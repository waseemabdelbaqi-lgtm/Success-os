/**
 * PHASE JO-01.2 — Jordan Grade 1 Complete Learning Ecosystem Engine
 *
 * Builds the full Success OS learning ecosystem for every Grade 1 lesson.
 * Hard gate: do not advance to the next lesson until current reaches 100%.
 * Hard gate: do not advance to Grade 2 until every Grade 1 lesson is complete.
 *
 * Official catalog: https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68
 * Does not copy textbooks — original Success OS content after JO-01 knowledge.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  G1_ECOSYSTEM_SCHEMA,
  G1_ECOSYSTEM_VERSION,
  G1_OFFICIAL_CATALOG_URL,
  G1_GRADE,
  G1_OFFICIAL_SUBJECTS,
  G1_COMPLETION_CHECKLIST,
  g1CompletionPercent,
  g1IsLessonComplete,
} from '../../data/jordan-grade1-learning-ecosystem.js';
import { authorGrade1LessonEcosystem } from './jordan-grade1-ecosystem-author.js';
import { listLibraryBooks, loadLibraryBook } from './library-store.js';
import { isJordanNationalBookId } from '../../data/jordan-national-knowledge-sources.js';
import { subjectCodeFromLabel } from '../../data/national-education-registry.js';
import { knowledgeRoot } from './jordan-national-knowledge-engine.js';

export const PHASE = 'JO-01.2_GRADE1_COMPLETE_LEARNING_ECOSYSTEM';
export const ENGINE_VERSION = '1.2.0';

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

function rootDir() {
  return path.join(process.cwd(), 'library', 'jordan-grade1-learning-ecosystem');
}

function safeName(s) {
  return String(s || '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .slice(0, 120);
}

function fileKey(s) {
  return String(s || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[<>:"/\\|?*]/g, '_');
}

function knowledgePath(grade, subject) {
  return path.join(
    knowledgeRoot(),
    'subjects',
    `${fileKey(grade)}__${fileKey(subject)}.json`,
  );
}

function loadKnowledge(subject) {
  return readJson(knowledgePath(G1_GRADE, subject));
}

function findGrade1Book(subject) {
  const books = listLibraryBooks().filter(
    (b) =>
      isJordanNationalBookId(b.id) &&
      b.identity?.grade === G1_GRADE &&
      b.identity?.subject === subject,
  );
  const produced = books.filter((b) => b.jo02?.producedAt);
  return produced[0] || books[0] || null;
}

function packagePath(subject, lessonId) {
  return path.join(
    rootDir(),
    'lessons',
    safeName(subject),
    `${safeName(lessonId)}.json`,
  );
}

function verifyPackage(pkg) {
  const issues = [];
  const pct = g1CompletionPercent(pkg);
  for (const key of G1_COMPLETION_CHECKLIST) {
    const value = pkg.resources?.[key];
    if (value == null || (typeof value === 'object' && value.status === 'missing')) {
      issues.push({ code: 'MISSING_RESOURCE', key });
    }
  }
  const qc = pkg.resources?.qualityControl || {};
  for (const flag of [
    'original',
    'scientificallyAccurate',
    'curriculumAligned',
    'ageAppropriate',
    'accessible',
    'multilingualReady',
    'verified',
  ]) {
    if (qc[flag] !== true) issues.push({ code: 'QUALITY_FLAG_FAILED', flag });
  }
  if (!pkg.resources?.questionBank?.questions?.length) {
    issues.push({ code: 'EMPTY_QUESTION_BANK' });
  }
  const q = pkg.resources.questionBank.questions || [];
  const missingExpl = q.filter(
    (item) =>
      item.type === 'multipleChoice' &&
      (!item.explanations?.correct || !item.explanations?.incorrect),
  );
  if (missingExpl.length) {
    issues.push({ code: 'MISSING_ANSWER_EXPLANATIONS', count: missingExpl.length });
  }

  const ok = issues.length === 0 && pct >= 100;
  return { ok, completionPercent: pct, issues };
}

function registryIdsFor(subject, unitIndex, lessonIndex) {
  const g = 'G01';
  const s = subjectCodeFromLabel(subject);
  const u = `U${String(unitIndex + 1).padStart(2, '0')}`;
  const l = `L${String(lessonIndex + 1).padStart(2, '0')}`;
  return {
    gradeId: `JOR-${g}`,
    subjectId: `JOR-${g}-${s}`,
    unitId: `JOR-${g}-${s}-${u}`,
    lessonId: `JOR-${g}-${s}-${u}-${l}`,
  };
}

function flattenLessons(book, knowledge) {
  if (book?.jo02?.producedAt && list(book.units).length) {
    const out = [];
    list(book.units).forEach((unit, ui) => {
      list(unit.lessons).forEach((lesson, li) => {
        out.push({
          unit,
          lesson,
          unitIndex: ui,
          lessonIndex: li,
          knowledgeLesson: null,
        });
      });
    });
    // Attach knowledge lessons by position when available
    if (knowledge?.units) {
      let k = 0;
      const kLessons = list(knowledge.units).flatMap((u) =>
        list(u.lessons).map((l) => ({ unit: u, lesson: l })),
      );
      for (const row of out) {
        row.knowledgeLesson = kLessons[k]?.lesson || null;
        k += 1;
      }
    }
    return out;
  }

  // Fall back to JO-01 knowledge structure (4×16)
  const out = [];
  list(knowledge?.units).forEach((unit, ui) => {
    list(unit.lessons).forEach((lesson, li) => {
      out.push({
        unit: {
          id: unit.unitId || `U${ui + 1}`,
          title: unit.titleAr || unit.title,
          titleAr: unit.titleAr,
        },
        lesson: {
          id: lesson.lessonId || `L${ui + 1}.${li + 1}`,
          title: lesson.titleAr || lesson.title,
          learningOutcomes: lesson.learningOutcomes,
          keyConcepts: lesson.scientificConcepts,
          vocabulary: lesson.definitions,
          curriculumAlignment: {
            requiredSkills: lesson.requiredSkills,
          },
        },
        unitIndex: ui,
        lessonIndex: li,
        knowledgeLesson: lesson,
      });
    });
  });
  return out;
}

function ensureDirs() {
  for (const dir of [
    rootDir(),
    path.join(rootDir(), 'lessons'),
    path.join(rootDir(), 'subjects'),
    path.join(rootDir(), 'units'),
    path.join(rootDir(), 'dashboards'),
    path.join(rootDir(), 'reports'),
    path.join(rootDir(), 'gates'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  for (const subject of G1_OFFICIAL_SUBJECTS) {
    fs.mkdirSync(path.join(rootDir(), 'lessons', safeName(subject)), { recursive: true });
  }
}

/**
 * Produce one lesson ecosystem. Returns incomplete if verification fails.
 */
