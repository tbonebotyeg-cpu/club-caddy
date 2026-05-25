"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scoreDifferential } from "@/lib/handicap";
import type { Tee } from "@/lib/supabase/database.types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function startRound(input: {
  course_id: string;
  tees_played: string;
  hole_count?: number;
  notes?: string | null;
  weather_summary?: string | null;
}) {
  const { supabase, user } = await requireUser();

  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("hole_count, tees")
    .eq("id", input.course_id)
    .single();
  if (courseErr || !course) throw new Error(courseErr?.message || "Course not found");

  const tees = course.tees as Tee[];
  const tee = tees.find((t) => t.label === input.tees_played);
  if (!tee) {
    throw new Error(`Tee "${input.tees_played}" not configured for this course`);
  }

  const holeCount = input.hole_count ?? course.hole_count;
  if (holeCount < 1 || holeCount > course.hole_count) {
    throw new Error(`Hole count must be between 1 and ${course.hole_count}`);
  }

  // Fetch hole pars NOW so the scorecard snapshot is immune to later course edits
  const { data: holes } = await supabase
    .from("holes")
    .select("hole_number, par")
    .eq("course_id", input.course_id)
    .order("hole_number", { ascending: true });
  const parByHole = new Map<number, number>();
  for (const h of holes ?? []) parByHole.set(h.hole_number, h.par);

  // Snapshot tee slope + rating so renaming the tee on the course later
  // doesn't break this round's differential calculation
  const { data: round, error } = await supabase
    .from("rounds")
    .insert({
      user_id: user.id,
      course_id: input.course_id,
      played_at: new Date().toISOString(),
      tees_played: input.tees_played,
      tees_slope: tee.slope,
      tees_rating: tee.rating,
      hole_count: holeCount,
      status: "in_progress",
      notes: input.notes ?? null,
      weather_summary: input.weather_summary ?? null,
    })
    .select()
    .single();
  if (error || !round) throw new Error(error?.message || "Failed to start round");

  const entries = Array.from({ length: holeCount }, (_, i) => ({
    round_id: round.id,
    hole_number: i + 1,
    strokes: 0,
    putts: 0,
    penalties: 0,
    green_in_regulation: false,
    sand_save: false,
    fairway_hit: null,
    picked_up: false,
    hole_par: parByHole.get(i + 1) ?? null,
  }));
  const { error: entriesErr } = await supabase.from("scorecard_entries").insert(entries);
  if (entriesErr) throw new Error(entriesErr.message);

  revalidatePath("/rounds");
  redirect(`/round/${round.id}`);
}

/**
 * Recompute total + differential for a round. Picked-up holes count as par+5 (ESC-ish).
 * Differential is set when the round is "completed" (manually finished) — even on partial rounds.
 * Uses the snapshot tees_slope + tees_rating so course tee edits don't change past results.
 */
