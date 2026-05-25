import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { ComingSoonShell } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Courses" };

export default function CoursesPage() {
  return (
    <ComingSoonShell
      eyebrow="Courses"
      title="Your course library"
      body="Save the tracks you play — par, slope, rating, hole-by-hole yardages and stroke index. Shipping in Phase 2."
      Icon={MapPin}
    />
  );
}
