/**
 * Interactive Lesson Engine service — resolve packages, filters, outlines.
 */
import { DEMO_BOOKS } from "@/content/demo/catalog";
import type { BookDefinition } from "@/types/student-portal";
import type {
  InteractiveLessonPackage,
  LessonFilters,
  LessonOutlineNode,
  LearningMode,
} from "@/types/interactive-lesson-engine";
import {
  LESSON_SECTION_LABELS,
  LESSON_SECTION_ORDER,
  LEARNING_MODES,
} from "@/types/interactive-lesson-engine";
import { adaptBookLessonToInteractivePackage } from "./adapt-book-lesson";
import { listBlockLibrary } from "./block-library";
import { FUTURE_CAPABILITY_PLACEHOLDERS } from "./future-placeholders";
import { DEMO_INTERACTIVE_LESSON } from "@/content/demo/interactive-lesson-engine";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";
import { ADAPTER_REGISTRY } from "./adapters";
import { ILE_THEMES } from "./core/theme";
import { listEngineLocales } from "./core/i18n";
import { ILE_A11Y, ILE_PERFORMANCE } from "./core/performance";
import { listAiCapabilities } from "./ai/integration-layer";

export { resolveTheme, themeToCssVars, ILE_THEMES } from "./core/theme";
export type { IleThemeId, IleThemeTokens } from "./core/theme";
export { t, locText, dirForLocale, listEngineLocales } from "./core/i18n";
export type { IleLocale } from "./core/i18n";
export {
  bumpPackageVersion,
  listVersionHistory,
  setPublishState,
  summarizePackage,
} from "./core/versioning";
export {
  buildBreadcrumbs,
  buildLessonSectionOutline,
  buildSlideOutline,
  adjacentIndex,
  searchPackage,
} from "./core/hierarchy";
export { ILE_A11Y, ILE_PERFORMANCE, shouldVirtualizeSlides } from "./core/performance";
export {
  AI_INTEGRATION_LAYER,
  getAiCapability,
  invokeAiCapability,
  listAiCapabilities,
} from "./ai/integration-layer";
export type { IleAiCapabilityId, AiCapabilityContract } from "./ai/integration-layer";

function books(): BookDefinition[] {
  return DEMO_BOOKS as BookDefinition[];
}

export function getLocalized(
  text: { en: string; ar: string } | undefined,
  locale: "en" | "ar" = "en",
): string {
  if (!text) return "";
  return text[locale] || text.en || text.ar || "";
}

export function engineStatus() {
  return {
    schema: "success-os.interactive-lesson-engine.v1",
    phase: "master-foundation",
    phases: [
      "core-architecture",
      "navigation-engine",
      "interactive-slide-engine",
      "student-workspace",
      "ai-integration-layer",
      "lesson-builder-admin",
      "component-library",
      "performance-a11y",
      "testing",
      "documentation",
    ],
    booksFirst: true,
    curriculumIngestion: false,
    aiVideoGeneration: false,
    countrySpecificLogic: false,
    blockLibrary: listBlockLibrary(),
    sectionOrder: LESSON_SECTION_ORDER,
    learningModes: LEARNING_MODES,
    themes: Object.keys(ILE_THEMES),
    locales: listEngineLocales(),
    adapters: ADAPTER_REGISTRY,
    aiCapabilities: listAiCapabilities(),
    futureCapabilities: FUTURE_CAPABILITY_PLACEHOLDERS,
    performance: {
      ...ILE_PERFORMANCE,
      a11y: ILE_A11Y,
    },
    estimatedMonthlyCostUsd: {
      shippedOssAdapters: 0,
      gatedAiMediaWhenEnabled: "usage-based (OpenAI/Claude/Gemini/HeyGen/ElevenLabs)",
    },
  };
}

export function buildPackageFromBookPath(
  bookId: string,
  unitId: string,
  lessonId: string,
): InteractiveLessonPackage | null {
  const book = books().find((b) => b.id === bookId || b.slug === bookId);
  if (!book) return null;
  const unit = book.units.find((u) => u.id === unitId);
  if (!unit) return null;
  const lessonIdx = unit.lessons.findIndex((l) => l.id === lessonId);
  if (lessonIdx < 0) return null;
  const lesson = unit.lessons[lessonIdx];
  if (!lesson) return null;
  const next = unit.lessons[lessonIdx + 1];
  return adaptBookLessonToInteractivePackage(book, unit, lesson, {
    next: next
      ? {
          id: next.id,
          title: next.title,
          href: STUDENT_ROUTES.lesson(book.id, unit.id, next.id),
        }
      : null,
  });
}

