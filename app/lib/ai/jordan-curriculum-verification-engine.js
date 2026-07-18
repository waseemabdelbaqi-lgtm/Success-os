/**
 * PHASE JO-03 — Jordan Curriculum Verification Engine
 *
 * No Jordan national book may be published unless:
 * 1) Full curriculum matching against JO-01 knowledge DB
 * 2) Content validation passes (no missing/duplicate/wrong content)
 * 3) Book open/navigation test passes
 * 4) Overall quality score ≥ 98%
 * 5) Admin explicitly approves
 *
 * Never publish simply because a book has pages.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  JO_EXCLUDED_CURRICULA,
  isExcludedInternationalLabel,
  isJordanNationalBookId,
} from '../../data/jordan-national-knowledge-sources.js';
import {
  knowledgeRoot,
  readJordanKnowledgeDatabase,
} from './jordan-national-knowledge-engine.js';
import {
  loadLibraryBook,
  saveLibraryBook,
  listLibraryBooks,
} from './library-store.js';
import { produceJordanBook, buildJordanProductionQueue } from './jordan-book-production-engine.js';
import {
  assertJordanReferenceLibraryReady,
  assertReferencesInLibrary,
} from './jordan-educational-reference-library-engine.js';
import { rebuildMiddleEastLiveBookIndex } from '../student/middle-east-live-book-store.js';
import { SCAFFOLD_FINGERPRINTS } from './middle-east-curriculum-knowledge-extraction-engine.js';

export const PHASE = 'JO-03_JORDAN_CURRICULUM_VERIFICATION';
export const ENGINE_VERSION = '3.0.0';
export const JO03_PUBLISH_GATE = 98;

function rootDir() {
  return process.cwd();
}

export function verificationRoot() {
  return path.join(rootDir(), 'library', 'jordan-curriculum-verification');
}

function ensureDirs() {
  for (const dir of [
    verificationRoot(),
    path.join(verificationRoot(), 'reports'),
    path.join(verificationRoot(), 'reviews'),
    path.join(verificationRoot(), 'comparisons'),
    path.join(verificationRoot(), 'dashboards'),
    path.join(verificationRoot(), 'book-tests'),
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

function norm(v) {
  return text(v)
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function similar(a, b) {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

function outcomeOverlap(bookOutcomes, knowledgeOutcomes) {
  const a = list(bookOutcomes).map(norm).filter(Boolean);
  const b = list(knowledgeOutcomes).map(norm).filter(Boolean);
  if (!b.length) return a.length ? 0.7 : 0;
  if (!a.length) return 0;
  let hits = 0;
  for (const ko of b) {
    if (a.some((bo) => bo.includes(ko.slice(0, 24)) || ko.includes(bo.slice(0, 24)))) {
      hits += 1;
    }
  }
  return hits / b.length;
}

function hasIntlBleed(blob) {
  for (const label of JO_EXCLUDED_CURRICULA) {
    const escaped = String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern =
      label.length <= 3
        ? new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?=[^\\p{L}\\p{N}]|$)`, 'iu')
        : new RegExp(escaped, 'iu');
    if (pattern.test(blob)) return label;
  }
  return null;
}

function isScaffold(body) {
  const t = text(body);
  if (t.length < 400) return true;
  return SCAFFOLD_FINGERPRINTS.some((fp) => t.includes(fp));
}

function loadKnowledgeForBook(book) {
  const identity = book.identity || {};
  const db = readJordanKnowledgeDatabase();
  const row = list(db?.subjects).find(
    (s) =>
      s.grade === identity.grade &&
      s.subject === identity.subject &&
      (s.stage === identity.stage ||
        s.stage === identity.educationalSystem ||
        !identity.stage),
  );
  if (!row?.subjectFile) {
    // fallback: grade+subject only
    const alt = list(db?.subjects).find(
      (s) => s.grade === identity.grade && s.subject === identity.subject,
    );
    if (!alt?.subjectFile) return null;
    return readJson(path.join(rootDir(), alt.subjectFile));
  }
  return readJson(path.join(rootDir(), row.subjectFile));
}

/**
 * Curriculum matching for every lesson against JO-01 knowledge node.
 */