export function produceGrade1LessonEcosystem({
  subject,
  unit,
  lesson,
  knowledgeLesson,
  book,
  unitIndex,
  lessonIndex,
  previousLessonIds,
  unitLessonIds,
  subjectLessonIds,
}) {
  const identity = book?.identity || {
    country: 'Jordan',
    educationalSystem: 'التعليم الأساسي',
    grade: G1_GRADE,
    subject,
    language: 'ar',
  };

  const pkg = authorGrade1LessonEcosystem({
    identity,
    book: book || { id: `knowledge:${subject}` },
    unit,
    lesson,
    knowledgeLesson,
    registryIds: registryIdsFor(subject, unitIndex, lessonIndex),
    previousLessonIds,
    unitLessonIds,
    subjectLessonIds,
  });

  // Enroll marker for content factory (integration link — not auto-publish)
  pkg.resources.contentFactoryEnrollment = {
    required: true,
    status: 'linked',
    phase: 'JO-09',
    note: 'Ecosystem linked; publication still requires Content Factory Admin path.',
  };

  const verification = verifyPackage(pkg);
  pkg.verification = verification;
  pkg.completionPercent = verification.completionPercent;
  pkg.status = verification.ok ? 'complete' : 'incomplete';
  pkg.updatedAt = nowIso();
  return pkg;
}

/**
 * Sequential production with hard 100% gate.
 */
