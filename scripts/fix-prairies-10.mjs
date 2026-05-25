// Prairies has alternate hole 9B → effectively 10 holes.
// Reshapes Country Side combos and adds two standalone loops.
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

// === Loop data ===========================================================

// Prairies — 10 holes (1-9 + alternate 9B as hole 10). 9B par 3, no published HCP.
const PRAIRIES_10 = {
  pars:  [4,4,5,4,3,4,5,3,4, 3],
  hcps:  [13,5,17,7,11,1,3,15,9, null],  // 9B has no HCP
  yards: {
    // 9B yardage from PDF: Blue=130, White=121, Red=112, Gold=112; B/W and W/R use White's
    "Blue":       [412,376,539,382,208,453,634,207,375, 130],
    "Blue/White": [412,376,494,382,208,408,634,145,345, 121],
    "White":      [399,339,494,336,162,408,612,145,345, 121],
    "White/Red":  [399,313,415,284,162,370,568,145,345, 121],
    "Red":        [383,313,415,284,115,370,568,135,288, 112],
    "Gold":       [284,200,335,200, 70,264,483,130,198, 112],
  },
};

const MEADOWS_9 = {
  pars:  [4,3,4,3,5,4,5,4,4],
  hcps_back:  [18,6,12,14,16,2,10,4,8],
  hcps_front: [17,5,11,13,15,1,9,3,7],
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
  pars:  [4,4,3,4,4,4,4,3,4, 4],
  yards: {
    "Blue":       [285,280,220,274,326,354,328,140,291, 292],
    "Blue/White": [285,280,158,274,326,340,328,140,276, 283],
    "White":      [269,280,158,261,312,340,323,132,276, 283],
    "White/Red":  [269,280,120,261,290,334,323,124,276, 235],
    "Red":        [253,270,120,248,290,334,318,124,233, 235],
    "Gold":       [125,219,125,195,235,245,222,110,185, 180],
  },
  // Woodlands standalone HCPs (1-9): the agent gave [9,13,3,15,7,1,5,11,17] — odd-spread
  // Ranks 1-9: [5,7,2,8,4,1,3,6,9]
  ranks: [5,7,2,8,4,1,3,6,9],
};

const TEES = [
  { label: "Blue",       slope: 133, rating: 73.4, color: "#3b82f6" },
  { label: "Blue/White", slope: 125, rating: 71.9, color: "#dbeafe" },
  { label: "White",      slope: 122, rating: 70.4, color: "#fafafa" },
  { label: "White/Red",  slope: 117, rating: 68.3, color: "#fecaca" },
  { label: "Red",        slope: 115, rating: 67.0, color: "#ef4444" },
  { label: "Gold",       slope: 100, rating: 61.0, color: "#facc15" },
];

const WOODLANDS_STANDALONE_TEES = [
  { label: "Blue",       slope: 108, rating: 32.3, color: "#3b82f6" },
  { label: "Blue/White", slope: 105, rating: 32.0, color: "#dbeafe" },
  { label: "White",      slope: 104, rating: 31.7, color: "#fafafa" },
  { label: "White/Red",  slope: 102, rating: 31.5, color: "#fecaca" },
  { label: "Red",        slope: 101, rating: 31.2, color: "#ef4444" },
  { label: "Gold",        slope:  94, rating: 28.7, color: "#facc15" },
];

// === Helpers =============================================================

function makeHole(holeNumber, par, hcp, yardagesByTee, idx) {
  const yardages = {};
  for (const [t, ys] of Object.entries(yardagesByTee)) {
    if (ys[idx] != null) yardages[t] = ys[idx];
  }
  return {
    hole_number: holeNumber,
    par,
    handicap_index: hcp ?? null,
    yardages,
  };
}

function buildPrairies10(startNumber = 1, hcps = PRAIRIES_10.hcps) {
  return PRAIRIES_10.pars.map((par, i) =>
    makeHole(startNumber + i, par, hcps[i], PRAIRIES_10.yards, i),
  );
}