export function matchCurriculum(book, knowledge) {
  const identity = book.identity || {};
  const checks = {
    countryJordan: identity.country === 'Jordan',
    nationalCurriculum:
      identity.curriculum === 'Jordan National Curriculum' ||
      /jordan-national-curriculum/i.test(book.id || ''),
    gradeMatches: Boolean(knowledge?.grade && identity.grade === knowledge.grade),
    subjectMatches: Boolean(knowledge?.subject && identity.subject === knowledge.subject),
    systemNational: !isExcludedInternationalLabel(identity.curriculum),
    notInternationalBook: isJordanNationalBookId(book.id),
  };

  const knowledgeUnits = list(knowledge?.units);
  const bookUnits = list(book.units);
  const lessonResults = [];
  let unitMatches = 0;
  let lessonTitleMatches = 0;
  let outcomeMatches = 0;
  let terminologyOk = 0;
  let difficultyOk = 0;
  let lessonsChecked = 0;

  for (let ui = 0; ui < Math.max(bookUnits.length, knowledgeUnits.length); ui += 1) {
    const bu = bookUnits[ui];
    const ku = knowledgeUnits[ui];
    if (bu && ku && similar(bu.title || bu.titleAr, ku.titleAr || ku.title)) {
      unitMatches += 1;
    }
    const bookLessons = list(bu?.lessons);
    const knowledgeLessons = list(ku?.lessons);
    for (let li = 0; li < Math.max(bookLessons.length, knowledgeLessons.length); li += 1) {
      const bl = bookLessons[li];
      const kl = knowledgeLessons[li];
      if (!bl && kl) {
        lessonResults.push({
          unitIndex: ui,
          lessonIndex: li,
          status: 'MISSING_IN_BOOK',
          knowledgeTitle: kl.titleAr,
        });
        continue;
      }
      if (bl && !kl) {
        lessonResults.push({
          unitIndex: ui,
          lessonIndex: li,
          status: 'EXTRA_IN_BOOK',
          bookTitle: bl.title,
        });
        lessonsChecked += 1;
        continue;
      }
      if (!bl || !kl) continue;
      lessonsChecked += 1;
      const titleOk = similar(bl.title, kl.titleAr || kl.title);
      if (titleOk) lessonTitleMatches += 1;
      const overlap = outcomeOverlap(
        list(bl.learningOutcomes).concat(list(bl.learningObjectives)),
        list(kl.learningOutcomes),
      );
      if (overlap >= 0.5) outcomeMatches += 1;
      const terms = list(kl.scientificConcepts);
      const body = `${bl.fullLesson || ''} ${JSON.stringify(bl.definitions || [])}`;
      const termHits = terms.filter((t) => body.includes(t)).length;
      const termOk = !terms.length || termHits / terms.length >= 0.5;
      if (termOk) terminologyOk += 1;
      const grade = identity.grade || '';
      // Difficulty: content mentions correct grade and is not scaffold-thin
      const difficulty =
        Boolean(grade) &&
        body.includes(grade) &&
        text(bl.fullLesson).length >= 800 &&
        !isScaffold(bl.fullLesson);
      if (difficulty) difficultyOk += 1;

      lessonResults.push({
        unitIndex: ui,
        lessonIndex: li,
        lessonId: bl.id,
        bookTitle: bl.title,
        knowledgeTitle: kl.titleAr,
        titleMatch: titleOk,
        outcomeOverlap: Math.round(overlap * 100) / 100,
        terminologyOk: termOk,
        difficultyOk: difficulty,
        status:
          titleOk && overlap >= 0.5 && termOk && difficulty
            ? 'PASS'
            : 'FAIL',
      });
    }
  }

  const expectedUnits = knowledgeUnits.length || bookUnits.length || 1;
  const expectedLessons = lessonsChecked || 1;
  const score = Math.round(
    ((Number(checks.countryJordan) +
      Number(checks.nationalCurriculum) +
      Number(checks.gradeMatches) +
      Number(checks.subjectMatches) +
      Number(checks.systemNational) +
      Number(checks.notInternationalBook)) /
      6) *
      40 +
      (unitMatches / expectedUnits) * 15 +
      (lessonTitleMatches / expectedLessons) * 15 +
      (outcomeMatches / expectedLessons) * 15 +
      (terminologyOk / expectedLessons) * 10 +
      (difficultyOk / expectedLessons) * 5,
  );

  return {
    checks,
    unitMatches,
    expectedUnits,
    lessonTitleMatches,
    outcomeMatches,
    terminologyOk,
    difficultyOk,
    lessonsChecked,
    lessonResults,
    curriculumAccuracy: Math.min(100, score),
    passed:
      checks.countryJordan &&
      checks.nationalCurriculum &&
      checks.gradeMatches &&
      checks.subjectMatches &&
      checks.notInternationalBook &&
      score >= 90,
  };
}

/**
 * Content validation — reject failing lessons.
 */
