/**
 * Simplified World Handicap System (WHS) calculation.
 *
 * Reference: USGA WHS Rules of Handicapping 2024.
 * For MVP we ignore PCC adjustment and ESC; we cap differentials sanely.
 */

export type RoundDifferentialInput = {
  adjustedGrossScore: number;
  courseRating: number;
  slopeRating: number;
};

export function scoreDifferential({
  adjustedGrossScore,
  courseRating,
  slopeRating,
}: RoundDifferentialInput): number {
  if (!slopeRating || slopeRating <= 0) return 0;
  const raw = (113 / slopeRating) * (adjustedGrossScore - courseRating);
  return Math.round(raw * 10) / 10;
}

/**
 * Per WHS: how many of the most-recent N rounds count toward the index.
 * Returns { count, adjustment } where adjustment is subtracted after averaging.
 */
function lowestNTable(rounds: number): { count: number; adjustment: number } | null {
  if (rounds < 3) return null;
  if (rounds === 3) return { count: 1, adjustment: -2.0 };
  if (rounds === 4) return { count: 1, adjustment: -1.0 };
  if (rounds === 5) return { count: 1, adjustment: 0 };
  if (rounds === 6) return { count: 2, adjustment: -1.0 };
  if (rounds <= 8) return { count: 2, adjustment: 0 };
  if (rounds <= 11) return { count: 3, adjustment: 0 };
  if (rounds <= 14) return { count: 4, adjustment: 0 };
  if (rounds <= 16) return { count: 5, adjustment: 0 };
  if (rounds <= 18) return { count: 6, adjustment: 0 };
  if (rounds === 19) return { count: 7, adjustment: 0 };
  return { count: 8, adjustment: 0 };
}

export function handicapIndex(differentials: number[]): number | null {
  if (!differentials.length) return null;
  const recent = differentials.slice(0, 20);
  const rule = lowestNTable(recent.length);
  if (!rule) return null;
  const sorted = [...recent].sort((a, b) => a - b).slice(0, rule.count);
  const avg = sorted.reduce((s, n) => s + n, 0) / sorted.length;
  const index = avg + rule.adjustment;
  return Math.round(index * 10) / 10;
}

export function courseHandicap(
  index: number,
  slopeRating: number,
  courseRating: number,
  par: number,
): number {
  return Math.round(index * (slopeRating / 113) + (courseRating - par));
}
