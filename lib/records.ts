import { createClient } from "@/lib/supabase/server";

export type LifetimeCounts = {
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubles: number;
  triplesPlus: number;
  holesInOne: number;
  holesPlayed: number;
  roundsPlayed: number;
};

export type BestRound = {
  score: number;
  over: number;
  courseName: string | null;
  date: string;
  holeCount: number;
} | null;

export type BestRoundRate = {
  pct: number;          // 0..100
  count: number;
  available: number;
  courseName: string | null;
  date: string;
  holeCount: number;
} | null;

export type BestRoundCount = {
  count: number;
  courseName: string | null;
  date: string;
  holeCount: number;
} | null;

export type Bests = {
  lowest18: BestRound;
  lowest9: BestRound;
  bestVsPar: BestRound;
  bestFir: BestRoundRate;
  bestGir: BestRoundRate;
  fewestPutts: BestRoundCount;
};

type RoundWithCourse = {
  id: string;
  played_at: string;
  total_strokes: number;
  hole_count: number;
  status: "in_progress" | "completed" | "abandoned";
  course_id: string;
  courses: { name: string } | null;
};

type EntryRow = {
  round_id: string;
  hole_number: number;
  strokes: number;
  putts: number;
  fairway_hit: boolean | null;
  green_in_regulation: boolean;
  picked_up: boolean;
  hole_par: number | null;
};

export async function getRecords(): Promise<{
  counts: LifetimeCounts;
  bests: Bests;
}> {
  const supabase = await createClient();

  // Only count completed rounds (skip in-progress and abandoned)
  const { data: roundData } = await supabase
    .from("rounds")
    .select("id, played_at, total_strokes, hole_count, status, course_id, courses(name)")
    .eq("status", "completed")
    .gt("total_strokes", 0)
    .order("played_at", { ascending: false });
  const rounds = (roundData ?? []) as unknown as RoundWithCourse[];

  const emptyCounts: LifetimeCounts = {
    eagles: 0, birdies: 0, pars: 0, bogeys: 0, doubles: 0, triplesPlus: 0,
    holesInOne: 0, holesPlayed: 0, roundsPlayed: 0,
  };
  const emptyBests: Bests = {
    lowest18: null, lowest9: null, bestVsPar: null,
    bestFir: null, bestGir: null, fewestPutts: null,
  };

  if (rounds.length === 0) return { counts: emptyCounts, bests: emptyBests };

  const roundIds = rounds.map((r) => r.id);
  const { data: entryData } = await supabase
    .from("scorecard_entries")
    .select("round_id, hole_number, strokes, putts, fairway_hit, green_in_regulation, picked_up, hole_par")
    .in("round_id", roundIds);
  const entries = (entryData ?? []) as EntryRow[];

  const counts = { ...emptyCounts, roundsPlayed: rounds.length };

  // Per-round aggregates
  type PerRound = {
    id: string;
    fir: number;
    firAvailable: number;        // par 4/5 holes that were actually scored
    gir: number;
    girAvailable: number;        // any hole that was actually scored
    putts: number;
    strokes: number;             // scored holes only (excludes picked_up's par+5)
    parThru: number;
    holesScored: number;         // holes with strokes > 0 (excludes picked_up)
    holesAccounted: number;      // holes with strokes > 0 OR picked_up
  };
  const perRound = new Map<string, PerRound>();
  const getPR = (id: string): PerRound => {
    let pr = perRound.get(id);
    if (!pr) {
      pr = { id, fir: 0, firAvailable: 0, gir: 0, girAvailable: 0, putts: 0,
             strokes: 0, parThru: 0, holesScored: 0, holesAccounted: 0 };
      perRound.set(id, pr);
    }
    return pr;
  };

  for (const e of entries) {
    if (e.strokes === 0 && !e.picked_up) continue; // not yet played

    const pr = getPR(e.round_id);
    pr.holesAccounted += 1;
    if (e.picked_up) {
      // counts as par+5 for differential but doesn't count toward birdies/pars/etc.
      continue;
    }
    pr.holesScored += 1;
    pr.strokes += e.strokes;
    counts.holesPlayed += 1;

    const par = e.hole_par;
    if (par != null) {
      pr.parThru += par;
      const delta = e.strokes - par;
      if (e.strokes === 1) counts.holesInOne += 1;
      if (delta <= -2) counts.eagles += 1;
      else if (delta === -1) counts.birdies += 1;
      else if (delta === 0) counts.pars += 1;
      else if (delta === 1) counts.bogeys += 1;
      else if (delta === 2) counts.doubles += 1;
      else if (delta >= 3) counts.triplesPlus += 1;

      if (par >= 4) {
        pr.firAvailable += 1;
        if (e.fairway_hit === true) pr.fir += 1;
      }
    }

    pr.girAvailable += 1;
    if (e.green_in_regulation) pr.gir += 1;
    pr.putts += e.putts;
  }

  // Bests
  const meta = new Map<string, RoundWithCourse>();
  for (const r of rounds) meta.set(r.id, r);

  let lowest18: BestRound = null;
  let lowest9: BestRound = null;
  let bestVsPar: BestRound = null;
  let bestFir: BestRoundRate = null;
  let bestGir: BestRoundRate = null;
  let fewestPutts: BestRoundCount = null;

  for (const pr of perRound.values()) {
    const r = meta.get(pr.id);
    if (!r) continue;
    const ctx = { courseName: r.courses?.name ?? null, date: r.played_at, holeCount: r.hole_count };

    // Round counts as "complete" only when every scheduled hole has a score or pickup
    if (pr.holesAccounted !== r.hole_count) continue;

    const over = r.total_strokes - pr.parThru;
    const recordedRound = {
      score: r.total_strokes,
      over,
      ...ctx,
    };

    // Bucket: <18 holes → "lowest 9", >=18 → "lowest 18" (covers 19-hole P+W combos)
    if (r.hole_count >= 18) {
      if (!lowest18 || r.total_strokes < lowest18.score) lowest18 = recordedRound;
    } else {
      if (!lowest9 || r.total_strokes < lowest9.score) lowest9 = recordedRound;
    }
    if (!bestVsPar || over < bestVsPar.over) bestVsPar = recordedRound;

    if (pr.firAvailable > 0) {
      const pct = Math.round((pr.fir / pr.firAvailable) * 100);
      if (!bestFir || pct > bestFir.pct) {
        bestFir = { pct, count: pr.fir, available: pr.firAvailable, ...ctx };
      }
    }
    if (pr.girAvailable > 0) {
      const pct = Math.round((pr.gir / pr.girAvailable) * 100);
      if (!bestGir || pct > bestGir.pct) {
        bestGir = { pct, count: pr.gir, available: pr.girAvailable, ...ctx };
      }
    }
    if (pr.putts > 0 && (!fewestPutts || pr.putts < fewestPutts.count)) {
      fewestPutts = { count: pr.putts, ...ctx };
    }
  }

  return {
    counts,
    bests: { lowest18, lowest9, bestVsPar, bestFir, bestGir, fewestPutts },
  };
}
