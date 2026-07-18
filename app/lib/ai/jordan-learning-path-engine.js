/**
 * PHASE JO-07 — Jordan Learning Path Engine
 *
 * Adapter over portable learning-path-engine-core.
 * Does NOT generate curriculum content — builds journeys from JO digital books.
 */

import path from 'node:path';
import { createLearningPathEngine } from './learning-path-engine-core.js';
import { isJordanNationalBookId } from '../../data/jordan-national-knowledge-sources.js';
import { listLibraryBooks } from './library-store.js';

export const PHASE = 'JO-07_JORDAN_LEARNING_PATH_ENGINE';
export const ENGINE_VERSION = '7.0.0';

function list(v) {
  return Array.isArray(v) ? v : [];
}

function updateRoot() {
  return path.join(process.cwd(), 'library', 'jordan-learning-paths');
}

let engineSingleton = null;

export function getJordanLearningPathEngine() {
  if (engineSingleton) return engineSingleton;
  engineSingleton = createLearningPathEngine({
    countryCode: 'JO',
    country: 'Jordan',
    educationalSystem: 'Jordan National Curriculum',
    rootDir: updateRoot(),
    listPathBooks: () => {
      const all = listLibraryBooks().filter((b) => isJordanNationalBookId(b.id));
      const produced = all.filter((b) => b.jo02?.producedAt);
      // Prefer JO-02 produced books for complete guided journeys; fall back to any national book with lessons.
      if (produced.length) return produced;
      return all.filter((b) => list(b.units).some((u) => list(u.lessons).length));
    },
  });
  return engineSingleton;
}

export function buildJordanLearningPaths() {
  return getJordanLearningPathEngine().buildAllPaths();
}

export function buildJordanLearningPathDashboard() {
  return getJordanLearningPathEngine().buildDashboard();
}

export function getJordanStudentProgression(studentId, bookId) {
  return getJordanLearningPathEngine().computeProgression(studentId, bookId);
}

export function recommendJordanNextLesson(studentId, bookId) {
  return getJordanLearningPathEngine().recommendNextLesson(studentId, bookId);
}

export function updateJordanLessonMastery(studentId, bookId, lessonId, state, meta = {}) {
  return getJordanLearningPathEngine().setLessonState(
    studentId,
    bookId,
    lessonId,
    state,
    meta,
  );
}

export function completeJordanLesson(studentId, bookId, lessonId, meta = {}) {
  return getJordanLearningPathEngine().markLessonCompleted(
    studentId,
    bookId,
    lessonId,
    meta,
  );
}

export function getJordanLearningPath(bookId) {
  return getJordanLearningPathEngine().loadPath(bookId);
}

export function getJordanLearningAnalytics() {
  return getJordanLearningPathEngine().buildAnalytics();
}

/**
 * Seed demo student analytics from existing paths (no curriculum generation).
 */
export function seedJordanDemoProgress(options = {}) {
  const engine = getJordanLearningPathEngine();
  const index = engine.buildAllPaths();
  const studentId = options.studentId || 'demo-student-jo';
  const bookId =
    options.bookId ||
    index.paths.find((p) => p.subject === 'الرياضيات' && p.grade === 'الصف 5')?.bookId ||
    index.paths[0]?.bookId;
  if (!bookId) return { ok: false, error: 'NO_PATH_BOOKS' };

  const pathDoc = engine.loadPath(bookId);
  const lessons = pathDoc?.lessons || [];
  // Complete first 5 lessons, leave one in progress, one needs revision pattern
  for (let i = 0; i < Math.min(5, lessons.length); i += 1) {
    engine.setLessonState(studentId, bookId, lessons[i].lessonId, 'In Progress', {
      studySeconds: 60,
    });
    engine.setLessonState(studentId, bookId, lessons[i].lessonId, 'Completed', {
      studySeconds: 480 + i * 30,
    });
  }
  if (lessons[5]) {
    engine.setLessonState(studentId, bookId, lessons[5].lessonId, 'In Progress', {
      studySeconds: 120,
    });
  }
  if (lessons[2]) {
    engine.setLessonState(studentId, bookId, lessons[2].lessonId, 'Needs Revision', {
      reviewed: true,
    });
  }
  if (lessons[0]) {
    engine.setLessonState(studentId, bookId, lessons[0].lessonId, 'Mastered', {
      studySeconds: 60,
    });
  }

  const progression = engine.computeProgression(studentId, bookId);
  const analytics = engine.buildAnalytics();
  return { ok: true, studentId, bookId, progression, analytics };
}

export function runJordanLearningPathEngine(options = {}) {
  if (options.dashboardOnly) {
    return { dashboard: buildJordanLearningPathDashboard() };
  }
  const index = buildJordanLearningPaths();
  let demo = null;
  if (options.seedDemo !== false) {
    demo = seedJordanDemoProgress(options);
  }
  const dashboard = buildJordanLearningPathDashboard();
  return {
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    index,
    demo,
    dashboard,
  };
}
