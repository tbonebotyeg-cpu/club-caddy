import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { ClubWithYardages, ClubYardage } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";
import { BagPage } from "./_components/bag-page";

export const metadata: Metadata = { title: "Bag" };
export const dynamic = "force-dynamic";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];
type YardageRow = Database["public"]["Tables"]["club_yardages"]["Row"];
type ClubWithYardagesRow = ClubRow & { club_yardages: YardageRow[] };

export default async function Bag() {
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
    created_at: c.created_at,
    yardages: (c.club_yardages ?? []).map<ClubYardage>((y) => ({
      id: y.id,
      club_id: y.club_id,
      swing_pct: y.swing_pct,
      yardage: y.yardage,
      notes: y.notes,
    })),
  }));

  return <BagPage initialBag={bag} />;
}
