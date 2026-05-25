// Update all 12 existing courses with full multi-tee data, then insert the
// missing loop combos for Country Side, Quarry, and Legends.
// Run: node scripts/update-all-tees.mjs

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
console.log(`Updating courses for ${user.email}\n`);

// =====================================================================
// SHARED HELPERS
// =====================================================================

// Build hole rows from a struct: par[], hcp[], yardages_by_tee={ label: yardage[] }
function buildHoles(pars, hcps, yardagesByTee, holeOffset = 0) {
  return pars.map((par, i) => {
    const yardages = {};
    for (const [tee, ys] of Object.entries(yardagesByTee)) {
      if (ys[i] != null) yardages[tee] = ys[i];
    }
    return {
      hole_number: i + 1 + holeOffset,
      par,
      handicap_index: hcps[i] ?? null,
      yardages,
    };
  });
}

function buildCombo(frontPars, frontHcps, frontYards, backPars, backHcps, backYards) {
  return [
    ...buildHoles(frontPars, frontHcps, frontYards, 0),
    ...buildHoles(backPars, backHcps, backYards, 9),
  ];
}

// Tee color presets — keeps the UI dot colors consistent
const COLOR = {
  Black: "#0a0a0a", Blue: "#3b82f6", White: "#fafafa",
  Gold: "#facc15", Red: "#ef4444", Green: "#22c55e",
  Yellow: "#eab308",
};
const tee = (label, slope, rating, color = COLOR[label] ?? null) => ({ label, slope, rating, color });

// =====================================================================
// SINGLE-COURSE VENUES (9 courses)
// =====================================================================

