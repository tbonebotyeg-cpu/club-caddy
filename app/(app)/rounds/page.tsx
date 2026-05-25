import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
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
  score_differential: number | null;
  courses: { name: string; par_total: number } | null;
};

export default async function RoundsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rounds")
    .select("id, played_at, tees_played, total_strokes, score_differential, courses(name, par_total)")
    .order("played_at", { ascending: false });
  const rounds = (data ?? []) as unknown as RoundListRow[];

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

  return (
    <div className="py-6 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">History</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
            {rounds.length} {rounds.length === 1 ? "round" : "rounds"}
          </h1>
        </div>
        <Link href="/round/new">
          <Button>
            <Plus className="h-4 w-4" /> New round
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {rounds.map((r) => {
          const course = r.courses;
          const par = course?.par_total ?? 72;
          const over = r.total_strokes ? r.total_strokes - par : 0;
          return (
            <Link key={r.id} href={`/rounds/${r.id}`}>
              <Card className="card-hover p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{course?.name ?? "Unknown course"}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {new Date(r.played_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {r.tees_played ? ` · ${r.tees_played}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  {r.total_strokes ? (
                    <>
                      <div className="num text-xl font-semibold">
                        {r.total_strokes}
                        <span className="text-muted text-sm ml-1">
                          ({over > 0 ? "+" : ""}{over === 0 ? "E" : over})
                        </span>
                      </div>
                      {r.score_differential != null && (
                        <div className="text-[10px] uppercase tracking-wider text-accent">
                          {Number(r.score_differential).toFixed(1)} diff
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted">In progress</span>
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
