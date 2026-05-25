"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type WindUnit = "mph" | "kmh";
export type TempUnit = "F" | "C";
export type DistanceUnit = "yards" | "metres";

export type Prefs = {
  windUnit: WindUnit;
  tempUnit: TempUnit;
  distanceUnit: DistanceUnit;
  setWindUnit: (u: WindUnit) => void;
  setTempUnit: (u: TempUnit) => void;
  setDistanceUnit: (u: DistanceUnit) => void;
};

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      windUnit: "mph",
      tempUnit: "F",
      distanceUnit: "yards",
      setWindUnit: (u) => set({ windUnit: u }),
      setTempUnit: (u) => set({ tempUnit: u }),
      setDistanceUnit: (u) => set({ distanceUnit: u }),
    }),
    {
      name: "club-caddy-prefs",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// === Conversions: storage / math is always mph + F + yards ================

export function windToMph(value: number, unit: WindUnit): number {
  return unit === "kmh" ? value / 1.60934 : value;
}

export function windFromMph(mph: number, unit: WindUnit): number {
  return unit === "kmh" ? mph * 1.60934 : mph;
}

export function tempToF(value: number, unit: TempUnit): number {
  return unit === "C" ? (value * 9) / 5 + 32 : value;
}

export function tempFromF(f: number, unit: TempUnit): number {
  return unit === "C" ? ((f - 32) * 5) / 9 : f;
}

export function distanceToYards(value: number, unit: DistanceUnit): number {
  return unit === "metres" ? value * 1.09361 : value;
}

export function distanceFromYards(yards: number, unit: DistanceUnit): number {
  return unit === "metres" ? yards / 1.09361 : yards;
}

export const WIND_UNIT_LABEL: Record<WindUnit, string> = { mph: "mph", kmh: "km/h" };
export const TEMP_UNIT_LABEL: Record<TempUnit, string> = { F: "°F", C: "°C" };
export const DISTANCE_UNIT_LABEL: Record<DistanceUnit, string> = {
  yards: "y",
  metres: "m",
};
