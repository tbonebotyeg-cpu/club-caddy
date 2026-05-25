// Verify the v2 schema migration: new columns exist, data migrated.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. Check new columns + migrated data on courses
const { data: courses, error: cErr } = await admin
  .from("courses")
  .select("name, par_total, hole_count, tees")
  .order("name");
if (cErr) { console.error("Courses query failed:", cErr.message); process.exit(1); }

console.log(`\nCourses (${courses.length}):`);
let coursesOK = 0, coursesWithEmptyTees = 0;
for (const c of courses) {
  const ok = Array.isArray(c.tees) && c.tees.length > 0 && c.tees[0].label && c.tees[0].slope && c.tees[0].rating;
  if (ok) coursesOK++;
  else coursesWithEmptyTees++;
  const tee = c.tees[0];
  console.log(`  ${ok ? "✓" : "✗"} ${c.name.padEnd(45)} par ${c.par_total} · ${c.hole_count}h · ${tee?.label ?? "—"} ${tee?.rating ?? "?"}/${tee?.slope ?? "?"}`);
}

// 2. Check a sample hole has yardages populated
const sampleCourse = courses[0];
const { data: sampleCourseRow } = await admin.from("courses").select("id").eq("name", sampleCourse.name).single();
const { data: holes } = await admin
  .from("holes")
  .select("hole_number, par, handicap_index, yardages")
  .eq("course_id", sampleCourseRow.id)
  .order("hole_number");

console.log(`\nSample holes from "${sampleCourse.name}" (${holes.length} holes):`);
const teeLabel = sampleCourse.tees[0]?.label ?? "White";
let holesOK = 0;
for (const h of holes) {
  const yardage = h.yardages?.[teeLabel];
  const ok = typeof yardage === "number" && yardage > 0;
  if (ok) holesOK++;
  console.log(`  ${ok ? "✓" : "✗"} hole ${String(h.hole_number).padStart(2)} · par ${h.par} · hcp ${h.handicap_index} · ${teeLabel} ${yardage ?? "—"}y`);
}

// 3. Check legacy columns are GONE
const { data: legacyCheck } = await admin.rpc("__noop_does_not_exist", {}).then(() => ({ data: null })).catch(() => ({ data: null }));
const legacyCheckCourses = await admin.from("courses").select("tees_label").limit(1);
const legacyCheckHoles = await admin.from("holes").select("yardage").limit(1);
const oldCoursesColExists = !legacyCheckCourses.error;
const oldHolesColExists = !legacyCheckHoles.error;

console.log("\nLegacy columns dropped:");
console.log(`  ${oldCoursesColExists ? "✗ courses.tees_label STILL EXISTS" : "✓ courses.tees_label dropped"}`);
console.log(`  ${oldHolesColExists ? "✗ holes.yardage STILL EXISTS" : "✓ holes.yardage dropped"}`);

// 4. Summary
console.log("\n=== Summary ===");
console.log(`  ${coursesOK}/${courses.length} courses have tees[] populated`);
console.log(`  ${holesOK}/${holes.length} sample holes have yardages populated`);
console.log(`  hole_count present on courses: ${courses.every((c) => typeof c.hole_count === "number") ? "✓" : "✗"}`);
console.log(`  All checks: ${coursesOK === courses.length && holesOK === holes.length && !oldCoursesColExists && !oldHolesColExists ? "✓ MIGRATION SUCCESSFUL" : "✗ ISSUES FOUND"}`);
