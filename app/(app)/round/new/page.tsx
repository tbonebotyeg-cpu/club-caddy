import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { ComingSoonShell } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "New round" };

export default function NewRound() {
  return (
    <ComingSoonShell
      eyebrow="Round"
      title="Scorecard ships in Phase 2"
      body="Course library, hole-by-hole scorecard, FIR/GIR, and handicap auto-calculation are next on the roadmap."
      Icon={ClipboardList}
      ctaHref="/bag"
      ctaLabel="Tune your bag in the meantime"
    />
  );
}
