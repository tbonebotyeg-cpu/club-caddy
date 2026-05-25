import type { ClubWithYardages, SwingPct, Weather } from "./types";

export type CaddyRecommendation = {
  clubId: string;
  clubName: string;
  swingPct: SwingPct;
  yards: number;
  delta: number;
  noteForGolfer: string;
};

/**
 * Adjust a target yardage based on wind/temp/altitude.
 * Wind: rough rule of thumb — 1y per 1.5 mph head/tail component.
 * Temp: every 10°F below 70°F adds ~1y to ball flight needed; above subtracts.
 * Altitude: every 1000 ft above sea level removes ~2% of needed yardage.
 *
 * `windDirDeg` is the direction wind is BLOWING TOWARD, in degrees from north.
 * `shotBearingDeg` is the direction the golfer is hitting toward.
 */
export function adjustForConditions(
  targetYards: number,
  weather: Weather | null,
  shotBearingDeg = 0,
): number {
  if (!weather) return targetYards;
  let adjusted = targetYards;

  // Wind: positive = headwind component, negative = tailwind component
  const relDeg = (((weather.windDirDeg - shotBearingDeg) % 360) + 360) % 360;
  const headTailComponent = -Math.cos((relDeg * Math.PI) / 180) * weather.windSpeedMph;
  adjusted += headTailComponent / 1.5;

  // Temp deviation from 70°F
  const tempDelta = 70 - weather.tempF;
  adjusted += tempDelta / 10;

  // Altitude (lower air resistance = less club needed)
  if (weather.altitudeFt && weather.altitudeFt > 500) {
    adjusted *= 1 - (weather.altitudeFt / 1000) * 0.02;
  }

  return Math.round(adjusted * 10) / 10;
}

export function recommendClub(
  targetYards: number,
  bag: ClubWithYardages[],
  weather: Weather | null = null,
  shotBearingDeg = 0,
  limit = 3,
): CaddyRecommendation[] {
  const adjusted = adjustForConditions(targetYards, weather, shotBearingDeg);

  const candidates = bag
    .filter((c) => c.type !== "putter")
    .flatMap((club) =>
      club.yardages
        .filter((y) => y.yardage > 0)
        .map((y) => ({
          clubId: club.id,
          clubName: club.name,
          swingPct: y.swing_pct,
          yards: y.yardage,
          delta: Math.round((y.yardage - adjusted) * 10) / 10,
        })),
    );

  return candidates
    .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
    .slice(0, limit)
    .map((c) => ({
      ...c,
      noteForGolfer: noteFor(c.swingPct, c.delta),
    }));
}

function noteFor(swingPct: SwingPct, delta: number): string {
  const swingLabel =
    swingPct === 100 ? "full" :
    swingPct === 75 ? "3/4" :
    swingPct === 50 ? "1/2" : "1/4";
  if (Math.abs(delta) < 2) return `Perfect ${swingLabel} swing`;
  if (delta > 0) return `${swingLabel} — back off ${Math.abs(delta)}y`;
  return `${swingLabel} — go ${Math.abs(delta)}y firmer`;
}