const COURSES_TO_UPDATE = [
  {
    name: "Goose Hummock",
    par_total: 71, hole_count: 18,
    tees: [
      tee("Gold", 140, 73.3),
      tee("Blue", 135, 71.6),
      tee("White", 128, 68.6),
      tee("Red", 125, 71.3, COLOR.Red),
    ],
    holes: buildHoles(
      [4,4,3,4,5,4,5,3,4, 4,3,5,4,4,4,4,3,4],
      [3,11,13,5,15,9,1,17,7, 16,18,10,14,8,4,2,12,6],
      {
        Gold: [384,418,201,443,511,421,547,134,374, 354,150,493,324,351,468,405,160,385],
        Blue: [370,405,187,409,493,405,496,123,354, 338,135,462,320,327,422,397,141,349],
        White: [355,388,177,377,472,393,471,102,330, 300,121,417,313,313,339,372,122,337],
        Red:   [342,373,157,369,451,380,446,82,320,  266,114,407,260,300,328,363,98,286],
      },
    ),
  },
  {
    name: "RedTail Landing",
    par_total: 72, hole_count: 18,
    tees: [
      tee("Black", 132, 74.4),
      tee("Blue", 125, 71.7),
      tee("White", 121, 70.1),
      tee("White/Green", 117, 69.1, "#a3e635"),
      tee("Green", 114, 68.0),
      // Gold men's slope/rating not on the card — omit (yardages only)
    ],
    holes: buildHoles(
      [4,5,4,3,5,4,4,3,4, 4,5,3,4,5,4,4,3,4],
      [13,3,11,9,5,15,7,17,1, 14,2,12,10,4,6,18,16,8],
      {
        Black:        [433,551,430,227,575,377,396,189,451, 428,582,220,381,602,454,335,224,467],
        Blue:         [390,521,396,195,543,352,363,151,417, 393,526,192,351,575,428,307,194,436],
        White:        [368,503,379,180,527,336,348,140,395, 372,516,179,335,563,421,301,182,425],
        "White/Green":[368,503,353,152,499,336,348,118,364, 372,516,156,335,536,401,301,153,400],
        Green:        [336,473,353,152,499,310,322,118,364, 342,485,156,305,536,401,283,153,400],
      },
    ),
  },
  {
    name: "Sandpiper",
    par_total: 72, hole_count: 18,
    tees: [
      tee("Blue", 129, 71.6),
      tee("Blue/White", 125, 70.0, "#dbeafe"),
      tee("White", 121, 69.0),
      tee("Yellow", 117, 66.7),
      tee("Yellow/Red", 113, 65.0, "#fb923c"),
      tee("Red", 112, 63.8),
    ],
    holes: buildHoles(
      [4,4,5,3,4,5,3,4,4, 5,4,4,3,4,5,4,3,4],
      [10,16,2,14,18,6,12,8,4, 13,11,7,17,9,1,5,15,3],
      {
        Blue:         [400,350,545,160,350,530,180,380,415, 540,390,400,150,350,500,390,195,440],
        "Blue/White": [380,350,530,150,350,500,165,380,365, 515,390,375,150,350,475,390,150,385],
        White:        [380,325,530,150,320,500,165,335,365, 515,365,375,135,340,475,370,150,385],
        Yellow:       [355,315,495,130,300,450,150,325,330, 490,340,350,115,325,450,320,105,345],
        "Yellow/Red": [275,315,435,130,295,450,150,310,295, 465,340,285,115,325,370,310,95,345],
        Red:          [275,295,435,120,295,400,125,310,295, 465,300,285,110,265,370,310,95,305],
      },
    ),
  },
  {
    name: "River Ridge",
    par_total: 71, hole_count: 18,
    tees: [
      tee("Blue", 120, 70.8),
      tee("Combo Blue/White", 119, 69.5, "#dbeafe"), // estimated; not on card
      tee("White", 117, 68.5),
      tee("Yellow", 108, 64.7),
      tee("Red", 100, 64.3),
    ],
    holes: buildHoles(
      [5,4,3,4,3,4,4,3,5, 4,5,3,4,4,3,4,4,5],
      [1,11,17,9,7,3,13,15,5, 8,4,14,10,2,18,16,12,6],
      {
        Blue:             [493,388,187,411,189,408,349,185,582, 417,574,152,452,434,164,345,391,499],
        "Combo Blue/White":[469,388,164,411,173,408,349,165,556, 384,548,152,452,407,164,345,372,465],
        White:            [469,316,164,378,173,351,333,165,556, 384,548,146,426,407,150,333,372,465],
        Yellow:           [401,271,141,339,142,302,317,135,458, 354,438,140,316,398,107,317,352,385],
        Red:              [401,271,141,339,105,302,317,135,458, 354,438,140,316,398,107,317,352,385],
      },
    ),
  },
  {
    name: "Raven Crest",
    par_total: 72, hole_count: 18,
    tees: [
      tee("Blue", 126, 71.2),
      tee("Blue/White", 123, 70.0, "#dbeafe"),
      tee("White", 117, 68.7),
      tee("White/Gold", 116, 67.6, "#fef3c7"),
      tee("Gold", 112, 65.8),
      tee("Gold/Green", 110, 64.5, "#bef264"),
    ],
    holes: buildHoles(
      [4,4,3,5,5,3,4,4,4, 5,4,3,4,5,3,4,4,4],
      [7,1,9,3,11,17,15,13,5, 14,18,10,6,4,12,2,16,8],
      {
        Blue:           [398,472,157,511,505,138,363,356,438, 524,320,220,385,540,198,441,361,395],
        "Blue/White":   [398,441,157,481,505,138,363,332,412, 524,320,198,356,511,150,412,361,395],
        White:          [358,441,135,481,471,112,335,332,412, 503,314,198,356,511,150,412,337,346],
        "White/Gold":   [358,366,135,481,471,112,335,332,388, 483,314,175,356,465,150,392,337,298],
        Gold:           [318,366,114,408,441,92,306,307,388,  483,303,175,318,465,125,392,311,298],
        "Gold/Green":   [318,305,114,408,441,92,306,307,305,  483,303,175,280,465,125,305,311,298],
      },
    ),
  },
  {
    name: "Whitetail Crossing",
    par_total: 72, hole_count: 18,
    tees: [
      tee("Black", 135, 74.1),
      tee("Gold", 130, 71.4),
      tee("Blue", 124, 69.8),
      tee("White", 119, 68.1),
      tee("Red", 114, 65.3),
    ],
    holes: buildHoles(
      [4,5,4,3,4,5,4,3,4, 4,4,5,4,3,4,3,5,4],
      [3,5,9,11,1,15,7,17,13, 14,18,4,2,12,10,16,8,6],
      {
        Black: [451,536,415,200,393,525,453,188,380, 395,394,543,434,222,370,213,553,418],
        Gold:  [426,498,380,174,364,496,426,156,353, 373,347,517,401,195,342,178,505,385],
        Blue:  [402,462,380,148,364,496,426,121,325, 373,347,500,401,192,308,178,457,385],
        White: [402,462,340,148,340,464,382,121,325, 341,308,475,360,165,288,142,457,343],
        Red:   [361,438,320,128,311,426,361,80,283,  316,286,452,333,145,211,121,433,324],
      },
    ),
  },
  {
    name: "Montgomery Glen",
    par_total: 72, hole_count: 18,
    tees: [
      tee("Gold", 130, 71.4),
      tee("Blue", 124, 70.1),
      tee("White", 119, 67.9),
      tee("Red", 125, 71.1, COLOR.Red),
    ],
    holes: buildHoles(
      [4,4,4,3,5,4,4,3,5, 4,3,4,3,4,5,4,5,4],
      [13,9,5,15,7,11,3,17,1, 10,12,4,18,16,6,2,8,14],
      {
        Gold:  [366,402,414,189,466,347,436,160,529, 317,224,398,193,348,507,437,472,361],
        Blue:  [360,394,404,174,461,331,436,138,522, 298,196,382,169,342,501,422,460,346],
        White: [351,332,396,174,406,331,402,115,438, 298,161,360,169,342,403,340,400,346],
        Red:   [253,326,368,157,406,265,332,100,433, 279,144,314,147,299,403,340,397,332],
      },
    ),
  },
  {
    name: "Jagare Ridge",
    par_total: 71, hole_count: 18,
    tees: [
      tee("Black", 140, 74.1),
      tee("Blue", 136, 72.1),
      tee("White", 129, 70.1),
      tee("Red", 120, 70.4, COLOR.Red),
    ],
    holes: buildHoles(
      [5,4,4,3,5,4,3,4,4, 4,4,4,3,4,3,4,5,4],
      [5,13,1,17,7,9,11,15,3, 8,12,6,18,14,10,2,4,16],
      {
        Black: [579,338,466,143,553,328,177,321,433, 317,346,428,162,375,208,444,591,314],
        Blue:  [555,327,430,131,514,318,166,307,419, 301,317,403,155,365,208,397,570,296],
        White: [521,315,390,111,498,283,157,264,407, 282,266,363,148,335,170,360,544,286],
        Red:   [487,280,338,108,385,204,134,250,386, 201,247,324,124,302,128,327,455,252],
      },
    ),
  },
];