export function validateContent(book, knowledge) {
  const identity = book.identity || {};
  const issues = [];
  const rejectedLessons = [];
  const seenTitles = new Map();
  const knowledgeLessonCount = list(knowledge?.units).reduce(
    (n, u) => n + list(u.lessons).length,
    0,
  );
  const bookLessons = list(book.units).flatMap((u, ui) =>
    list(u.lessons).map((l) => ({ ...l, _unitId: u.id || u.unitId, _unitIndex: ui })),
  );

  if (knowledgeLessonCount && bookLessons.length < knowledgeLessonCount) {
    issues.push({
      code: 'MISSING_LESSONS',
      detail: `book=${bookLessons.length} knowledge=${knowledgeLessonCount}`,
    });
  }

  for (const lesson of bookLessons) {
    const titleKey = norm(lesson.title);
    if (seenTitles.has(titleKey)) {
      issues.push({ code: 'DUPLICATE_LESSON', lessonId: lesson.id, title: lesson.title });
      rejectedLessons.push({ lessonId: lesson.id, reasons: ['DUPLICATE_LESSON'] });
      continue;
    }
    seenTitles.set(titleKey, lesson.id);

    const reasons = [];
    const full = text(lesson.fullLesson || lesson.stepByStepExplanation);
    const summary = text(lesson.lessonSummary || lesson.summary);

    if (!full || full.length < 400) reasons.push('EMPTY_OR_THIN_PAGE');
    if (isScaffold(full)) reasons.push('GENERIC_OR_SCAFFOLD');
    if (!summary) reasons.push('MISSING_SUMMARY');
    if (!list(lesson.definitions).length && !list(lesson.scientificTerms).length) {
      reasons.push('MISSING_DEFINITIONS');
    }
    if (!list(lesson.diagrams).length && !list(lesson.illustrations).length) {
      reasons.push('MISSING_DIAGRAMS');
    }
    if (list(lesson.references).length < 2) reasons.push('MISSING_REFERENCES');

    // Wrong subject / grade content
    if (identity.subject && !full.includes(identity.subject)) {
      reasons.push('WRONG_SUBJECT_SIGNAL');
    }
    if (identity.grade && !full.includes(identity.grade)) {
      reasons.push('WRONG_GRADE_SIGNAL');
    }

    const bleed = hasIntlBleed(`${full}\n${summary}\n${lesson.title}`);
    if (bleed) reasons.push(`INTERNATIONAL_BLEED:${bleed}`);

    // Broken formulas: flagged if formulasVerified present but marked false, or empty formula strings
    for (const f of list(lesson.formulasVerified)) {
      if (f.verified === false) reasons.push('BROKEN_FORMULA');
      if (!text(f.expression)) reasons.push('EMPTY_FORMULA');
    }
    for (const f of list(lesson.rulesLawsFormulas)) {
      if (!text(f)) reasons.push('EMPTY_FORMULA');
    }

    // Wrong terminology: knowledge concepts mostly absent
    const kUnit = list(knowledge?.units)[lesson._unitIndex];
    const kLesson = list(kUnit?.lessons).find((k) => k.lessonId === lesson.id) ||
      list(kUnit?.lessons)[0];
    const concepts = list(kLesson?.scientificConcepts);
    if (concepts.length) {
      const hits = concepts.filter((c) => full.includes(c)).length;
      if (hits / concepts.length < 0.34) reasons.push('WRONG_TERMINOLOGY');
    }

    if (reasons.length) {
      issues.push({ code: 'LESSON_REJECTED', lessonId: lesson.id, title: lesson.title, reasons });
      rejectedLessons.push({ lessonId: lesson.id, title: lesson.title, reasons });
    }
  }

  const completeness =
    knowledgeLessonCount > 0
      ? Math.round(
          ((bookLessons.length - rejectedLessons.length) / knowledgeLessonCount) * 100,
        )
      : bookLessons.length
        ? Math.round(
            ((bookLessons.length - rejectedLessons.length) / bookLessons.length) * 100,
          )
        : 0;

  return {
    issues,
    rejectedLessons,
    missingLessonCount: Math.max(0, knowledgeLessonCount - bookLessons.length),
    duplicateCount: issues.filter((i) => i.code === 'DUPLICATE_LESSON').length,
    bookLessonCount: bookLessons.length,
    knowledgeLessonCount,
    completeness: Math.max(0, Math.min(100, completeness)),
    passed: rejectedLessons.length === 0 && issues.filter((i) => i.code === 'MISSING_LESSONS').length === 0,
  };
}

/**
 * Book open / navigation / structure test (deterministic structural open).
 */
