// Expand Country Side combos with Woodlands from 18 to 19 holes so the
// bonus hole 10 of Woodlands is included. Also corrects Woodlands' par_total
// (was off by 1).
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
console.log(`Fixing for ${user.email}\n`);

// === Source data (from CCT official PDF) ============================
const PRAIRIES = {
  pars:  [4,4,5,4,3,4,5,3,4],
  hcps:  [13,5,17,7,11,1,3,15,9],         // front-9 odd, in 18-hole convention
  yards: {
    "Blue":       [412,376,539,382,208,453,634,207,375],
    "Blue/White": [412,376,494,382,208,408,634,145,345],
    "White":      [399,339,494,336,162,408,612,145,345],
    "White/Red":  [399,313,415,284,162,370,568,145,345],
    "Red":        [383,313,415,284,115,370,568,135,288],
    "Gold":       [284,200,335,200, 70,264,483,130,198],
  },
};

const MEADOWS = {
  pars:  [4,3,4,3,5,4,5,4,4],
  hcps_when_back: [18,6,12,14,16,2,10,4,8], // when used as back 9 of P/M
  hcps_when_front: [17,5,11,13,15,1,9,3,7], // shifted to odd
  yards: {
    "Blue":       [307,221,352,146,491,473,596,452,415],
    "Blue/White": [307,204,352,130,491,473,515,396,415],
    "White":      [295,204,343,130,455,416,515,396,368],
    "White/Red":  [295,155,343,130,403,384,478,396,368],
    "Red":        [251,155,334, 95,403,384,478,369,317],
    "Gold":       [210, 97,222, 95,315,263,367,294,231],
  },
};

const WOODLANDS_10 = {
  pars:  [4,4,3,4,4,4,4,3,4,4],            // 10 holes incl. bonus
  yards: {
    "Blue":       [285,280,220,274,326,354,328,140,291,292],
    "Blue/White": [285,280,158,274,326,340,328,140,276,283],
    "White":      [269,280,158,261,312,340,323,132,276,283],
    "White/Red":  [269,280,120,261,290,334,323,124,276,235],
    "Red":        [253,270,120,248,290,334,318,124,233,235],
    "Gold":       [125,219,125,195,235,245,222,110,185,180],
  },
};

// Combo tees (same 6 men's tees as the rated P/M combo; P/W and M/W aren't
// officially rated but Country Side rounds bonus into the same tee labels)
const TEES = [
  { label: "Blue",       slope: 133, rating: 73.4, color: "#3b82f6" },
  { label: "Blue/White", slope: 125, rating: 71.9, color: "#dbeafe" },
  { label: "White",      slope: 122, rating: 70.4, color: "#fafafa" },
  { label: "White/Red",  slope: 117, rating: 68.3, color: "#fecaca" },
  { label: "Red",        slope: 115, rating: 67.0, color: "#ef4444" },
  { label: "Gold",       slope: 100, rating: 61.0, color: "#facc15" },
];

// HCPs for Woodlands' 10 holes when used as the back 9+bonus of a 19-hole combo:
// holes 1-9 → even 2,4,6,8,10,12,14,16,18 (back-9 ranked by standalone Woodlands HCPs)
// hole 10 (bonus) → 19 (the "easiest" / last to give a stroke)
// Woodlands standalone HCPs (1-9 only): [9,13,3,15,7,1,5,11,17] → ranks: easiest→hardest order
const WOODLANDS_RANKS = [5, 7, 2, 8, 4, 1, 3, 6, 9]; // rank of each hole among 1-9
const WOODLANDS_BACK_HCPS = WOODLANDS_RANKS.map((r) => 2 * r);  // 10,14,4,16,8,2,6,12,18
const WOODLANDS_BONUS_HCP = 19;

function buildHole(holeNumber, par, hcp, yardagesPerTee, idx) {
  const yardages = {};
  for (const [t, ys] of Object.entries(yardagesPerTee)) {
    if (ys[idx] != null) yardages[t] = ys[idx];
  }
  return {
    hole_number: holeNumber,
    par,
    handicap_index: hcp ?? null,
    yardages,
  };
}

// 19-hole combo: front 9 (Prairies/Meadows) + 10 Woodlands holes
function buildCombo({ frontPars, frontHcps, frontYards, woodlands }) {
  const holes = [];
  for (let i = 0; i < 9; i++) {
    holes.push(buildHole(i + 1, frontPars[i], frontHcps[i], frontYards, i));
  }
  for (let i = 0; i < 9; i++) {
    holes.push(buildHole(i + 10, woodlands.pars[i], WOODLANDS_BACK_HCPS[i], woodlands.yards, i));
  }
  // Bonus hole 19 (Woodlands' 10th)
  holes.push(buildHole(19, woodlands.pars[9], WOODLANDS_BONUS_HCP, woodlands.yards, 9));
  return holes;
}

const COURSES = [
  {
    name: "Country Side — Prairies/Woodlands",
    par_total: 36 + 38,  // Prairies 36 + Woodlands 10-hole 38 = 74
    hole_count: 19,
    holes: buildCombo({
      frontPars: PRAIRIES.pars,
      frontHcps: PRAIRIES.hcps,
      frontYards: PRAIRIES.yards,
      woodlands: WOODLANDS_10,
    }),
  },
  {
    name: "Country Side — Meadows/Woodlands",
    par_total: 36 + 38,
    hole_count: 19,
    holes: buildCombo({
      frontPars: MEADOWS.pars,
      frontHcps: MEADOWS.hcps_when_front,
      frontYards: MEADOWS.yards,
      woodlands: WOODLANDS_10,
    }),
  },
];

for (const c of COURSES) {
  const { data: existing } = await admin
    .from("courses").select("id")
    .eq("user_id", user.id).eq("name", c.name).maybeSingle();
  if (!existing) {
    console.log(`  skip ${c.name} (not found)`);
    continue;
  }

  const { error: uErr } = await admin
    .from("courses").update({
      par_total: c.par_total,
      hole_count: c.hole_count,
      tees: TEES,
    }).eq("id", existing.id);
  if (uErr) { console.error(`  fail ${c.name}: ${uErr.message}`); continue; }

  await admin.from("holes").delete().eq("course_id", existing.id);
  const holeRows = c.holes.map((h) => ({ course_id: existing.id, ...h }));
  const { error: hErr } = await admin.from("holes").insert(holeRows);
  if (hErr) { console.error(`  fail ${c.name} holes: ${hErr.message}`); continue; }

  console.log(`  upd ${c.name} (par ${c.par_total}, ${c.hole_count}h)`);
}

// Also correct par_total for the standalone 10-hole Woodlands (was 39, should be 38)
const { data: w } = await admin
  .from("courses").select("id")
  .eq("user_id", user.id).eq("name", "Country Side — Woodlands").maybeSingle();
if (w) {
  await admin.from("courses").update({ par_total: 38 }).eq("id", w.id);
  console.log("  upd Country Side — Woodlands (par 38 corrected)");
}

console.log("\nDone.");
