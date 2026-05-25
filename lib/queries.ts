import { createClient } from "@/lib/supabase/server";
import { handicapIndex } from "@/lib/handicap";

type DiffRow = {
  id: string;
  played_at: string;
  score_differential: number | null;
  courses: { name: string } | null;
};

export async function getHandicapIndex(): Promise<{
  index: number | null;
  rounds: number;
  recent: Array<{ id: string; differential: number; played_at: string; courseName: string | null }>;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rounds")
    .select("id, played_at, score_differential, courses(name)")
    .not("score_differential", "is", null)
    .order("played_at", { ascending: false })
    .limit(20);
  const rounds = (data ?? []) as unknown as DiffRow[];

  const recent = rounds.map((r) => ({
    id: r.id,
    differential: Number(r.score_differential),
    played_at: r.played_at,
    courseName: r.courses?.name ?? null,
  }));

  const index = handicapIndex(recent.map((r) => r.differential));
  return { index, rounds: recent.length, recent };
}