export function testBookOpen(book) {
  const pages = [];
  const fail = (page, reason) => {
    pages.push({ page, ok: false, reason });
  };
  const pass = (page) => {
    pages.push({ page, ok: true });
  };

  // Cover
  if (!book.cover?.title || !book.cover?.grade || !book.cover?.subject) {
    fail('cover', 'COVER_INCOMPLETE');
  } else pass('cover');

  // Book information
  if (
    !book.identity?.country ||
    !book.identity?.curriculum ||
    !book.identity?.grade ||
    !book.identity?.subject
  ) {
    fail('book-information', 'IDENTITY_INCOMPLETE');
  } else pass('book-information');

  // TOC
  const toc = list(book.tableOfContents);
  const units = list(book.units);
  if (!toc.length || toc.length !== units.length) fail('table-of-contents', 'TOC_MISMATCH');
  else pass('table-of-contents');

  // Units
  if (!units.length) fail('units', 'NO_UNITS');
  else pass('units');

  // Lessons
  const lessons = units.flatMap((u) => list(u.lessons));
  if (!lessons.length) fail('lessons', 'NO_LESSONS');
  else {
    const empty = lessons.filter((l) => !text(l.fullLesson || l.stepByStepExplanation));
    if (empty.length) fail('lessons', `EMPTY_LESSONS:${empty.length}`);
    else pass('lessons');
  }

  // Navigation — every TOC lesson id resolves
  let navOk = true;
  for (const tu of toc) {
    const unit = units.find((u) => (u.id || u.unitId) === tu.unitId);
    if (!unit) {
      navOk = false;
      break;
    }
    for (const tl of list(tu.lessons)) {
      const found = list(unit.lessons).some((l) => l.id === tl.lessonId || l.title === tl.title);
      if (!found) {
        navOk = false;
        break;
      }
    }
  }
  if (!navOk) fail('navigation', 'TOC_LESSON_UNRESOLVED');
  else pass('navigation');

  // Search index — titles + glossary terms available
  const glossary = list(book.glossary);
  const searchCorpus = [
    ...lessons.map((l) => l.title),
    ...glossary.map((g) => g.term),
  ].filter(Boolean);
  if (searchCorpus.length < lessons.length) fail('search', 'SEARCH_INDEX_THIN');
  else pass('search');

  // Images / diagrams
  const withDiagrams = lessons.filter(
    (l) => list(l.diagrams).length || list(l.illustrations).length,
  ).length;
  if (withDiagrams < lessons.length * 0.8) fail('images', 'MISSING_DIAGRAMS_COVERAGE');
  else pass('images');

  // Internal links
  let linksOk = true;
  for (const lesson of lessons) {
    const link = lesson.internalLinks || {};
    if (link.bookId && link.bookId !== book.id) {
      linksOk = false;
      break;
    }
  }
  if (!linksOk) fail('internal-links', 'BROKEN_INTERNAL_LINK');
  else pass('internal-links');

  // Reading mode — each lesson has summary + full lesson
  const readingOk = lessons.every(
    (l) =>
      text(l.lessonSummary || l.summary).length >= 40 &&
      text(l.fullLesson || l.stepByStepExplanation).length >= 400,
  );
  if (!readingOk) fail('reading-mode', 'READING_PAYLOAD_INCOMPLETE');
  else pass('reading-mode');

  const passedPages = pages.filter((p) => p.ok).length;
  const navigationScore = Math.round((passedPages / Math.max(1, pages.length)) * 100);

  return {
    pages,
    everyPageLoads: pages.every((p) => p.ok),
    navigationScore,
    passed: pages.every((p) => p.ok),
  };
}

function scoreReadability(book) {
  const lessons = list(book.units).flatMap((u) => list(u.lessons));
  if (!lessons.length) return 0;
  let points = 0;
  for (const l of lessons) {
    const full = text(l.fullLesson);
    const summary = text(l.lessonSummary || l.summary);
    if (full.length >= 800) points += 40;
    else if (full.length >= 400) points += 20;
    if (summary.length >= 60) points += 20;
    if (list(l.workedExamples).length) points += 20;
    if (!isScaffold(full)) points += 20;
  }
  return Math.min(100, Math.round(points / lessons.length));
}

function scoreScientific(book, curriculumMatch, content) {
  const termRatio =
    curriculumMatch.lessonsChecked > 0
      ? curriculumMatch.terminologyOk / curriculumMatch.lessonsChecked
      : 0;
  const rejectPenalty = Math.min(40, list(content.rejectedLessons).length * 5);
  return Math.max(0, Math.min(100, Math.round(termRatio * 100 - rejectPenalty + 10)));
}

function scoreDesign(book) {
  let score = 0;
  if (book.cover?.title) score += 20;
  if (book.cover?.subtitle) score += 10;
  if (book.bookIntroduction) score += 15;
  const glossarySize = list(book.glossary).length;
  if (glossarySize >= 4) score += 20;
  else if (glossarySize >= 2) score += 15;
  else if (glossarySize >= 1) score += 8;
  if (list(book.tableOfContents).length) score += 15;
  const lessons = list(book.units).flatMap((u) => list(u.lessons));
  const diag = lessons.filter((l) => list(l.diagrams).length || list(l.illustrations).length).length;
  if (lessons.length && diag / lessons.length >= 0.9) score += 20;
  else if (lessons.length && diag / lessons.length >= 0.7) score += 12;
  return Math.min(100, score);
}