export function runGrade1LearningEcosystem(options = {}) {
  ensureDirs();
  const subjects = options.subject
    ? G1_OFFICIAL_SUBJECTS.filter((s) => s === options.subject)
    : [...G1_OFFICIAL_SUBJECTS];
  const maxLessons = options.maxLessons || Infinity;
  const stopOnIncomplete = options.stopOnIncomplete !== false;

  const report = {
    schema: G1_ECOSYSTEM_SCHEMA,
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    officialCatalogUrl: G1_OFFICIAL_CATALOG_URL,
    startedAt: nowIso(),
    subjects: {},
    completedLessons: 0,
    incompleteLessons: 0,
    blockedAt: null,
    grade1Complete: false,
    grade2Unlocked: false,
  };

  let producedThisRun = 0;

  for (const subject of subjects) {
    const knowledge = loadKnowledge(subject);
    if (!knowledge && !options.allowMissingKnowledge) {
      report.subjects[subject] = {
        status: 'blocked',
        reason: 'JO01_KNOWLEDGE_MISSING',
        catalogUrl: G1_OFFICIAL_CATALOG_URL,
      };
      if (stopOnIncomplete) {
        report.blockedAt = { subject, reason: 'JO01_KNOWLEDGE_MISSING' };
        break;
      }
      continue;
    }

    const book = findGrade1Book(subject);
    const rows = flattenLessons(book, knowledge);
    if (!rows.length) {
      report.subjects[subject] = {
        status: 'blocked',
        reason: 'NO_LESSONS',
      };
      if (stopOnIncomplete) {
        report.blockedAt = { subject, reason: 'NO_LESSONS' };
        break;
      }
      continue;
    }

    const subjectLessonIds = rows.map((r) => r.lesson.id);
    const subjectState = {
      subject,
      bookId: book?.id || null,
      jo02Produced: Boolean(book?.jo02?.producedAt),
      totalLessons: rows.length,
      completed: 0,
      incomplete: 0,
      lessons: [],
    };

    const previousLessonIds = [];
    let unitCursor = -1;
    let unitLessonIds = [];

    for (const row of rows) {
      if (producedThisRun >= maxLessons) break;

      if (row.unitIndex !== unitCursor) {
        unitCursor = row.unitIndex;
        unitLessonIds = rows
          .filter((r) => r.unitIndex === unitCursor)
          .map((r) => r.lesson.id);
      }

      const existing = readJson(packagePath(subject, row.lesson.id));
      if (existing && g1IsLessonComplete(existing) && !options.force) {
        subjectState.completed += 1;
        subjectState.lessons.push({
          lessonId: row.lesson.id,
          title: row.lesson.title,
          status: 'complete',
          completionPercent: 100,
          reused: true,
        });
        previousLessonIds.push(row.lesson.id);
        report.completedLessons += 1;
        continue;
      }

      const pkg = produceGrade1LessonEcosystem({
        subject,
        unit: row.unit,
        lesson: row.lesson,
        knowledgeLesson: row.knowledgeLesson,
        book,
        unitIndex: row.unitIndex,
        lessonIndex: row.lessonIndex,
        previousLessonIds: [...previousLessonIds],
        unitLessonIds,
        subjectLessonIds,
      });

      writeJson(packagePath(subject, row.lesson.id), pkg);
      producedThisRun += 1;

      // Unit-level bundle update
      writeJson(
        path.join(
          rootDir(),
          'units',
          `${safeName(subject)}__${safeName(row.unit.id || row.unit.unitId || `U${row.unitIndex + 1}`)}.json`,
        ),
        {
          subject,
          unitId: row.unit.id || row.unit.unitId,
          unitTitle: row.unit.title || row.unit.titleAr,
          lessonIds: unitLessonIds,
          assessments: {
            unitQuiz: pkg.resources.unitQuiz,
            midUnitAssessment: pkg.resources.midUnitAssessment,
            endOfUnitExam: pkg.resources.endOfUnitExam,
          },
          updatedAt: nowIso(),
        },
      );

      if (!g1IsLessonComplete(pkg)) {
        subjectState.incomplete += 1;
        report.incompleteLessons += 1;
        subjectState.lessons.push({
          lessonId: row.lesson.id,
          title: pkg.title,
          status: 'incomplete',
          completionPercent: pkg.completionPercent,
          issues: pkg.verification?.issues?.slice(0, 8),
        });
        report.blockedAt = {
          subject,
          lessonId: row.lesson.id,
          title: pkg.title,
          completionPercent: pkg.completionPercent,
          issues: pkg.verification?.issues?.slice(0, 8),
        };
        if (stopOnIncomplete) {
          report.subjects[subject] = subjectState;
          report.finishedAt = nowIso();
          persistReport(report);
          return report;
        }
      } else {
        subjectState.completed += 1;
        report.completedLessons += 1;
        subjectState.lessons.push({
          lessonId: row.lesson.id,
          title: pkg.title,
          status: 'complete',
          completionPercent: 100,
        });
        previousLessonIds.push(row.lesson.id);
      }
    }

    // Subject final bundle
    writeJson(path.join(rootDir(), 'subjects', `${safeName(subject)}.json`), {
      subject,
      grade: G1_GRADE,
      officialCatalogUrl: G1_OFFICIAL_CATALOG_URL,
      totalLessons: subjectState.totalLessons,
      completedLessons: subjectState.completed,
      complete: subjectState.completed === subjectState.totalLessons,
      bookId: subjectState.bookId,
      subjectFinalExamLinked: true,
      updatedAt: nowIso(),
    });

    subjectState.status =
      subjectState.completed === subjectState.totalLessons ? 'complete' : 'in-progress';
    report.subjects[subject] = subjectState;

    if (producedThisRun >= maxLessons) break;
    if (subjectState.status !== 'complete' && stopOnIncomplete && report.blockedAt) {
      break;
    }
  }

  const allComplete = G1_OFFICIAL_SUBJECTS.every((s) => {
    const st = report.subjects[s];
    return st && st.completed === st.totalLessons && st.totalLessons > 0;
  });
  report.grade1Complete = allComplete;
  report.grade2Unlocked = allComplete;
  report.finishedAt = nowIso();
  persistReport(report);
  return report;
}

