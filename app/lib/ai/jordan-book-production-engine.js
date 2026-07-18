/**
 * PHASE JO-02 — Jordan Book Production Engine
 *
 * ONLY Jordan National Curriculum.
 * One subject at a time — all official grades for that subject before the next.
 * Hierarchy: Country → System → Grade → Subject → Book → Unit → Lesson → Summary → Full Lesson
 * Quality over quantity. Never copy textbooks.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  assertJordanBookGenerationAllowed,
  readJordanKnowledgeDatabase,
  readJordanKnowledgeStatus,
} from './jordan-national-knowledge-engine.js';
import { assertJordanReferenceLibraryReady } from './jordan-educational-reference-library-engine.js';
import {
  JO_EXCLUDED_CURRICULA,
  isExcludedInternationalLabel,
  isJordanNationalBookId,
} from '../../data/jordan-national-knowledge-sources.js';
import { authorJordanLesson } from './jordan-lesson-author.js';
import {
  bookIdFromIdentity,
  loadLibraryBook,
  saveLibraryBook,
} from './library-store.js';
import { rebuildMiddleEastLiveBookIndex } from '../student/middle-east-live-book-store.js';
import { SCAFFOLD_FINGERPRINTS } from './middle-east-curriculum-knowledge-extraction-engine.js';

export const PHASE = 'JO-02_JORDAN_BOOK_PRODUCTION';
export const ENGINE_VERSION = '2.0.0';
export const MIN_QUALITY_SCORE = 90;
export const MIN_FULL_LESSON_CHARS = 900;

/** Pedagogical subject production order (exact JO-01 subject names). */
export const SUBJECT_PRODUCTION_ORDER = [
  'الرياضيات المبكرة',
  'الرياضيات',
  'اللغة والتواصل',
  'اللغة العربية',
  'اللغة الإنجليزية',
  'العلوم والاستكشاف',
  'العلوم',
  'الفيزياء',
  'الكيمياء',
  'العلوم الحياتية',
  'علوم الأرض والبيئة',
  'التربية الإسلامية',
  'الدراسات الاجتماعية',
  'التربية الوطنية والمدنية',
  'التاريخ',
  'تاريخ الأردن',
  'الجغرافيا',
  'المهارات الرقمية',
  'الحاسوب',
  'الثقافة المالية',
  'المهارات الحياتية',
  'التربية المهنية',
  'التربية الرياضية',
  'الفنون',
  'التربية الفنية والموسيقية والمسرحية',
  'الفنون والتصميم',
  'الفلسفة',
  'علم النفس والاجتماع',
  'الأعمال',
  'الهندسة',
  'تكنولوجيا المعلومات',
  'الضيافة',
  'السفر والسياحة',
  'الزراعة',
  'البناء والإنشاءات',
];

const GRADE_ORDER = [
  'رياض الأطفال',
  'الصف 1',
  'الصف 2',
  'الصف 3',
  'الصف 4',
  'الصف 5',
  'الصف 6',
  'الصف 7',
  'الصف 8',
  'الصف 9',
  'الصف 10',
  'الصف 11',
  'الصف 12',
];

function rootDir() {
  return process.cwd();
}

export function productionRoot() {
  return path.join(rootDir(), 'library', 'jordan-book-production');
}

