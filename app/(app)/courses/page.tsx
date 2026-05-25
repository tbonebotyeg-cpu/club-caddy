import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, city, country, par_total, slope_rating, course_rating, tees_label")
    .order("name", { ascending: true });

  return (
    <div className="py-6 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Courses</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
            {courses?.length ?? 0} {courses?.length === 1 ? "course" : "courses"}
          </h1>
        </div>
        <Link href="/courses/new">
          <Button>
            <Plus className="h-4 w-4" /> Add course
          </Button>
        </Link>
      </div>

      {!courses || courses.length === 0 ? (
        <Card className="p-10 text-center">
          <MapPin className="mx-auto h-10 w-10 text-accent" />
          <h2 className="mt-4 text-xl font-semibold">Your course library is empty</h2>
          <p className="mt-2 text-muted">
            Add the tracks you play — par, slope, rating, hole yardages and stroke index.
          </p>
          <div className="mt-6">
            <Link href="/courses/new">
              <Button>Add your first course</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`}>
              <Card className="card-hover p-5 h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{c.name}</h3>
                    {(c.city || c.country) && (
                      <p className="text-sm text-muted mt-0.5">
                        {[c.city, c.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-surface-elevated px-2 py-1 text-[10px] uppercase tracking-wider text-muted">
                    {c.tees_label}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <Metric label="Par" value={c.par_total} />
                  <Metric label="Slope" value={c.slope_rating} />
                  <Metric label="Rating" value={c.course_rating.toFixed(1)} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="num text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">{label}</div>
    </div>
  );
}
