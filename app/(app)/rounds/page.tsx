import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { ComingSoonShell } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Rounds" };

export default function RoundsPage() {
  return (
    <ComingSoonShell
      eyebrow="History"
      title="No rounds yet"
      body="Once you start tracking rounds, every score, putt and FIR/GIR shows up here, with trends and per-course breakdowns."
      Icon={ClipboardList}
      ctaHref="/round/new"
      ctaLabel="Start a round"
    />
  );
}
