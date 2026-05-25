"use client";

import { useMemo, useState } from "react";
import { Wind, Target } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { recommendClub } from "@/lib/caddy";
import type { ClubWithYardages, Weather } from "@/lib/types";

export function CaddyTool({ bag }: { bag: ClubWithYardages[] }) {
  const [target, setTarget] = useState<number>(150);
  const [wind, setWind] = useState<number>(0);
  const [windDir, setWindDir] = useState<number>(0); // 0 = headwind, 180 = tailwind
  const [temp, setTemp] = useState<number>(70);

  const weather: Weather | null =
    wind === 0 && temp === 70
      ? null
      : { windSpeedMph: Math.abs(wind), windDirDeg: windDir, tempF: temp };

  const recs = useMemo(
    () => recommendClub(target, bag, weather, 0, 3),
    [target, bag, weather],
  );

  return (
    <div className="mt-8 space-y-6">
      <Card className="p-5">
        <Label htmlFor="target">Target yardage</Label>
        <div className="mt-2 flex items-baseline gap-3">
          <Input
            id="target"
            type="number"
            inputMode="numeric"
            min={20}
            max={400}
            value={target || ""}
            onChange={(e) => setTarget(Number(e.target.value) || 0)}
            className="num text-3xl h-14 text-center"
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="wind">Wind (mph)</Label>
            <Input
              id="wind"
              type="number"
              value={wind || ""}
              onChange={(e) => setWind(Number(e.target.value) || 0)}
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
            <Label htmlFor="temp">Temp °F</Label>
            <Input
              id="temp"
              type="number"
              value={temp || ""}
              onChange={(e) => setTemp(Number(e.target.value) || 70)}
              placeholder="70"
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
            Set yardages in your Bag to see recommendations.
          </Card>
        )}
        {recs.map((r, i) => (
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
              <div className="num text-2xl font-semibold">{r.yards}<span className="text-muted text-sm">y</span></div>
              <div className={`text-xs ${i === 0 ? "text-accent" : "text-muted"}`}>
                {r.delta === 0 ? "spot on" : `${r.delta > 0 ? "+" : ""}${r.delta}y`}
              </div>
            </div>
          </Card>
        ))}
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
