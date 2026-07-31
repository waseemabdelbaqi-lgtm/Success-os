/**
 * Production bridge: attach interactive-lesson scaffolds to authored book lessons
 * after the complete reference lesson validates the engine.
 */
import { listAuthoredBooks } from "@/src/lib/jordan-books/production/queue-processor";
import { scaffoldFromBookLesson, listInteractiveLessons } from "@/src/lib/sos-lesson-engine/registry";

export function buildLessonCoverageReport() {
  const books = listAuthoredBooks();
  const complete = listInteractiveLessons();
  const completeLessonIds = new Set(complete.map((l) => l.identity.lessonId));

  let totalLessons = 0;
  let withCompleteInteractive = 0;
  let scaffoldable = 0;

  for (const book of books) {
    for (const unit of book.units) {
      for (const lesson of unit.lessons) {
        totalLessons += 1;
        if (completeLessonIds.has(lesson.id)) {
          withCompleteInteractive += 1;
        } else {
          scaffoldable += 1;
          // ensure scaffold builds without throwing
          scaffoldFromBookLesson(book, unit.id, unit.titleAr, lesson);
        }
      }
    }
  }

  return {
    authoredBooks: books.length,
    totalBookLessons: totalLessons,
    completeInteractiveLessons: withCompleteInteractive,
    scaffoldReadyLessons: scaffoldable,
    referenceLessonId: complete[0]?.id || null,
    honestCompleteClaim: false,
    note:
      "Only the Grade 1 Math u0-l1 reference lesson is fully staged. Other book lessons scaffold into the engine via adapter; queue continues deepening.",
  };
}
