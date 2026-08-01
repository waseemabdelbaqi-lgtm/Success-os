/**
 * Local lesson-block progress for Course workspace (localStorage).
 * Ready to swap for server enrolment progress later.
 */
import type { LessonBlockId } from "@/types/course-structure";
import { LESSON_BLOCK_ORDER } from "@/types/course-structure";

const STORAGE_KEY = "success-os.course-lesson-progress.v1";

export type LessonBlockProgressRecord = {
  courseId: string;
  unitId: string;
  lessonId: string;
  blocksCompleted: LessonBlockId[];
  quizScore?: number | null;
  questionsCorrect?: number;
  questionsTotal?: number;
  chatTurns?: number;
  lastVisitedAt: string;
  masteryPercent: number;
};

function key(courseId: string, unitId: string, lessonId: string) {
  return `${courseId}::${unitId}::${lessonId}`;
}

function loadAll(): Record<string, LessonBlockProgressRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, LessonBlockProgressRecord>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getLessonBlockProgress(
  courseId: string,
  unitId: string,
  lessonId: string,
): LessonBlockProgressRecord {
  const all = loadAll();
  const k = key(courseId, unitId, lessonId);
  return (
    all[k] || {
      courseId,
      unitId,
      lessonId,
      blocksCompleted: [],
      quizScore: null,
      questionsCorrect: 0,
      questionsTotal: 0,
      chatTurns: 0,
      lastVisitedAt: new Date().toISOString(),
      masteryPercent: 0,
    }
  );
}

export function markBlockComplete(
  courseId: string,
  unitId: string,
  lessonId: string,
  blockId: LessonBlockId,
): LessonBlockProgressRecord {
  const all = loadAll();
  const k = key(courseId, unitId, lessonId);
  const current = getLessonBlockProgress(courseId, unitId, lessonId);
  const blocksCompleted = Array.from(
    new Set([...current.blocksCompleted, blockId]),
  ) as LessonBlockId[];
  const masteryPercent = Math.round(
    (blocksCompleted.length / LESSON_BLOCK_ORDER.length) * 100,
  );
  const next: LessonBlockProgressRecord = {
    ...current,
    blocksCompleted,
    masteryPercent,
    lastVisitedAt: new Date().toISOString(),
  };
  all[k] = next;
  saveAll(all);
  return next;
}

export function recordQuizResult(
  courseId: string,
  unitId: string,
  lessonId: string,
  correct: number,
  total: number,
): LessonBlockProgressRecord {
  const marked = markBlockComplete(courseId, unitId, lessonId, "quiz");
  const all = loadAll();
  const k = key(courseId, unitId, lessonId);
  const next: LessonBlockProgressRecord = {
    ...marked,
    questionsCorrect: correct,
    questionsTotal: total,
    quizScore: total ? Math.round((correct / total) * 100) : null,
  };
  all[k] = next;
  saveAll(all);
  return next;
}
