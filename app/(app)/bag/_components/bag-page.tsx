"use client";

import { useState, useTransition } from "react";
import { Plus, Sparkles, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CLUB_TYPE_LABEL,
  SWING_PCTS,
  type ClubWithYardages,
  type SwingPct,
} from "@/lib/types";
import { ClubEditor } from "./club-editor";
import { SwingMatrix } from "./swing-matrix";
import { createClub, deleteClub, seedStarterBag, setYardage, updateClub } from "../actions";

export function BagPage({ initialBag }: { initialBag: ClubWithYardages[] }) {
  const [bag, setBag] = useState(initialBag);
  const [editing, setEditing] = useState<ClubWithYardages | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  function patchLocal(id: string, mut: (c: ClubWithYardages) => ClubWithYardages) {
    setBag((prev) => prev.map((c) => (c.id === id ? mut(c) : c)));
  }

  async function handleSeed() {
    startTransition(async () => {
      try {
        await seedStarterBag();
        toast.success("Starter bag added — set your yardages.");
        // Soft reload — the server action revalidates the route.
        window.location.reload();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  async function handleAdd(values: {
    name: string;
    type: ClubWithYardages["type"];
    loft: number | null;
    notes: string | null;
  }) {
    startTransition(async () => {
      try {
        const club = await createClub(values);
        setBag((prev) => [
          ...prev,
          {
            id: club.id,
            name: club.name,
            type: club.type,
            loft: club.loft,
            position: club.position,
            notes: club.notes,
            yardages: SWING_PCTS.map((p) => ({
              club_id: club.id,
              swing_pct: p,
              yardage: 0,
            })),
          },
        ]);
        setAdding(false);
        toast.success(`${club.name} added`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  async function handleEdit(
    id: string,
    values: {
      name: string;
      type: ClubWithYardages["type"];
      loft: number | null;
      notes: string | null;
    },
  ) {
    startTransition(async () => {
      try {
        await updateClub(id, values);
        patchLocal(id, (c) => ({ ...c, ...values }));
        setEditing(null);
        toast.success("Updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this club from your bag?")) return;
    startTransition(async () => {
      try {
        await deleteClub(id);
        setBag((prev) => prev.filter((c) => c.id !== id));
        toast.success("Removed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  async function handleYardage(clubId: string, swingPct: SwingPct, yardage: number) {
    patchLocal(clubId, (c) => ({
      ...c,
      yardages: c.yardages.map((y) =>
        y.swing_pct === swingPct ? { ...y, yardage } : y,
      ),
    }));
    try {
      await setYardage(clubId, swingPct, yardage);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const totalYardages = bag.reduce(
    (s, c) => s + c.yardages.filter((y) => y.yardage > 0).length,
    0,
  );

  return (
    <div className="py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">My Bag</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
            {bag.length} {bag.length === 1 ? "club" : "clubs"}
            <span className="text-muted font-normal text-base ml-3">
              {totalYardages} yardages set
            </span>
          </h1>
        </div>
        <Button onClick={() => setAdding(true)} disabled={pending}>
          <Plus className="h-4 w-4" /> Add club
        </Button>
      </div>

      {/* Empty state */}
      {bag.length === 0 ? (
        <Card className="p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-accent" />
          <h2 className="mt-4 text-xl font-semibold">Your bag is empty</h2>
          <p className="mt-2 text-muted">
            Start with a 14-club starter bag (Driver through Putter) — you’ll set the yardages.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={handleSeed} loading={pending}>
              Seed starter bag
            </Button>
            <Button variant="outline" onClick={() => setAdding(true)}>
              Add one club
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bag.map((club) => (
            <Card key={club.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted">
                    {CLUB_TYPE_LABEL[club.type]}
                    {club.loft != null && (
                      <span className="ml-2 num">{club.loft}°</span>
                    )}
                  </div>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">
                    {club.name}
                  </h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(club)}
                    className="rounded-full p-2 text-muted hover:text-accent hover:bg-surface-elevated transition-colors"
                    aria-label={`Edit ${club.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(club.id)}
                    className="rounded-full p-2 text-muted hover:text-danger hover:bg-surface-elevated transition-colors"
                    aria-label={`Delete ${club.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <SwingMatrix
                yardages={club.yardages}
                onChange={(p, y) => handleYardage(club.id, p, y)}
                disabled={club.type === "putter"}
              />
              {club.notes && (
                <p className="mt-3 text-xs text-muted italic">“{club.notes}”</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Editors */}
      {adding && (
        <ClubEditor
          onClose={() => setAdding(false)}
          onSave={handleAdd}
          submitting={pending}
        />
      )}
      {editing && (
        <ClubEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(v) => handleEdit(editing.id, v)}
          submitting={pending}
        />
      )}
    </div>
  );
}