export function getDemoEngineLesson(): InteractiveLessonPackage {
  return DEMO_INTERACTIVE_LESSON;
}

export function resolveLessonPackage(query: {
  packageId?: string | null;
  bookId?: string | null;
  unitId?: string | null;
  lessonId?: string | null;
}): InteractiveLessonPackage | null {
  if (query.packageId === "demo" || query.packageId === DEMO_INTERACTIVE_LESSON.id) {
    return getDemoEngineLesson();
  }
  if (query.bookId && query.unitId && query.lessonId) {
    return buildPackageFromBookPath(query.bookId, query.unitId, query.lessonId);
  }
  return getDemoEngineLesson();
}

export function filterPackages(
  packages: InteractiveLessonPackage[],
  filters: LessonFilters,
): InteractiveLessonPackage[] {
  return packages.filter((pkg) => {
    const f = pkg.filters || {};
    if (filters.country && f.country && filters.country !== f.country) return false;
    if (filters.curriculum && f.curriculum && filters.curriculum !== f.curriculum)
      return false;
    if (filters.qualification && f.qualification && filters.qualification !== f.qualification)
      return false;
    if (filters.grade && f.grade && filters.grade !== f.grade) return false;
    if (filters.subject && f.subject && filters.subject !== f.subject) return false;
    if (filters.unit && f.unit && filters.unit !== f.unit) return false;
    if (filters.lesson && f.lesson && filters.lesson !== f.lesson) return false;
    if (filters.language && f.language && filters.language !== f.language) return false;
    if (filters.difficulty && pkg.difficulty && filters.difficulty !== pkg.difficulty)
      return false;
    return true;
  });
}

export function listEngineCatalog(filters: LessonFilters = {}): InteractiveLessonPackage[] {
  const fromBooks: InteractiveLessonPackage[] = [];
  for (const book of books()) {
    for (const unit of book.units) {
      for (const lesson of unit.lessons) {
        const pkg = buildPackageFromBookPath(book.id, unit.id, lesson.id);
        if (pkg) fromBooks.push(pkg);
      }
    }
  }
  return filterPackages([getDemoEngineLesson(), ...fromBooks], filters);
}

export function buildOutlines(pkg: InteractiveLessonPackage): {
  lesson: LessonOutlineNode;
  unit?: LessonOutlineNode;
  book?: LessonOutlineNode;
} {
  const lesson: LessonOutlineNode = {
    type: "lesson",
    id: pkg.id,
    title: pkg.title,
    children: [
      ...LESSON_SECTION_ORDER.filter((s) => (pkg.sections[s] || []).length).map((s) => ({
        type: "section" as const,
        id: s,
        title: LESSON_SECTION_LABELS[s],
      })),
      ...pkg.slides.map((sl) => ({
        type: "slide" as const,
        id: sl.id,
        title: sl.title,
      })),
    ],
  };

  if (pkg.source.kind === "book" && pkg.source.bookId) {
    const book = books().find((b) => b.id === pkg.source.bookId);
    if (book) {
      const unit = book.units.find((u) => u.id === pkg.source.unitId);
      return {
        lesson,
        unit: unit
          ? {
              type: "unit",
              id: unit.id,
              title: unit.title,
              children: unit.lessons.map((l) => ({
                type: "lesson" as const,
                id: l.id,
                title: l.title,
                href: STUDENT_ROUTES.lesson(book.id, unit.id, l.id),
              })),
            }
          : undefined,
        book: {
          type: "book",
          id: book.id,
          title: book.title,
          href: STUDENT_ROUTES.book(book.id),
          children: book.units.map((u) => ({
            type: "unit" as const,
            id: u.id,
            title: u.title,
            children: u.lessons.map((l) => ({
              type: "lesson" as const,
              id: l.id,
              title: l.title,
              href: STUDENT_ROUTES.lesson(book.id, u.id, l.id),
            })),
          })),
        },
      };
    }
  }

  return { lesson };
}

export function modeConfig(mode: LearningMode) {
  return {
    mode,
    showTeacherNotes: mode === "teacher",
    showAiTutor: mode === "ai_tutor" || mode === "student",
    presentationChrome: mode === "presentation",
    denseReading: mode === "reading",
  };
}
