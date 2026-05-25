// Insert Alberta Beach Golf Resort with multi-tee data.
// Par 72, 18 holes. Blue / White / Red tees (men's slope/rating).
// Source: GolfPass scorecard + Golf Canada facility page.
// Note: GolfPass total for red (4961) differs from Golf Canada (4831) by 130y —
// using GolfPass per-hole numbers since they're internally consistent.
// Run: node scripts/import-alberta-beach.mjs

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
console.log(`Inserting Alberta Beach for ${user.email}\n`);

// === Scorecard data ======================================================

const PARS = [4, 5, 4, 5, 3, 4, 5, 3, 4,  4, 3, 4, 4, 5, 3, 4, 4, 4]; // total 72
const HCPS = [7,15, 1, 5,11,17,13, 9, 3,  4,18,16,10, 2, 6, 8,14,12];

const YARDS = {
  Blue:  [317, 501, 387, 509, 211, 343, 459, 108, 415,  324, 152, 354, 414, 435, 168, 397, 405, 387], // 6286
  White: [295, 431, 328, 448, 169, 315, 432,  99, 359,  309, 138, 332, 360, 417, 137, 332, 389, 371], // 5661
  Red:   [256, 386, 272, 419, 139, 286, 388,  86, 307,  301, 129, 296, 318, 387, 109, 301, 284, 297], // 4961
};

const TEES = [
  { label: "Blue",  slope: 126, rating: 73.6, color: "#3b82f6" },
  { label: "White", slope: 121, rating: 70.7, color: "#fafafa" },
  { label: "Red",   slope: 114, rating: 66.9, color: "#ef4444" },
];

const PAR_TOTAL = PARS.reduce((a, b) => a + b, 0); // 72

// === Build hole rows =====================================================

const HOLES = PARS.map((par, i) => {
  const yardages = {};
  for (const [t, ys] of Object.entries(YARDS)) {
    if (ys[i] != null) yardages[t] = ys[i];
  }
  return {
    hole_number: i + 1,
    par,
    handicap_index: HCPS[i],
    yardages,
  };
});

// === Upsert ==============================================================

const COURSE = {
  name: "Alberta Beach Golf Resort",
  city: "Alberta Beach",
  country: "Canada",
  par_total: PAR_TOTAL,
  hole_count: 18,
  tees: TEES,
};

const { data: existing } = await admin
  .from("courses").select("id")
  .eq("user_id", user.id).eq("name", COURSE.name).maybeSingle();

if (existing) {
  const { error } = await admin
    .from("courses").update({
      par_total: COURSE.par_total,
      hole_count: COURSE.hole_count,
      tees: COURSE.tees,
    }).eq("id", existing.id);
  if (error) { console.error(`fail: ${error.message}`); process.exit(1); }
  await admin.from("holes").delete().eq("course_id", existing.id);
  const holeRows = HOLES.map((h) => ({ course_id: existing.id, ...h }));
  const { error: hErr } = await admin.from("holes").insert(holeRows);
  if (hErr) { console.error(`fail holes: ${hErr.message}`); process.exit(1); }
  console.log(`upd ${COURSE.name} (par ${COURSE.par_total}, ${COURSE.hole_count}h)`);
} else {
  const { data: created, error } = await admin
    .from("courses").insert({
      user_id: user.id,
      name: COURSE.name,
      city: COURSE.city,
      country: COURSE.country,
      par_total: COURSE.par_total,
      hole_count: COURSE.hole_count,
      tees: COURSE.tees,
    }).select().single();
  if (error || !created) { console.error(`fail: ${error?.message}`); process.exit(1); }
  const holeRows = HOLES.map((h) => ({ course_id: created.id, ...h }));
  const { error: hErr } = await admin.from("holes").insert(holeRows);
  if (hErr) { console.error(`fail holes: ${hErr.message}`); process.exit(1); }
  console.log(`new ${COURSE.name} (par ${COURSE.par_total}, ${COURSE.hole_count}h)`);
}

console.log("\nDone.");
