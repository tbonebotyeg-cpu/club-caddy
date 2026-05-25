import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { scoreLabel, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Round detail" };
export const dynamic = "force-dynamic";

export default async function RoundDetailPage(props: { params: Promise<{ id: string }> }) {
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
    played_at: string;
    tees_played: string | null;
    weather_summary: string | null;
    score_differential: number | null;
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

  const played = (entries ?? []).filter((e) => e.strokes > 0);
  const total = played.reduce((s, e) => s + e.strokes, 0);
  const parThru = played.reduce((s, e) => {
    const h = (holes ?? []).find((x) => x.hole_number === e.hole_number);
    return s + (h?.par ?? 0);
  }, 0);
  const over = total - parThru;

  const front = played.filter((e) => e.hole_number <= 9);
  const back = played.filter((e) => e.hole_number > 9);
  const sum = (arr: typeof played) => arr.reduce((s, e) => s + e.strokes, 0);

  const putts = played.reduce((s, e) => s + e.putts, 0);
  const fairwayPars = (holes ?? []).filter((h) => h.par >= 4).map((h) => h.hole_number);
  const fairwaysAvailable = played.filter((e) => fairwayPars.includes(e.hole_number));
  const firCount = fairwaysAvailable.filter((e) => e.fairway_hit === true).length;
  const firPct =
    fairwaysAvailable.length > 0 ? Math.round((firCount / fairwaysAvailable.length) * 100) : 0;
  const girCount = played.filter((e) => e.green_in_regulation).length;
  const girPct = played.length > 0 ? Math.round((girCount / played.length) * 100) : 0;

  return (
    <div className="py-6 md:py-10">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Round</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">{course.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {new Date(round.played_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {round.tees_played ? ` · ${round.tees_played} tees` : ""}
            {round.weather_summary ? ` · ${round.weather_summary}` : ""}
          </p>
        </div>
        <Link href={`/round/${round.id}`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </Link>
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
          title="Front 9"
          holes={(holes ?? []).filter((h) => h.hole_number <= 9)}
          entries={front}
          total={sum(front)}
          par={(holes ?? []).filter((h) => h.hole_number <= 9).reduce((s, h) => s + h.par, 0)}
        />
        <div className="border-t border-border" />
        <ScorecardGrid
          title="Back 9"
          holes={(holes ?? []).filter((h) => h.hole_number > 9)}
          entries={back}
          total={sum(back)}
          par={(holes ?? []).filter((h) => h.hole_number > 9).reduce((s, h) => s + h.par, 0)}
        />
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
  holes,
  entries,
  total,
  par,
}: {
  title: string;
  holes: Array<{ hole_number: number; par: number; yardage: number }>;
  entries: Array<{ hole_number: number; strokes: number; putts: number }>;
  total: number;
  par: number;
}) {
  return (
    <div className="p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider text-muted">{title}</h3>
        <span className="num text-sm">
          {total || "—"} <span className="text-muted">/ par {par}</span>
        </span>
      </div>
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted">
              <th className="text-left px-1 py-1 font-normal">Hole</th>
              {holes.map((h) => (
                <th key={h.hole_number} className="px-1 py-1 text-center font-normal">
                  {h.hole_number}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-[11px] text-subtle">
              <td className="px-1 py-1">Par</td>
              {holes.map((h) => (
                <td key={h.hole_number} className="num text-center px-1 py-1">
                  {h.par}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-1 py-1.5 text-[10px] uppercase tracking-wider text-muted">Score</td>
              {holes.map((h) => {
                const e = entries.find((x) => x.hole_number === h.hole_number);
                const cls = e && e.strokes > 0 ? scoreLabel(e.strokes, h.par).className : "";
                return (
                  <td key={h.hole_number} className="px-1 py-1 text-center">
                    <span className={cn("num font-semibold", cls)}>{e?.strokes || "—"}</span>
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