function ensureGlossary(book) {
  const existing = list(book.glossary);
  if (existing.length >= 4) return book;
  const map = new Map(existing.map((g) => [text(g.term), g.definition || '']));
  for (const unit of list(book.units)) {
    for (const lesson of list(unit.lessons)) {
      for (const d of list(lesson.definitions).concat(list(lesson.scientificTerms))) {
        const term = text(d.term);
        if (!term || map.has(term)) continue;
        map.set(term, d.definition || d.definitionAr || '');
      }
      for (const c of list(lesson.keyConcepts)) {
        const term = text(c);
        if (!term || map.has(term)) continue;
        map.set(term, `مفهوم في ${book.identity?.subject || 'المادة'}`);
      }
    }
  }
  return {
    ...book,
    glossary: [...map.entries()].map(([term, definition]) => ({ term, definition })),
  };
}

function scoreReferences(book) {
  const refs = list(book.references);
  const lessons = list(book.units).flatMap((u) => list(u.lessons));
  let score = 0;
  if (refs.length >= 2) score += 30;
  if (refs.some((r) => /moe\.gov\.jo|nccd\.gov\.jo|darsak\.gov\.jo/i.test(r.url || ''))) {
    score += 40;
  }
  const withRefs = lessons.filter((l) => list(l.references).length >= 2).length;
  if (lessons.length) score += Math.round((withRefs / lessons.length) * 30);
  return Math.min(100, score);
}

/**
 * Full quality scorecard — publish gate ≥ 98% overall.
 */
export function scoreBookQuality({ curriculumMatch, content, bookTest, book }) {
  const curriculumAccuracy = curriculumMatch.curriculumAccuracy;
  const scientificAccuracy = scoreScientific(book, curriculumMatch, content);
  const completeness = content.completeness;
  const readability = scoreReadability(book);
  const navigation = bookTest.navigationScore;
  const designQuality = scoreDesign(book);
  const referenceQuality = scoreReferences(book);

  const overall = Math.round(
    (curriculumAccuracy +
      scientificAccuracy +
      completeness +
      readability +
      navigation +
      designQuality +
      referenceQuality) /
      7,
  );

  return {
    curriculumAccuracy,
    scientificAccuracy,
    completeness,
    readability,
    navigation,
    designQuality,
    referenceQuality,
    overallQualityScore: overall,
    publishGate: JO03_PUBLISH_GATE,
    meetsPublishGate: overall >= JO03_PUBLISH_GATE,
  };
}

/**
 * Verify one Jordan national book end-to-end. Does NOT publish.
 */