function buildMeadows9(startNumber, hcps) {
  return MEADOWS_9.pars.map((par, i) =>
    makeHole(startNumber + i, par, hcps[i], MEADOWS_9.yards, i),
  );
}

// Build Woodlands holes, with HCPs reranked to fit a back-9 slot (even numbers)
// + bonus hole 10 → highest available HCP.
function buildWoodlands10(startNumber, baseHcp) {
  // back-9 even HCPs derived from ranks; bonus = next available
  const backHcps = WOODLANDS_10.ranks.map((r) => baseHcp + 2 * r);
  const bonusHcp = baseHcp + 18 + 1; // 19 for back-9 slot
  const allHcps = [...backHcps, bonusHcp];
  return WOODLANDS_10.pars.map((par, i) =>
    makeHole(startNumber + i, par, allHcps[i], WOODLANDS_10.yards, i),
  );
}

// === Course definitions ===================================================

const COURSES = [
  // === Standalone loops =====
  {
    name: "Country Side — Prairies",
    par_total: PRAIRIES_10.pars.reduce((a, b) => a + b, 0), // 39
    hole_count: 10,
    tees: TEES,
    holes: buildPrairies10(1, PRAIRIES_10.hcps),
  },
  {
    name: "Country Side — Meadows",
    par_total: 36,
    hole_count: 9,
    tees: TEES,
    holes: buildMeadows9(1, MEADOWS_9.hcps_front),
  },

  // === Combos =====
  {
    name: "Country Side — Prairies/Meadows",
    par_total: 39 + 36,  // 75
    hole_count: 19,
    tees: TEES,
    holes: [
      ...buildPrairies10(1, PRAIRIES_10.hcps),
      ...buildMeadows9(11, MEADOWS_9.hcps_back),
    ],
  },
  {
    name: "Country Side — Prairies/Woodlands",
    par_total: 39 + 38,  // 77
    hole_count: 20,
    tees: TEES,
    holes: [
      ...buildPrairies10(1, PRAIRIES_10.hcps),
      // Woodlands as back: hcps shifted up by 0 → even 2-18 + bonus 19
      ...buildWoodlands10(11, 0),
    ],
  },
  {
    name: "Country Side — Meadows/Woodlands",
    par_total: 36 + 38,  // 74
    hole_count: 19,
    tees: TEES,
    holes: [
      ...buildMeadows9(1, MEADOWS_9.hcps_front),
      ...buildWoodlands10(10, 0),
    ],
  },
];

// === Upsert ==============================================================

async function upsertCourse(c) {
  const { data: existing } = await admin
    .from("courses").select("id")
    .eq("user_id", user.id).eq("name", c.name).maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("courses").update({
        par_total: c.par_total,
        hole_count: c.hole_count,
        tees: c.tees,
      }).eq("id", existing.id);
    if (error) { console.error(`  fail ${c.name}: ${error.message}`); return; }
    await admin.from("holes").delete().eq("course_id", existing.id);
    const holeRows = c.holes.map((h) => ({ course_id: existing.id, ...h }));
    const { error: hErr } = await admin.from("holes").insert(holeRows);
    if (hErr) { console.error(`  fail ${c.name} holes: ${hErr.message}`); return; }
    console.log(`  upd ${c.name} (par ${c.par_total}, ${c.hole_count}h)`);
  } else {
    const { data: created, error } = await admin
      .from("courses").insert({
        user_id: user.id,
        name: c.name,
        city: "Sherwood Park",
        country: "Canada",
        par_total: c.par_total,
        hole_count: c.hole_count,
        tees: c.tees,
      }).select().single();
    if (error || !created) { console.error(`  fail ${c.name}: ${error?.message}`); return; }
    const holeRows = c.holes.map((h) => ({ course_id: created.id, ...h }));
    const { error: hErr } = await admin.from("holes").insert(holeRows);
    if (hErr) { console.error(`  fail ${c.name} holes: ${hErr.message}`); return; }
    console.log(`  new ${c.name} (par ${c.par_total}, ${c.hole_count}h)`);
  }
}

for (const c of COURSES) await upsertCourse(c);

console.log("\nDone.");
