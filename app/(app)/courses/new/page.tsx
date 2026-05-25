import type { Metadata } from "next";
import { CourseEditor } from "../_components/course-editor";

export const metadata: Metadata = { title: "New course" };

export default function NewCoursePage() {
  return (
    <div className="py-6 md:py-10 max-w-3xl mx-auto">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">Courses</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Add a course</h1>
      <p className="mt-2 text-muted text-sm">
        Enter par, slope, course rating, and hole-by-hole yardages + stroke index.
      </p>
      <div className="mt-8">
        <CourseEditor />
      </div>
    </div>
  );
}
