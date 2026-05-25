import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/top-bar";
import { BottomNav } from "@/components/nav/bottom-nav";
import { getHandicapIndex } from "@/lib/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { index, rounds } = await getHandicapIndex();

  return (
    <>
      <TopBar email={user.email} handicap={index} roundsCounted={rounds} />
      <div className="flex-1 mx-auto w-full max-w-6xl px-4 pb-24 md:pb-10 md:px-6">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
