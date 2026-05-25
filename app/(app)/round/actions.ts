"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scoreDifferential } from "@/lib/handicap";

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
  tees_played?: string | null;
  notes?: string | null;
  weather_summary?: string | null;
}) {
  const { supabase, user } = await requireUser();

  const { data: round, error } = await supabase
    .from("rounds")
    .insert({
      user_id: user.id,
      course_id: input.course_id,
      played_at: new Date().toISOString(),
      tees_played: input.tees_played ?? null,
      notes: input.notes ?? null,
      weather_summary: input.weather_summary ?? null,
    })
    .select()
    .single();
  if (error || !round) throw new Error(error?.message || "Failed to start round");

  // Pre-seed scorecard rows for 18 holes (strokes=0 means "not played yet")
  const entries = Array.from({ length: 18 }, (_, i) => ({
    round_id: round.id,
    hole_number: i + 1,
    strokes: 0,
    putts: 0,
    penalties: 0,
    green_in_regulation: false,
    sand_save: false,
    fairway_hit: null,
  }));
  const { error: entriesErr } = await supabase.from("scorecard_entries").insert(entries);
  if (entriesErr) throw new Error(entriesErr.message);

  revalidatePath("/rounds");
  redirect(`/round/${round.id}`);
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

  const { error } = await supabase
    .from("scorecard_entries")
    .update(patch)
    .eq("round_id", roundId)
    .eq("hole_number", holeNumber);
  if (error) throw new Error(error.message);

  // Recompute round totals if strokes changed
  if (patch.strokes !== undefined) {
    const { data: entries } = await supabase
      .from("scorecard_entries")
      .select("strokes")
      .eq("round_id", roundId);
    const total = (entries ?? []).reduce((s, e) => s + (e.strokes || 0), 0);

    // Get course rating/slope for differential
    const { data: roundRow } = await supabase
      .from("rounds")
      .select("course_id, courses(course_rating, slope_rating)")
      .eq("id", roundId)
      .single();
    const round = roundRow as unknown as
      | { course_id: string; courses: { course_rating: number; slope_rating: number } | null }
      | null;
    const course = round?.courses ?? null;

    let differential: number | null = null;
    const holesPlayed = (entries ?? []).filter((e) => e.strokes > 0).length;
    if (course && holesPlayed === 18 && total > 0) {
      differential = scoreDifferential({
        adjustedGrossScore: total,
        courseRating: Number(course.course_rating),
        slopeRating: course.slope_rating,
      });
    }
    await supabase
      .from("rounds")
      .update({ total_strokes: total, score_differential: differential })
      .eq("id", roundId);
  }

  revalidatePath(`/round/${roundId}`);
  revalidatePath("/rounds");
  revalidatePath("/stats");
}

export async function finishRound(roundId: string) {
  revalidatePath(`/round/${roundId}`);
  revalidatePath("/rounds");
  revalidatePath("/stats");
  redirect(`/rounds/${roundId}`);
}

export async function deleteRound(roundId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("rounds").delete().eq("id", roundId);
  if (error) throw new Error(error.message);
  revalidatePath("/rounds");
  revalidatePath("/stats");
  redirect("/rounds");
}