export function verifyJordanBook(bookId, options = {}) {
  ensureDirs();
  const book = loadLibraryBook(bookId);
  if (!book) return { ok: false, error: 'BOOK_NOT_FOUND', bookId };
  if (!isJordanNationalBookId(bookId)) {
    return {
      ok: false,
      error: 'NOT_JORDAN_NATIONAL',
      bookId,
      note: 'JO-03 verifies Jordan National Curriculum books only.',
    };
  }

  const knowledge = loadKnowledgeForBook(book);
  if (!knowledge) {
    return {
      ok: false,
      error: 'KNOWLEDGE_NODE_MISSING',
      bookId,
      note: 'Cannot verify without JO-01 knowledge node.',
    };
  }

  const bookForScoring = ensureGlossary(book);
  const curriculumMatch = matchCurriculum(bookForScoring, knowledge);
  const content = validateContent(bookForScoring, knowledge);
  const bookTest = testBookOpen(bookForScoring);
  const quality = scoreBookQuality({
    curriculumMatch,
    content,
    bookTest,
    book: bookForScoring,
  });

  const verificationPassed =
    curriculumMatch.passed &&
    content.passed &&
    bookTest.passed &&
    quality.meetsPublishGate;

  const review = {
    schema: 'success-os.jordan-curriculum-verification.v1',
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    bookId,
    identity: book.identity,
    subject: book.identity?.subject,
    grade: book.identity?.grade,
    lessonsCompleted: content.bookLessonCount - content.rejectedLessons.length,
    lessonsMissing: content.missingLessonCount + content.rejectedLessons.length,
    qualityScore: quality.overallQualityScore,
    quality,
    verificationStatus: verificationPassed
      ? 'VERIFIED_PENDING_ADMIN'
      : 'FAILED_VERIFICATION',
    publishStatus:
      book.jo03?.adminApproved && book.publication?.status === 'PUBLISHED'
        ? 'PUBLISHED'
        : verificationPassed
          ? 'AWAITING_ADMIN_APPROVAL'
          : 'BLOCKED',
    lastReviewDate: new Date().toISOString(),
    curriculumMatch,
    contentValidation: {
      passed: content.passed,
      issues: content.issues.slice(0, 50),
      rejectedLessons: content.rejectedLessons,
      missingLessonCount: content.missingLessonCount,
      duplicateCount: content.duplicateCount,
    },
    bookTest,
    adminApproved: Boolean(book.jo03?.adminApproved),
    canPublish: false, // never auto-publish — admin required
  };

  // Persist verification onto book — unpublish if not admin-approved
  const next = {
    ...bookForScoring,
    jo03: {
      phase: PHASE,
      engineVersion: ENGINE_VERSION,
      verifiedAt: review.lastReviewDate,
      verificationStatus: review.verificationStatus,
      qualityScore: quality.overallQualityScore,
      quality,
      curriculumMatchPassed: curriculumMatch.passed,
      contentValidationPassed: content.passed,
      bookTestPassed: bookTest.passed,
      adminApproved: Boolean(book.jo03?.adminApproved),
      adminApprovedAt: book.jo03?.adminApprovedAt || null,
      adminRejectedAt: book.jo03?.adminRejectedAt || null,
      adminNotes: book.jo03?.adminNotes || null,
    },
    publication: {
      ...(book.publication || {}),
      studentPortalVisible: Boolean(
        book.jo03?.adminApproved &&
          verificationPassed &&
          quality.meetsPublishGate,
      ),
      status:
        book.jo03?.adminApproved && verificationPassed && quality.meetsPublishGate
          ? 'PUBLISHED'
          : verificationPassed
            ? 'PENDING_ADMIN_APPROVAL'
            : 'VERIFICATION_FAILED',
      reason: verificationPassed
        ? 'JO-03 verified — awaiting Admin approval before publish'
        : 'JO-03 verification failed — repair required before Admin review',
    },
    quality: {
      ...(book.quality || {}),
      jo03: quality,
      bookStatus: review.verificationStatus,
    },
    updatedAt: new Date().toISOString(),
  };

  // If previously published without admin approval, force unpublish
  if (!next.jo03.adminApproved) {
    next.publication.studentPortalVisible = false;
    if (next.publication.status === 'PUBLISHED') {
      next.publication.status = verificationPassed
        ? 'PENDING_ADMIN_APPROVAL'
        : 'VERIFICATION_FAILED';
    }
  }

  if (!options.dryRun) {
    saveLibraryBook(next);
    writeJson(path.join(verificationRoot(), 'reviews', `${bookId}.json`), review);
    writeJson(path.join(verificationRoot(), 'book-tests', `${bookId}.json`), bookTest);
  }

  return {
    ok: true,
    bookId,
    verificationPassed,
    qualityScore: quality.overallQualityScore,
    meetsPublishGate: quality.meetsPublishGate,
    verificationStatus: review.verificationStatus,
    publishStatus: next.publication.status,
    review,
  };
}

export function compareBookWithCurriculum(bookId) {
  ensureDirs();
  const book = loadLibraryBook(bookId);
  if (!book) return { ok: false, error: 'BOOK_NOT_FOUND' };
  const knowledge = loadKnowledgeForBook(book);
  if (!knowledge) return { ok: false, error: 'KNOWLEDGE_NODE_MISSING' };

  const comparison = {
    schema: 'success-os.jordan-curriculum-comparison.v1',
    bookId,
    identity: book.identity,
    knowledge: {
      stage: knowledge.stage,
      grade: knowledge.grade,
      subject: knowledge.subject,
      units: list(knowledge.units).map((u) => ({
        unitId: u.unitId,
        title: u.titleAr,
        lessons: list(u.lessons).map((l) => ({
          lessonId: l.lessonId,
          title: l.titleAr,
          outcomes: list(l.learningOutcomes),
        })),
      })),
    },
    book: {
      units: list(book.units).map((u) => ({
        unitId: u.id || u.unitId,
        title: u.title,
        lessons: list(u.lessons).map((l) => ({
          lessonId: l.id,
          title: l.title,
          outcomes: list(l.learningOutcomes),
        })),
      })),
    },
    curriculumMatch: matchCurriculum(book, knowledge),
    comparedAt: new Date().toISOString(),
  };

  writeJson(path.join(verificationRoot(), 'comparisons', `${bookId}.json`), comparison);
  return { ok: true, comparison };
}

export function listJordanNationalBookIds() {
  return listLibraryBooks()
    .map((b) => b.id)
    .filter((id) => isJordanNationalBookId(id));
}

