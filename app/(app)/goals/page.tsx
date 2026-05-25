import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { ComingSoonShell } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Goals" };

export default function GoalsPage() {
  return (
    <ComingSoonShell
      eyebrow="Goals"
      title="Break 80. Or 90. Or just be consistent."
      body="Set targets — handicap, scoring, FIR%, GIR% — and we’ll track progress and celebrate PRs."
      Icon={Trophy}
    />
  );
}
