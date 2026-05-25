import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseEditor } from "../_components/course-editor";

export const metadata: Metadata = { title: "Edit course" };
export const dynamic = "force-dynamic";

export default async function CourseDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();
  if (!course) notFound();

  const { data: holes } = await supabase
    .from("holes")
    .select("*")
    .eq("course_id", id)
    .order("hole_number", { ascending: true });

  return (
    <div className="py-6 md:py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Course</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">{course.name}</h1>
          {(course.city || course.country) && (
            <p className="mt-1 text-muted text-sm">
              {[course.city, course.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <Link href={`/round/new?course=${course.id}`}>
          <Button variant="secondary">Start round here</Button>
        </Link>
      </div>

      <Card className="mt-6 p-5">
        <CourseEditor
          courseId={course.id}
          initial={{
            name: course.name,
            city: course.city,
            country: course.country,
            par_total: course.par_total,
            tees_label: course.tees_label,
            slope_rating: course.slope_rating,
            course_rating: Number(course.course_rating),
            holes:
              holes?.map((h) => ({
                hole_number: h.hole_number,
                par: h.par,
                yardage: h.yardage,
                handicap_index: h.handicap_index,
              })) ?? [],
          }}
        />
      </Card>
    </div>
  );
}
