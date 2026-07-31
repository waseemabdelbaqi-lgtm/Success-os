/**
 * Portable Learning Path Engine Core
 *
 * Reusable for Jordan and every future country.
 * Does NOT generate curriculum content — builds journeys from existing books.
 */

import fs from 'node:fs';
import path from 'node:path';

export const LEARNING_PATH_SCHEMA = 'success-os.learning-path-engine.v1';
export const MASTERY_STATES = Object.freeze([
  'Not Started',
  'In Progress',
  'Completed',
  'Needs Revision',
  'Mastered',
]);

function list(v) {
  return Array.isArray(v) ? v : [];
}

function text(v) {
  return String(v || '').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function ensureDirs(root) {
  for (const dir of [
    root,
    path.join(root, 'paths'),
    path.join(root, 'progress'),
    path.join(root, 'analytics'),
    path.join(root, 'dashboards'),
    path.join(root, 'reports'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function estimateStudyMinutes(lesson, difficulty) {
  const body = text(lesson.fullLesson || lesson.stepByStepExplanation);
  const base = Math.max(12, Math.min(35, Math.round(body.length / 120)));
  if (difficulty === 'advanced') return base + 8;
  if (difficulty === 'intermediate') return base + 4;
  return base;
}

function difficultyForIndex(index, total) {
  const ratio = total <= 1 ? 0 : index / (total - 1);
  if (ratio < 0.34) return 'foundational';
  if (ratio < 0.72) return 'intermediate';
  return 'advanced';
}

function importanceForIndex(index, total) {
  // Early unit openers + unit closers ranked higher
  if (index === 0 || index === total - 1) return 'critical';
  if (index % 4 === 3) return 'high';
  if (index % 2 === 0) return 'standard';
  return 'supporting';
}

/**
 * @param {object} config
 * @param {string} config.countryCode
 * @param {string} config.country
 * @param {string} config.educationalSystem
 * @param {string} config.rootDir
 * @param {() => object[]} config.listPathBooks — books eligible for learning paths
 */
export function createLearningPathEngine(config) {
  const { countryCode, country, educationalSystem, rootDir, listPathBooks } = config;
  const phase = `${countryCode}-LEARNING-PATH-ENGINE`;

  function root() {
    return rootDir;
  }

  function progressPath(studentId) {
    return path.join(root(), 'progress', `${String(studentId || 'anonymous').replace(/[\\/:*?"<>|]/g, '-')}.json`);
  }

  function flattenBookLessons(book) {
    const nodes = [];
    let order = 0;
    for (const unit of list(book.units)) {
      const unitId = unit.id || unit.unitId;
      for (const lesson of list(unit.lessons)) {
        nodes.push({
          order: order++,
          bookId: book.id,
          unitId,
          unitTitle: unit.title || unit.titleAr,
          lessonId: lesson.id,
          title: lesson.title,
          lesson,
        });
      }
    }
    return nodes;
  }

  /**
   * Build a complete learning path for one book (guided journey).
   */
  function buildBookLearningPath(book) {
    const identity = book.identity || {};
    const flat = flattenBookLessons(book);
    const total = flat.length;
    const _byLessonId = new Map(flat.map((n) => [n.lessonId, n]));

    const lessons = flat.map((node, index) => {
      const lesson = node.lesson;
      const difficulty = difficultyForIndex(index, total);
      const importance = importanceForIndex(index, total);
      const previous = index > 0 ? [flat[index - 1].lessonId] : [];
      // Unit-internal soft prerequisite: first lesson of unit may also depend on prior unit closer
      if (index > 0 && flat[index].unitId !== flat[index - 1].unitId && index > 1) {
        previous.push(flat[index - 1].lessonId);
      }
      const next = index < total - 1 ? [flat[index + 1].lessonId] : [];
      const requiredConcepts = list(lesson.keyConcepts).length
        ? list(lesson.keyConcepts)
        : list(lesson.scientificConcepts).length
          ? list(lesson.scientificConcepts)
          : list(lesson.definitions).map((d) => d.term).filter(Boolean);
      const skillsGained = list(
        lesson.learningOutcomes ||
          lesson.learningObjectives ||
          lesson.curriculumAlignment?.requiredSkills,
      ).slice(0, 5);
      const related = [];
      // Same unit siblings
      for (const other of flat) {
        if (other.lessonId === node.lessonId) continue;
        if (other.unitId === node.unitId) related.push(other.lessonId);
      }
      // Adjacent lessons
      if (flat[index - 2]) related.push(flat[index - 2].lessonId);
      if (flat[index + 2]) related.push(flat[index + 2].lessonId);

      const estimatedStudyTimeMinutes = estimateStudyMinutes(lesson, difficulty);
      const learningObjective =
        list(lesson.learningOutcomes)[0] ||
        lesson.curriculumAlignment?.officialLearningObjective ||
        `إتقان مفاهيم درس ${node.title}`;

      return {
        lessonId: node.lessonId,
        title: node.title,
        unitId: node.unitId,
        unitTitle: node.unitTitle,
        sequenceIndex: index,
        learningObjective,
        previousLessonsRequired: [...new Set(previous)],
        nextLessons: next,
        requiredConcepts: requiredConcepts.slice(0, 8),
        skillsGained,
        estimatedStudyTimeMinutes,
        difficultyLevel: difficulty,
        importanceLevel: importance,
        recommendedRevisionOrder: index + 1,
        relatedLessons: [...new Set(related)].slice(0, 6),
        masteryDefault: 'Not Started',
      };
    });

    const units = list(book.units).map((unit) => {
      const unitId = unit.id || unit.unitId;
      const unitLessons = lessons.filter((l) => l.unitId === unitId);
      return {
        unitId,
        title: unit.title || unit.titleAr,
        lessonIds: unitLessons.map((l) => l.lessonId),
        lessonCount: unitLessons.length,
        estimatedStudyTimeMinutes: unitLessons.reduce(
          (n, l) => n + l.estimatedStudyTimeMinutes,
          0,
        ),
      };
    });

    return {
      schema: 'success-os.learning-path.v1',
      pathId: `path__${book.id}`,
      country,
      countryCode,
      educationalSystem: identity.educationalSystem || educationalSystem,
      grade: identity.grade,
      subject: identity.subject,
      bookId: book.id,
      curriculum: identity.curriculum,
      hierarchy: [
        country,
        identity.educationalSystem || educationalSystem,
        identity.grade,
        identity.subject,
        book.id,
      ],
      units,
      lessons,
      totals: {
        units: units.length,
        lessons: lessons.length,
        estimatedStudyTimeMinutes: lessons.reduce(
          (n, l) => n + l.estimatedStudyTimeMinutes,
          0,
        ),
      },
      builtAt: nowIso(),
    };
  }

  function buildAllPaths() {
    ensureDirs(root());
    const books = listPathBooks();
    const paths = [];
    for (const book of books) {
      const pathDoc = buildBookLearningPath(book);
      writeJson(path.join(root(), 'paths', `${pathDoc.pathId}.json`), pathDoc);
      paths.push({
        pathId: pathDoc.pathId,
        bookId: pathDoc.bookId,
        grade: pathDoc.grade,
        subject: pathDoc.subject,
        lessons: pathDoc.totals.lessons,
        minutes: pathDoc.totals.estimatedStudyTimeMinutes,
      });
    }
    const index = {
      schema: 'success-os.learning-path-index.v1',
      countryCode,
      country,
      educationalSystem,
      phase,
      paths,
      totals: {
        books: paths.length,
        lessons: paths.reduce((n, p) => n + p.lessons, 0),
        minutes: paths.reduce((n, p) => n + p.minutes, 0),
      },
      builtAt: nowIso(),
    };
    writeJson(path.join(root(), 'paths', 'index.json'), index);
    return index;
  }

  function loadPath(bookId) {
    return readJson(path.join(root(), 'paths', `path__${bookId}.json`));
  }

  function loadPathIndex() {
    return readJson(path.join(root(), 'paths', 'index.json'));
  }

  function readStudentProgress(studentId) {
    return (
      readJson(progressPath(studentId)) || {
        schema: 'success-os.learning-path-progress.v1',
        studentId: studentId || 'anonymous',
        countryCode,
        lessons: {},
        events: [],
        updatedAt: null,
      }
    );
  }

  function writeStudentProgress(studentId, progress) {
    ensureDirs(root());
    const next = { ...progress, updatedAt: nowIso() };
    writeJson(progressPath(studentId), next);
    return next;
  }

  function getLessonState(progress, lessonId) {
    return progress.lessons?.[lessonId]?.state || 'Not Started';
  }

  function setLessonState(studentId, bookId, lessonId, state, meta = {}) {
    if (!MASTERY_STATES.includes(state)) {
      const err = new Error('INVALID_MASTERY_STATE');
      err.code = 'INVALID_MASTERY_STATE';
      err.details = { state, allowed: MASTERY_STATES };
      throw err;
    }
    const progress = readStudentProgress(studentId);
    const prev = progress.lessons[lessonId] || {};
    progress.lessons[lessonId] = {
      ...prev,
      bookId,
      lessonId,
      state,
      startedAt: prev.startedAt || (state !== 'Not Started' ? nowIso() : null),
      completedAt:
        state === 'Completed' || state === 'Mastered'
          ? nowIso()
          : prev.completedAt || null,
      lastUpdatedAt: nowIso(),
      studySeconds: (prev.studySeconds || 0) + (meta.studySeconds || 0),
      reviewCount:
        (prev.reviewCount || 0) + (state === 'Needs Revision' ? 1 : meta.reviewed ? 1 : 0),
    };
    progress.events = [
      {
        at: nowIso(),
        bookId,
        lessonId,
        state,
        ...meta,
      },
      ...list(progress.events),
    ].slice(0, 500);
    writeStudentProgress(studentId, progress);
    return computeProgression(studentId, bookId);
  }

  function markLessonCompleted(studentId, bookId, lessonId, meta = {}) {
    return setLessonState(studentId, bookId, lessonId, 'Completed', meta);
  }

  function prerequisitesMet(pathDoc, progress, lessonId) {
    const node = list(pathDoc.lessons).find((l) => l.lessonId === lessonId);
    if (!node) return { ok: false, reason: 'LESSON_NOT_IN_PATH' };
    const missing = [];
    for (const pre of list(node.previousLessonsRequired)) {
      const state = getLessonState(progress, pre);
      if (!['Completed', 'Mastered'].includes(state)) missing.push(pre);
    }
    return { ok: missing.length === 0, missing };
  }

  /**
   * Recommend next lesson — never if prerequisites incomplete.
   */
  function recommendNextLesson(studentId, bookId) {
    const pathDoc = loadPath(bookId);
    if (!pathDoc) return { ok: false, error: 'PATH_NOT_FOUND', bookId };
    const progress = readStudentProgress(studentId);

    for (const lesson of list(pathDoc.lessons)) {
      const state = getLessonState(progress, lesson.lessonId);
      if (['Completed', 'Mastered'].includes(state)) continue;
      const gate = prerequisitesMet(pathDoc, progress, lesson.lessonId);
      if (!gate.ok) {
        return {
          ok: true,
          blocked: true,
          reason: 'PREREQUISITES_INCOMPLETE',
          missingPrerequisites: gate.missing,
          recommendedLessonId: null,
          suggestedUnlock: gate.missing[0] || null,
        };
      }
      if (state === 'Needs Revision') {
        return {
          ok: true,
          blocked: false,
          recommendedLessonId: lesson.lessonId,
          reason: 'REVISION_PRIORITY',
          lesson,
        };
      }
      return {
        ok: true,
        blocked: false,
        recommendedLessonId: lesson.lessonId,
        reason: 'CURRICULUM_ORDER',
        lesson,
      };
    }

    return {
      ok: true,
      blocked: false,
      recommendedLessonId: null,
      reason: 'PATH_COMPLETE',
      lesson: null,
    };
  }

  /**
   * Progression metrics for a student on a book / subject / grade / curriculum.
   */
  function computeProgression(studentId, bookId) {
    const pathDoc = loadPath(bookId);
    if (!pathDoc) return { ok: false, error: 'PATH_NOT_FOUND', bookId };
    const progress = readStudentProgress(studentId);
    const lessons = list(pathDoc.lessons);

    let completed = 0;
    let mastered = 0;
    let inProgress = 0;
    let needsRevision = 0;
    let notStarted = 0;
    let current = null;

    for (const lesson of lessons) {
      const state = getLessonState(progress, lesson.lessonId);
      if (state === 'Mastered') {
        mastered += 1;
        completed += 1;
      } else if (state === 'Completed') completed += 1;
      else if (state === 'In Progress') {
        inProgress += 1;
        if (!current) current = lesson;
      } else if (state === 'Needs Revision') {
        needsRevision += 1;
        if (!current) current = lesson;
      } else {
        notStarted += 1;
        if (!current) current = lesson;
      }
    }

    const unitProgress = list(pathDoc.units).map((unit) => {
      const ids = list(unit.lessonIds);
      const done = ids.filter((id) =>
        ['Completed', 'Mastered'].includes(getLessonState(progress, id)),
      ).length;
      return {
        unitId: unit.unitId,
        title: unit.title,
        completed: done,
        total: ids.length,
        percent: pct(done, ids.length),
      };
    });

    const bookProgressPercent = pct(completed, lessons.length);
    const recommendation = recommendNextLesson(studentId, bookId);

    // Subject / grade / curriculum aggregates from all paths for this student
    const index = loadPathIndex() || { paths: [] };
    const allPaths = list(index.paths)
      .map((p) => loadPath(p.bookId))
      .filter(Boolean);

    function aggregate(filterFn) {
      const subset = allPaths.filter(filterFn);
      let totalLessons = 0;
      let doneLessons = 0;
      for (const p of subset) {
        for (const l of list(p.lessons)) {
          totalLessons += 1;
          if (['Completed', 'Mastered'].includes(getLessonState(progress, l.lessonId))) {
            doneLessons += 1;
          }
        }
      }
      return {
        books: subset.length,
        completedLessons: doneLessons,
        totalLessons,
        percent: pct(doneLessons, totalLessons),
      };
    }

    return {
      ok: true,
      studentId,
      country,
      educationalSystem: pathDoc.educationalSystem,
      grade: pathDoc.grade,
      subject: pathDoc.subject,
      bookId,
      pathId: pathDoc.pathId,
      currentPosition: current
        ? {
            lessonId: current.lessonId,
            title: current.title,
            unitId: current.unitId,
            unitTitle: current.unitTitle,
            sequenceIndex: current.sequenceIndex,
            state: getLessonState(progress, current.lessonId),
          }
        : {
            lessonId: null,
            title: null,
            state: 'Path Complete',
          },
      completedLessons: completed,
      remainingLessons: Math.max(0, lessons.length - completed),
      masteredLessons: mastered,
      inProgressLessons: inProgress,
      needsRevisionLessons: needsRevision,
      notStartedLessons: notStarted,
      currentUnitProgress: unitProgress,
      bookProgress: {
        completed,
        total: lessons.length,
        percent: bookProgressPercent,
      },
      subjectProgress: aggregate((p) => p.subject === pathDoc.subject),
      gradeProgress: aggregate((p) => p.grade === pathDoc.grade),
      overallCurriculumProgress: aggregate(() => true),
      recommendation,
      updatedAt: nowIso(),
    };
  }

  /**
   * Admin analytics from stored progress files + path definitions.
   */
  function buildAnalytics() {
    ensureDirs(root());
    const index = loadPathIndex() || { paths: [] };
    const progressDir = path.join(root(), 'progress');
    const students = fs.existsSync(progressDir)
      ? fs
          .readdirSync(progressDir)
          .filter((f) => f.endsWith('.json'))
          .map((f) => readJson(path.join(progressDir, f)))
          .filter(Boolean)
      : [];

    const lessonStats = new Map();
    let studentsStarted = 0;
    let studentsCompletedAnyPath = 0;
    const completionTimes = [];

    for (const student of students) {
      const lessonEntries = Object.values(student.lessons || {});
      if (lessonEntries.some((l) => l.state && l.state !== 'Not Started')) {
        studentsStarted += 1;
      }

      let studentCompletedAllTracked = true;
      let studentHasLessons = false;

      for (const [lessonId, entry] of Object.entries(student.lessons || {})) {
        studentHasLessons = true;
        if (!lessonStats.has(lessonId)) {
          lessonStats.set(lessonId, {
            lessonId,
            bookId: entry.bookId,
            started: 0,
            completed: 0,
            reviewed: 0,
            totalStudySeconds: 0,
            incomplete: 0,
          });
        }
        const stat = lessonStats.get(lessonId);
        if (entry.state !== 'Not Started') stat.started += 1;
        if (['Completed', 'Mastered'].includes(entry.state)) {
          stat.completed += 1;
          if (entry.startedAt && entry.completedAt) {
            const ms =
              new Date(entry.completedAt).getTime() - new Date(entry.startedAt).getTime();
            if (ms > 0 && ms < 1000 * 60 * 60 * 8) completionTimes.push(ms / 60000);
          }
        } else {
          stat.incomplete += 1;
          studentCompletedAllTracked = false;
        }
        stat.reviewed += entry.reviewCount || 0;
        stat.totalStudySeconds += entry.studySeconds || 0;
      }

      if (studentHasLessons && studentCompletedAllTracked) studentsCompletedAnyPath += 1;
    }

    const statsList = [...lessonStats.values()];
    const mostDifficult = [...statsList]
      .map((s) => ({
        ...s,
        failRatio: s.started ? s.incomplete / s.started : 0,
      }))
      .sort((a, b) => b.failRatio - a.failRatio || b.incomplete - a.incomplete)
      .slice(0, 10);

    const mostReviewed = [...statsList]
      .sort((a, b) => b.reviewed - a.reviewed)
      .slice(0, 10);

    const incompleteLessons = statsList
      .filter((s) => s.incomplete > 0)
      .sort((a, b) => b.incomplete - a.incomplete)
      .slice(0, 20);

    const totalPathLessons = list(index.paths).reduce((n, p) => n + (p.lessons || 0), 0);
    const completedAcrossStudents = statsList.reduce((n, s) => n + s.completed, 0);
    // Curriculum completion % = average book completion across started students
    let curriculumCompletionPercentage = 0;
    if (studentsStarted && totalPathLessons) {
      let sumPct = 0;
      for (const student of students) {
        let done = 0;
        for (const p of list(index.paths)) {
          const pathDoc = loadPath(p.bookId);
          for (const l of list(pathDoc?.lessons)) {
            if (
              ['Completed', 'Mastered'].includes(
                student.lessons?.[l.lessonId]?.state || 'Not Started',
              )
            ) {
              done += 1;
            }
          }
        }
        sumPct += pct(done, totalPathLessons);
      }
      curriculumCompletionPercentage =
        Math.round((sumPct / Math.max(1, students.length)) * 10) / 10;
    }

    const avgCompletionTimeMinutes = completionTimes.length
      ? Math.round(
          (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) * 10,
        ) / 10
      : 0;

    const analytics = {
      schema: 'success-os.learning-path-analytics.v1',
      countryCode,
      country,
      educationalSystem,
      studentsStarted,
      studentsCompleted: studentsCompletedAnyPath,
      averageCompletionTimeMinutes: avgCompletionTimeMinutes,
      mostDifficultLessons: mostDifficult,
      mostReviewedLessons: mostReviewed,
      incompleteLessons,
      curriculumCompletionPercentage,
      pathBooks: list(index.paths).length,
      pathLessons: totalPathLessons,
      completedLessonEvents: completedAcrossStudents,
      updatedAt: nowIso(),
    };

    writeJson(path.join(root(), 'analytics', 'latest.json'), analytics);
    return analytics;
  }

  function buildDashboard() {
    const index = loadPathIndex() || { paths: [], totals: {} };
    const analytics = buildAnalytics();
    return {
      schema: 'success-os.learning-path-dashboard.v1',
      countryCode,
      country,
      educationalSystem,
      phase,
      pathIndex: index,
      analytics,
      masteryStates: MASTERY_STATES,
      updatedAt: nowIso(),
    };
  }

  return {
    countryCode,
    country,
    educationalSystem,
    phase,
    root,
    buildBookLearningPath,
    buildAllPaths,
    loadPath,
    loadPathIndex,
    readStudentProgress,
    setLessonState,
    markLessonCompleted,
    prerequisitesMet,
    recommendNextLesson,
    computeProgression,
    buildAnalytics,
    buildDashboard,
    MASTERY_STATES,
  };
}
