"use client";

import { useMemo, useState } from "react";
import { Wind, Target } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { recommendClub } from "@/lib/caddy";
import type { ClubWithYardages, Weather } from "@/lib/types";
import {
  usePrefs,
  windToMph,
  tempToF,
  distanceToYards,
  distanceFromYards,
  WIND_UNIT_LABEL,
  TEMP_UNIT_LABEL,
  DISTANCE_UNIT_LABEL,
} from "@/lib/prefs";

// Parse a user-typed string into a number, or null when blank/invalid.
// This is the key to letting users delete every character without snapping back.
function toNum(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function CaddyTool({ bag }: { bag: ClubWithYardages[] }) {
  const { windUnit, tempUnit, distanceUnit } = usePrefs();

  // Defaults expressed in the user's preferred units
  const defaultTarget = useMemo(
    () => Math.round(distanceToYards(150, distanceUnit) === 150 ? 150 : 150 / 1.09361),
    [distanceUnit],
  );
  const defaultTemp = tempUnit === "C" ? "21" : "70";

  // Inputs are strings so they can be cleared freely
  const [target, setTarget] = useState<string>(String(distanceUnit === "yards" ? 150 : 137));
  const [wind, setWind] = useState<string>("");
  const [windDir, setWindDir] = useState<number>(0);
  const [temp, setTemp] = useState<string>(defaultTemp);

  const targetN = toNum(target);
  const windN = toNum(wind);
  const tempN = toNum(temp);

  // Convert user's units → internal (mph, F, yards) for the recommender
  const targetYards = targetN != null ? distanceToYards(targetN, distanceUnit) : null;
  const windMph = windN != null ? windToMph(windN, windUnit) : 0;
  const tempF = tempN != null ? tempToF(tempN, tempUnit) : 70;

  const weather: Weather | null =
    windMph === 0 && tempF === 70
      ? null
      : { windSpeedMph: Math.abs(windMph), windDirDeg: windDir, tempF: tempF };

  const recs = useMemo(
    () =>
      targetYards != null && targetYards > 0
        ? recommendClub(targetYards, bag, weather, 0, 3)
        : [],
    [targetYards, bag, weather],
  );

  const dLabel = DISTANCE_UNIT_LABEL[distanceUnit];

  return (
    <div className="mt-8 space-y-6">
      <Card className="p-5">
        <Label htmlFor="target">Target distance ({dLabel})</Label>
        <div className="mt-2 flex items-baseline gap-3">
          <Input
            id="target"
            type="number"
            inputMode="numeric"
            min={0}
            max={500}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="num text-3xl h-14 text-center"
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="wind">Wind ({WIND_UNIT_LABEL[windUnit]})</Label>
            <Input
              id="wind"
              type="number"
              min={0}
              value={wind}
              onChange={(e) => setWind(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="windDir">Direction</Label>
            <select
              id="windDir"
              value={windDir}
              onChange={(e) => setWindDir(Number(e.target.value))}
              className="mt-0 flex h-11 w-full rounded-lg border border-border-strong bg-background px-3 text-sm"
            >
              <option value={0}>Head</option>
              <option value={45}>Head/Right</option>
              <option value={90}>Right</option>
              <option value={135}>Tail/Right</option>
              <option value={180}>Tail</option>
              <option value={225}>Tail/Left</option>
              <option value={270}>Left</option>
              <option value={315}>Head/Left</option>
            </select>
          </div>
          <div>
            <Label htmlFor="temp">Temp ({TEMP_UNIT_LABEL[tempUnit]})</Label>
            <Input
              id="temp"
              type="number"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              placeholder={defaultTemp}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted">
          <span>Top picks</span>
          {weather && (
            <span className="inline-flex items-center gap-1 text-accent">
              <Wind className="h-3 w-3" /> adjusted
            </span>
          )}
        </div>
        {recs.length === 0 && (
          <Card className="p-6 text-sm text-muted text-center">
            {targetYards == null
              ? "Enter a target distance to see recommendations."
              : "Set yardages in your Bag to see recommendations."}
          </Card>
        )}
        {recs.map((r, i) => {
          const displayYards = Math.round(distanceFromYards(r.yards, distanceUnit));
          const displayDelta = Math.round(distanceFromYards(r.delta, distanceUnit));
          return (
            <Card
              key={r.clubId + r.swingPct}
              className={`p-4 flex items-center justify-between ${
                i === 0 ? "border-accent bg-accent/5" : ""
              }`}
            >
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-lg">{r.clubName}</span>
                  <span className="text-xs uppercase tracking-wider text-muted">
                    {swingLabel(r.swingPct)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{r.noteForGolfer}</p>
              </div>
              <div className="text-right">
                <div className="num text-2xl font-semibold">
                  {displayYards}
                  <span className="text-muted text-sm">{dLabel}</span>
                </div>
                <div className={`text-xs ${i === 0 ? "text-accent" : "text-muted"}`}>
                  {displayDelta === 0
                    ? "spot on"
                    : `${displayDelta > 0 ? "+" : ""}${displayDelta}${dLabel}`}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-subtle text-center">
        <Target className="inline-block h-3 w-3 mr-1" />
        Tip: dial in 3/4 and 1/2 yardages too — gap shots get a lot easier.
      </p>
    </div>
  );
}

function swingLabel(p: number) {
  return p === 100 ? "Full" : p === 75 ? "3/4" : p === 50 ? "1/2" : "1/4";
}
