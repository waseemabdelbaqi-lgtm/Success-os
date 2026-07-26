import { IB_PHYSICS_PHOTOELECTRIC } from "@/src/lib/digital-library/lessons/ib-physics-photoelectric-effect";
import { JORDAN_G1_MATH_NUMBER_LINE_ADDITION } from "@/src/lib/digital-library/lessons/jordan-g1-math-number-line-addition";
import type { LessonModuleContent } from "@/src/lib/digital-library/types";

const LESSONS: Record<string, LessonModuleContent> = {
  [IB_PHYSICS_PHOTOELECTRIC.slug]: IB_PHYSICS_PHOTOELECTRIC,
  [JORDAN_G1_MATH_NUMBER_LINE_ADDITION.slug]: JORDAN_G1_MATH_NUMBER_LINE_ADDITION,
};

export function getLessonBySlug(slug: string | undefined | null): LessonModuleContent | null {
  if (!slug) return null;
  return LESSONS[slug] || null;
}

export function getDefaultPrototypeLesson() {
  return IB_PHYSICS_PHOTOELECTRIC;
}

export function listRegisteredLessons() {
  return Object.values(LESSONS).map((l) => ({
    slug: l.slug,
    title: l.title,
    subtitle: l.subtitle,
  }));
}
