/**
 * Asset extraction — catalog placeholders only in this PR (no media generation).
 */
import type { DetectedBook, ImportAsset } from "@/types/curriculum-import-engine";

export function extractAssets(book: DetectedBook): DetectedBook {
  const units = book.units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((lesson) => {
      const assets: ImportAsset[] = [...(lesson.assets || [])];
      if (!assets.length) {
        assets.push({
          id: `asset_${lesson.id}_ref`,
          kind: "other",
          label: {
            en: "Reference asset slot (not generated)",
            ar: "موضع أصل مرجعي (غير مُولَّد)",
          },
          src: null,
          placeholder: true,
        });
      }
      return { ...lesson, assets };
    }),
  }));
  return { ...book, units };
}

export function countAssets(book: DetectedBook): number {
  return book.units.reduce(
    (n, u) => n + u.lessons.reduce((m, l) => m + (l.assets?.length || 0), 0),
    0,
  );
}
