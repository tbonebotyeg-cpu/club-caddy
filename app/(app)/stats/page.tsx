import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Plus, Trophy, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getHandicapIndex } from "@/lib/queries";
import { getRecords } from "@/lib/records";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HandicapTrend } from "./_components/handicap-trend";

export const metadata: Metadata = { title: "Stats" };
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const supabase = await createClient();
  const [{ index, rounds, recent }, { counts, bests }] = await Promise.all([
    getHandicapIndex(),
    getRecords(),
  ]);

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

  if (counts.roundsPlayed === 0) {
    return (
      <div className="py-10 md:py-16 max-w-xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-accent text-center">Stats</p>
        <Card className="mt-6 p-10 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Track a round to see stats
          </h1>
          <p className="mt-2 text-muted text-sm">
            Once you log a few rounds, scoring average, handicap trend and records will live here.
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

  const trend = [...recent].reverse().map((r, i) => ({
    label: i + 1,
    differential: r.differential,
    date: r.played_at,
  }));

  return (
    <div className="py-6 md:py-10 space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Stats</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Your numbers</h1>
      </header>

      {/* Headline metrics */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          <BigStat label="Rounds tracked" value={counts.roundsPlayed} hint="lifetime" />
          <BigStat
            label="Holes played"
            value={counts.holesPlayed}
            hint={`${counts.roundsPlayed} rounds`}
          />
        </div>
      </section>

      {/* Hole-by-hole tallies */}
      <section>
        <SectionHeader icon={Flag} title="Hole-by-hole" hint="Lifetime totals" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-3">
          <TallyCard label="Holes in 1" value={counts.holesInOne} className="text-score-eagle" />
          <TallyCard label="Eagles" value={counts.eagles} className="text-score-eagle" />
          <TallyCard label="Birdies" value={counts.birdies} className="text-score-birdie" />
          <TallyCard label="Pars" value={counts.pars} className="text-score-par" />
          <TallyCard label="Bogeys" value={counts.bogeys} className="text-score-bogey" />
          <TallyCard
            label="Double+"
            value={counts.doubles + counts.triplesPlus}
            className="text-score-double"
          />
        </div>
      </section>

      {/* Personal bests */}
      <section>
        <SectionHeader icon={Trophy} title="Personal bests" hint="Best round you've tracked" />
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <BestCard
            label="Lowest 18"
            value={bests.lowest18 ? bests.lowest18.score : "—"}
            sub={
              bests.lowest18
                ? `${bests.lowest18.over === 0 ? "E" : bests.lowest18.over > 0 ? `+${bests.lowest18.over}` : bests.lowest18.over} · ${bests.lowest18.courseName ?? "Unknown"}`
                : "Finish all 18 to count"
            }
            date={bests.lowest18?.date}
          />
          <BestCard
            label="Best vs par"
            value={
              bests.bestVsPar
                ? bests.bestVsPar.over === 0
                  ? "E"
                  : bests.bestVsPar.over > 0
                  ? `+${bests.bestVsPar.over}`
                  : `${bests.bestVsPar.over}`
                : "—"
            }
            sub={
              bests.bestVsPar
                ? `${bests.bestVsPar.score} · ${bests.bestVsPar.courseName ?? "Unknown"}`
                : "—"
            }
            date={bests.bestVsPar?.date}
          />
          <BestCard
            label="Most fairways"
            value={bests.mostFir ? bests.mostFir.count : "—"}
            sub={bests.mostFir ? `${bests.mostFir.courseName ?? "Unknown"}` : "—"}
            date={bests.mostFir?.date}
          />
          <BestCard
            label="Most GIR"
            value={bests.mostGir ? bests.mostGir.count : "—"}
            sub={bests.mostGir ? `${bests.mostGir.courseName ?? "Unknown"}` : "—"}
            date={bests.mostGir?.date}
          />
          <BestCard
            label="Fewest putts"
            value={bests.fewestPutts ? bests.fewestPutts.count : "—"}
            sub={
              bests.fewestPutts ? `${bests.fewestPutts.courseName ?? "Unknown"}` : "Track putts to count"
            }
            date={bests.fewestPutts?.date}
          />
        </div>
      </section>

      {/* Handicap trend */}
      {trend.length >= 2 && (
        <section>
          <SectionHeader icon={BarChart3} title="Handicap trend" hint="Last 20 differentials" />
          <Card className="mt-3 p-5">
            <HandicapTrend data={trend} />
          </Card>
        </section>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted inline-flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {title}
      </h2>
      {hint && <span className="text-[10px] uppercase tracking-wider text-subtle">{hint}</span>}
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

function TallyCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <Card className="p-3 text-center">
      <div className={`num text-3xl font-semibold ${className ?? ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted mt-1">{label}</div>
    </Card>
  );
}

function BestCard({
  label,
  value,
  sub,
  date,
}: {
  label: string;
  value: string | number;
  sub: string;
  date?: string;
}) {
  return (
    <Card className="p-4 flex items-center justify-between gap-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
        <div className="mt-0.5 text-xs text-subtle">{sub}</div>
      </div>
      <div className="text-right">
        <div className="num text-3xl font-semibold text-accent">{value}</div>
        {date && (
          <div className="text-[10px] uppercase tracking-wider text-subtle mt-0.5">
            {new Date(date).toLocaleDateString(undefined, {
              year: "2-digit",
              month: "short",
              day: "numeric",
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
