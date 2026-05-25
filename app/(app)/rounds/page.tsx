import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Rounds" };
export const dynamic = "force-dynamic";

type RoundListRow = {
  id: string;
  played_at: string;
  tees_played: string | null;
  total_strokes: number;
  hole_count: number;
  status: "in_progress" | "completed" | "abandoned";
  score_differential: number | null;
  courses: { name: string } | null;
};

export default async function RoundsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rounds")
    .select(
      "id, played_at, tees_played, total_strokes, hole_count, status, score_differential, courses(name)",
    )
    .order("played_at", { ascending: false });
  const rounds = (data ?? []) as unknown as RoundListRow[];

  // Sum actual hole pars from scorecard entries for each round (so non-72/non-18 rounds get correct over-par)
  const { data: parData } = rounds.length
    ? await supabase
        .from("scorecard_entries")
        .select("round_id, hole_par, strokes, picked_up")
        .in("round_id", rounds.map((r) => r.id))
    : { data: [] };
  const playedParByRound = new Map<string, number>();
  for (const e of (parData ?? []) as Array<{
    round_id: string;
    hole_par: number | null;
    strokes: number;
    picked_up: boolean;
  }>) {
    if ((e.strokes > 0 || e.picked_up) && e.hole_par != null) {
      playedParByRound.set(e.round_id, (playedParByRound.get(e.round_id) ?? 0) + e.hole_par);
    }
  }

  if (rounds.length === 0) {
    return (
      <div className="py-10 md:py-16 max-w-xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-accent text-center">History</p>
        <Card className="mt-6 p-10 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">No rounds yet</h1>
          <p className="mt-2 text-muted text-sm">
            Start tracking and every score, putt and FIR/GIR shows up here.
          </p>
          <Link href="/round/new" className="mt-6 inline-block">
            <Button>
              <Plus className="h-4 w-4" /> Start a round
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const inProgress = rounds.filter((r) => r.status === "in_progress");
  const completed = rounds.filter((r) => r.status !== "in_progress");

  return (
    <div className="py-6 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">History</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
            {completed.length} {completed.length === 1 ? "round" : "rounds"}
          </h1>
        </div>
        <Link href="/round/new">
          <Button>
            <Plus className="h-4 w-4" /> New round
          </Button>
        </Link>
      </div>

      {/* In-progress rounds — surface separately at the top */}
      {inProgress.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-wider text-warning mb-2">
            In progress ({inProgress.length})
          </h2>
          <div className="space-y-2">
            {inProgress.map((r) => (
              <Link key={r.id} href={`/round/${r.id}`}>
                <Card className="card-hover p-4 flex items-center justify-between border-warning/40 bg-warning/5">
                  <div>
                    <div className="font-medium">{r.courses?.name ?? "Unknown course"}</div>
                    <div className="text-xs text-muted mt-0.5">
                      Started {new Date(r.played_at).toLocaleDateString(undefined, {
                        month: "short", day: "numeric",
                      })}
                      {r.tees_played ? ` · ${r.tees_played}` : ""}
                      {` · ${r.hole_count}h`}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 text-warning px-3 py-1.5 text-xs font-medium">
                    <Play className="h-3 w-3" /> Resume
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {completed.map((r) => {
          const course = r.courses;
          const playedPar = playedParByRound.get(r.id);
          const over = r.total_strokes && playedPar ? r.total_strokes - playedPar : null;
          return (
            <Link key={r.id} href={`/rounds/${r.id}`}>
              <Card className="card-hover p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{course?.name ?? "Unknown course"}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {new Date(r.played_at).toLocaleDateString(undefined, {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                    {r.tees_played ? ` · ${r.tees_played}` : ""}
                    {r.hole_count !== 18 ? ` · ${r.hole_count}h` : ""}
                  </div>
                </div>
                <div className="text-right">
                  {r.total_strokes ? (
                    <>
                      <div className="num text-xl font-semibold">
                        {r.total_strokes}
                        {over != null && (
                          <span className="text-muted text-sm ml-1">
                            ({over > 0 ? "+" : ""}{over === 0 ? "E" : over})
                          </span>
                        )}
                      </div>
                      {r.score_differential != null && (
                        <div className="text-[10px] uppercase tracking-wider text-accent">
                          {Number(r.score_differential).toFixed(1)} diff
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted">No score</span>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
