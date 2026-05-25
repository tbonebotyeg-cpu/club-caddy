import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getHandicapIndex } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HandicapTrend } from "./_components/handicap-trend";

export const metadata: Metadata = { title: "Stats" };
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const supabase = await createClient();
  const { index, rounds, recent } = await getHandicapIndex();

  const { data: allRounds } = await supabase
    .from("rounds")
    .select("total_strokes, courses(par_total)")
    .gt("total_strokes", 0)
    .order("played_at", { ascending: false })
    .limit(50);

  const playedRounds = (allRounds ?? []) as unknown as Array<{
    total_strokes: number;
    courses: { par_total: number } | null;
  }>;
  const scoringAvg =
    playedRounds.length > 0
      ? Math.round(
          playedRounds.reduce((s, r) => s + r.total_strokes, 0) / playedRounds.length,
        )
      : null;

  const overParAvg =
    playedRounds.length > 0
      ? Math.round(
          playedRounds.reduce((s, r) => {
            const par = r.courses?.par_total ?? 72;
            return s + (r.total_strokes - par);
          }, 0) / playedRounds.length,
        )
      : null;

  if (rounds === 0) {
    return (
      <div className="py-10 md:py-16 max-w-xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-accent text-center">Stats</p>
        <Card className="mt-6 p-10 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Track a round to see stats</h1>
          <p className="mt-2 text-muted text-sm">
            Once you log a few rounds, scoring average, handicap trend and more will live here.
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

  // Trend in chronological order
  const trend = [...recent].reverse().map((r, i) => ({
    label: i + 1,
    differential: r.differential,
    date: r.played_at,
  }));

  return (
    <div className="py-6 md:py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">Stats</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Your numbers</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <BigStat
          label="Handicap Index"
          value={index == null ? "—" : index.toFixed(1)}
          hint={index == null ? `${3 - rounds} more rounds` : "WHS-style"}
          accent
        />
        <BigStat
          label="Scoring avg"
          value={scoringAvg ?? "—"}
          hint={overParAvg != null ? `${overParAvg > 0 ? "+" : ""}${overParAvg} vs par` : ""}
        />
        <BigStat label="Rounds tracked" value={playedRounds.length} hint="last 50" />
        <BigStat
          label="Best differential"
          value={recent.length ? Math.min(...recent.map((r) => r.differential)).toFixed(1) : "—"}
          hint="last 20"
        />
      </div>

      {trend.length >= 2 && (
        <Card className="mt-6 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
            Differential trend
          </h2>
          <HandicapTrend data={trend} />
        </Card>
      )}
    </div>
  );
}

function BigStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 num text-3xl font-semibold ${accent ? "text-accent" : ""}`}>
        {value}
      </div>
      {hint && <div className="text-[10px] text-subtle mt-1 uppercase tracking-wider">{hint}</div>}
    </Card>
  );
}
