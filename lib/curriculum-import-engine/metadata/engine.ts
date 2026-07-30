/**
 * METADATA_ENGINE — extract / normalize curriculum metadata. No AI rewrite.
 */
import type { DetectedBook, ExtractedMetadata } from "@/types/curriculum-import-engine";

export function extractMetadata(book: DetectedBook): ExtractedMetadata {
  const keywords = new Set<string>(book.metadata.keywords || []);
  const objectives = [...(book.metadata.objectives || [])];

  for (const unit of book.units) {
    for (const lesson of unit.lessons) {
      for (const k of lesson.keywords) keywords.add(k);
      for (const o of lesson.objectives) objectives.push(o);
    }
  }

  return {
    ...book.metadata,
    keywords: [...keywords],
    objectives,
    country: book.metadata.country,
    curriculum: book.metadata.curriculum,
    grade: book.metadata.grade,
    semester: book.metadata.semester,
    subject: book.metadata.subject,
    language: book.metadata.language,
  };
}

export function validateMetadata(meta: ExtractedMetadata): {
  ok: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!meta.country) missing.push("country");
  if (!meta.curriculum) missing.push("curriculum");
  if (!meta.grade) missing.push("grade");
  if (!meta.subject) missing.push("subject");
  if (!meta.sourceId) missing.push("sourceId");
  return { ok: missing.length === 0, missing };
}
