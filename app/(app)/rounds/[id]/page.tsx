import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { scoreLabel, cn } from "@/lib/utils";
import { RoundDetailActions } from "./_components/round-detail-actions";

export const metadata: Metadata = { title: "Round detail" };
export const dynamic = "force-dynamic";

type EntryRow = {
  hole_number: number;
  strokes: number;
  putts: number;
  fairway_hit: boolean | null;
  green_in_regulation: boolean;
  picked_up: boolean;
  hole_par: number | null;
};

export default async function RoundDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: roundData } = await supabase
    .from("rounds")
    .select("*, courses(id, name, par_total)")
    .eq("id", id)
    .single();
  if (!roundData) notFound();
  const round = roundData as unknown as {
    id: string;
    course_id: string;
    played_at: string;
    tees_played: string | null;
    hole_count: number;
    status: "in_progress" | "completed" | "abandoned";
    weather_summary: string | null;
    score_differential: number | null;
    courses: { id: string; name: string; par_total: number };
  };

  const { data: entriesData } = await supabase
    .from("scorecard_entries")
    .select("hole_number, strokes, putts, fairway_hit, green_in_regulation, picked_up, hole_par")
    .eq("round_id", id)
    .order("hole_number", { ascending: true });
  const entries = (entriesData ?? []) as EntryRow[];

  const course = round.courses;
  const played = entries.filter((e) => e.strokes > 0 || e.picked_up);
  const total = played.reduce((s, e) => {
    if (e.picked_up) return s + ((e.hole_par ?? 4) + 5);
    return s + e.strokes;
  }, 0);
  const parThru = played.reduce((s, e) => s + (e.hole_par ?? 0), 0);
  const over = total - parThru;

  const front = played.filter((e) => e.hole_number <= 9);
  const back = played.filter((e) => e.hole_number > 9);
  const sumStrokes = (arr: typeof played) =>
    arr.reduce((s, e) => s + (e.picked_up ? (e.hole_par ?? 4) + 5 : e.strokes), 0);

  const putts = played.reduce((s, e) => s + e.putts, 0);
  // FIR available = par-4/5 holes that were scored (not picked up)
  const firAvail = played.filter((e) => !e.picked_up && (e.hole_par ?? 0) >= 4);
  const firCount = firAvail.filter((e) => e.fairway_hit === true).length;
  const firPct = firAvail.length > 0 ? Math.round((firCount / firAvail.length) * 100) : 0;
  // GIR available = all scored holes
  const girAvail = played.filter((e) => !e.picked_up);
  const girCount = girAvail.filter((e) => e.green_in_regulation).length;
  const girPct = girAvail.length > 0 ? Math.round((girCount / girAvail.length) * 100) : 0;

  const showBack = round.hole_count > 9;
  const frontTitle = showBack ? "Front 9" : "Holes";
  const backHoles = entries.filter((e) => e.hole_number > 9 && e.hole_number <= round.hole_count);
  const backTitle = round.hole_count === 18 ? "Back 9" : `Holes 10–${round.hole_count}`;

  return (
    <div className="py-6 md:py-10">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Round</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">{course.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {new Date(round.played_at).toLocaleDateString(undefined, {
              year: "numeric", month: "long", day: "numeric",
            })}
            {round.tees_played ? ` · ${round.tees_played} tees` : ""}
            {round.hole_count !== 18 ? ` · ${round.hole_count} holes` : ""}
            {round.weather_summary ? ` · ${round.weather_summary}` : ""}
          </p>
          {round.status === "in_progress" && (
            <p className="mt-1 text-xs text-warning">
              In progress — finish on the live scorecard to set the differential
            </p>
          )}
        </div>
        <RoundDetailActions roundId={round.id} status={round.status} />
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <BigStat
          label="Total"
          value={total || "—"}
          accent={total > 0 ? `${over > 0 ? "+" : ""}${over === 0 ? "E" : over}` : ""}
        />
        <BigStat
          label="Differential"
          value={round.score_differential != null ? Number(round.score_differential).toFixed(1) : "—"}
        />
        <BigStat label="Putts" value={putts || "—"} />
        <BigStat label="FIR / GIR" value={`${firPct}% / ${girPct}%`} />
      </div>

      {/* Scorecard grid */}
      <Card className="overflow-hidden">
        <ScorecardGrid
          title={frontTitle}
          entries={entries.filter((e) => e.hole_number <= 9)}
          total={sumStrokes(front)}
          par={entries.filter((e) => e.hole_number <= 9).reduce((s, e) => s + (e.hole_par ?? 0), 0)}
        />
        {showBack && (
          <>
            <div className="border-t border-border" />
            <ScorecardGrid
              title={backTitle}
              entries={backHoles}
              total={sumStrokes(back)}
              par={backHoles.reduce((s, e) => s + (e.hole_par ?? 0), 0)}
            />
          </>
        )}
      </Card>

      <div className="mt-6">
        <Link href="/rounds" className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1">
          Back to history <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 num text-3xl font-semibold">
        {value}
        {accent && <span className="text-base text-muted ml-2">({accent})</span>}
      </div>
    </Card>
  );
}

function ScorecardGrid({
  title,
  entries,
  total,
  par,
}: {
  title: string;
  entries: EntryRow[];
  total: number;
  par: number;
}) {
  return (
    <div className="p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider text-muted">{title}</h3>
        <span className="num text-sm">
          {total || "—"} <span className="text-muted">/ par {par || "—"}</span>
        </span>
      </div>
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted">
              <th className="text-left px-1 py-1 font-normal">Hole</th>
              {entries.map((e) => (
                <th key={e.hole_number} className="px-1 py-1 text-center font-normal">
                  {e.hole_number}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-[11px] text-subtle">
              <td className="px-1 py-1">Par</td>
              {entries.map((e) => (
                <td key={e.hole_number} className="num text-center px-1 py-1">
                  {e.hole_par ?? "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-1 py-1.5 text-[10px] uppercase tracking-wider text-muted">Score</td>
              {entries.map((e) => {
                if (e.picked_up) {
                  return (
                    <td key={e.hole_number} className="px-1 py-1 text-center">
                      <span className="num font-semibold text-warning">X</span>
                    </td>
                  );
                }
                const par = e.hole_par;
                const cls = e.strokes > 0 && par != null ? scoreLabel(e.strokes, par).className : "";
                return (
                  <td key={e.hole_number} className="px-1 py-1 text-center">
                    <span className={cn("num font-semibold", cls)}>{e.strokes || "—"}</span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