// =====================================================================
// MULTI-LOOP VENUE BUILDING BLOCKS
// =====================================================================

// COUNTRY SIDE LOOPS
const CS_PRAIRIES = {
  pars: [4,4,5,4,3,4,5,3,4],
  hcps_odd: [13,5,17,7,11,1,3,15,9],   // when used as front 9 in a P/M combo
  yards: {
    "Blue":       [412,376,539,382,208,453,634,207,375],
    "Blue/White": [412,376,494,382,208,408,634,145,345],
    "White":      [399,339,494,336,162,408,612,145,345],
    "White/Red":  [399,313,415,284,162,370,568,145,345],
    "Red":        [383,313,415,284,115,370,568,135,288],
    "Gold":       [284,200,335,200,70,264,483,130,198],
  },
};
const CS_MEADOWS = {
  pars: [4,3,4,3,5,4,5,4,4],
  hcps_even: [18,6,12,14,16,2,10,4,8],   // back-9 of P/M combo
  yards: {
    "Blue":       [307,221,352,146,491,473,596,452,415],
    "Blue/White": [307,204,352,130,491,473,515,396,415],
    "White":      [295,204,343,130,455,416,515,396,368],
    "White/Red":  [295,155,343,130,403,384,478,396,368],
    "Red":        [251,155,334,95,403,384,478,369,317],
    "Gold":       [210,97,222,95,315,263,367,294,231],
  },
};
const CS_WOODLANDS_9 = {
  pars: [4,4,3,4,4,4,4,3,4],            // 9-hole core
  hcps_standalone: [9,13,3,15,7,1,5,11,17],
  yards: {
    "Blue":       [285,280,220,274,326,354,328,140,291],
    "Blue/White": [285,280,158,274,326,340,328,140,276],
    "White":      [269,280,158,261,312,340,323,132,276],
    "White/Red":  [269,280,120,261,290,334,323,124,276],
    "Red":        [253,270,120,248,290,334,318,124,233],
    "Gold":       [125,219,125,195,235,245,222,110,185],
  },
};
const CS_TEES_18 = [   // Prairies+Meadows combo ratings
  tee("Blue", 133, 73.4),
  tee("Blue/White", 125, 71.9, "#dbeafe"),
  tee("White", 122, 70.4),
  tee("White/Red", 117, 68.3, "#fecaca"),
  tee("Red", 115, 67.0),
  tee("Gold", 100, 61.0),
];
const CS_WOODLANDS_TEES_9 = [   // Woodlands' own 9-hole ratings (in 9-hole convention)
  tee("Blue", 108, 32.3),
  tee("Blue/White", 105, 32.0, "#dbeafe"),
  tee("White", 104, 31.7),
  tee("White/Red", 102, 31.5, "#fecaca"),
  tee("Red", 101, 31.2),
  tee("Gold", 94, 28.7),
];

