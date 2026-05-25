"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { startRound } from "../actions";

type CourseRow = {
  id: string;
  name: string;
  city: string | null;
  tees_label: string;
  par_total: number;
  slope_rating: number;
  course_rating: number;
};

export function StartRoundForm({
  courses,
  preselectedCourseId,
}: {
  courses: CourseRow[];
  preselectedCourseId?: string;
}) {
  const [courseId, setCourseId] = useState(preselectedCourseId ?? courses[0]?.id ?? "");
  const [tees, setTees] = useState("");
  const [weather, setWeather] = useState("");
  const [pending, startTransition] = useTransition();

  const selected = courses.find((c) => c.id === courseId);

  function handleStart() {
    if (!courseId) {
      toast.error("Pick a course");
      return;
    }
    startTransition(async () => {
      try {
        await startRound({
          course_id: courseId,
          tees_played: tees.trim() || selected?.tees_label || null,
          weather_summary: weather.trim() || null,
        });
        // startRound() redirects to /round/[id]
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Card className="p-5 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="course">Course</Label>
        <Select id="course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.city ? ` — ${c.city}` : ""}
            </option>
          ))}
        </Select>
      </div>

      {selected && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <Metric label="Par" value={selected.par_total} />
          <Metric label="Slope" value={selected.slope_rating} />
          <Metric label="Rating" value={selected.course_rating.toFixed(1)} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="tees">Tees played</Label>
          <Input
            id="tees"
            placeholder={selected?.tees_label ?? "White"}
            value={tees}
            onChange={(e) => setTees(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weather">Weather (optional)</Label>
          <Input
            id="weather"
            placeholder="62°F, 8 mph SW"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
          />
        </div>
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
