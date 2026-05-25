"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Check,
  Plus,
  Minus,
  Trash2,
  HandHelping,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { scoreLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  updateScorecardEntry,
  pickUpHole,
  finishRound,
  deleteRound,
} from "../../actions";

type Hole = {
  hole_number: number;
  par: number;
  yardage: number | null;
  handicap_index: number | null;
};

type Entry = {
  id: string;
  round_id: string;
  hole_number: number;
  strokes: number;
  putts: number;
  fairway_hit: boolean | null;
  green_in_regulation: boolean;
  sand_save: boolean;
  penalties: number;
  picked_up: boolean;
  notes: string | null;
};

export function Scorecard({
  roundId,
  courseName,
  teesPlayed,
  holes,
  initialEntries,
}: {
  roundId: string;
  courseName: string;
  teesPlayed: string | null;
  holes: Hole[];
  initialEntries: Entry[];
}) {
  const router = useRouter();
  const holeCount = holes.length;
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [active, setActive] = useState<number>(() => {
    const lastDone = initialEntries.findLast?.((e) => e.strokes > 0 || e.picked_up);
    return lastDone ? Math.min(holeCount, lastDone.hole_number + 1) : 1;
  });
  const [, startTransition] = useTransition();

  const currentHole = holes.find((h) => h.hole_number === active);
  const currentEntry =
    entries.find((e) => e.hole_number === active) ??
    ({
      id: "tmp",
      round_id: roundId,
      hole_number: active,
      strokes: 0,
      putts: 0,
      fairway_hit: null,
      green_in_regulation: false,
      sand_save: false,
      penalties: 0,
      picked_up: false,
      notes: null,
    } as Entry);

  const totals = useMemo(() => {
    // Sum entered strokes + picked-up holes count as par+5
    const strokes = entries.reduce((s, e) => {
      if (e.picked_up) {
        const h = holes.find((x) => x.hole_number === e.hole_number);
        return s + ((h?.par ?? 4) + 5);
      }
      return s + (e.strokes || 0);
    }, 0);
    const done = entries.filter((e) => e.strokes > 0 || e.picked_up);
    const parThru = done.reduce((s, e) => {
      const h = holes.find((x) => x.hole_number === e.hole_number);
      return s + (h?.par ?? 0);
    }, 0);
    return { strokes, holesThru: done.length, parThru };
  }, [entries, holes]);

  function patchLocal(holeNumber: number, patch: Partial<Entry>) {
    setEntries((prev) =>
      prev.map((e) => (e.hole_number === holeNumber ? { ...e, ...patch } : e)),
    );
  }

  function commit(patch: Partial<Entry>) {
    patchLocal(active, patch);
    startTransition(async () => {
      try {
        await updateScorecardEntry(roundId, active, patch);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function setStrokes(n: number) {
    const clamped = Math.max(0, Math.min(15, n));
    if (clamped !== currentEntry.strokes || currentEntry.picked_up) {
      // Setting strokes also clears picked_up (action does it server-side too)
      patchLocal(active, { strokes: clamped, picked_up: false });
      startTransition(async () => {
        try {
          await updateScorecardEntry(roundId, active, { strokes: clamped });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Save failed");
        }
      });
    }
  }

  function inc(field: "strokes" | "putts" | "penalties", delta: number) {
    if (field === "strokes") {
      setStrokes((currentEntry.strokes ?? 0) + delta);
      return;
    }
    const cur = (currentEntry[field] as number) ?? 0;
    const next = Math.max(0, Math.min(10, cur + delta));
    if (next !== cur) commit({ [field]: next });
  }

  function handlePickUp() {
    patchLocal(active, { picked_up: true, strokes: 0 });
    startTransition(async () => {
      try {
        await pickUpHole(roundId, active);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function goto(n: number) {
    setActive(Math.max(1, Math.min(holeCount, n)));
  }

  if (!currentHole) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted">This round's course has no holes loaded.</p>
      </div>
    );
  }

  const overUnder = totals.strokes - totals.parThru;
  const displayedStrokes = currentEntry.picked_up
    ? null
    : currentEntry.strokes > 0
    ? currentEntry.strokes
    : null;

  return (
    <div className="py-4 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Live round</p>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{courseName}</h1>
          {teesPlayed && <p className="text-xs text-muted">{teesPlayed} tees</p>}
        </div>
        <div className="text-right">
          <div className="num text-2xl font-semibold">
            {totals.strokes || "—"}
            {totals.strokes > 0 && (
              <span className="text-muted text-sm ml-1">
                ({overUnder > 0 ? "+" : ""}{overUnder === 0 ? "E" : overUnder})
              </span>
            )}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted">
            thru {totals.holesThru}
          </div>
        </div>
      </div>

      {/* Hole picker strip */}
      <div className="overflow-x-auto -mx-4 px-4 mb-4">
        <div className="inline-flex gap-1.5">
          {holes.map((h) => {
            const e = entries.find((x) => x.hole_number === h.hole_number);
            const done = e && (e.strokes > 0 || e.picked_up);
            const isActive = h.hole_number === active;
            const label = e && e.strokes > 0 ? scoreLabel(e.strokes, h.par) : null;
            return (
              <button
                key={h.hole_number}
                onClick={() => goto(h.hole_number)}
                className={cn(
                  "shrink-0 flex flex-col items-center justify-center w-10 h-12 rounded-lg border text-[11px]",
                  isActive
                    ? "border-accent bg-accent/10 text-accent"
                    : done
                    ? "border-border-strong bg-surface text-foreground"
                    : "border-border bg-surface text-muted",
                )}
              >
                <span className="num font-semibold">{h.hole_number}</span>
                {e?.picked_up ? (
                  <span className="num text-[10px] text-warning">X</span>
                ) : label ? (
                  <span className={cn("num text-[10px]", label.className)}>{e?.strokes}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <Card className="p-5">
        {/* Hole banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <Flag className="h-5 w-5 text-accent" />
            <span className="text-lg font-semibold">Hole {currentHole.hole_number}</span>
            <span className="text-xs uppercase tracking-wider text-muted">
              Par {currentHole.par}
              {currentHole.yardage ? ` · ${currentHole.yardage}y` : ""}
              {currentHole.handicap_index != null
                ? ` · HCP ${currentHole.handicap_index}`
                : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goto(active - 1)}
              disabled={active === 1}
              className="rounded-full p-2 text-muted hover:text-foreground disabled:opacity-30"
              aria-label="Previous hole"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goto(active + 1)}
              disabled={active === holeCount}
              className="rounded-full p-2 text-muted hover:text-foreground disabled:opacity-30"
              aria-label="Next hole"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Strokes — huge */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            onClick={() => inc("strokes", -1)}
            className="rounded-full h-12 w-12 border border-border-strong text-foreground hover:border-accent flex items-center justify-center"
            aria-label="Decrement strokes"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center min-w-[120px]">
            <div
              className={cn(
                "num text-7xl font-semibold leading-none",
                currentEntry.picked_up
                  ? "text-warning"
                  : displayedStrokes
                  ? scoreLabel(displayedStrokes, currentHole.par).className
                  : "text-muted",
              )}
            >
              {currentEntry.picked_up ? "X" : displayedStrokes ?? "—"}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted mt-1">
              {currentEntry.picked_up
                ? "Picked up"
                : displayedStrokes
                ? scoreLabel(displayedStrokes, currentHole.par).label
                : "Strokes"}
            </div>
          </div>
          <button
            onClick={() => inc("strokes", 1)}
            className="rounded-full h-12 w-12 bg-accent text-accent-foreground hover:bg-accent-hover flex items-center justify-center"
            aria-label="Increment strokes"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Tap-to-set strokes row */}
        <div className="mt-4 grid grid-cols-8 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              onClick={() => setStrokes(n)}
              className={cn(
                "num h-9 rounded-lg border text-sm font-semibold transition-colors",
                !currentEntry.picked_up && currentEntry.strokes === n
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-muted hover:text-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Pickup */}
        <div className="mt-3 flex justify-center">
          <button
            onClick={handlePickUp}
            disabled={currentEntry.picked_up}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              currentEntry.picked_up
                ? "bg-warning/10 text-warning cursor-default"
                : "border border-border text-muted hover:text-warning hover:border-warning",
            )}
          >
            <HandHelping className="h-3.5 w-3.5" />
            {currentEntry.picked_up ? "Picked up" : "Pick up on this hole"}
          </button>
        </div>

        {/* Putts + penalties row */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatStepper
            label="Putts"
            value={currentEntry.putts}
            onIncrement={() => inc("putts", 1)}
            onDecrement={() => inc("putts", -1)}
          />
          <StatStepper
            label="Penalties"
            value={currentEntry.penalties}
            onIncrement={() => inc("penalties", 1)}
            onDecrement={() => inc("penalties", -1)}
            danger
          />
        </div>

        {/* Toggles */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Toggle
            label="Fairway"
            active={currentEntry.fairway_hit === true}
            disabled={currentHole.par === 3}
            onClick={() =>
              commit({
                fairway_hit:
                  currentEntry.fairway_hit === true
                    ? false
                    : currentEntry.fairway_hit === false
                    ? null
                    : true,
              })
            }
          />
          <Toggle
            label="GIR"
            active={currentEntry.green_in_regulation}
            onClick={() => commit({ green_in_regulation: !currentEntry.green_in_regulation })}
          />
          <Toggle
            label="Sand save"
            active={currentEntry.sand_save}
            onClick={() => commit({ sand_save: !currentEntry.sand_save })}
          />
        </div>

        {/* Next + finish — both always available so you can end early */}
        <div className="mt-6 flex gap-3">
          {active < holeCount && (
            <Button className="flex-1" onClick={() => goto(active + 1)}>
              Next hole <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant={active < holeCount ? "outline" : "primary"}
            className={active < holeCount ? "" : "flex-1"}
            onClick={() => {
              const holesDone = entries.filter((e) => e.strokes > 0 || e.picked_up).length;
              if (holesDone < holeCount) {
                if (
                  !confirm(
                    `Finish with only ${holesDone} of ${holeCount} holes complete? The remaining holes will be left unfilled.`,
                  )
                )
                  return;
              }
              startTransition(async () => {
                await finishRound(roundId);
              });
            }}
          >
            <Check className="h-4 w-4" /> Finish round
          </Button>
        </div>
      </Card>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() =>
            confirm("Delete this round? This can't be undone.") &&
            startTransition(async () => {
              try {
                await deleteRound(roundId);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              }
            })
          }
          className="text-xs text-subtle hover:text-danger inline-flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" /> Delete round
        </button>
      </div>
    </div>
  );
}

function StatStepper({
  label,
  value,
  onIncrement,
  onDecrement,
  danger,
}: {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted mb-2">{label}</div>
      <div className="flex items-center justify-between">
        <button
          onClick={onDecrement}
          className="rounded-full h-7 w-7 border border-border-strong text-muted hover:text-foreground flex items-center justify-center"
          aria-label={`Decrement ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className={cn("num text-2xl font-semibold", danger && value > 0 && "text-danger")}>
          {value}
        </span>
        <button
          onClick={onIncrement}
          className="rounded-full h-7 w-7 border border-border-strong text-muted hover:text-foreground flex items-center justify-center"
          aria-label={`Increment ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-background text-muted hover:text-foreground",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {label}
    </button>
  );
}
