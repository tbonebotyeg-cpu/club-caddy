"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TEE_PRESETS } from "@/lib/types";
import {
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseRoundCount,
  type CourseInput,
  type HoleInput,
} from "../actions";

type TeeDraft = { label: string; slope: string; rating: string; color: string | null };
type HoleDraft = {
  hole_number: number;
  par: string;
  handicap_index: string;
  yardages: Record<string, string>; // teeLabel → string (allow blank)
};

function blankHoles(n: number): HoleDraft[] {
  return Array.from({ length: n }, (_, i) => ({
    hole_number: i + 1,
    par: "",
    handicap_index: "",
    yardages: {},
  }));
}

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
  const [country, setCountry] = useState(initial?.country ?? "Canada");
  const [holeCount, setHoleCount] = useState<number>(initial?.hole_count ?? 18);

  const [tees, setTees] = useState<TeeDraft[]>(
    initial?.tees && initial.tees.length > 0
      ? initial.tees.map((t) => ({
          label: t.label,
          slope: String(t.slope),
          rating: String(t.rating),
          color: t.color ?? null,
        }))
      : [{ label: "White", slope: "", rating: "", color: "#fafafa" }],
  );

  const [holes, setHoles] = useState<HoleDraft[]>(
    initial?.holes && initial.holes.length > 0
      ? initial.holes.map((h) => ({
          hole_number: h.hole_number,
          par: String(h.par),
          handicap_index: h.handicap_index != null ? String(h.handicap_index) : "",
          yardages: Object.fromEntries(
            Object.entries(h.yardages ?? {}).map(([k, v]) => [k, String(v)]),
          ),
        }))
      : blankHoles(holeCount),
  );

  // When hole count changes, resize the holes array (preserve existing rows)
  function handleHoleCountChange(n: number) {
    if (n < holes.length) {
      // Check if the holes being dropped have any data
      const droppedHaveData = holes.slice(n).some(
        (h) =>
          h.par !== "" ||
          h.handicap_index !== "" ||
          Object.values(h.yardages).some((v) => v !== ""),
      );
      if (droppedHaveData) {
        const lost = holes.length - n;
        if (!confirm(
          `Reducing to ${n} holes will permanently remove the data on holes ${n + 1}–${holes.length} (${lost} ${lost === 1 ? "hole" : "holes"}). Continue?`,
        )) {
          return;
        }
      }
    }
    setHoleCount(n);
    setHoles((prev) => {
      if (n === prev.length) return prev;
      if (n > prev.length) {
        return [...prev, ...blankHoles(n - prev.length).map((h, i) => ({
          ...h, hole_number: prev.length + i + 1,
        }))];
      }
      return prev.slice(0, n);
    });
  }

  const parTotal = useMemo(
    () => holes.reduce((s, h) => s + (Number(h.par) || 0), 0),
    [holes],
  );

  // === Tee operations ===
  function addTee() {
    // pick next unused preset
    const used = new Set(tees.map((t) => t.label.toLowerCase()));
    const next = TEE_PRESETS.find((p) => !used.has(p.label.toLowerCase())) ?? {
      label: `Tee ${tees.length + 1}`,
      color: null as string | null,
    };
    setTees((prev) => [
      ...prev,
      { label: next.label, slope: "", rating: "", color: next.color ?? null },
    ]);
  }

  function removeTee(idx: number) {
    if (tees.length === 1) {
      toast.error("Need at least one tee box");
      return;
    }
    const removed = tees[idx];
    setTees((prev) => prev.filter((_, i) => i !== idx));
    // Remove yardages for that tee on every hole
    setHoles((prev) =>
      prev.map((h) => {
        const next = { ...h.yardages };
        delete next[removed.label];
        return { ...h, yardages: next };
      }),
    );
  }

  function patchTee(idx: number, patch: Partial<TeeDraft>) {
    setTees((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
    // If label was renamed, migrate yardages key on every hole
    if (patch.label && patch.label !== tees[idx].label) {
      const oldLabel = tees[idx].label;
      const newLabel = patch.label;
      setHoles((prev) =>
        prev.map((h) => {
          if (!(oldLabel in h.yardages)) return h;
          const { [oldLabel]: val, ...rest } = h.yardages;
          return { ...h, yardages: { ...rest, [newLabel]: val } };
        }),
      );
    }
  }

  function setHole(i: number, patch: Partial<HoleDraft>) {
    setHoles((prev) => prev.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  }

  function setHoleYardage(i: number, teeLabel: string, value: string) {
    setHoles((prev) =>
      prev.map((h, idx) =>
        idx === i ? { ...h, yardages: { ...h.yardages, [teeLabel]: value } } : h,
      ),
    );
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Name your course");
      return;
    }

    // Validate tees
    const parsedTees = [] as { label: string; slope: number; rating: number; color: string | null }[];
    const seenLabels = new Set<string>();
    for (const t of tees) {
      if (!t.label.trim()) { toast.error("Every tee needs a label"); return; }
      const labelKey = t.label.trim().toLowerCase();
      if (seenLabels.has(labelKey)) {
        toast.error(`Duplicate tee label "${t.label}"`); return;
      }
      seenLabels.add(labelKey);
      const slope = Number(t.slope);
      const rating = Number(t.rating);
      if (!Number.isFinite(slope) || slope < 55 || slope > 155) {
        toast.error(`${t.label}: slope must be 55–155`); return;
      }
      if (!Number.isFinite(rating) || rating < 50 || rating > 85) {
        toast.error(`${t.label}: rating must be 50–85`); return;
      }
      parsedTees.push({ label: t.label.trim(), slope, rating, color: t.color ?? null });
    }

    // Validate holes
    const parsedHoles: HoleInput[] = [];
    for (const h of holes) {
      const par = Number(h.par);
      if (!Number.isFinite(par) || par < 3 || par > 6) {
        toast.error(`Hole ${h.hole_number}: par must be 3–6`); return;
      }
      const hcpRaw = h.handicap_index.trim();
      let hcp: number | null = null;
      if (hcpRaw !== "") {
        const n = Number(hcpRaw);
        if (!Number.isFinite(n) || n < 1 || n > 27) {
          toast.error(`Hole ${h.hole_number}: HCP must be 1–27`); return;
        }
        hcp = n;
      }
      // Yardages: parse each, allow blank (omitted)
      const yardages: Record<string, number> = {};
      for (const tee of parsedTees) {
        const raw = (h.yardages[tee.label] ?? "").trim();
        if (raw === "") continue;
        const y = Number(raw);
        if (!Number.isFinite(y) || y < 0 || y > 700) {
          toast.error(`Hole ${h.hole_number} / ${tee.label}: yardage must be 0–700`); return;
        }
        yardages[tee.label] = y;
      }
      parsedHoles.push({
        hole_number: h.hole_number,
        par,
        handicap_index: hcp,
        yardages,
      });
    }

    const payload: CourseInput = {
      name: name.trim(),
      city: city.trim() || null,
      country: country.trim() || null,
      par_total: parTotal,
      hole_count: holeCount,
      tees: parsedTees,
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
    startTransition(async () => {
      try {
        const roundCount = await getCourseRoundCount(courseId);
        const msg = roundCount > 0
          ? `Delete this course AND the ${roundCount} round${roundCount === 1 ? "" : "s"} you've tracked here? Can't be undone.`
          : "Delete this course? Can't be undone.";
        if (!confirm(msg)) return;
        await deleteCourse(courseId);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Course meta */}
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
          <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="holeCount">Hole count</Label>
          <Select
            id="holeCount"
            value={holeCount}
            onChange={(e) => handleHoleCountChange(Number(e.target.value))}
          >
            <option value={9}>9</option>
            <option value={10}>10</option>
            <option value={18}>18</option>
            <option value={27}>27</option>
          </Select>
        </div>
      </div>

      {/* Tee management */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Tee boxes ({tees.length})
          </h3>
          <Button type="button" size="sm" variant="outline" onClick={addTee}>
            <Plus className="h-3.5 w-3.5" /> Add tee
          </Button>
        </div>
        <div className="space-y-2">
          {tees.map((t, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_2fr_1fr_1fr_auto] gap-2 items-center rounded-lg border border-border bg-background p-2"
            >
              <div
                className="h-6 w-6 rounded-full border border-border-strong"
                style={{ background: t.color ?? "transparent" }}
                title={t.color ?? "no color"}
              />
              <Input
                value={t.label}
                onChange={(e) => patchTee(i, { label: e.target.value })}
                placeholder="Label (Black/Blue/White…)"
                className="h-9"
              />
              <Input
                type="number"
                value={t.slope}
                onChange={(e) => patchTee(i, { slope: e.target.value })}
                placeholder="Slope"
                className="h-9"
              />
              <Input
                type="number"
                step="0.1"
                value={t.rating}
                onChange={(e) => patchTee(i, { rating: e.target.value })}
                placeholder="Rating"
                className="h-9"
              />
              <button
                type="button"
                onClick={() => removeTee(i)}
                className="rounded-full p-1.5 text-muted hover:text-danger"
                aria-label="Remove tee"
                disabled={tees.length === 1}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Holes table */}
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
                <th className="px-2 py-1">HCP</th>
                {tees.map((t) => (
                  <th key={t.label} className="px-2 py-1">
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: t.color ?? "var(--muted)" }}
                      />
                      {t.label}
                    </span>
                  </th>
                ))}
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
                      className="num w-14 rounded border border-border-strong bg-background px-2 py-1 text-center"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      max={27}
                      value={h.handicap_index}
                      onChange={(e) => setHole(i, { handicap_index: e.target.value })}
                      className="num w-14 rounded border border-border-strong bg-background px-2 py-1 text-center"
                    />
                  </td>
                  {tees.map((t) => (
                    <td key={t.label} className="px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        max={700}
                        value={h.yardages[t.label] ?? ""}
                        onChange={(e) => setHoleYardage(i, t.label, e.target.value)}
                        className={cn(
                          "num w-20 rounded border border-border-strong bg-background px-2 py-1 text-center",
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
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
