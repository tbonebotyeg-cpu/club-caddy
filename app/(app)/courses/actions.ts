"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseSchema, HoleSchema } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export type CourseInput = {
  name: string;
  city: string | null;
  country: string | null;
  par_total: number;
  tees_label: string;
  slope_rating: number;
  course_rating: number;
  holes: Array<{ hole_number: number; par: number; yardage: number; handicap_index: number }>;
};

export async function createCourse(input: CourseInput) {
  const { supabase, user } = await requireUser();

  const meta = CourseSchema.pick({
    name: true,
    city: true,
    country: true,
    par_total: true,
    tees_label: true,
    slope_rating: true,
    course_rating: true,
  }).parse(input);

  const { data: course, error } = await supabase
    .from("courses")
    .insert({ ...meta, user_id: user.id })
    .select()
    .single();
  if (error || !course) throw new Error(error?.message || "Failed to create course");

  const holeRows = input.holes.map((h) =>
    HoleSchema.parse({ ...h, course_id: course.id }),
  );
  const { error: holesErr } = await supabase.from("holes").insert(holeRows);
  if (holesErr) throw new Error(holesErr.message);

  revalidatePath("/courses");
  redirect(`/courses/${course.id}`);
}

export async function updateCourse(courseId: string, input: CourseInput) {
  const { supabase } = await requireUser();
  const meta = CourseSchema.pick({
    name: true,
    city: true,
    country: true,
    par_total: true,
    tees_label: true,
    slope_rating: true,
    course_rating: true,
  }).parse(input);

  const { error } = await supabase.from("courses").update(meta).eq("id", courseId);
  if (error) throw new Error(error.message);

  // Replace holes (simpler than diff-by-hole-number)
  await supabase.from("holes").delete().eq("course_id", courseId);
  const holeRows = input.holes.map((h) => HoleSchema.parse({ ...h, course_id: courseId }));
  const { error: holesErr } = await supabase.from("holes").insert(holeRows);
  if (holesErr) throw new Error(holesErr.message);

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
}

export async function deleteCourse(courseId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) throw new Error(error.message);
  revalidatePath("/courses");
  redirect("/courses");
}
