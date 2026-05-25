import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { ComingSoonShell } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Stats" };

export default function StatsPage() {
  return (
    <ComingSoonShell
      eyebrow="Stats"
      title="Your dashboard awaits"
      body="Scoring average, FIR%, GIR%, putts per round, scoring by par, club performance and handicap trend — all here once you log rounds."
      Icon={BarChart3}
      ctaHref="/round/new"
      ctaLabel="Track your first round"
    />
  );
}
