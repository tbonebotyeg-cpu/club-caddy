"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { createCourse, updateCourse, deleteCourse, type CourseInput } from "../actions";

type Hole = { hole_number: number; par: number; yardage: number; handicap_index: number };

const DEFAULT_18: Hole[] = Array.from({ length: 18 }, (_, i) => ({
  hole_number: i + 1,
  par: 4,
  yardage: 380,
  handicap_index: i + 1,
}));

export function CourseEditor({
  courseId,
  initial,
}: {
  courseId?: string;
  initial?: CourseInput;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [tees, setTees] = useState(initial?.tees_label ?? "White");
  const [slope, setSlope] = useState<number>(initial?.slope_rating ?? 113);
  const [rating, setRating] = useState<number>(initial?.course_rating ?? 72);
  const [holes, setHoles] = useState<Hole[]>(
    initial?.holes && initial.holes.length === 18 ? initial.holes : DEFAULT_18,
  );

  const parTotal = useMemo(() => holes.reduce((s, h) => s + h.par, 0), [holes]);

  function setHole(i: number, patch: Partial<Hole>) {
    setHoles((prev) => prev.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Name your course");
      return;
    }
    // Validate handicap indexes are 1..18 unique
    const hcps = new Set(holes.map((h) => h.handicap_index));
    if (hcps.size !== 18) {
      toast.error("Handicap indexes must be 1–18 with no duplicates");
      return;
    }

    const payload: CourseInput = {
      name: name.trim(),
      city: city.trim() || null,
      country: country.trim() || null,
      tees_label: tees,
      slope_rating: slope,
      course_rating: rating,
      par_total: parTotal,
      holes,
    };

    startTransition(async () => {
      try {
        if (courseId) {
          await updateCourse(courseId, payload);
          toast.success("Course updated");
        } else {
          await createCourse(payload);
          // createCourse redirects to /courses/[id]
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  async function remove() {
    if (!courseId) return;
    if (!confirm("Delete this course and all its hole data? Rounds will keep their scores.")) return;
    startTransition(async () => {
      try {
        await deleteCourse(courseId);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Course name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pebble Beach" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Pebble Beach" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="USA" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tees">Tees</Label>
          <Select id="tees" value={tees} onChange={(e) => setTees(e.target.value)}>
            {["Black", "Blue", "White", "Gold", "Red", "Green"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="slope">Slope</Label>
            <Input
              id="slope"
              type="number"
              min={55}
              max={155}
              value={slope}
              onChange={(e) => setSlope(Number(e.target.value) || 113)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating">Course rating</Label>
            <Input
              id="rating"
              type="number"
              step="0.1"
              min={50}
              max={85}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value) || 72)}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Holes
          </h3>
          <span className="num text-sm">
            Par <span className="text-accent">{parTotal}</span>
          </span>
        </div>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted text-left">
                <th className="px-2 py-1">#</th>
                <th className="px-2 py-1">Par</th>
                <th className="px-2 py-1">Yards</th>
                <th className="px-2 py-1">HCP</th>
              </tr>
            </thead>
            <tbody>
              {holes.map((h, i) => (
                <tr key={i} className="bg-background">
                  <td className="px-2 py-1 num text-foreground font-semibold w-10">{h.hole_number}</td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={3}
                      max={6}
                      value={h.par}
                      onChange={(e) => setHole(i, { par: Number(e.target.value) || 4 })}
                      className="num w-16 rounded border border-border-strong bg-background px-2 py-1 text-center"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={50}
                      max={700}
                      value={h.yardage}
                      onChange={(e) => setHole(i, { yardage: Number(e.target.value) || 0 })}
                      className="num w-20 rounded border border-border-strong bg-background px-2 py-1 text-center"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      max={18}
                      value={h.handicap_index}
                      onChange={(e) => setHole(i, { handicap_index: Number(e.target.value) || 1 })}
                      className="num w-16 rounded border border-border-strong bg-background px-2 py-1 text-center"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={save} loading={pending} className="flex-1">
          {courseId ? "Save changes" : "Create course"}
        </Button>
        {courseId && (
          <Button variant="danger" onClick={remove} disabled={pending}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/courses")} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
