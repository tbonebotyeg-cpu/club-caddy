"use client";

import { useEffect, useState } from "react";
import type { ClubYardage, SwingPct } from "@/lib/types";
import { SWING_PCTS } from "@/lib/types";
import { cn } from "@/lib/utils";

const SWING_LABEL: Record<SwingPct, string> = {
  100: "Full",
  75: "3/4",
  50: "1/2",
  25: "1/4",
};

export function SwingMatrix({
  yardages,
  onChange,
  disabled = false,
}: {
  yardages: ClubYardage[];
  onChange: (swingPct: SwingPct, yardage: number) => void;
  disabled?: boolean;
}) {
  const byPct = new Map(yardages.map((y) => [y.swing_pct as SwingPct, y.yardage]));

  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      {SWING_PCTS.map((p) => (
        <SwingCell
          key={p}
          label={SWING_LABEL[p]}
          value={byPct.get(p) ?? 0}
          onCommit={(v) => onChange(p, v)}
          accent={p === 100}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function SwingCell({
  label,
  value,
  onCommit,
  accent,
  disabled,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  accent?: boolean;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(value || ""));
  useEffect(() => {
    setDraft(String(value || ""));
  }, [value]);

  function commit() {
    const n = Number(draft);
    const safe = Number.isFinite(n) && n >= 0 ? Math.min(500, Math.round(n)) : 0;
    if (safe !== value) onCommit(safe);
    setDraft(String(safe || ""));
  }

  return (
    <label
      className={cn(
        "flex flex-col gap-1 rounded-lg border bg-background px-2 py-2.5 transition-colors",
        accent ? "border-border-strong" : "border-border",
        !disabled && "focus-within:border-accent",
        disabled && "opacity-40",
      )}
    >
      <span className="text-[10px] uppercase tracking-wider text-muted text-center">
        {label}
      </span>
      <div className="flex items-baseline justify-center gap-0.5">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={500}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder="—"
          className="num bg-transparent w-full text-center text-xl font-semibold text-foreground focus:outline-none"
        />
        <span className="text-[10px] text-muted">y</span>
      </div>
    </label>
  );
}
