"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { createCourse, updateCourse, deleteCourse, type CourseInput } from "../actions";

type HoleDraft = {
  hole_number: number;
  par: string;
  yardage: string;
  handicap_index: string;
};

const BLANK_18: HoleDraft[] = Array.from({ length: 18 }, (_, i) => ({
  hole_number: i + 1,
  par: "",
  yardage: "",
  handicap_index: "",
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
  const [slope, setSlope] = useState<string>(
    initial?.slope_rating != null ? String(initial.slope_rating) : "",
  );
  const [rating, setRating] = useState<string>(
    initial?.course_rating != null ? String(initial.course_rating) : "",
  );
  const [holes, setHoles] = useState<HoleDraft[]>(
    initial?.holes && initial.holes.length === 18
      ? initial.holes.map((h) => ({
          hole_number: h.hole_number,
          par: String(h.par),
          yardage: String(h.yardage),
          handicap_index: String(h.handicap_index),
        }))
      : BLANK_18,
  );

  const parTotal = useMemo(
    () => holes.reduce((s, h) => s + (Number(h.par) || 0), 0),
    [holes],
  );

  function setHole(i: number, patch: Partial<HoleDraft>) {
    setHoles((prev) => prev.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Name your course");
      return;
    }
    const slopeN = Number(slope);
    const ratingN = Number(rating);
    if (!Number.isFinite(slopeN) || slopeN < 55 || slopeN > 155) {
      toast.error("Slope rating must be 55–155");
      return;
    }
    if (!Number.isFinite(ratingN) || ratingN < 50 || ratingN > 85) {
      toast.error("Course rating must be 50–85");
      return;
    }

    // Validate every hole
    const parsedHoles: Array<{
      hole_number: number;
      par: number;
      yardage: number;
      handicap_index: number;
    }> = [];
    for (const h of holes) {
      const par = Number(h.par);
      const yards = Number(h.yardage);
      const hcp = Number(h.handicap_index);
      if (!Number.isFinite(par) || par < 3 || par > 6) {
        toast.error(`Hole ${h.hole_number}: par must be 3–6`);
        return;
      }
      if (!Number.isFinite(yards) || yards < 50 || yards > 700) {
        toast.error(`Hole ${h.hole_number}: yardage must be 50–700`);
        return;
      }
      if (!Number.isFinite(hcp) || hcp < 1 || hcp > 18) {
        toast.error(`Hole ${h.hole_number}: HCP must be 1–18`);
        return;
      }
      parsedHoles.push({
        hole_number: h.hole_number,
        par,
        yardage: yards,
        handicap_index: hcp,
      });
    }
    const hcps = new Set(parsedHoles.map((h) => h.handicap_index));
    if (hcps.size !== 18) {
      toast.error("Handicap indexes must be 1–18 with no duplicates");
      return;
    }

    const payload: CourseInput = {
      name: name.trim(),
      city: city.trim() || null,
      country: country.trim() || null,
      tees_label: tees,
      slope_rating: slopeN,
      course_rating: ratingN,
      par_total: parTotal,
      holes: parsedHoles,
    };

    startTransition(async () => {
      try {
        if (courseId) {
          await updateCourse(courseId, payload);
          toast.success("Course updated");
        } else {
          await createCourse(payload);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  async function remove() {
    if (!courseId) return;
    if (
      !confirm(
        "Delete this course? This also deletes every round you've tracked here. Cannot be undone.",
      )
    )
      return;
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
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tees">Tees</Label>
          <Select id="tees" value={tees} onChange={(e) => setTees(e.target.value)}>
            {["Black", "Blue", "White", "Gold", "Red", "Green"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
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
              onChange={(e) => setSlope(e.target.value)}
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
              onChange={(e) => setRating(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Holes</h3>
          <span className="num text-sm">
            Par <span className="text-accent">{parTotal || "—"}</span>
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
                  <td className="px-2 py-1 num text-foreground font-semibold w-10">
                    {h.hole_number}
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={3}
                      max={6}
                      value={h.par}
                      onChange={(e) => setHole(i, { par: e.target.value })}
                      className="num w-16 rounded border border-border-strong bg-background px-2 py-1 text-center"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={50}
                      max={700}
                      value={h.yardage}
                      onChange={(e) => setHole(i, { yardage: e.target.value })}
                      className="num w-20 rounded border border-border-strong bg-background px-2 py-1 text-center"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      max={18}
                      value={h.handicap_index}
                      onChange={(e) => setHole(i, { handicap_index: e.target.value })}
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
