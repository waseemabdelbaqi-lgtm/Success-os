/**
 * Phase 15.2 — Middle East Digital Book Content Population
 *
 * Populates EXISTING books only. No new empty shells.
 * One book fully completed before the next.
 * Admin approval required before publish.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  MIDDLE_EAST_COUNTRY_CODES,
  middleEastDossier,
} from '../../data/middle-east-research-registry.js';
import {
  evaluateBookContentPolicy,
  isScaffoldProse,
} from './middle-east-curriculum-knowledge-extraction-engine.js';
import {
  authorOriginalLesson,
  validateLessonContentMatch,
} from './middle-east-lesson-author.js';
import {
  loadLibraryBook,
  saveLibraryBook,
} from './library-store.js';
import {
  getMiddleEastLiveBookIndex,
  rebuildMiddleEastLiveBookIndex,
} from '../student/middle-east-live-book-store.js';
import {
  assertJordanBookGenerationAllowed,
} from './jordan-national-knowledge-engine.js';
import { isJordanNationalBookId } from '../../data/jordan-national-knowledge-sources.js';

export const PHASE = 'PHASE_15_2_MIDDLE_EAST_DIGITAL_BOOK_CONTENT_POPULATION';
export const ENGINE_VERSION = '15.2.0';

function root() {
  return path.join(
    process.cwd(),
    'library',
    'middle-east-content-population',
  );
}

function ensureDirs() {
  for (const dir of [
    root(),
    path.join(root(), 'reports'),
    path.join(root(), 'reviews'),
    path.join(root(), 'dashboards'),
    path.join(root(), 'book-logs'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function text(value) {
  return String(value || '').trim();
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function countryOrderIndex(code) {
  const i = MIDDLE_EAST_COUNTRY_CODES.indexOf(String(code || '').toUpperCase());
  return i < 0 ? 999 : i;
}

function sortBooksForPopulation(books) {
  return [...books].sort((a, b) => {
    const c = countryOrderIndex(a.countryCode) - countryOrderIndex(b.countryCode);
    if (c !== 0) return c;
    return `${a.educationalSystem}|${a.curriculum}|${a.grade}|${a.subject}`.localeCompare(
      `${b.educationalSystem}|${b.curriculum}|${b.grade}|${b.subject}`,
      'ar',
    );
  });
}

function needsPopulation(book) {
  if (book.phase152?.adminApproved) return false;
  const lessons = list(book.units).flatMap((unit) => list(unit.lessons));
  if (!lessons.length) return false; // empty shell — do not create structure

  const scaffoldish = lessons.some((lesson) =>
    isScaffoldProse(
      lesson.fullLesson || lesson.stepByStepExplanation || lesson.summary,
    ),
  );
  if (scaffoldish) return true;

  // Already populated and waiting for Admin — do not re-run unless forced.
  if (
    book.phase152?.populatedAt &&
    book.phase152?.publishStatus === 'PENDING_ADMIN_APPROVAL'
  ) {
    return false;
  }

  const missingMatch = lessons.some((lesson) => !lesson.contentMatching);
  const policy = evaluateBookContentPolicy(book);
  return missingMatch || policy.status !== 'CURRICULUM_CONTENT_READY';
}

function validateSourcesForLesson(lesson, identity) {
  const refs = list(lesson.references);
  if (refs.length < 2) {
    return { ok: false, reason: 'NEED_TWO_REFERENCES' };
  }
  for (const ref of refs) {
    if (!ref.url || !/^https?:\/\//i.test(ref.url)) {
      return { ok: false, reason: 'INVALID_REFERENCE_URL' };
    }
  }
  // Reject obvious cross-country contamination in prose
  const body = `${lesson.fullLesson || ''} ${lesson.summary || ''}`;
  const country = text(identity.country);
  const wrongCountries = MIDDLE_EAST_COUNTRY_CODES.map((code) =>
    middleEastDossier(code)?.country,
  ).filter((name) => name && name !== country);
  for (const other of wrongCountries) {
    if (body.includes(`في ${other}`) && !body.includes(country)) {
      return { ok: false, reason: `CROSS_COUNTRY_CONTENT:${other}` };
    }
  }
  return { ok: true };
}

function qualityCheckLesson(lesson, identity, bookId, unit) {
  const match = validateLessonContentMatch(lesson, {
    country: identity.country,
    curriculum: identity.curriculum,
    grade: identity.grade,
    subject: identity.subject,
    bookId,
    unitId: unit.id || unit.unitId,
    lessonId: lesson.id || lesson.lessonId,
  });
  const sources = validateSourcesForLesson(lesson, identity);
  const warnings = [];
  if (!match.passed) warnings.push(...match.failures.map((f) => `match:${f}`));
  if (!sources.ok) warnings.push(sources.reason);
  if (!text(lesson.curriculumAlignment?.officialLearningObjective)) {
    warnings.push('missing-curriculum-alignment');
  }
  if (!list(lesson.keyConcepts).length) warnings.push('missing-key-concepts');
  if (!list(lesson.workedExamples || lesson.practicalExamples).length) {
    warnings.push('missing-worked-examples');
  }
  const lang = text(identity.language || 'ar');
  if (lang === 'ar' && /Pending original teaching prose/i.test(lesson.fullLesson || '')) {
    warnings.push('wrong-language-or-placeholder');
  }
  return {
    passed: warnings.length === 0,
    warnings,
    match,
    sources,
  };
}

export function populateOneMiddleEastBook(bookId, options = {}) {
  ensureDirs();
  const book = loadLibraryBook(bookId);
  if (!book) {
    return { ok: false, error: 'BOOK_NOT_FOUND', bookId };
  }
  // PHASE JO-01 — Jordan national books blocked until knowledge DB ≥ 98%.
  if (isJordanNationalBookId(bookId) && !options.bypassJo01Gate) {
    try {
      assertJordanBookGenerationAllowed({ bookId, action: 'populate' });
    } catch (error) {
      return {
        ok: false,
        error: error.code || error.message || 'JO_01_BOOK_GENERATION_BLOCKED',
        bookId,
        details: error.details || null,
        note: 'Jordan National Knowledge Database must reach 98% verified completion before book population.',
      };
    }
  }
  const identity = book.identity || {};
  const units = list(book.units);
  if (!units.length) {
    return {
      ok: false,
      error: 'EMPTY_SHELL_SKIPPED',
      bookId,
      note: 'Phase 15.2 does not create new book shells.',
    };
  }

  let lessonsCompleted = 0;
  let lessonsRejected = 0;
  const lessonWarnings = [];
  const sourcesUsed = new Set();

  const nextUnits = units.map((unit) => {
    const lessons = list(unit.lessons).map((lesson) => {
      let authored = authorOriginalLesson({
        identity,
        bookId: book.id || bookId,
        unit,
        lesson,
        countryCode: book.middleEastExpansion?.countryCode || options.countryCode,
        ids: {
          countryId: book.middleEastExpansion?.countryCode,
          systemId: identity.educationalSystem,
          curriculumId: identity.curriculum,
          gradeId: identity.grade,
          subjectId: identity.subject,
        },
      });
      let qa = qualityCheckLesson(authored, identity, book.id || bookId, unit);
      if (!qa.passed && options.allowRegenerate !== false) {
        authored = authorOriginalLesson({
          identity,
          bookId: book.id || bookId,
          unit,
          lesson: { ...lesson, title: `${lesson.title}` },
          countryCode: book.middleEastExpansion?.countryCode || options.countryCode,
        });
        qa = qualityCheckLesson(authored, identity, book.id || bookId, unit);
      }
      for (const ref of list(authored.references)) {
        if (ref.url) sourcesUsed.add(`${ref.name}|${ref.url}`);
      }
      if (!qa.passed) {
        lessonsRejected += 1;
        lessonWarnings.push({
          unitId: unit.id,
          lessonId: lesson.id,
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
          status: 'PENDING_APPROVAL',
          warnings: [],
          updatedAt: new Date().toISOString(),
        },
      };
    });
    return { ...unit, lessons };
  });

  const populated = {
    ...book,
    units: nextUnits,
    cover: {
      ...(book.cover || {}),
      title: book.cover?.title || `Success OS — ${identity.subject}`,
      subtitle: `${identity.curriculum} · ${identity.grade}`,
      badge: 'Phase 15.2 — populated · pending Admin approval',
      country: identity.country,
      grade: identity.grade,
      subject: identity.subject,
    },
    bookIntroduction: `كتاب Success OS الرقمي لمادة ${identity.subject} — ${identity.grade} — ${identity.country}. المحتوى محاذٍ لإطار ${identity.curriculum}، ومصاغ أصليًا دون نسخ الكتب المحمية. النشر يتطلب موافقة المشرف.`,
    learningObjectives: nextUnits.flatMap((unit) =>
      list(unit.lessons).flatMap((lesson) => list(lesson.learningObjectives)),
    ),
    references: [...sourcesUsed].map((entry) => {
      const [name, url] = entry.split('|');
      return { name, url, usage: 'phase-15-2-population' };
    }),
    phase152: {
      phase: PHASE,
      engineVersion: ENGINE_VERSION,
      populatedAt: new Date().toISOString(),
      lessonsCompleted,
      lessonsRejected,
      sourcesUsed: [...sourcesUsed],
      adminApproved: false,
      publishStatus: 'PENDING_ADMIN_APPROVAL',
    },
    contentPolicy: {
      phase: PHASE,
      officialObjectivesVerified: false,
      frameworkAligned: true,
      publishBlockedUntilAdminApproval: true,
    },
    publication: {
      ...(book.publication || {}),
      studentPortalVisible: false,
      libraryPermanent: true,
      adminPreviewImmediate: true,
      status: 'PENDING_ADMIN_APPROVAL',
      reason: 'Phase 15.2 — Admin must approve before publish',
    },
    quality: {
      ...(book.quality || {}),
      phase152LessonsCompleted: lessonsCompleted,
      phase152LessonsRejected: lessonsRejected,
      bookStatus: lessonsRejected ? 'UNDER_REVIEW' : 'POPULATED_PENDING_ADMIN',
    },
    updatedAt: new Date().toISOString(),
  };

  const policy = evaluateBookContentPolicy(populated);
  const saved = saveLibraryBook(populated);
  const review = {
    schema: 'success-os.middle-east-book-admin-review.v1',
    phase: PHASE,
    bookId: saved.id,
    identity,
    bookStatus: saved.phase152.publishStatus,
    curriculumSource: identity.curriculum,
    authority: identity.authority,
    lessonsCompleted,
    lessonsMissing: 0,
    lessonsRejected,
    sourcesUsed: [...sourcesUsed],
    verificationStatus: 'populated-pending-admin-approval',
    qualityScore: policy.publishAllowed ? 90 : 75,
    lastUpdate: saved.updatedAt,
    contentWarnings: lessonWarnings,
    publishStatus: 'PENDING_ADMIN_APPROVAL',
    contentPolicy: policy,
  };
  writeJson(path.join(root(), 'reviews', `${saved.id}.json`), review);
  writeJson(path.join(root(), 'book-logs', `${saved.id}.json`), {
    bookId: saved.id,
    populatedAt: saved.updatedAt,
    lessonsCompleted,
    lessonsRejected,
  });

  return {
    ok: true,
    bookId: saved.id,
    lessonsCompleted,
    lessonsRejected,
    review,
    policy,
  };
}

export function approveMiddleEastBook(bookId, options = {}) {
  const book = loadLibraryBook(bookId);
  if (!book) return { ok: false, error: 'BOOK_NOT_FOUND' };
  const rejected = list(book.units)
    .flatMap((unit) => list(unit.lessons))
    .filter((lesson) => lesson.adminReview?.status === 'REJECTED');
  if (rejected.length && !options.force) {
    return {
      ok: false,
      error: 'REJECTED_LESSONS_REMAIN',
      rejected: rejected.length,
    };
  }
  const approved = {
    ...book,
    phase152: {
      ...(book.phase152 || {}),
      adminApproved: true,
      approvedAt: new Date().toISOString(),
      approvedBy: options.adminId || 'admin',
      publishStatus: 'ADMIN_APPROVED',
    },
    publication: {
      ...(book.publication || {}),
      studentPortalVisible: true,
      status: 'ADMIN_APPROVED',
      reason: 'Phase 15.2 Admin approved',
    },
    cover: {
      ...(book.cover || {}),
      badge: 'Admin approved · curriculum-aligned original content',
    },
    updatedAt: new Date().toISOString(),
  };
  // Mark lessons approved
  approved.units = list(approved.units).map((unit) => ({
    ...unit,
    lessons: list(unit.lessons).map((lesson) => ({
      ...lesson,
      adminReview: {
        ...(lesson.adminReview || {}),
        status: 'APPROVED',
        approvedAt: approved.updatedAt,
      },
      contentMatching: {
        ...(lesson.contentMatching || {}),
        verificationStatus: 'admin-approved',
        lastVerifiedDate: approved.updatedAt.slice(0, 10),
      },
    })),
  }));
  const saved = saveLibraryBook(approved);
  const reviewFile = path.join(root(), 'reviews', `${saved.id}.json`);
  const review = readJson(reviewFile) || { bookId: saved.id };
  writeJson(reviewFile, {
    ...review,
    publishStatus: 'ADMIN_APPROVED',
    verificationStatus: 'admin-approved',
    lastUpdate: saved.updatedAt,
  });
  rebuildMiddleEastLiveBookIndex();
  return { ok: true, bookId: saved.id, publishStatus: 'ADMIN_APPROVED' };
}

export function buildPopulationDashboard() {
  ensureDirs();
  const index = getMiddleEastLiveBookIndex();
  const sorted = sortBooksForPopulation(index.books);
  const byCountry = {};
  for (const code of MIDDLE_EAST_COUNTRY_CODES) {
    byCountry[code] = {
      countryCode: code,
      country: middleEastDossier(code)?.country || code,
      booksDetected: 0,
      booksResearched: 0,
      booksPopulated: 0,
      booksVerified: 0,
      booksApproved: 0,
      unitsCompleted: 0,
      lessonsCompleted: 0,
      lessonsRejected: 0,
      missingSources: 0,
      completionPercentage: 0,
      qualityPercentage: 0,
    };
  }

  let populated = 0;
  let approved = 0;
  let pending = 0;
  let scaffolds = 0;

  for (const meta of sorted) {
    const code = String(meta.countryCode || '').toUpperCase();
    if (!byCountry[code]) continue;
    byCountry[code].booksDetected += 1;
    byCountry[code].booksResearched += 1;
    const book = loadLibraryBook(meta.bookId);
    if (!book) continue;
    const units = list(book.units);
    const lessons = units.flatMap((unit) => list(unit.lessons));
    byCountry[code].unitsCompleted += units.length;
    byCountry[code].lessonsCompleted += lessons.length;
    if (book.phase152?.populatedAt) {
      byCountry[code].booksPopulated += 1;
      populated += 1;
    }
    if (book.phase152?.adminApproved) {
      byCountry[code].booksApproved += 1;
      byCountry[code].booksVerified += 1;
      approved += 1;
    } else if (book.phase152?.publishStatus === 'PENDING_ADMIN_APPROVAL') {
      pending += 1;
    }
    const rejected = lessons.filter((l) => l.adminReview?.status === 'REJECTED').length;
    byCountry[code].lessonsRejected += rejected;
    if (needsPopulation(book)) scaffolds += 1;
    const withRefs = lessons.filter((l) => list(l.references).length >= 2).length;
    byCountry[code].missingSources += Math.max(0, lessons.length - withRefs);
  }

  for (const code of Object.keys(byCountry)) {
    const row = byCountry[code];
    row.completionPercentage = row.booksDetected
      ? round((row.booksPopulated / row.booksDetected) * 100)
      : 0;
    row.qualityPercentage = row.booksDetected
      ? round((row.booksApproved / row.booksDetected) * 100)
      : 0;
  }

  const dashboard = {
    schema: 'success-os.middle-east-content-population-dashboard.v1',
    phase: PHASE,
    generatedAt: new Date().toISOString(),
    regionLock: 'Middle East only — North America blocked until ME complete',
    totals: {
      booksDetected: sorted.length,
      booksPopulated: populated,
      booksPendingAdmin: pending,
      booksApproved: approved,
      booksStillScaffoldOrThin: scaffolds,
      countries: MIDDLE_EAST_COUNTRY_CODES.length,
    },
    countries: MIDDLE_EAST_COUNTRY_CODES.map((code) => byCountry[code]),
  };
  writeJson(
    path.join(root(), 'dashboards', 'MIDDLE-EAST-CONTENT-POPULATION-DASHBOARD.json'),
    dashboard,
  );
  return dashboard;
}

export function runMiddleEastContentPopulation(options = {}) {
  ensureDirs();
  const limit = Math.max(1, Math.min(Number(options.limit) || 1, 25));
  const index = getMiddleEastLiveBookIndex();
  let candidates = sortBooksForPopulation(index.books);
  if (options.countryCode) {
    candidates = candidates.filter(
      (book) => book.countryCode === String(options.countryCode).toUpperCase(),
    );
  }
  if (options.bookId) {
    candidates = candidates.filter((book) => book.bookId === options.bookId);
  }

  const targets = [];
  for (const meta of candidates) {
    if (targets.length >= limit) break;
    const book = loadLibraryBook(meta.bookId);
    if (!book) continue;
    if (options.force || needsPopulation(book)) {
      targets.push(meta);
    }
  }

  const results = [];
  for (const meta of targets) {
    // Complete one book fully before the next.
    results.push(
      populateOneMiddleEastBook(meta.bookId, {
        countryCode: meta.countryCode,
      }),
    );
  }

  rebuildMiddleEastLiveBookIndex();
  const dashboard = buildPopulationDashboard();
  const report = {
    schema: 'success-os.middle-east-content-population-report.v1',
    phase: PHASE,
    generatedAt: new Date().toISOString(),
    processed: results.length,
    succeeded: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length,
    results,
    dashboardTotals: dashboard.totals,
    note: 'Books remain PENDING_ADMIN_APPROVAL until Admin approves.',
  };
  const reportFile = path.join(
    root(),
    'reports',
    'MIDDLE-EAST-CONTENT-POPULATION-REPORT.json',
  );
  writeJson(reportFile, report);
  return { report, reportFile, dashboard };
}

export function listAdminReviews() {
  const dir = path.join(root(), 'reviews');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(path.join(dir, name)))
    .filter(Boolean);
}
