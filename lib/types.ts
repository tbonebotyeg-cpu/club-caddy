import { z } from "zod";

export const ClubType = z.enum([
  "driver",
  "wood",
  "hybrid",
  "iron",
  "wedge",
  "putter",
]);
export type ClubType = z.infer<typeof ClubType>;

export const SwingPct = z.union([
  z.literal(100),
  z.literal(75),
  z.literal(50),
  z.literal(25),
]);
export type SwingPct = z.infer<typeof SwingPct>;
export const SWING_PCTS: SwingPct[] = [100, 75, 50, 25];

export const ClubSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  name: z.string().min(1).max(40),
  type: ClubType,
  loft: z.number().min(0).max(80).nullable().optional(),
  position: z.number().int().min(0).max(20).default(0),
  notes: z.string().max(280).nullable().optional(),
  created_at: z.string().optional(),
});
export type Club = z.infer<typeof ClubSchema>;

export const ClubYardageSchema = z.object({
  id: z.string().uuid().optional(),
  club_id: z.string().uuid(),
  swing_pct: SwingPct,
  yardage: z.number().int().min(0).max(500),
  notes: z.string().max(140).nullable().optional(),
});
export type ClubYardage = z.infer<typeof ClubYardageSchema>;

export type ClubWithYardages = Club & {
  id: string;
  yardages: ClubYardage[];
};

export const CourseSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  city: z.string().max(80).nullable().optional(),
  country: z.string().max(40).nullable().optional(),
  par_total: z.number().int().min(27).max(80),
  tees_label: z.string().max(40).default("White"),
  slope_rating: z.number().int().min(55).max(155).default(113),
  course_rating: z.number().min(50).max(85).default(72),
});
export type Course = z.infer<typeof CourseSchema>;

export const HoleSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  hole_number: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(6),
  yardage: z.number().int().min(50).max(700),
  handicap_index: z.number().int().min(1).max(18),
});
export type Hole = z.infer<typeof HoleSchema>;

export const RoundSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  played_at: z.string(),
  tees_played: z.string().nullable().optional(),
  weather_summary: z.string().nullable().optional(),
  notes: z.string().max(400).nullable().optional(),
  total_strokes: z.number().int().min(0).default(0),
  score_differential: z.number().nullable().optional(),
});
export type Round = z.infer<typeof RoundSchema>;

export const ScorecardEntrySchema = z.object({
  id: z.string().uuid().optional(),
  round_id: z.string().uuid(),
  hole_number: z.number().int().min(1).max(18),
  strokes: z.number().int().min(0).max(15),
  putts: z.number().int().min(0).max(10).default(0),
  fairway_hit: z.boolean().nullable().optional(),
  green_in_regulation: z.boolean().default(false),
  sand_save: z.boolean().default(false),
  penalties: z.number().int().min(0).default(0),
  notes: z.string().max(140).nullable().optional(),
});
export type ScorecardEntry = z.infer<typeof ScorecardEntrySchema>;

export type Weather = {
  windSpeedMph: number;
  windDirDeg: number;
  tempF: number;
  altitudeFt?: number;
};

export const CLUB_TYPE_LABEL: Record<ClubType, string> = {
  driver: "Driver",
  wood: "Wood",
  hybrid: "Hybrid",
  iron: "Iron",
  wedge: "Wedge",
  putter: "Putter",
};

export const STARTER_BAG: Array<{ name: string; type: ClubType; loft: number | null }> = [
  { name: "Driver", type: "driver", loft: 10.5 },
  { name: "3 Wood", type: "wood", loft: 15 },
  { name: "5 Wood", type: "wood", loft: 19 },
  { name: "4 Hybrid", type: "hybrid", loft: 22 },
  { name: "5 Iron", type: "iron", loft: 25 },
  { name: "6 Iron", type: "iron", loft: 28 },
  { name: "7 Iron", type: "iron", loft: 32 },
  { name: "8 Iron", type: "iron", loft: 36 },
  { name: "9 Iron", type: "iron", loft: 40 },
  { name: "PW", type: "wedge", loft: 46 },
  { name: "GW", type: "wedge", loft: 50 },
  { name: "SW", type: "wedge", loft: 56 },
  { name: "LW", type: "wedge", loft: 60 },
  { name: "Putter", type: "putter", loft: null },
];
