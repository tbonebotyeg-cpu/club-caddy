"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  usePrefs,
  type WindUnit,
  type TempUnit,
  type DistanceUnit,
} from "@/lib/prefs";

export function SettingsForm() {
  const prefs = usePrefs();
  // Avoid hydration mismatch — Zustand persist reads localStorage on the client only
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <Card className="p-5">
        <div className="h-32 animate-pulse rounded bg-surface-elevated" />
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-6">
      <Group<DistanceUnit>
        label="Distance"
        hint="Used for club yardages and Caddy target."
        value={prefs.distanceUnit}
        onChange={prefs.setDistanceUnit}
        options={[
          { value: "yards", label: "Yards", sub: "y" },
          { value: "metres", label: "Metres", sub: "m" },
        ]}
      />

      <Group<WindUnit>
        label="Wind speed"
        hint="Used by the Caddy weather adjustment."
        value={prefs.windUnit}
        onChange={prefs.setWindUnit}
        options={[
          { value: "mph", label: "Miles per hour", sub: "mph" },
          { value: "kmh", label: "Kilometres per hour", sub: "km/h" },
        ]}
      />

      <Group<TempUnit>
        label="Temperature"
        hint="Used by the Caddy weather adjustment."
        value={prefs.tempUnit}
        onChange={prefs.setTempUnit}
        options={[
          { value: "F", label: "Fahrenheit", sub: "°F" },
          { value: "C", label: "Celsius", sub: "°C" },
        ]}
      />
    </Card>
  );
}

function Group<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; sub: string }>;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold uppercase tracking-wider text-muted">
          {label}
        </div>
      </div>
      {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "flex flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors",
                active
                  ? "border-accent bg-accent/10"
                  : "border-border bg-background hover:border-border-strong",
              )}
            >
              <span className={cn("text-sm font-medium", active && "text-accent")}>
                {o.label}
              </span>
              <span className="num text-xs text-muted mt-0.5">{o.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
