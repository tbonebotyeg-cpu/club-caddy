import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Scorecard } from "./_components/scorecard";

export const metadata: Metadata = { title: "Round" };
export const dynamic = "force-dynamic";

export default async function RoundPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: roundData } = await supabase
    .from("rounds")
    .select("*, courses(id, name, par_total, slope_rating, course_rating)")
    .eq("id", id)
    .single();
  if (!roundData) notFound();
  const round = roundData as unknown as {
    id: string;
    course_id: string;
    tees_played: string | null;
    courses: {
      id: string;
      name: string;
      par_total: number;
      slope_rating: number;
      course_rating: number;
    };
  };

  const { data: holes } = await supabase
    .from("holes")
    .select("hole_number, par, yardage, handicap_index")
    .eq("course_id", round.course_id)
    .order("hole_number", { ascending: true });

  const { data: entries } = await supabase
    .from("scorecard_entries")
    .select("*")
    .eq("round_id", id)
    .order("hole_number", { ascending: true });

  const course = round.courses;

  return (
    <Scorecard
      roundId={id}
      courseName={course.name}
      teesPlayed={round.tees_played}
      holes={holes ?? []}
      initialEntries={entries ?? []}
    />
  );
}
