"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeeSchema, type Tee } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export type HoleInput = {
  hole_number: number;
  par: number;
  handicap_index: number | null;
  yardages: Record<string, number>;
};

export type CourseInput = {
  name: string;
  city: string | null;
  country: string | null;
  par_total: number;
  hole_count: number;
  tees: Tee[];
  holes: HoleInput[];
};

export async function createCourse(input: CourseInput) {
  const { supabase, user } = await requireUser();

  if (!Array.isArray(input.tees) || input.tees.length === 0) {
    throw new Error("Add at least one tee box");
  }
  const tees = input.tees.map((t) => TeeSchema.parse(t));

  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      user_id: user.id,
      name: input.name,
      city: input.city,
      country: input.country,
      par_total: input.par_total,
      hole_count: input.hole_count,
      tees,
    })
    .select()
    .single();
  if (error || !course) throw new Error(error?.message || "Failed to create course");

  const holeRows = input.holes.map((h) => ({
    course_id: course.id,
    hole_number: h.hole_number,
    par: h.par,
    handicap_index: h.handicap_index,
    yardages: h.yardages,
  }));
  const { error: holesErr } = await supabase.from("holes").insert(holeRows);
  if (holesErr) throw new Error(holesErr.message);

  revalidatePath("/courses");
  redirect(`/courses/${course.id}`);
}

export async function updateCourse(courseId: string, input: CourseInput) {
  const { supabase } = await requireUser();

  if (!Array.isArray(input.tees) || input.tees.length === 0) {
    throw new Error("Add at least one tee box");
  }
  const tees = input.tees.map((t) => TeeSchema.parse(t));

  const { error } = await supabase
    .from("courses")
    .update({
      name: input.name,
      city: input.city,
      country: input.country,
      par_total: input.par_total,
      hole_count: input.hole_count,
      tees,
    })
    .eq("id", courseId);
  if (error) throw new Error(error.message);

  // Replace holes
  await supabase.from("holes").delete().eq("course_id", courseId);
  const holeRows = input.holes.map((h) => ({
    course_id: courseId,
    hole_number: h.hole_number,
    par: h.par,
    handicap_index: h.handicap_index,
    yardages: h.yardages,
  }));
  const { error: holesErr } = await supabase.from("holes").insert(holeRows);
  if (holesErr) throw new Error(holesErr.message);

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
}

export async function getCourseRoundCount(courseId: string): Promise<number> {
  const { supabase } = await requireUser();
  const { count } = await supabase
    .from("rounds")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);
  return count ?? 0;
}

export async function deleteCourse(courseId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) throw new Error(error.message);
  revalidatePath("/courses");
  redirect("/courses");
}