async function recomputeRoundTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roundId: string,
) {
  const { data: roundRow } = await supabase
    .from("rounds")
    .select("hole_count, tees_played, tees_slope, tees_rating, status, courses(tees)")
    .eq("id", roundId)
    .single();
  const round = roundRow as unknown as
    | {
        hole_count: number;
        tees_played: string | null;
        tees_slope: number | null;
        tees_rating: number | null;
        status: "in_progress" | "completed" | "abandoned";
        courses: { tees: Tee[] } | null;
      }
    | null;
  if (!round) return;

  const { data: entries } = await supabase
    .from("scorecard_entries")
    .select("strokes, picked_up, hole_par")
    .eq("round_id", roundId);

  // Total counts entered strokes + par+5 for picked-up holes
  const total = (entries ?? []).reduce((s, e) => {
    if (e.picked_up) return s + ((e.hole_par ?? 4) + 5);
    return s + (e.strokes || 0);
  }, 0);

  const holesScored = (entries ?? []).filter(
    (e) => e.strokes > 0 || e.picked_up,
  ).length;
  const allHolesAccountedFor = holesScored === round.hole_count;
  const playedPar = (entries ?? [])
    .filter((e) => e.strokes > 0 || e.picked_up)
    .reduce((s, e) => s + (e.hole_par ?? 0), 0);

  // Resolve slope/rating: prefer snapshot, fall back to current course tees
  let slope = round.tees_slope;
  let rating = round.tees_rating != null ? Number(round.tees_rating) : null;
  if ((slope == null || rating == null) && round.tees_played) {
    const tee = round.courses?.tees?.find((t) => t.label === round.tees_played);
    if (tee) {
      slope = slope ?? tee.slope;
      rating = rating ?? Number(tee.rating);
    }
  }

  let differential: number | null = null;
  const shouldCompute =
    (round.status === "completed" || allHolesAccountedFor) && total > 0;
  if (shouldCompute && slope != null && rating != null) {
    // Pro-rate the rating to the actual holes played.
    // Heuristic: ratings > 50 are 18-hole; ratings < 50 are already 9-hole.
    const ratingPerHole = rating > 50 ? rating / 18 : rating / 9;
    const effectiveRating = ratingPerHole * round.hole_count;
    differential = scoreDifferential({
      adjustedGrossScore: total,
      courseRating: effectiveRating,
      slopeRating: slope,
    });
    void playedPar;
  }

  await supabase
    .from("rounds")
    .update({ total_strokes: total, score_differential: differential })
    .eq("id", roundId);
}

export async function updateScorecardEntry(
  roundId: string,
  holeNumber: number,
  patch: {
    strokes?: number;
    putts?: number;
    fairway_hit?: boolean | null;
    green_in_regulation?: boolean;
    sand_save?: boolean;
    penalties?: number;
  },
) {
  const { supabase } = await requireUser();

  // Setting strokes clears picked_up (player un-picked-up by typing a score)
  const fullPatch: typeof patch & { picked_up?: boolean } = { ...patch };
  if (patch.strokes !== undefined && patch.strokes > 0) {
    fullPatch.picked_up = false;
  }

  const { error } = await supabase
    .from("scorecard_entries")
    .update(fullPatch)
    .eq("round_id", roundId)
    .eq("hole_number", holeNumber);
  if (error) throw new Error(error.message);

  if (patch.strokes !== undefined) await recomputeRoundTotals(supabase, roundId);

  revalidatePath(`/round/${roundId}`);
  revalidatePath("/rounds");
  revalidatePath("/stats");
}

export async function pickUpHole(roundId: string, holeNumber: number) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("scorecard_entries")
    .update({ picked_up: true, strokes: 0 })
    .eq("round_id", roundId)
    .eq("hole_number", holeNumber);
  if (error) throw new Error(error.message);

  await recomputeRoundTotals(supabase, roundId);
  revalidatePath(`/round/${roundId}`);
  revalidatePath("/rounds");
  revalidatePath("/stats");
}

export async function finishRound(roundId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("rounds")
    .update({ status: "completed", finished_at: new Date().toISOString() })
    .eq("id", roundId);
  if (error) throw new Error(error.message);

  await recomputeRoundTotals(supabase, roundId);

  revalidatePath(`/round/${roundId}`);
  revalidatePath("/rounds");
  revalidatePath("/stats");
  redirect(`/rounds/${roundId}`);
}

export async function reopenRound(roundId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("rounds")
    .update({ status: "in_progress", finished_at: null })
    .eq("id", roundId);
  if (error) throw new Error(error.message);

  revalidatePath(`/round/${roundId}`);
  revalidatePath("/rounds");
  revalidatePath("/stats");
  redirect(`/round/${roundId}`);
}

export async function deleteRound(roundId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("rounds").delete().eq("id", roundId);
  if (error) throw new Error(error.message);
  revalidatePath("/rounds");
  revalidatePath("/stats");
  redirect("/rounds");
}
