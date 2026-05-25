// Insert Jagare Ridge, Country Side, Legends (2 combos), The Quarry (Slate/Granite).
// All on "White" (or Deck 3 for Quarry) — multi-tee comes next migration.
// Run with: node scripts/import-new-venues.mjs

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
console.log(`Inserting for ${user.email}\n`);

// HCPs are odd for front-9, even for back-9 (standard USGA allocation).
// Where back-9 HCPs are unknown, assigned even numbers in hole order as placeholder.

const COURSES = [
  {
    name: "Jagare Ridge",
    city: "Edmonton",
    par_total: 71, slope: 129, rating: 70.1, tees: "White",
    holes: [
      [5,521,5],[4,315,13],[4,390,1],[3,111,17],[5,498,7],[4,283,9],[3,157,11],[4,264,15],[4,407,3],
      [4,282,8],[4,266,12],[4,363,6],[3,148,18],[4,335,14],[3,170,10],[4,360,2],[5,544,4],[4,286,16],
    ],
  },
  {
    name: "Country Side — Prairies/Meadows",
    city: "Sherwood Park",
    par_total: 72, slope: 122, rating: 70.4, tees: "White",
    holes: [
      [4,399,13],[4,339,5],[5,494,17],[4,336,7],[3,162,11],[4,408,1],[5,545,3],[3,145,15],[4,345,9],
      [4,295,18],[3,204,6],[4,343,12],[3,130,14],[5,455,16],[4,416,2],[5,515,10],[4,396,4],[4,368,8],
    ],
  },
  {
    name: "Legends — Champions + Old Hickory",
    city: "Sherwood Park",
    par_total: 72, slope: 121, rating: 69.2, tees: "White",
    holes: [
      // Champions Nine (front)
      [4,331,13],[4,340,7],[5,472,3],[4,368,11],[3,151,15],[5,488,1],[4,404,5],[3,164,17],[4,332,9],
      // Old Hickory Nine (back)
      [5,501,4],[4,379,8],[4,364,10],[5,528,2],[3,134,18],[4,308,12],[4,420,6],[3,170,16],[4,306,14],
    ],
  },
  {
    name: "Legends — Old Hickory + Traditions",
    city: "Sherwood Park",
    par_total: 72, slope: 118, rating: 67.5, tees: "White",
    holes: [
      // Old Hickory Nine (front) — using its own HCPs as odd
      [5,501,3],[4,379,7],[4,364,9],[5,528,1],[3,134,17],[4,308,11],[4,420,5],[3,170,15],[4,306,13],
      // Traditions Nine (back) — official HCPs not published; placeholder evens
      [4,320,2],[4,357,4],[3,135,6],[4,326,8],[5,579,10],[5,470,12],[3,148,14],[4,369,16],[4,380,18],
    ],
  },
  {
    name: "The Quarry — Slate/Granite",
    city: "Edmonton",
    par_total: 72, slope: 122, rating: 72.8, tees: "Deck 3",
    holes: [
      // Slate Nine (front) — verified HCPs
      [4,313,5],[4,414,1],[5,526,13],[4,360,17],[4,353,3],[3,155,11],[4,368,7],[3,138,15],[5,501,9],
      // Granite Nine (back) — HCPs not published; placeholder evens
      [4,411,2],[5,524,4],[3,173,6],[4,348,8],[4,344,10],[3,198,12],[5,496,14],[4,386,16],[4,333,18],
    ],
  },
];

for (const c of COURSES) {
  const { data: existing } = await admin
    .from("courses").select("id")
    .eq("user_id", user.id).eq("name", c.name).maybeSingle();
  if (existing) {
    console.log(`  skip ${c.name} (already exists)`);
    continue;
  }

  const { data: course, error: cErr } = await admin
    .from("courses").insert({
      user_id: user.id,
      name: c.name, city: c.city, country: "Canada",
      par_total: c.par_total,
      tees_label: c.tees,
      slope_rating: c.slope, course_rating: c.rating,
    }).select().single();
  if (cErr || !course) { console.error(`  fail ${c.name}: ${cErr?.message}`); continue; }

  const holeRows = c.holes.map(([par, yards, hcp], i) => ({
    course_id: course.id, hole_number: i + 1,
    par, yardage: yards, handicap_index: hcp,
  }));
  const { error: hErr } = await admin.from("holes").insert(holeRows);
  if (hErr) { console.error(`  fail ${c.name} holes: ${hErr.message}`); continue; }

  console.log(`  done ${c.name} (par ${c.par_total}, ${c.rating}/${c.slope} ${c.tees})`);
}

console.log("\nDone.");
