import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { ClubWithYardages, ClubYardage } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";
import { CaddyTool } from "./_components/caddy-tool";
import { ComingSoonShell } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Caddy" };
export const dynamic = "force-dynamic";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];
type YardageRow = Database["public"]["Tables"]["club_yardages"]["Row"];
type ClubWithYardagesRow = ClubRow & { club_yardages: YardageRow[] };

export default async function CaddyPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clubs")
    .select("id, name, type, loft, position, notes, created_at, club_yardages(*)")
    .order("position", { ascending: true });

  const clubs = (data ?? []) as unknown as ClubWithYardagesRow[];

  const bag: ClubWithYardages[] = clubs.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    loft: c.loft,
    position: c.position,
    notes: c.notes,
    yardages: (c.club_yardages ?? []).map<ClubYardage>((y) => ({
      id: y.id,
      club_id: y.club_id,
      swing_pct: y.swing_pct,
      yardage: y.yardage,
      notes: y.notes,
    })),
  }));

  const hasYardages = bag.some((c) => c.yardages.some((y) => y.yardage > 0));

  if (!hasYardages) {
    return (
      <ComingSoonShell
        eyebrow="Caddy"
        title="Set some yardages first"
        body="Add a few clubs in your Bag and fill in yardages — the Caddy needs your numbers to recommend a club."
        Icon={Compass}
        ctaHref="/bag"
        ctaLabel="Go to my Bag"
      />
    );
  }

  return (
    <div className="py-6 md:py-10 max-w-2xl mx-auto">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">Caddy</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
        What’s the play?
      </h1>
      <p className="mt-2 text-muted text-sm">
        Type a target yardage — get the top 3 club + swing combos from your bag.
      </p>
      <CaddyTool bag={bag} />
    </div>
  );
}
