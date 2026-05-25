"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ClubSchema, SWING_PCTS, STARTER_BAG, type ClubType, type SwingPct } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createClub(input: {
  name: string;
  type: ClubType;
  loft?: number | null;
  notes?: string | null;
}) {
  const parsed = ClubSchema.pick({ name: true, type: true, loft: true, notes: true }).parse(input);
  const { supabase, user } = await requireUser();

  const { count } = await supabase
    .from("clubs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: club, error } = await supabase
    .from("clubs")
    .insert({
      user_id: user.id,
      name: parsed.name,
      type: parsed.type,
      loft: parsed.loft ?? null,
      notes: parsed.notes ?? null,
      position: count ?? 0,
    })
    .select()
    .single();
  if (error || !club) throw new Error(error?.message || "Failed to create club");

  // Seed empty yardages so the matrix renders immediately.
  await supabase.from("club_yardages").insert(
    SWING_PCTS.map((p) => ({ club_id: club.id, swing_pct: p, yardage: 0 })),
  );

  revalidatePath("/bag");
  return club;
}

export async function updateClub(
  id: string,
  patch: { name?: string; type?: ClubType; loft?: number | null; notes?: string | null },
) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("clubs").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bag");
}

export async function deleteClub(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("clubs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bag");
}

export async function setYardage(clubId: string, swingPct: SwingPct, yardage: number) {
  const { supabase } = await requireUser();
  const clean = Math.max(0, Math.min(500, Math.round(yardage)));
  const { error } = await supabase
    .from("club_yardages")
    .upsert(
      { club_id: clubId, swing_pct: swingPct, yardage: clean },
      { onConflict: "club_id,swing_pct" },
    );
  if (error) throw new Error(error.message);
  revalidatePath("/bag");
}

export async function reorderClubs(orderedIds: string[]) {
  const { supabase, user } = await requireUser();
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("clubs").update({ position: idx }).eq("id", id).eq("user_id", user.id),
    ),
  );
  revalidatePath("/bag");
}

export async function seedStarterBag() {
  const { supabase, user } = await requireUser();
  const { count } = await supabase
    .from("clubs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) > 0) return;

  const rows = STARTER_BAG.map((c, i) => ({
    user_id: user.id,
    name: c.name,
    type: c.type,
    loft: c.loft,
    position: i,
  }));
  const { data: clubs, error } = await supabase.from("clubs").insert(rows).select();
  if (error || !clubs) throw new Error(error?.message || "Failed to seed bag");

  const yardages = clubs.flatMap((c) =>
    SWING_PCTS.map((p) => ({ club_id: c.id, swing_pct: p, yardage: 0 })),
  );
  await supabase.from("club_yardages").insert(yardages);
  revalidatePath("/bag");
}