/** Prefer JO-02 produced books; fall back to national books that exist on disk. */
export function listJo03CandidateBookIds() {
  const fromQueue = (() => {
    try {
      return buildJordanProductionQueue().map((j) => j.bookId);
    } catch {
      return [];
    }
  })();
  const produced = fromQueue.filter((id) => {
    const book = loadLibraryBook(id);
    return Boolean(book?.jo02?.producedAt);
  });
  if (produced.length) return produced;
  return listJordanNationalBookIds().filter((id) => Boolean(loadLibraryBook(id)?.jo02?.producedAt));
}

export function verifyAllJordanBooks(options = {}) {
  ensureDirs();
  const ids = options.bookIds || listJo03CandidateBookIds();
  const results = [];
  for (const bookId of ids) {
    if (!loadLibraryBook(bookId)) continue;
    results.push(verifyJordanBook(bookId, options));
  }

  const dashboard = buildJo03Dashboard(results);
  writeJson(path.join(verificationRoot(), 'dashboards', 'latest.json'), dashboard);
  writeJson(
    path.join(verificationRoot(), 'reports', `jo-03-verify-${Date.now()}.json`),
    { results, dashboard, ranAt: new Date().toISOString() },
  );

  try {
    rebuildMiddleEastLiveBookIndex();
  } catch {
    /* best effort */
  }

  return { ok: true, verified: results.length, results, dashboard };
}

