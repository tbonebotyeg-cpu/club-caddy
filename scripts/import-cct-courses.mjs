// One-off: import Country Club Tour courses into the signed-in user's account.
// Run with: node scripts/import-cct-courses.mjs
// Uses SUPABASE_SERVICE_ROLE_KEY from .env.local (bypasses RLS).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Lightweight .env.local loader (no extra deps)
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing env vars");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Find the (sole) user
const { data: users, error: userErr } = await admin.auth.admin.listUsers();
if (userErr) throw userErr;
const user = users.users[0];
if (!user) throw new Error("No user found — sign in to the app first");
console.log(`Importing for ${user.email} (${user.id})`);

// 7 Country Club Tour courses — names + cities from countryclubtour.com/outdoor-golf/
// Slope/rating/holes are placeholders until you fill them in from the real scorecard.
const COURSES = [
  { name: "Goose Hummock",      city: "Gibbons",     par: 72 },
  { name: "RedTail Landing",    city: "Nisku",       par: 72 },
  { name: "Sandpiper",          city: "St. Albert",  par: 72 },
  { name: "River Ridge",        city: "Edmonton",    par: 72 },
  { name: "Raven Crest",        city: "Edmonton",    par: 72 },
  { name: "Whitetail Crossing", city: "Mundare",     par: 72 },
  { name: "Montgomery Glen",    city: "Wetaskiwin",  par: 72 },
];

// Sensible default 18 holes: par 72 (4×3 + 10×4 + 4×5), 380y, HCP 1-18
const DEFAULT_PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 4, 5, 4, 4, 3, 5]; // sums to 72
const DEFAULT_HOLES = DEFAULT_PARS.map((par, i) => ({
  hole_number: i + 1,
  par,
  yardage: par === 3 ? 165 : par === 5 ? 510 : 380,
  handicap_index: i + 1,
}));

for (const c of COURSES) {
  // Skip if it already exists for this user
  const { data: existing } = await admin
    .from("courses")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", c.name)
    .maybeSingle();
  if (existing) {
    console.log(`  skip ${c.name} (already exists)`);
    continue;
  }

  const { data: course, error: cErr } = await admin
    .from("courses")
    .insert({
      user_id: user.id,
      name: c.name,
      city: c.city,
      country: "Canada",
      par_total: c.par,
      tees_label: "White",
      slope_rating: 113,
      course_rating: 72.0,
    })
    .select()
    .single();
  if (cErr || !course) {
    console.error(`  fail ${c.name}: ${cErr?.message}`);
    continue;
  }

  const { error: hErr } = await admin
    .from("holes")
    .insert(DEFAULT_HOLES.map((h) => ({ ...h, course_id: course.id })));
  if (hErr) {
    console.error(`  fail ${c.name} holes: ${hErr.message}`);
    continue;
  }
  console.log(`  done ${c.name}`);
}

console.log("\nAll 7 courses imported. Open /courses to edit slope/rating/yardages from the real scorecards.");
