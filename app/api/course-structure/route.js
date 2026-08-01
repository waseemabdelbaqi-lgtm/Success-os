/**
 * Course structure API — Course → Unit → Lesson (+ blocks).
 * Read-only demo catalog; no publish side effects.
 */
import {
  buildCourseTree,
  courseStructureStatus,
  getCourse,
  getLesson,
  getUnit,
  listCourses,
} from "@/services/student/course-structure.service";
import { LESSON_BLOCK_ORDER } from "@/types/course-structure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const courseId = url.searchParams.get("course");
    const unitId = url.searchParams.get("unit");
    const lessonId = url.searchParams.get("lesson");

    if (courseId && unitId && lessonId) {
      const path = getLesson(courseId, unitId, lessonId);
      if (!path) {
        return Response.json({ ok: false, error: "LESSON_NOT_FOUND" }, { status: 404 });
      }
      return Response.json({
        ok: true,
        hierarchy: "Course → Unit → Lesson",
        blockOrder: LESSON_BLOCK_ORDER,
        ...path,
        tree: buildCourseTree(path.course),
      });
    }

    if (courseId && unitId) {
      const path = getUnit(courseId, unitId);
      if (!path) {
        return Response.json({ ok: false, error: "UNIT_NOT_FOUND" }, { status: 404 });
      }
      return Response.json({ ok: true, ...path });
    }

    if (courseId) {
      const course = getCourse(courseId);
      if (!course) {
        return Response.json({ ok: false, error: "COURSE_NOT_FOUND" }, { status: 404 });
      }
      return Response.json({
        ok: true,
        course,
        tree: buildCourseTree(course),
        blockOrder: LESSON_BLOCK_ORDER,
      });
    }

    return Response.json({
      ok: true,
      ...courseStructureStatus(),
      courses: listCourses().map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        units: c.units.length,
        lessons: c.units.reduce((n, u) => n + u.lessons.length, 0),
        hierarchy: c.hierarchy,
      })),
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: String(error && error.message ? error.message : error) },
      { status: 500 },
    );
  }
}