// QUARRY LOOPS — Decks 1-5 system
const Q_TEES = [
  { label: "Deck 1", color: "#0a0a0a" },
  { label: "Deck 2", color: "#3b82f6" },
  { label: "Deck 3", color: "#fafafa" },
  { label: "Deck 4", color: "#facc15" },
  { label: "Deck 5", color: "#ef4444" },
];
const Q_SLATE_GRANITE_RATINGS = [   // verified per combo
  { ...Q_TEES[0], slope: 143, rating: 76.6 },
  { ...Q_TEES[1], slope: 138, rating: 73.0 },
  { ...Q_TEES[2], slope: 125, rating: 70.7 },
  { ...Q_TEES[3], slope: 119, rating: 68.4 },
  { ...Q_TEES[4], slope: 113, rating: 65.2 },
];
const Q_GRANITE = {
  pars: [4,5,3,4,4,3,5,4,4],
  hcps_standalone: [3,1,7,9,2,6,4,8,5], // GolfPass derived
  yards: {
    "Deck 1": [466,622,206,392,425,252,535,442,394],
    "Deck 2": [432,548,193,365,396,224,511,418,376],
    "Deck 3": [411,524,173,348,344,198,496,386,333],
    "Deck 4": [388,500,163,288,311,168,426,362,306],
    "Deck 5": [367,430,129,235,276,116,387,314,262],
  },
};
const Q_SLATE = {
  pars: [4,4,5,4,4,3,4,3,5],
  hcps_standalone: [1,2,3,4,5,6,7,8,9], // GolfPass listed sequential default
  yards: {
    "Deck 1": [387,500,662,410,407,198,438,160,591],
    "Deck 2": [353,452,565,388,375,180,394,145,548],
    "Deck 3": [313,414,526,360,353,155,368,138,501],
    "Deck 4": [261,385,497,336,327,141,329,125,445],
    "Deck 5": [232,339,472,304,289,136,296,111,402],
  },
};
const Q_IRONSTONE = {
  pars: [4,5,4,4,3,4,5,3,4],
  hcps_standalone: [8,3,9,7,2,5,1,6,4],
  yards: {
    "Deck 1": [420,602,354,428,251,474,652,221,436],
    "Deck 2": [393,578,330,387,226,446,602,198,409],
    "Deck 3": [382,550,304,378,206,420,584,171,383],
    "Deck 4": [360,519,299,358,198,400,558,160,350],
    "Deck 5": [317,496,270,321,169,379,535,130,323],
  },
};

// LEGENDS LOOPS
const L_CHAMPIONS = {
  pars: [4,4,5,4,3,5,4,3,4],
  hcps_standalone: [13,7,3,11,15,1,5,17,9],
  yards: {
    "Blue":  [351,422,503,386,185,523,429,175,363],
    "White": [331,340,472,368,151,488,404,164,332],
    "Red":   [302,323,403,290,125,401,352,127,282],
  },
};
const L_OLD_HICKORY = {
  pars: [5,4,4,5,3,4,4,3,4],
  hcps_standalone: [3,7,9,1,17,11,5,15,13],
  yards: {
    "Blue":  [528,396,394,596,152,327,436,207,320],
    "White": [501,379,364,528,134,308,420,170,306],
    "Red":   [479,310,287,502,100,300,328,161,284],
  },
};
const L_TRADITIONS = {
  pars: [4,4,3,4,5,5,3,4,4],
  hcps_standalone: [null,null,null,null,null,null,null,null,null], // unknown
  yards: {
    "Blue":  [330,387,151,346,601,491,157,403,426],
    "White": [320,357,135,326,579,470,148,369,380],
    "Red":   [226,325,100,298,458,436,120,353,337],
  },
};

