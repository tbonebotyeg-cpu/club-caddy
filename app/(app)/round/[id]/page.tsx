import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tee } from "@/lib/supabase/database.types";
import { Scorecard } from "./_components/scorecard";

export const metadata: Metadata = { title: "Round" };
export const dynamic = "force-dynamic";

export default async function RoundPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: roundData } = await supabase
    .from("rounds")
    .select("*, courses(id, name, par_total, tees)")
    .eq("id", id)
    .single();
  if (!roundData) notFound();
  const round = roundData as unknown as {
    id: string;
    course_id: string;
    tees_played: string | null;
    hole_count: number;
    courses: {
      id: string;
      name: string;
      par_total: number;
      tees: Tee[];
    };
  };

  const { data: holesData } = await supabase
    .from("holes")
    .select("hole_number, par, handicap_index, yardages")
    .eq("course_id", round.course_id)
    .order("hole_number", { ascending: true });

  const { data: entries } = await supabase
    .from("scorecard_entries")
    .select("*")
    .eq("round_id", id)
    .order("hole_number", { ascending: true });

  const teeLabel = round.tees_played ?? round.courses.tees[0]?.label ?? null;
  const holes = (holesData ?? [])
    .filter((h) => h.hole_number <= round.hole_count)
    .map((h) => {
      const yardages = (h.yardages as Record<string, number>) ?? {};
      const y = teeLabel ? yardages[teeLabel] : undefined;
      return {
        hole_number: h.hole_number,
        par: h.par,
        handicap_index: h.handicap_index,
        yardage: typeof y === "number" && y > 0 ? y : null,
      };
    });

  return (
    <Scorecard
      roundId={id}
      courseName={round.courses.name}
      teesPlayed={teeLabel}
      holes={holes}
      initialEntries={entries ?? []}
    />
  );
}
