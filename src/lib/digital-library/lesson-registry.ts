import { IB_PHYSICS_PHOTOELECTRIC } from "@/src/lib/digital-library/lessons/ib-physics-photoelectric-effect";
import type { LessonModuleContent } from "@/src/lib/digital-library/types";

const LESSONS: Record<string, LessonModuleContent> = {
  [IB_PHYSICS_PHOTOELECTRIC.slug]: IB_PHYSICS_PHOTOELECTRIC,
};

export function getLessonBySlug(slug: string | undefined | null): LessonModuleContent | null {
  if (!slug) return null;
  return LESSONS[slug] || null;
}

export function getDefaultPrototypeLesson() {
  return IB_PHYSICS_PHOTOELECTRIC;
}
