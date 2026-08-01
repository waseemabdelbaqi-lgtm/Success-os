/**
 * Content normalization — structure only. No AI rewrite. No quiz generation.
 */
import type { DetectedBook, DetectedLesson, DetectedUnit } from "@/types/curriculum-import-engine";

function normText(value: { en: string; ar: string }) {
  return {
    en: String(value?.en || "").trim(),
    ar: String(value?.ar || "").trim(),
  };
}

export function normalizeBook(book: DetectedBook): DetectedBook {
  const units: DetectedUnit[] = book.units.map((unit, ui) => ({
    ...unit,
    id: unit.id || `unit_${ui + 1}`,
    order: unit.order || ui + 1,
    title: normText(unit.title),
    overview: unit.overview ? normText(unit.overview) : undefined,
    lessons: unit.lessons.map((lesson, li) => normalizeLesson(lesson, ui, li)),
  }));

  return {
    ...book,
    title: normText(book.title),
    units,
    metadata: {
      ...book.metadata,
      country: String(book.metadata.country || "").trim(),
      curriculum: String(book.metadata.curriculum || "").trim(),
      grade: book.metadata.grade ? String(book.metadata.grade).trim() : undefined,
      subject: book.metadata.subject ? String(book.metadata.subject).trim() : undefined,
      semester: book.metadata.semester ? String(book.metadata.semester).trim() : undefined,
      keywords: [...new Set(book.metadata.keywords.map((k) => k.trim()).filter(Boolean))],
    },
  };
}

function normalizeLesson(lesson: DetectedLesson, ui: number, li: number): DetectedLesson {
  return {
    ...lesson,
    id: lesson.id || `u${ui + 1}_l${li + 1}`,
    order: lesson.order || li + 1,
    title: normText(lesson.title),
    body: normText(lesson.body),
    objectives: (lesson.objectives || []).map(normText).filter((o) => o.en || o.ar),
    keywords: [...new Set((lesson.keywords || []).map((k) => k.trim()).filter(Boolean))],
    assets: lesson.assets || [],
    references: lesson.references || [],
  };
}
