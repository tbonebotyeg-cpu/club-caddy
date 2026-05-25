"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ClubType, CLUB_TYPE_LABEL, type Club, type ClubWithYardages } from "@/lib/types";

const Schema = z.object({
  name: z.string().min(1, "Name your club").max(40),
  type: ClubType,
  loft: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().min(0).max(80).nullable(),
  ),
  notes: z.string().max(280).nullable().optional(),
});

type FormValues = z.input<typeof Schema>;

export function ClubEditor({
  initial,
  onClose,
  onSave,
  submitting,
}: {
  initial?: ClubWithYardages | Club;
  onClose: () => void;
  onSave: (values: {
    name: string;
    type: ClubType;
    loft: number | null;
    notes: string | null;
  }) => void;
  submitting: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name: initial?.name ?? "",
      type: (initial?.type as ClubType) ?? "iron",
      loft: initial?.loft ?? null,
      notes: initial?.notes ?? "",
    },
  });

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(values: FormValues) {
    const parsed = Schema.parse(values);
    onSave({
      name: parsed.name.trim(),
      type: parsed.type,
      loft: typeof parsed.loft === "number" ? parsed.loft : null,
      notes: parsed.notes?.toString().trim() || null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-t-2xl md:rounded-2xl border border-border-strong bg-surface p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold tracking-tight">
            {initial ? "Edit club" : "Add club"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:text-foreground hover:bg-surface-elevated"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. 7 Iron" {...register("name")} />
            {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select id="type" {...register("type")}>
                {(Object.keys(CLUB_TYPE_LABEL) as ClubType[]).map((t) => (
                  <option key={t} value={t}>
                    {CLUB_TYPE_LABEL[t]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loft">Loft (°)</Label>
              <Input
                id="loft"
                type="number"
                step="0.5"
                min={0}
                max={80}
                placeholder="optional"
                {...register("loft")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="e.g. fades right with full swing"
              className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:border-accent"
              {...register("notes")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="flex-1">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
