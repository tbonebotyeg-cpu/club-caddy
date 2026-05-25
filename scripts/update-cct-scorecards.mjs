// Update the 7 CCT courses with real scorecard data extracted from the official
// Country Club Tour PDFs (and AllSquareGolf for Goose Hummock).
// Run with: node scripts/update-cct-scorecards.mjs

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
console.log(`Updating for ${user.email}\n`);

// Real scorecard data from official PDFs (Dec 2024) on countryclubtour.com,
// cross-referenced with Golf Canada / BlueGolf where applicable.
const COURSES = [
  {
    name: "Goose Hummock",
    par_total: 71, slope: 125, rating: 67.8,
    holes: [
      [4,374,3],[4,355,11],[3,162,13],[4,345,5],[5,432,15],[4,359,9],[5,431,1],[3,93,17],[4,302,7],
      [4,243,16],[3,111,18],[5,381,10],[4,286,14],[4,286,8],[4,310,4],[4,340,2],[3,112,12],[4,308,6],
    ],
  },
  {
    name: "RedTail Landing",
    par_total: 72, slope: 121, rating: 70.1,
    holes: [
      [4,368,13],[5,503,3],[4,379,11],[3,180,9],[5,527,5],[4,336,15],[4,348,7],[3,140,17],[4,395,1],
      [4,372,14],[5,516,2],[3,179,12],[4,335,10],[5,563,4],[4,421,6],[4,301,18],[3,182,16],[4,425,8],
    ],
  },
  {
    name: "Sandpiper",
    par_total: 72, slope: 121, rating: 69.0,
    holes: [
      [4,380,10],[4,325,16],[5,530,2],[3,150,14],[4,320,18],[5,500,6],[3,165,12],[4,335,8],[4,365,4],
      [5,515,13],[4,365,11],[4,375,7],[3,135,17],[4,340,9],[5,475,1],[4,370,5],[3,150,15],[4,385,3],
    ],
  },
  {
    name: "River Ridge",
    par_total: 71, slope: 117, rating: 68.5,
    holes: [
      [5,469,1],[4,316,11],[3,164,17],[4,378,9],[3,173,7],[4,351,3],[4,333,13],[3,165,15],[5,556,5],
      [4,384,8],[5,548,4],[3,146,14],[4,426,10],[4,407,2],[3,150,18],[4,333,16],[4,372,12],[5,465,6],
    ],
  },
  {
    name: "Raven Crest",
    par_total: 72, slope: 117, rating: 68.7,
    holes: [
      [4,358,7],[4,441,1],[3,135,9],[5,481,3],[5,471,11],[3,112,17],[4,335,15],[4,332,13],[4,412,5],
      [5,503,14],[4,314,18],[3,198,10],[4,356,6],[5,511,4],[3,150,12],[4,412,2],[4,337,16],[4,346,8],
    ],
  },
  {
    name: "Whitetail Crossing",
    par_total: 72, slope: 119, rating: 68.1,
    holes: [
      [4,402,3],[5,462,5],[4,340,9],[3,148,11],[4,340,1],[5,464,15],[4,382,7],[3,121,17],[4,325,13],
      [4,341,14],[4,308,18],[5,475,4],[4,360,2],[3,165,12],[4,288,10],[3,142,16],[5,457,8],[4,343,6],
    ],
  },
  {
    name: "Montgomery Glen",
    par_total: 72, slope: 119, rating: 67.9,
    holes: [
      [4,351,13],[4,332,9],[4,396,5],[3,174,15],[5,406,7],[4,331,11],[4,402,3],[3,115,17],[5,438,1],
      [4,298,10],[3,161,12],[4,360,4],[3,169,18],[4,342,16],[5,403,6],[4,340,2],[5,400,8],[4,346,14],
    ],
  },
];

for (const c of COURSES) {
  const { data: course } = await admin
    .from("courses")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", c.name)
    .maybeSingle();
  if (!course) {
    console.log(`  skip ${c.name} (not found)`);
    continue;
  }

  // Update course meta
  const { error: uErr } = await admin
    .from("courses")
    .update({
      par_total: c.par_total,
      slope_rating: c.slope,
      course_rating: c.rating,
      tees_label: "White",
    })
    .eq("id", course.id);
  if (uErr) { console.error(`  fail ${c.name}: ${uErr.message}`); continue; }

  // Replace holes
  await admin.from("holes").delete().eq("course_id", course.id);
  const holeRows = c.holes.map(([par, yards, hcp], i) => ({
    course_id: course.id,
    hole_number: i + 1,
    par, yardage: yards, handicap_index: hcp,
  }));
  const { error: hErr } = await admin.from("holes").insert(holeRows);
  if (hErr) { console.error(`  fail ${c.name} holes: ${hErr.message}`); continue; }

  console.log(`  done ${c.name} (par ${c.par_total}, ${c.rating}/${c.slope})`);
}

console.log("\nAll 7 courses updated with real scorecard data from official PDFs.");