// =====================================================================
// BUILD MULTI-LOOP COURSE LIST (updates + inserts)
// =====================================================================

// Convert any unique HCP array to 1-9 ranks (1 = hardest), then map to combo position.
function rankify(hcps) {
  if (hcps.some((h) => h == null)) return null;
  const sorted = [...hcps].map((h, i) => ({ h, i })).sort((a, b) => a.h - b.h);
  const ranks = new Array(hcps.length);
  sorted.forEach((entry, rank) => { ranks[entry.i] = rank + 1; });
  return ranks;
}

function comboHcps(loop, isFront) {
  const ranks = rankify(loop.hcps_standalone ?? []);
  // Fallback: when standalone HCPs unknown (e.g. Traditions), use sequential
  // placeholder ranks. The HCP per hole is mostly cosmetic for solo tracking.
  const effectiveRanks = ranks ?? Array.from({ length: 9 }, (_, i) => i + 1);
  return effectiveRanks.map((r) => (isFront ? 2 * r - 1 : 2 * r));
}

function comboHoles(front, back) {
  const frontHcps = front.hcps_odd ?? comboHcps(front, true);
  const backHcps = back.hcps_even ?? comboHcps(back, false);
  return buildCombo(front.pars, frontHcps, front.yards, back.pars, backHcps, back.yards);
}

const MULTI_LOOP_COURSES = [
  // ===== COUNTRY SIDE =====
  {
    name: "Country Side — Prairies/Meadows",
    par_total: 72, hole_count: 18,
    tees: CS_TEES_18,
    holes: comboHoles(
      { ...CS_PRAIRIES, hcps_odd: CS_PRAIRIES.hcps_odd },
      { ...CS_MEADOWS, hcps_even: CS_MEADOWS.hcps_even },
    ),
  },
  {
    name: "Country Side — Prairies/Woodlands",
    par_total: 71,  // Prairies (36) + Woodlands core 9 (35) = 71
    hole_count: 18,
    tees: CS_TEES_18, // P+W not officially rated — using P/M combo ratings as approximation
    holes: comboHoles(
      { pars: CS_PRAIRIES.pars, hcps_odd: CS_PRAIRIES.hcps_odd, yards: CS_PRAIRIES.yards },
      { pars: CS_WOODLANDS_9.pars, hcps_standalone: CS_WOODLANDS_9.hcps_standalone, yards: CS_WOODLANDS_9.yards },
    ),
    notes_rating_estimated: true,
  },
  {
    name: "Country Side — Meadows/Woodlands",
    par_total: 71,
    hole_count: 18,
    tees: CS_TEES_18,
    holes: comboHoles(
      // Meadows as front 9: rerank its standalone HCP from the published even-back-9 numbers
      { pars: CS_MEADOWS.pars, hcps_standalone: CS_MEADOWS.hcps_even, yards: CS_MEADOWS.yards },
      { pars: CS_WOODLANDS_9.pars, hcps_standalone: CS_WOODLANDS_9.hcps_standalone, yards: CS_WOODLANDS_9.yards },
    ),
    notes_rating_estimated: true,
  },
  {
    name: "Country Side — Woodlands (9)",
    par_total: 35, hole_count: 9,
    tees: CS_WOODLANDS_TEES_9,
    holes: buildHoles(CS_WOODLANDS_9.pars, CS_WOODLANDS_9.hcps_standalone, CS_WOODLANDS_9.yards),
  },

  // ===== THE QUARRY =====
  {
    name: "The Quarry — Slate/Granite",
    par_total: 72, hole_count: 18,
    tees: Q_SLATE_GRANITE_RATINGS,
    holes: buildCombo(
      Q_SLATE.pars, comboHcps(Q_SLATE, true), Q_SLATE.yards,
      Q_GRANITE.pars, comboHcps(Q_GRANITE, false), Q_GRANITE.yards,
    ),
  },
  {
    name: "The Quarry — Slate/Ironstone",
    par_total: 72, hole_count: 18,
    tees: Q_SLATE_GRANITE_RATINGS, // closest available combo ratings
    holes: buildCombo(
      Q_SLATE.pars, comboHcps(Q_SLATE, true), Q_SLATE.yards,
      Q_IRONSTONE.pars, comboHcps(Q_IRONSTONE, false), Q_IRONSTONE.yards,
    ),
    notes_rating_estimated: true,
  },
  {
    name: "The Quarry — Granite/Ironstone",
    par_total: 72, hole_count: 18,
    tees: Q_SLATE_GRANITE_RATINGS,
    holes: buildCombo(
      Q_GRANITE.pars, comboHcps(Q_GRANITE, true), Q_GRANITE.yards,
      Q_IRONSTONE.pars, comboHcps(Q_IRONSTONE, false), Q_IRONSTONE.yards,
    ),
    notes_rating_estimated: true,
  },

  // ===== LEGENDS =====
  {
    name: "Legends — Champions + Old Hickory",
    par_total: 72, hole_count: 18,
    tees: [
      tee("Blue", 130, 71.6),
      tee("White", 121, 69.2),
      tee("Red", 126, 70.8, COLOR.Red),  // ladies' rating
    ],
    holes: buildCombo(
      L_CHAMPIONS.pars, comboHcps(L_CHAMPIONS, true), L_CHAMPIONS.yards,
      L_OLD_HICKORY.pars, comboHcps(L_OLD_HICKORY, false), L_OLD_HICKORY.yards,
    ),
  },
  {
    name: "Legends — Old Hickory + Traditions",
    par_total: 72, hole_count: 18,
    tees: [
      tee("Blue", 126, 71.1),
      tee("White", 118, 67.5),
      tee("Red", 123, 70.4, COLOR.Red),
    ],
    holes: buildCombo(
      L_OLD_HICKORY.pars, comboHcps(L_OLD_HICKORY, true), L_OLD_HICKORY.yards,
      L_TRADITIONS.pars, comboHcps(L_TRADITIONS, false), L_TRADITIONS.yards,  // unknown HCPs = null
    ),
  },
  {
    name: "Legends — Champions + Traditions",
    par_total: 72, hole_count: 18,
    tees: [
      tee("Blue", 128, 71.0),  // estimated — not officially published
      tee("White", 120, 68.4),
      tee("Red", 125, 70.6, COLOR.Red),
    ],
    holes: buildCombo(
      L_CHAMPIONS.pars, comboHcps(L_CHAMPIONS, true), L_CHAMPIONS.yards,
      L_TRADITIONS.pars, comboHcps(L_TRADITIONS, false), L_TRADITIONS.yards,
    ),
    notes_rating_estimated: true,
  },
];