function persistReport(report) {
  ensureDirs();
  writeJson(path.join(rootDir(), 'reports', 'latest.json'), report);
  writeJson(path.join(rootDir(), 'gates', 'grade1-completion.json'), {
    grade1Complete: report.grade1Complete,
    grade2Unlocked: report.grade2Unlocked,
    rule: 'Do not move to Grade 2 until every Grade 1 lesson is fully completed and verified.',
    officialCatalogUrl: G1_OFFICIAL_CATALOG_URL,
    updatedAt: nowIso(),
  });
  writeJson(path.join(rootDir(), 'dashboards', 'latest.json'), buildGrade1EcosystemDashboard(report));
  writeJson(path.join(rootDir(), 'registry.json'), {
    schema: G1_ECOSYSTEM_SCHEMA,
    version: G1_ECOSYSTEM_VERSION,
    phase: PHASE,
    officialCatalogUrl: G1_OFFICIAL_CATALOG_URL,
    subjects: G1_OFFICIAL_SUBJECTS,
    reportSummary: {
      completedLessons: report.completedLessons,
      incompleteLessons: report.incompleteLessons,
      grade1Complete: report.grade1Complete,
      grade2Unlocked: report.grade2Unlocked,
      blockedAt: report.blockedAt,
    },
    updatedAt: nowIso(),
  });
}

export function buildGrade1EcosystemDashboard(report = null) {
  const rep = report || readJson(path.join(rootDir(), 'reports', 'latest.json')) || {};
  const subjects = rep.subjects || {};
  const rows = G1_OFFICIAL_SUBJECTS.map((s) => {
    const st = subjects[s] || {};
    return {
      subject: s,
      total: st.totalLessons || 0,
      completed: st.completed || 0,
      incomplete: st.incomplete || 0,
      status: st.status || 'not-started',
      jo02Produced: Boolean(st.jo02Produced),
      percent:
        st.totalLessons > 0
          ? Math.round((st.completed / st.totalLessons) * 1000) / 10
          : 0,
    };
  });
  const totalLessons = rows.reduce((a, r) => a + r.total, 0);
  const completed = rows.reduce((a, r) => a + r.completed, 0);
  return {
    schema: 'success-os.g1-ecosystem-dashboard.v1',
    phase: PHASE,
    officialCatalogUrl: G1_OFFICIAL_CATALOG_URL,
    grade: G1_GRADE,
    subjects: rows,
    totalLessons,
    completedLessons: completed,
    completionPercent:
      totalLessons > 0 ? Math.round((completed / totalLessons) * 1000) / 10 : 0,
    grade1Complete: Boolean(rep.grade1Complete),
    grade2Unlocked: Boolean(rep.grade2Unlocked),
    blockedAt: rep.blockedAt || null,
    checklistSize: G1_COMPLETION_CHECKLIST.length,
    updatedAt: nowIso(),
  };
}

export function listGrade1EcosystemPackages(subject = null) {
  const subjects = subject ? [subject] : [...G1_OFFICIAL_SUBJECTS];
  const out = [];
  for (const s of subjects) {
    const dir = path.join(rootDir(), 'lessons', safeName(s));
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const pkg = readJson(path.join(dir, file));
      if (!pkg) continue;
      out.push({
        subject: s,
        lessonId: pkg.lessonId,
        title: pkg.title,
        status: pkg.status,
        completionPercent: pkg.completionPercent,
        path: path.join(dir, file),
      });
    }
  }
  return out;
}

export function runJordanGrade1LearningEcosystem(options = {}) {
  if (options.dashboardOnly) {
    return { dashboard: buildGrade1EcosystemDashboard() };
  }
  const report = runGrade1LearningEcosystem(options);
  return {
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    officialCatalogUrl: G1_OFFICIAL_CATALOG_URL,
    completedLessons: report.completedLessons,
    incompleteLessons: report.incompleteLessons,
    grade1Complete: report.grade1Complete,
    grade2Unlocked: report.grade2Unlocked,
    blockedAt: report.blockedAt,
    subjects: report.subjects,
    dashboard: buildGrade1EcosystemDashboard(report),
    rule: 'A lesson is complete only at 100%. Grade 2 stays locked until every Grade 1 lesson is verified.',
  };
}
