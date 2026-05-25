"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import type { Tee } from "@/lib/supabase/database.types";
import { startRound } from "../actions";

type CourseRow = {
  id: string;
  name: string;
  city: string | null;
  par_total: number;
  hole_count: number;
  tees: Tee[];
};

type Venue = {
  name: string;             // "Country Side" — display label for first dropdown
  isVenue: boolean;         // true = multi-setup; false = standalone course
  courses: CourseRow[];     // setups under this venue (1+ for both)
};

export function StartRoundForm({
  courses,
  preselectedCourseId,
}: {
  courses: CourseRow[];
  preselectedCourseId?: string;
}) {
  const venues = useMemo(() => groupByVenue(courses), [courses]);

  // Find the preselected course's venue + course; default to first venue + first course
  const initial = (() => {
    if (preselectedCourseId) {
      for (const v of venues) {
        const c = v.courses.find((x) => x.id === preselectedCourseId);
        if (c) return { venueName: v.name, courseId: c.id };
      }
    }
    const first = venues[0];
    return { venueName: first?.name ?? "", courseId: first?.courses[0]?.id ?? "" };
  })();

  const [venueName, setVenueName] = useState(initial.venueName);
  const [courseId, setCourseId] = useState(initial.courseId);

  const currentVenue = venues.find((v) => v.name === venueName);
  const selected = courses.find((c) => c.id === courseId);

  const [teeLabel, setTeeLabel] = useState<string>(selected?.tees[0]?.label ?? "");
  const [holeCount, setHoleCount] = useState<number>(selected?.hole_count ?? 18);
  const [weather, setWeather] = useState("");
  const [pending, startTransition] = useTransition();

  // When venue changes, reset course to first setup at that venue
  useEffect(() => {
    if (!currentVenue) return;
    const stillValid = currentVenue.courses.some((c) => c.id === courseId);
    if (!stillValid) setCourseId(currentVenue.courses[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueName]);

  // When course changes, reset tee + hole count
  useEffect(() => {
    if (!selected) return;
    setTeeLabel(selected.tees[0]?.label ?? "");
    setHoleCount(selected.hole_count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const selectedTee = selected?.tees.find((t) => t.label === teeLabel) ?? null;

  function handleStart() {
    if (!courseId) { toast.error("Pick a course"); return; }
    if (!teeLabel) { toast.error("Pick a tee box"); return; }
    startTransition(async () => {
      try {
        await startRound({
          course_id: courseId,
          tees_played: teeLabel,
          hole_count: holeCount,
          weather_summary: weather.trim() || null,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  // hole-count options: 9, 18, full
  const holeOptions = useMemo(() => {
    if (!selected) return [9, 18];
    const opts = new Set<number>();
    if (selected.hole_count >= 9) opts.add(9);
    if (selected.hole_count >= 18) opts.add(18);
    opts.add(selected.hole_count);
    return Array.from(opts).sort((a, b) => a - b);
  }, [selected]);

  const hasMultipleSetups = (currentVenue?.courses.length ?? 0) > 1;

  return (
    <Card className="p-5 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="venue">Course</Label>
        <Select id="venue" value={venueName} onChange={(e) => setVenueName(e.target.value)}>
          {venues.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name}
              {v.isVenue ? "" : v.courses[0]?.city ? ` — ${v.courses[0].city}` : ""}
            </option>
          ))}
        </Select>
      </div>

      {hasMultipleSetups && currentVenue && (
        <div className="space-y-2">
          <Label htmlFor="setup">Setup</Label>
          <Select
            id="setup"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            {currentVenue.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {shortLabel(currentVenue, c)} ({c.hole_count}h · par {c.par_total})
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="tee">Tee box</Label>
          <Select
            id="tee"
            value={teeLabel}
            onChange={(e) => setTeeLabel(e.target.value)}
          >
            {(selected?.tees ?? []).map((t) => (
              <option key={t.label} value={t.label}>
                {t.label} ({t.rating.toFixed(1)} / {t.slope})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="holeCount">Holes to play</Label>
          <Select
            id="holeCount"
            value={holeCount}
            onChange={(e) => setHoleCount(Number(e.target.value))}
          >
            {holeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </div>
      </div>

      {selectedTee && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <Metric label="Par" value={selected?.par_total ?? "—"} />
          <Metric label="Slope" value={selectedTee.slope} />
          <Metric label="Rating" value={selectedTee.rating.toFixed(1)} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="weather">Weather (optional)</Label>
        <Input
          id="weather"
          placeholder="62°F, 8 mph SW"
          value={weather}
          onChange={(e) => setWeather(e.target.value)}
        />
      </div>

      <Button size="lg" onClick={handleStart} loading={pending} className="w-full">
        <Play className="h-4 w-4" /> Start round
      </Button>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="num text-xl font-semibold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">{label}</div>
    </div>
  );
}

// Group courses by venue using the " — " separator in the name.
// "Country Side — Prairies/Meadows" → venue: "Country Side"
// "Goose Hummock" → no venue (standalone)
function groupByVenue(courses: CourseRow[]): Venue[] {
  const grouped = new Map<string, CourseRow[]>();
  const standalone: CourseRow[] = [];

  for (const c of courses) {
    const idx = c.name.indexOf(" — ");
    if (idx > 0) {
      const venue = c.name.slice(0, idx);
      if (!grouped.has(venue)) grouped.set(venue, []);
      grouped.get(venue)!.push(c);
    } else {
      standalone.push(c);
    }
  }

  const venues: Venue[] = [];
  // Multi-setup venues first (alphabetical), then standalone courses
  for (const [name, list] of Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    if (list.length >= 2) {
      venues.push({ name, isVenue: true, courses: list });
    } else {
      // single-course "venue" — flatten to standalone
      standalone.push(...list);
    }
  }
  for (const c of standalone.sort((a, b) => a.name.localeCompare(b.name))) {
    venues.push({ name: c.name, isVenue: false, courses: [c] });
  }
  return venues;
}

function shortLabel(venue: Venue, c: CourseRow): string {
  if (!venue.isVenue) return c.name;
  // strip "Venue — " prefix
  return c.name.slice(venue.name.length + 3);
}
