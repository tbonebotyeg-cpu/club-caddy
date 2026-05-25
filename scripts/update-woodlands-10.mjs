// Update "Country Side — Woodlands (9)" to be a 10-hole course (the bonus hole 10
// from the official scorecard, par 4, HCP 19 → mapped to a sequential placeholder).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: users } = await admin.auth.admin.listUsers();
const user = users.users[0];

// Find current Woodlands course
const { data: woodlands } = await admin
  .from("courses").select("id, name")
  .eq("user_id", user.id)
  .eq("name", "Country Side — Woodlands (9)")
  .maybeSingle();

if (!woodlands) {
  console.log("Woodlands course not found");
  process.exit(0);
}

// Rename + bump hole count to 10
const { error: renameErr } = await admin
  .from("courses").update({
    name: "Country Side — Woodlands",
    hole_count: 10,
    par_total: 39, // 35 + 4 (bonus hole)
  }).eq("id", woodlands.id);
if (renameErr) { console.error(renameErr.message); process.exit(1); }

// Add hole 10 (par 4, HCP placeholder — would have been 19, capped to 10)
const { error: holeErr } = await admin.from("holes").insert({
  course_id: woodlands.id,
  hole_number: 10,
  par: 4,
  handicap_index: 10,
  yardages: {
    "Blue": 292,
    "Blue/White": 283,
    "White": 283,
    "White/Red": 235,
    "Red": 235,
    "Gold": 180,
  },
});
if (holeErr) { console.error(holeErr.message); process.exit(1); }

console.log("✓ Woodlands updated to 10 holes (par 39, bonus hole 10 added)");