function ensureDirs() {
  for (const dir of [
    productionRoot(),
    path.join(productionRoot(), 'queue'),
    path.join(productionRoot(), 'reviews'),
    path.join(productionRoot(), 'book-logs'),
    path.join(productionRoot(), 'dashboards'),
    path.join(productionRoot(), 'reports'),
    path.join(productionRoot(), 'subjects'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
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

function list(v) {
  return Array.isArray(v) ? v : [];
}

function text(v) {
  return String(v || '').trim();
}

function gradeRank(grade) {
  const i = GRADE_ORDER.indexOf(grade);
  return i < 0 ? 500 : i;
}

function subjectRank(subject) {
  const i = SUBJECT_PRODUCTION_ORDER.indexOf(subject);
  return i < 0 ? 500 + text(subject).localeCompare('أ', 'ar') : i;
}

function statePath() {
  return path.join(productionRoot(), 'state.json');
}

export function readProductionState() {
  return (
    readJson(statePath()) || {
      schema: 'success-os.jordan-book-production-state.v1',
      phase: PHASE,
      currentSubject: null,
      subjectLock: null,
      completedBookIds: [],
      publishedBookIds: [],
      rejectedBookIds: [],
      updatedAt: null,
    }
  );
}

function writeProductionState(state) {
  ensureDirs();
  const next = { ...state, updatedAt: new Date().toISOString() };
  writeJson(statePath(), next);
  return next;
}

function loadKnowledgeSubjectFile(subjectFileRel) {
  const abs = path.join(rootDir(), subjectFileRel);
  return readJson(abs);
}

/**
 * Build production queue: subject-major, then grade.
 * Never includes international curricula.
 */
export function buildJordanProductionQueue() {
  const db = readJordanKnowledgeDatabase();
  if (!db?.subjects?.length) {
    throw new Error('JO_01_KNOWLEDGE_DB_MISSING');
  }

  const jobs = [];
  for (const row of db.subjects) {
    if (isExcludedInternationalLabel(`${row.stage} ${row.subject}`)) continue;
    const knowledge = loadKnowledgeSubjectFile(row.subjectFile);
    if (!knowledge?.units?.length) continue;

    const identity = {
      country: 'Jordan',
      educationalSystem: row.stage,
      curriculumType: 'national',
      curriculum: 'Jordan National Curriculum',
      authority: 'Jordan Ministry of Education / NCCD',
      stage: row.stage,
      grade: row.grade,
      subject: row.subject,
      language: 'ar',
    };
    const bookId = bookIdFromIdentity(identity);
    jobs.push({
      key: row.key,
      subject: row.subject,
      grade: row.grade,
      stage: row.stage,
      bookId,
      identity,
      subjectFile: row.subjectFile,
      unitCount: row.unitCount,
      lessonCount: row.lessonCount,
      knowledgeVerificationPercent: row.verificationPercent,
    });
  }

  jobs.sort((a, b) => {
    const s = subjectRank(a.subject) - subjectRank(b.subject);
    if (s !== 0) return s;
    const g = gradeRank(a.grade) - gradeRank(b.grade);
    if (g !== 0) return g;
    return text(a.stage).localeCompare(text(b.stage), 'ar');
  });

  return jobs;
}

function isScaffoldText(body) {
  const t = text(body);
  if (t.length < MIN_FULL_LESSON_CHARS) return true;
  return SCAFFOLD_FINGERPRINTS.some((fp) => t.includes(fp));
}

function qualityCheckJordanLesson(lesson, identity) {
  const warnings = [];
  const full = text(lesson.fullLesson || lesson.stepByStepExplanation);
  const summary = text(lesson.lessonSummary || lesson.summary);

  if (full.length < MIN_FULL_LESSON_CHARS) warnings.push('FULL_LESSON_TOO_SHORT');
  if (summary.length < 40) warnings.push('SUMMARY_TOO_SHORT');
  if (isScaffoldText(full)) warnings.push('SCAFFOLD_OR_GENERIC_PROSE');
  if (list(lesson.references).length < 2) warnings.push('MISSING_REFERENCES');
  if (!list(lesson.learningOutcomes).length) warnings.push('MISSING_OUTCOMES');
  if (!list(lesson.definitions).length && !list(lesson.scientificTerms).length) {
    warnings.push('MISSING_DEFINITIONS');
  }
  if (!list(lesson.diagrams).length && !list(lesson.illustrations).length) {
    warnings.push('MISSING_DIAGRAMS');
  }
  if (!list(lesson.workedExamples).length) warnings.push('MISSING_EXAMPLES');
  if (!lesson.jo02?.knowledgeReferenced) warnings.push('KNOWLEDGE_NOT_REFERENCED');

  const blob = `${full}\n${summary}\n${lesson.title}`;
  for (const label of JO_EXCLUDED_CURRICULA) {
    const escaped = String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern =
      label.length <= 3
        ? new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?=[^\\p{L}\\p{N}]|$)`, 'iu')
        : new RegExp(escaped, 'iu');
    if (pattern.test(blob)) {
      warnings.push(`INTERNATIONAL_BLEED:${label}`);
    }
  }
  if (!blob.includes('الأردن') && !blob.includes('Jordan') && !blob.includes('المنهاج الوطني')) {
    warnings.push('MISSING_JORDAN_CURRICULUM_SIGNAL');
  }
  if (identity.subject && !blob.includes(identity.subject)) {
    warnings.push('SUBJECT_MISMATCH_SIGNAL');
  }
  if (identity.grade && !blob.includes(identity.grade)) {
    warnings.push('GRADE_MISMATCH_SIGNAL');
  }

  const passed = warnings.length === 0;
  return { passed, warnings };
}

function scoreBook(lessons, rejected) {
  const total = lessons.length || 1;
  const ok = total - rejected;
  const base = (ok / total) * 100;
  const avgLen =
    lessons.reduce((n, l) => n + text(l.fullLesson).length, 0) / total;
  const lengthBonus = avgLen >= MIN_FULL_LESSON_CHARS ? 0 : -5;
  return Math.max(0, Math.min(100, Math.round(base + lengthBonus)));
}

function buildGlossary(units) {
  const map = new Map();
  for (const unit of units) {
    for (const lesson of list(unit.lessons)) {
      for (const d of list(lesson.definitions).concat(list(lesson.scientificTerms))) {
        const term = text(d.term);
        if (!term || map.has(term)) continue;
        map.set(term, d.definition || d.definitionAr || '');
      }
    }
  }
  return [...map.entries()].map(([term, definition]) => ({ term, definition }));
}

function verifyInternalLinks(book) {
  const issues = [];
  const unitIds = new Set(list(book.units).map((u) => u.id || u.unitId));
  for (const unit of list(book.units)) {
    for (const lesson of list(unit.lessons)) {
      const link = lesson.internalLinks || {};
      if (link.bookId && link.bookId !== book.id) issues.push(`BOOK_ID_MISMATCH:${lesson.id}`);
      if (link.unitId && !unitIds.has(link.unitId) && link.unitId !== (unit.id || unit.unitId)) {
        issues.push(`UNIT_LINK_BROKEN:${lesson.id}`);
      }
      if (!link.lessonId && !lesson.id) issues.push(`LESSON_ID_MISSING`);
    }
  }
  return { ok: issues.length === 0, issues };
}

/**
 * Produce one Jordan national book from JO-01 knowledge node.
 */
export function produceJordanBook(job, options = {}) {
  ensureDirs();
  assertJordanBookGenerationAllowed({ bookId: job.bookId, action: 'jo02-produce' });
  assertJordanReferenceLibraryReady({ bookId: job.bookId, action: 'jo02-produce' });

  if (isExcludedInternationalLabel(job.subject) || !isJordanNationalBookId(job.bookId)) {
    return {
      ok: false,
      error: 'JO_02_INTERNATIONAL_EXCLUDED',
      bookId: job.bookId,
    };
  }

  const knowledge = loadKnowledgeSubjectFile(job.subjectFile);
  if (!knowledge?.units?.length) {
    return { ok: false, error: 'KNOWLEDGE_NODE_MISSING', bookId: job.bookId };
  }

  const identity = job.identity;
  let lessonsCompleted = 0;
  let lessonsRejected = 0;
  const lessonWarnings = [];
  const sourcesUsed = new Set();

  const units = list(knowledge.units).map((kUnit) => {
    const unitId = kUnit.unitId || kUnit.id;
    const unitTitle = kUnit.titleAr || kUnit.title;
    const lessons = list(kUnit.lessons).map((kLesson) => {
      let authored = null;
      let qa = { passed: false, warnings: ['NOT_AUTHORED'] };
      const maxAttempts = options.maxAttempts || 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        authored = authorJordanLesson({
          identity,
          bookId: job.bookId,
          unit: { id: unitId, unitId, title: unitTitle, titleAr: unitTitle },
          knowledgeLesson: kLesson,
          attempt,
        });
        qa = qualityCheckJordanLesson(authored, identity);
        if (qa.passed) break;
      }

      for (const ref of list(authored?.references)) {
        if (ref.url) sourcesUsed.add(`${ref.name}|${ref.url}`);
      }

      if (!qa.passed) {
        lessonsRejected += 1;
        lessonWarnings.push({
          unitId,
          lessonId: kLesson.lessonId,
          warnings: qa.warnings,
        });
        return {
          ...authored,
          adminReview: {
            status: 'REJECTED',
            warnings: qa.warnings,
            updatedAt: new Date().toISOString(),
          },
        };
      }

      lessonsCompleted += 1;
      return {
        ...authored,
        adminReview: {
          status: 'APPROVED_BY_QA',
          warnings: [],
          updatedAt: new Date().toISOString(),
        },
      };
    });

    return {
      id: unitId,
      unitId,
      title: unitTitle,
      titleAr: unitTitle,
      lessons,
    };
  });

  const allLessons = units.flatMap((u) => list(u.lessons));
  const qualityScore = scoreBook(allLessons, lessonsRejected);
  const glossary = buildGlossary(units);
  const toc = units.map((u) => ({
    unitId: u.id,
    title: u.title,
    lessons: list(u.lessons).map((l) => ({ lessonId: l.id, title: l.title })),
  }));

  // JO-03: never auto-publish. Production writes PENDING verification only.
  const publishReady = false;
  const productionReady =
    lessonsRejected === 0 &&
    qualityScore >= MIN_QUALITY_SCORE &&
    allLessons.length > 0;

  const book = {
    schema: 'success-os.digital-book.v1',
    id: job.bookId,
    designation: 'Success OS Digital Book',
    governmentApprovalClaim: false,
    identity,
    cover: {
      title: `Success OS — ${identity.subject}`,
      subtitle: `${identity.curriculum} · ${identity.grade}`,
      country: 'Jordan',
      educationalSystem: identity.educationalSystem,
      curriculum: identity.curriculum,
      grade: identity.grade,
      subject: identity.subject,
      badge: productionReady
        ? 'JO-02 — produced · awaiting JO-03 verification + Admin'
        : 'JO-02 — pending quality repair',
    },
    tableOfContents: toc,
    units,
    bookIntroduction: `كتاب Success OS الرقمي لمادة ${identity.subject} — ${identity.grade} — المملكة الأردنية الهاشمية. مبني على قاعدة المعرفة الوطنية (JO-01) ومحاذٍ للمنهاج الوطني الأردني (وزارة التربية / NCCD / درسك). المحتوى أصلي بالكامل دون نسخ الكتب المدرسية المحمية.`,
    learningObjectives: allLessons.flatMap((l) => list(l.learningOutcomes)),
    glossary,
    references: [...sourcesUsed].map((entry) => {
      const [name, url] = entry.split('|');
      return { name, url, usage: 'jo-02-production' };
    }),
    jo02: {
      phase: PHASE,
      engineVersion: ENGINE_VERSION,
      producedAt: new Date().toISOString(),
      knowledgeKey: job.key,
      knowledgeFile: job.subjectFile,
      lessonsCompleted,
      lessonsRejected,
      lessonsExpected: job.lessonCount,
      unitsExpected: job.unitCount,
      qualityScore,
      sourcesUsed: [...sourcesUsed],
      hierarchy: [
        'Jordan',
        identity.educationalSystem,
        identity.grade,
        identity.subject,
        job.bookId,
      ],
    },
    contentPolicy: {
      phase: PHASE,
      jordanNationalOnly: true,
      internationalExcluded: JO_EXCLUDED_CURRICULA,
      copyBookText: false,
      knowledgeReferencedBeforeAuthoring: true,
      requiresJo03Verification: true,
      requiresAdminApproval: true,
    },
    publication: {
      studentPortalVisible: false,
      libraryPermanent: true,
      adminPreviewImmediate: true,
      status: productionReady
        ? 'PENDING_JO03_VERIFICATION'
        : 'QA_FAILED_PENDING_REPAIR',
      reason: productionReady
        ? 'JO-02 complete — JO-03 curriculum verification + Admin approval required before publish'
        : 'JO-02 QA rejected one or more lessons — repair required',
      publishedAt: null,
    },
    quality: {
      bookStatus: productionReady ? 'JO02_PRODUCED_PENDING_JO03' : 'JO02_NEEDS_REPAIR',
      qualityScore,
      lessonsCompleted,
      lessonsRejected,
      phase: PHASE,
    },
    updatedAt: new Date().toISOString(),
  };

  const links = verifyInternalLinks(book);
  book.quality.internalLinksOk = links.ok;
  book.quality.internalLinkIssues = links.issues;
  if (!links.ok) {
    book.publication.studentPortalVisible = false;
    book.publication.status = 'LINK_CHECK_FAILED';
    book.quality.bookStatus = 'JO02_NEEDS_REPAIR';
  }

  const opensCorrectly =
    Boolean(book.id) &&
    list(book.units).length > 0 &&
    list(book.tableOfContents).length === list(book.units).length &&
    allLessons.every((l) => text(l.fullLesson).length >= MIN_FULL_LESSON_CHARS);
  book.quality.bookOpensCorrectly = opensCorrectly;
  if (!opensCorrectly) {
    book.publication.studentPortalVisible = false;
    book.publication.status = 'OPEN_CHECK_FAILED';
  }

  const finalPublish = false; // JO-03 + Admin only
  const producedOk = productionReady && links.ok && opensCorrectly;

  const saved = saveLibraryBook(book);

  const review = {
    schema: 'success-os.jordan-book-admin-review.v1',
    phase: PHASE,
    bookId: saved.id,
    identity,
    researchProgress: 100,
    contentProgress: Math.round((lessonsCompleted / Math.max(1, allLessons.length)) * 100),
    unitsCompleted: units.length,
    unitsExpected: job.unitCount,
    lessonsCompleted,
    lessonsExpected: job.lessonCount,
    lessonsMissing: Math.max(0, (job.lessonCount || allLessons.length) - lessonsCompleted),
    qualityScore: book.quality.qualityScore,
    missingLessons: lessonWarnings.map((w) => w.lessonId),
    verificationStatus: producedOk ? 'produced-pending-jo03' : 'needs-repair',
    publishStatus: book.publication.status,
    contentWarnings: lessonWarnings,
    internalLinksOk: links.ok,
    bookOpensCorrectly: opensCorrectly,
    lastUpdate: saved.updatedAt,
  };

  writeJson(path.join(productionRoot(), 'reviews', `${saved.id}.json`), review);
  writeJson(path.join(productionRoot(), 'book-logs', `${saved.id}.json`), {
    bookId: saved.id,
    subject: identity.subject,
    grade: identity.grade,
    producedAt: saved.updatedAt,
    lessonsCompleted,
    lessonsRejected,
    qualityScore: book.quality.qualityScore,
    publishStatus: book.publication.status,
  });

  return {
    ok: true,
    bookId: saved.id,
    lessonsCompleted,
    lessonsRejected,
    qualityScore: book.quality.qualityScore,
    publishStatus: book.publication.status,
    published: finalPublish,
    producedOk,
    review,
  };
}

function subjectJobs(queue, subject) {
  return queue.filter((j) => j.subject === subject);
}

function isBookDone(bookId, state) {
  return (
    state.publishedBookIds.includes(bookId) ||
    state.completedBookIds.includes(bookId)
  );
}

function bookAlreadyProducedOk(bookId) {
  const book = loadLibraryBook(bookId);
  if (!book?.jo02?.producedAt) return false;
  if ((book.jo02?.lessonsRejected || 0) > 0) return false;
  if ((book.quality?.qualityScore || book.jo02?.qualityScore || 0) < MIN_QUALITY_SCORE) {
    return false;
  }
  // Produced for JO-03 pipeline (not necessarily student-published)
  const status = book.publication?.status;
  return [
    'PUBLISHED',
    'PENDING_JO03_VERIFICATION',
    'PENDING_ADMIN_APPROVAL',
    'VERIFIED_PENDING_ADMIN',
    'AWAITING_ADMIN_APPROVAL',
  ].includes(status) || Boolean(book.jo03?.verifiedAt);
}

/**
 * Produce the next book in the locked subject queue (one at a time).
 */
export function produceNextJordanBook(options = {}) {
  ensureDirs();
  assertJordanBookGenerationAllowed({ action: 'jo02-produce-next' });

  const queue = buildJordanProductionQueue();
  writeJson(path.join(productionRoot(), 'queue', 'latest.json'), {
    schema: 'success-os.jordan-production-queue.v1',
    phase: PHASE,
    totalJobs: queue.length,
    subjects: [...new Set(queue.map((j) => j.subject))],
    jobs: queue.map((j) => ({
      bookId: j.bookId,
      subject: j.subject,
      grade: j.grade,
      stage: j.stage,
    })),
    builtAt: new Date().toISOString(),
  });

  let state = readProductionState();

  // Determine current subject lock
  let currentSubject = options.subject || state.subjectLock || state.currentSubject;
  if (!currentSubject) {
    currentSubject = queue[0]?.subject || null;
  }
  if (!currentSubject) {
    return { ok: false, error: 'EMPTY_QUEUE' };
  }

  // Enforce single-subject lock
  if (state.subjectLock && options.subject && options.subject !== state.subjectLock) {
    const remaining = subjectJobs(queue, state.subjectLock).filter(
      (j) => !isBookDone(j.bookId, state) && !bookAlreadyProducedOk(j.bookId),
    );
    if (remaining.length) {
      return {
        ok: false,
        error: 'SUBJECT_LOCK_ACTIVE',
        subjectLock: state.subjectLock,
        remainingInSubject: remaining.length,
        note: 'Complete the locked subject before starting another.',
      };
    }
  }

  state = writeProductionState({
    ...state,
    currentSubject,
    subjectLock: currentSubject,
  });

  const jobs = subjectJobs(queue, currentSubject);
  const pending = jobs.filter((j) => !bookAlreadyProducedOk(j.bookId));
  const target = options.bookId
    ? jobs.find((j) => j.bookId === options.bookId)
    : pending[0];

  if (!target || (options.bookId && bookAlreadyProducedOk(target.bookId) && !options.force)) {
    if (!pending.length || (options.bookId && bookAlreadyProducedOk(options.bookId))) {
      const nextSubjectJob = queue.find(
        (j) => j.subject !== currentSubject && !bookAlreadyProducedOk(j.bookId),
      );
      const nextSubject = nextSubjectJob?.subject || null;
      state = writeProductionState({
        ...state,
        currentSubject: options.advance === false ? currentSubject : nextSubject,
        subjectLock: options.advance === false ? currentSubject : nextSubject,
      });
      const dashboard = buildJordanProductionDashboard();
      return {
        ok: true,
        subjectComplete: true,
        subject: currentSubject,
        nextSubject: state.subjectLock,
        dashboard,
      };
    }
  }

  if (!target) {
    return { ok: false, error: 'NO_TARGET_BOOK', subject: currentSubject };
  }

  const result = produceJordanBook(target, options);
  if (!result.ok) return result;

  const completedBookIds = [...new Set([...(state.completedBookIds || []), result.bookId])];
  const publishedBookIds = result.published
    ? [...new Set([...(state.publishedBookIds || []), result.bookId])]
    : state.publishedBookIds || [];
  const rejectedBookIds = result.lessonsRejected
    ? [...new Set([...(state.rejectedBookIds || []), result.bookId])]
    : (state.rejectedBookIds || []).filter((id) => id !== result.bookId);

  const stillPending = jobs.filter((j) => {
    if (j.bookId === result.bookId) return !result.published;
    return !bookAlreadyProducedOk(j.bookId) && !publishedBookIds.includes(j.bookId);
  });

  let nextSubject = currentSubject;
  let subjectLock = currentSubject;
  let subjectComplete = false;
  if (!stillPending.length && result.published) {
    subjectComplete = true;
    const advanceTo = queue.find((j) => j.subject !== currentSubject && !bookAlreadyProducedOk(j.bookId))
      ?.subject;
    if (options.advance !== false) {
      nextSubject = advanceTo || null;
      subjectLock = advanceTo || null;
    }
  }

  state = writeProductionState({
    ...state,
    currentSubject: nextSubject,
    subjectLock,
    completedBookIds,
    publishedBookIds,
    rejectedBookIds,
    lastBookId: result.bookId,
    lastSubject: currentSubject,
  });

  writeJson(
    path.join(productionRoot(), 'subjects', `${currentSubject.replace(/[\\/:*?"<>|]/g, '-')}.json`),
    {
      subject: currentSubject,
      totalGrades: jobs.length,
      published: jobs.filter((j) => publishedBookIds.includes(j.bookId) || bookAlreadyProducedOk(j.bookId))
        .length,
      pending: stillPending.length,
      complete: subjectComplete,
      bookIds: jobs.map((j) => j.bookId),
      updatedAt: new Date().toISOString(),
    },
  );

  if (result.published) {
    try {
      rebuildMiddleEastLiveBookIndex();
    } catch {
      /* index rebuild best-effort */
    }
  }

  const dashboard = buildJordanProductionDashboard();
  writeJson(path.join(productionRoot(), 'dashboards', 'latest.json'), dashboard);

  return {
    ...result,
    subject: currentSubject,
    subjectComplete,
    remainingInSubject: stillPending.length,
    nextSubject: subjectLock,
    dashboard,
  };
}

/**
 * Produce entire current subject (all grades) sequentially.
 */
export function produceJordanSubject(subject, options = {}) {
  ensureDirs();
  const queue = buildJordanProductionQueue();
  const jobs = subjectJobs(queue, subject);
  if (!jobs.length) return { ok: false, error: 'SUBJECT_NOT_IN_QUEUE', subject };

  writeProductionState({
    ...readProductionState(),
    currentSubject: subject,
    subjectLock: subject,
  });

  const results = [];
  for (const job of jobs) {
    if (bookAlreadyProducedOk(job.bookId) && !options.force) {
      results.push({ ok: true, bookId: job.bookId, skipped: true, reason: 'ALREADY_PUBLISHED' });
      continue;
    }
    const result = produceJordanBook(job, options);
    results.push(result);
    const state = readProductionState();
    writeProductionState({
      ...state,
      completedBookIds: [...new Set([...(state.completedBookIds || []), result.bookId].filter(Boolean))],
      publishedBookIds: result.published
        ? [...new Set([...(state.publishedBookIds || []), result.bookId])]
        : state.publishedBookIds,
      lastBookId: result.bookId,
      lastSubject: subject,
    });
    if (!result.ok || (result.lessonsRejected > 0 && options.stopOnReject !== false)) {
      break;
    }
  }

  const published = results.filter((r) => r.published || r.skipped).length;
  const subjectComplete = published >= jobs.length && results.every((r) => r.ok !== false || r.skipped);
  if (subjectComplete) {
    const nextSubject = queue.find((j) => j.subject !== subject)?.subject || null;
    writeProductionState({
      ...readProductionState(),
      currentSubject: nextSubject,
      subjectLock: nextSubject,
    });
  }

  try {
    rebuildMiddleEastLiveBookIndex();
  } catch {
    /* ignore */
  }

  const dashboard = buildJordanProductionDashboard();
  writeJson(path.join(productionRoot(), 'dashboards', 'latest.json'), dashboard);
  writeJson(path.join(productionRoot(), 'reports', `subject-${Date.now()}.json`), {
    subject,
    results,
    subjectComplete,
    dashboard,
  });

  return {
    ok: true,
    subject,
    subjectComplete,
    booksAttempted: results.length,
    booksPublished: results.filter((r) => r.published || r.skipped).length,
    results,
    dashboard,
  };
}

export function buildJordanProductionDashboard() {
  ensureDirs();
  const queue = (() => {
    try {
      return buildJordanProductionQueue();
    } catch {
      return [];
    }
  })();
  const state = readProductionState();
  const jo01 = readJordanKnowledgeStatus();

  const subjects = [...new Set(queue.map((j) => j.subject))];
  const subjectRows = subjects.map((subject) => {
    const jobs = subjectJobs(queue, subject);
    const reviews = jobs.map((j) => {
      const review = readJson(path.join(productionRoot(), 'reviews', `${j.bookId}.json`));
      const book = loadLibraryBook(j.bookId);
      return { job: j, review, book };
    });
    const unitsCompleted = reviews.reduce(
      (n, r) => n + (r.review?.unitsCompleted || list(r.book?.units).length || 0),
      0,
    );
    const lessonsCompleted = reviews.reduce(
      (n, r) => n + (r.review?.lessonsCompleted || 0),
      0,
    );
    const lessonsExpected = jobs.reduce((n, j) => n + (j.lessonCount || 0), 0);
    const published = reviews.filter(
      (r) =>
        r.book?.publication?.status === 'PUBLISHED' ||
        state.publishedBookIds.includes(r.job.bookId),
    ).length;
    const qualityScores = reviews
      .map((r) => r.review?.qualityScore || r.book?.quality?.qualityScore)
      .filter((x) => typeof x === 'number');
    const avgQuality = qualityScores.length
      ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
      : 0;
    const missingLessons = reviews.flatMap((r) => list(r.review?.missingLessons));
    const contentProgress = lessonsExpected
      ? Math.round((lessonsCompleted / lessonsExpected) * 100)
      : 0;

    return {
      subject,
      grades: jobs.length,
      researchProgress: 100,
      contentProgress,
      unitsCompleted,
      lessonsCompleted,
      lessonsExpected,
      qualityScore: avgQuality,
      missingLessons,
      verificationStatus:
        published === jobs.length && jobs.length
          ? 'subject-complete'
          : published
            ? 'in-progress'
            : 'not-started',
      publishStatus: `${published}/${jobs.length} published`,
      published,
      locked: state.subjectLock === subject,
    };
  });

  return {
    schema: 'success-os.jordan-book-production-dashboard.v1',
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    jo01Gate: {
      verifiedCompletionPercent: jo01?.verification?.verifiedCompletionPercent ?? 0,
      bookGenerationAllowed: jo01?.bookGenerationAllowed === true,
    },
    state: {
      currentSubject: state.currentSubject,
      subjectLock: state.subjectLock,
      publishedBooks: state.publishedBookIds?.length || 0,
      completedBooks: state.completedBookIds?.length || 0,
    },
    totals: {
      queueBooks: queue.length,
      subjects: subjects.length,
      publishedBooks: state.publishedBookIds?.length || 0,
    },
    subjects: subjectRows,
    excludeInternational: JO_EXCLUDED_CURRICULA,
    updatedAt: new Date().toISOString(),
  };
}

export function runJordanBookProduction(options = {}) {
  if (options.dashboardOnly) {
    return { dashboard: buildJordanProductionDashboard() };
  }
  if (options.subject) {
    return produceJordanSubject(options.subject, options);
  }
  if (options.allSubjects) {
    const queue = buildJordanProductionQueue();
    const subjects = [...new Set(queue.map((j) => j.subject))];
    const results = [];
    for (const subject of subjects) {
      const result = produceJordanSubject(subject, options);
      results.push(result);
      if (!result.subjectComplete && options.stopOnIncomplete !== false) break;
    }
    return { ok: true, subjectsProcessed: results.length, results };
  }
  return produceNextJordanBook(options);
}
