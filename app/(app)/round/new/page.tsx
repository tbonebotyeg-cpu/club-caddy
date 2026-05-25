import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StartRoundForm } from "./start-round-form";

export const metadata: Metadata = { title: "New round" };
export const dynamic = "force-dynamic";

export default async function NewRoundPage(props: {
  searchParams: Promise<{ course?: string }>;
}) {
  const sp = await props.searchParams;
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, city, tees_label, par_total, slope_rating, course_rating")
    .order("name", { ascending: true });

  if (!courses || courses.length === 0) {
    return (
      <div className="py-10 md:py-16 max-w-xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-accent text-center">Round</p>
        <Card className="mt-6 p-10 text-center">
          <MapPin className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Add a course first</h1>
          <p className="mt-2 text-muted text-sm">
            You need at least one course in your library before you can start a round.
          </p>
          <Link href="/courses/new" className="mt-6 inline-block">
            <Button>
              <Plus className="h-4 w-4" /> Add a course
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 md:py-10 max-w-2xl mx-auto">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">Round</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Start a round</h1>
      <p className="mt-2 text-muted text-sm">Pick a course and tees. You can edit later.</p>
      <div className="mt-8">
        <StartRoundForm courses={courses} preselectedCourseId={sp.course} />
      </div>
    </div>
  );
}
