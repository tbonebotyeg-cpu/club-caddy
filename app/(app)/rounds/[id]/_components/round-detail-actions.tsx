"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Play, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteRound, reopenRound } from "../../../round/actions";

export function RoundDetailActions({
  roundId,
  status,
}: {
  roundId: string;
  status: "in_progress" | "completed" | "abandoned";
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this round? This can't be undone.")) return;
    startTransition(async () => {
      try {
        await deleteRound(roundId);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleReopen() {
    if (
      !confirm(
        "Reopen this round to edit scores? It'll move back to In Progress and stats will update when you finish again.",
      )
    )
      return;
    startTransition(async () => {
      try {
        await reopenRound(roundId);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {status === "in_progress" ? (
        <Link href={`/round/${roundId}`}>
          <Button size="sm">
            <Play className="h-4 w-4" /> Resume
          </Button>
        </Link>
      ) : (
        <Button size="sm" variant="outline" onClick={handleReopen} disabled={pending}>
          <RotateCcw className="h-4 w-4" /> Reopen
        </Button>
      )}
      <button
        onClick={handleDelete}
        disabled={pending}
        className="text-xs text-subtle hover:text-danger inline-flex items-center gap-1"
      >
        <Trash2 className="h-3 w-3" /> Delete
      </button>
    </div>
  );
}
