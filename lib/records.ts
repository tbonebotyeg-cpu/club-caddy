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

export type Bests = {
  lowest18: { score: number; over: number; courseName: string | null; date: string } | null;
  bestVsPar: { over: number; score: number; courseName: string | null; date: string } | null;
  mostFir: { count: number; courseName: string | null; date: string } | null;
  mostGir: { count: number; courseName: string | null; date: string } | null;
  fewestPutts: { count: number; courseName: string | null; date: string } | null;
};

type RoundWithCourse = {
  id: string;
  played_at: string;
  total_strokes: number;
  course_id: string;
  courses: { name: string; par_total: number } | null;
};

type EntryRow = {
  round_id: string;
  hole_number: number;
  strokes: number;
  putts: number;
  fairway_hit: boolean | null;
  green_in_regulation: boolean;
};

type HoleRow = {
  course_id: string;
  hole_number: number;
  par: number;
};

export async function getRecords(): Promise<{
  counts: LifetimeCounts;
  bests: Bests;
}> {
  const supabase = await createClient();

  const { data: roundData } = await supabase
    .from("rounds")
    .select("id, played_at, total_strokes, course_id, courses(name, par_total)")
    .gt("total_strokes", 0)
    .order("played_at", { ascending: false });
  const rounds = (roundData ?? []) as unknown as RoundWithCourse[];

  if (rounds.length === 0) {
    return {
      counts: {
        eagles: 0,
        birdies: 0,
        pars: 0,
        bogeys: 0,
        doubles: 0,
        triplesPlus: 0,
        holesInOne: 0,
        holesPlayed: 0,
        roundsPlayed: 0,
      },
      bests: {
        lowest18: null,
        bestVsPar: null,
        mostFir: null,
        mostGir: null,
        fewestPutts: null,
      },
    };
  }

  const roundIds = rounds.map((r) => r.id);
  const courseIds = Array.from(new Set(rounds.map((r) => r.course_id)));

  const { data: entryData } = await supabase
    .from("scorecard_entries")
    .select("round_id, hole_number, strokes, putts, fairway_hit, green_in_regulation")
    .in("round_id", roundIds)
    .gt("strokes", 0);
  const entries = (entryData ?? []) as EntryRow[];

  const { data: holeData } = await supabase
    .from("holes")
    .select("course_id, hole_number, par")
    .in("course_id", courseIds);
  const holes = (holeData ?? []) as HoleRow[];

  // Index holes by (course_id, hole_number) for quick lookup
  const parIdx = new Map<string, number>();
  for (const h of holes) parIdx.set(`${h.course_id}:${h.hole_number}`, h.par);

  const roundCourseId = new Map<string, string>();
  for (const r of rounds) roundCourseId.set(r.id, r.course_id);

  const counts: LifetimeCounts = {
    eagles: 0,
    birdies: 0,
    pars: 0,
    bogeys: 0,
    doubles: 0,
    triplesPlus: 0,
    holesInOne: 0,
    holesPlayed: 0,
    roundsPlayed: rounds.length,
  };

  // Per-round aggregates for bests
  type PerRound = {
    id: string;
    fir: number;
    gir: number;
    putts: number;
  };
  const perRound = new Map<string, PerRound>();

  for (const e of entries) {
    counts.holesPlayed += 1;

    const cid = roundCourseId.get(e.round_id);
    if (cid) {
      const par = parIdx.get(`${cid}:${e.hole_number}`);
      if (par != null) {
        const delta = e.strokes - par;
        if (e.strokes === 1) counts.holesInOne += 1;
        if (delta <= -2) counts.eagles += 1;
        else if (delta === -1) counts.birdies += 1;
        else if (delta === 0) counts.pars += 1;
        else if (delta === 1) counts.bogeys += 1;
        else if (delta === 2) counts.doubles += 1;
        else if (delta >= 3) counts.triplesPlus += 1;
      }
    }

    const pr =
      perRound.get(e.round_id) ?? { id: e.round_id, fir: 0, gir: 0, putts: 0 };
    if (e.fairway_hit === true) pr.fir += 1;
    if (e.green_in_regulation) pr.gir += 1;
    pr.putts += e.putts;
    perRound.set(e.round_id, pr);
  }

  // Bests
  const roundMeta = new Map<string, RoundWithCourse>();
  for (const r of rounds) roundMeta.set(r.id, r);

  // Lowest 18 — only count rounds with all 18 holes scored
  const holesPlayedPerRound = new Map<string, number>();
  for (const e of entries) {
    holesPlayedPerRound.set(
      e.round_id,
      (holesPlayedPerRound.get(e.round_id) ?? 0) + 1,
    );
  }
  const completedRounds = rounds.filter(
    (r) => (holesPlayedPerRound.get(r.id) ?? 0) === 18,
  );

  let lowest18: Bests["lowest18"] = null;
  let bestVsPar: Bests["bestVsPar"] = null;
  for (const r of completedRounds) {
    const par = r.courses?.par_total ?? 72;
    const over = r.total_strokes - par;
    if (!lowest18 || r.total_strokes < lowest18.score) {
      lowest18 = {
        score: r.total_strokes,
        over,
        courseName: r.courses?.name ?? null,
        date: r.played_at,
      };
    }
    if (!bestVsPar || over < bestVsPar.over) {
      bestVsPar = {
        over,
        score: r.total_strokes,
        courseName: r.courses?.name ?? null,
        date: r.played_at,
      };
    }
  }

  let mostFir: Bests["mostFir"] = null;
  let mostGir: Bests["mostGir"] = null;
  let fewestPutts: Bests["fewestPutts"] = null;
  for (const pr of perRound.values()) {
    const r = roundMeta.get(pr.id);
    if (!r) continue;
    const holesThisRound = holesPlayedPerRound.get(pr.id) ?? 0;
    const isComplete = holesThisRound === 18;
    const ctx = {
      courseName: r.courses?.name ?? null,
      date: r.played_at,
    };
    if (isComplete) {
      if (!mostFir || pr.fir > mostFir.count) {
        mostFir = { count: pr.fir, ...ctx };
      }
      if (!mostGir || pr.gir > mostGir.count) {
        mostGir = { count: pr.gir, ...ctx };
      }
      if (pr.putts > 0 && (!fewestPutts || pr.putts < fewestPutts.count)) {
        fewestPutts = { count: pr.putts, ...ctx };
      }
    }
  }

  return {
    counts,
    bests: { lowest18, bestVsPar, mostFir, mostGir, fewestPutts },
  };
}