// =====================================================================
// EXECUTION — upsert each course (update if name exists, insert otherwise)
// =====================================================================

async function upsertCourse(c) {
  const { data: existing } = await admin
    .from("courses").select("id")
    .eq("user_id", user.id).eq("name", c.name).maybeSingle();

  if (existing) {
    // Update meta + replace holes
    const { error: uErr } = await admin
      .from("courses").update({
        par_total: c.par_total,
        hole_count: c.hole_count,
        tees: c.tees,
      }).eq("id", existing.id);
    if (uErr) { console.error(`  fail update ${c.name}: ${uErr.message}`); return; }
    await admin.from("holes").delete().eq("course_id", existing.id);
    const holeRows = c.holes.map((h) => ({ course_id: existing.id, ...h }));
    const { error: hErr } = await admin.from("holes").insert(holeRows);
    if (hErr) { console.error(`  fail update ${c.name} holes: ${hErr.message}`); return; }
    console.log(`  upd ${c.name} (${c.tees.length} tees · ${c.hole_count}h)`);
  } else {
    // Insert
    const { data: created, error: cErr } = await admin
      .from("courses").insert({
        user_id: user.id,
        name: c.name,
        city: c.city ?? null,
        country: c.country ?? "Canada",
        par_total: c.par_total,
        hole_count: c.hole_count,
        tees: c.tees,
      }).select().single();
    if (cErr || !created) { console.error(`  fail insert ${c.name}: ${cErr?.message}`); return; }
    const holeRows = c.holes.map((h) => ({ course_id: created.id, ...h }));
    const { error: hErr } = await admin.from("holes").insert(holeRows);
    if (hErr) { console.error(`  fail insert ${c.name} holes: ${hErr.message}`); return; }
    console.log(`  new ${c.name} (${c.tees.length} tees · ${c.hole_count}h)`);
  }
}

for (const c of COURSES_TO_UPDATE) {
  await upsertCourse(c);
}
for (const c of MULTI_LOOP_COURSES) {
  await upsertCourse(c);
}

console.log("\nDone.");