export function buildJo03Dashboard(precomputedResults = null) {
  ensureDirs();
  const reviewsDir = path.join(verificationRoot(), 'reviews');
  let rows = [];
  if (precomputedResults) {
    rows = precomputedResults.filter((r) => r.ok).map((r) => r.review);
  } else if (fs.existsSync(reviewsDir)) {
    rows = fs
      .readdirSync(reviewsDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => readJson(path.join(reviewsDir, f)))
      .filter(Boolean);
  }

  const subjects = {};
  for (const r of rows) {
    const key = `${r.subject}::${r.grade}`;
    subjects[key] = {
      bookId: r.bookId,
      subject: r.subject,
      grade: r.grade,
      lessonsCompleted: r.lessonsCompleted,
      lessonsMissing: r.lessonsMissing,
      qualityScore: r.qualityScore,
      verificationStatus: r.verificationStatus,
      lastReviewDate: r.lastReviewDate,
      publishStatus: r.publishStatus,
      adminApproved: r.adminApproved,
    };
  }

  const listRows = Object.values(subjects).sort((a, b) =>
    `${a.subject}|${a.grade}`.localeCompare(`${b.subject}|${b.grade}`, 'ar'),
  );

  return {
    schema: 'success-os.jordan-verification-dashboard.v1',
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    publishGate: JO03_PUBLISH_GATE,
    totals: {
      booksReviewed: listRows.length,
      verifiedPendingAdmin: listRows.filter((r) => r.verificationStatus === 'VERIFIED_PENDING_ADMIN')
        .length,
      failed: listRows.filter((r) => r.verificationStatus === 'FAILED_VERIFICATION').length,
      published: listRows.filter((r) => r.publishStatus === 'PUBLISHED').length,
      awaitingAdmin: listRows.filter((r) => r.publishStatus === 'AWAITING_ADMIN_APPROVAL').length,
      atOrAbove98: listRows.filter((r) => (r.qualityScore || 0) >= JO03_PUBLISH_GATE).length,
    },
    books: listRows,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Admin: approve publish — only if verification passed and score ≥ 98.
 */
export function adminApproveJordanBook(bookId, options = {}) {
  assertJordanReferenceLibraryReady({ bookId, action: 'jo03-admin-approve' });
  const verification = verifyJordanBook(bookId, { dryRun: false });
  if (!verification.ok) return verification;
  if (!verification.verificationPassed || !verification.meetsPublishGate) {
    return {
      ok: false,
      error: 'VERIFICATION_OR_SCORE_BLOCK',
      bookId,
      qualityScore: verification.qualityScore,
      required: JO03_PUBLISH_GATE,
      verificationStatus: verification.verificationStatus,
    };
  }

  const book = loadLibraryBook(bookId);
  try {
    assertReferencesInLibrary(book.references || book.jo05?.referenceSourceIds?.map((id) => ({ sourceId: id })), {
      bookId,
      action: 'admin-approve',
    });
  } catch (error) {
    return {
      ok: false,
      error: error.code || error.message,
      details: error.details || null,
      bookId,
      note: 'Every book must reference verified JO-05 library sources before Admin publish.',
    };
  }
  const next = {
    ...book,
    jo03: {
      ...book.jo03,
      adminApproved: true,
      adminApprovedAt: new Date().toISOString(),
      adminRejectedAt: null,
      adminNotes: options.notes || 'Admin approved after JO-03 verification',
      verificationStatus: 'ADMIN_APPROVED_PUBLISHED',
    },
    publication: {
      ...(book.publication || {}),
      studentPortalVisible: true,
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
      reason: 'JO-03 verified + Admin approved',
    },
    cover: {
      ...(book.cover || {}),
      badge: 'JO-03 — verified · Admin approved',
    },
    updatedAt: new Date().toISOString(),
  };
  saveLibraryBook(next);

  const reviewPath = path.join(verificationRoot(), 'reviews', `${bookId}.json`);
  const review = readJson(reviewPath) || {};
  writeJson(reviewPath, {
    ...review,
    ...verification.review,
    adminApproved: true,
    publishStatus: 'PUBLISHED',
    verificationStatus: 'ADMIN_APPROVED_PUBLISHED',
    lastReviewDate: next.updatedAt,
  });

  try {
    rebuildMiddleEastLiveBookIndex();
  } catch {
    /* ignore */
  }

  return { ok: true, bookId, publishStatus: 'PUBLISHED', qualityScore: verification.qualityScore };
}

export function adminRejectJordanBook(bookId, options = {}) {
  const book = loadLibraryBook(bookId);
  if (!book) return { ok: false, error: 'BOOK_NOT_FOUND' };
  const next = {
    ...book,
    jo03: {
      ...(book.jo03 || {}),
      adminApproved: false,
      adminRejectedAt: new Date().toISOString(),
      adminNotes: options.notes || 'Admin rejected',
      verificationStatus: 'ADMIN_REJECTED',
    },
    publication: {
      ...(book.publication || {}),
      studentPortalVisible: false,
      status: 'ADMIN_REJECTED',
      reason: options.notes || 'Admin rejected after JO-03 review',
    },
    updatedAt: new Date().toISOString(),
  };
  saveLibraryBook(next);
  const reviewPath = path.join(verificationRoot(), 'reviews', `${bookId}.json`);
  const review = readJson(reviewPath) || { bookId };
  writeJson(reviewPath, {
    ...review,
    adminApproved: false,
    publishStatus: 'ADMIN_REJECTED',
    verificationStatus: 'ADMIN_REJECTED',
    lastReviewDate: next.updatedAt,
    adminNotes: options.notes || null,
  });
  return { ok: true, bookId, publishStatus: 'ADMIN_REJECTED' };
}

export function adminRegenerateJordanBook(bookId) {
  const queue = buildJordanProductionQueue();
  const job = queue.find((j) => j.bookId === bookId);
  if (!job) return { ok: false, error: 'JOB_NOT_IN_QUEUE', bookId };
  // Produce without auto-publish — JO-03 must re-verify + admin approve
  const produced = produceJordanBook(job, { autoPublish: false, force: true });
  if (!produced.ok) return produced;
  const verification = verifyJordanBook(bookId);
  return { ok: true, regenerated: true, produced, verification };
}

export function adminEditJordanBook(bookId, patch = {}) {
  const book = loadLibraryBook(bookId);
  if (!book) return { ok: false, error: 'BOOK_NOT_FOUND' };
  const allowed = ['bookIntroduction', 'cover', 'glossary', 'references'];
  const next = { ...book, updatedAt: new Date().toISOString() };
  for (const key of allowed) {
    if (patch[key] !== undefined) next[key] = patch[key];
  }
  if (patch.adminNotes) {
    next.jo03 = { ...(next.jo03 || {}), adminNotes: patch.adminNotes };
  }
  // Edits invalidate prior admin approval
  next.jo03 = {
    ...(next.jo03 || {}),
    adminApproved: false,
    verificationStatus: 'EDITED_NEEDS_REVERIFY',
  };
  next.publication = {
    ...(next.publication || {}),
    studentPortalVisible: false,
    status: 'PENDING_REVERIFICATION',
  };
  saveLibraryBook(next);
  return { ok: true, bookId, note: 'Edit saved — re-run verification before Admin approval.' };
}

export function previewJordanBook(bookId) {
  const book = loadLibraryBook(bookId);
  if (!book) return { ok: false, error: 'BOOK_NOT_FOUND' };
  return {
    ok: true,
    preview: {
      id: book.id,
      cover: book.cover,
      identity: book.identity,
      introduction: book.bookIntroduction,
      toc: book.tableOfContents,
      unitCount: list(book.units).length,
      lessonCount: list(book.units).flatMap((u) => list(u.lessons)).length,
      jo03: book.jo03,
      publication: book.publication,
      sampleLesson: list(list(book.units)[0]?.lessons)[0]
        ? {
            title: list(book.units)[0].lessons[0].title,
            summary: list(book.units)[0].lessons[0].lessonSummary,
            fullLessonPreview: text(list(book.units)[0].lessons[0].fullLesson).slice(0, 500),
          }
        : null,
    },
  };
}

export function runJordanCurriculumVerification(options = {}) {
  if (options.bookId) {
    return verifyJordanBook(options.bookId, options);
  }
  return verifyAllJordanBooks(options);
}
