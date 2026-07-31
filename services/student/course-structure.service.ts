/**
 * Course structure service — Course → Unit → Lesson reads.
 * Demo-backed now; swap data source without changing UI.
 */
import {
  COURSE_DEMO_META,
  DEMO_COURSE,
  listDemoCourses,
} from "@/content/demo/course-structure";
import type {
  CourseDefinition,
  CourseLesson,
  CourseTreeNode,
  CourseUnit,
  LessonBlockId,
  LocaleText,
} from "@/types/course-structure";
import { LESSON_BLOCK_LABELS, LESSON_BLOCK_ORDER } from "@/types/course-structure";

export function getLocalized(
  text: LocaleText | undefined,
  locale: "en" | "ar" = "en",
): string {
  if (!text) return "";
  return text[locale] || text.en || text.ar || "";
}

export function listCourses(): CourseDefinition[] {
  return listDemoCourses();
}

export function getCourse(courseIdOrSlug: string): CourseDefinition | null {
  const courses = listCourses();
  return (
    courses.find((c) => c.id === courseIdOrSlug || c.slug === courseIdOrSlug) ||
    null
  );
}

export function getUnit(
  courseId: string,
  unitId: string,
): { course: CourseDefinition; unit: CourseUnit } | null {
  const course = getCourse(courseId);
  if (!course) return null;
  const unit = course.units.find((u) => u.id === unitId);
  if (!unit) return null;
  return { course, unit };
}

export function getLesson(
  courseId: string,
  unitId: string,
  lessonId: string,
): {
  course: CourseDefinition;
  unit: CourseUnit;
  lesson: CourseLesson;
} | null {
  const path = getUnit(courseId, unitId);
  if (!path) return null;
  const lesson = path.unit.lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;
  return { ...path, lesson };
}

export function getAdjacentLessons(
  courseId: string,
  unitId: string,
  lessonId: string,
): { previous: CourseLesson | null; next: CourseLesson | null } {
  const path = getUnit(courseId, unitId);
  if (!path) return { previous: null, next: null };
  const idx = path.unit.lessons.findIndex((l) => l.id === lessonId);
  if (idx < 0) return { previous: null, next: null };
  return {
    previous: path.unit.lessons[idx - 1] || null,
    next: path.unit.lessons[idx + 1] || null,
  };
}

export function buildCourseTree(course: CourseDefinition): CourseTreeNode {
  return {
    type: "course",
    id: course.id,
    title: course.title,
    children: course.units.map((unit) => ({
      type: "unit" as const,
      id: unit.id,
      title: unit.title,
      children: unit.lessons.map((lesson) => ({
        type: "lesson" as const,
        id: lesson.id,
        title: lesson.title,
        children: LESSON_BLOCK_ORDER.map((blockId) => ({
          type: "block" as const,
          id: blockId,
          title: LESSON_BLOCK_LABELS[blockId],
        })),
      })),
    })),
  };
}

export function courseStructureStatus() {
  return {
    schema: DEMO_COURSE.schema,
    demo: COURSE_DEMO_META,
    hierarchy: DEMO_COURSE.hierarchy,
    blockOrder: LESSON_BLOCK_ORDER as LessonBlockId[],
    courseCount: listCourses().length,
  };
}

export { COURSE_DEMO_META, DEMO_COURSE };
