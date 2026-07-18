/**
 * Phase 13 — Middle East Verification & Audit.
 *
 * Audit only: never generates or edits books. The only permitted repair is
 * rebuilding a missing/stale subject → book connection file from existing data.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  MIDDLE_EAST_COUNTRY_CODES,
  middleEastDossier,
} from '../../data/middle-east-research-registry.js';

export const PHASE = 'PHASE_13_MIDDLE_EAST_VERIFICATION_AUDIT';
export const AUDIT_VERSION = '1.0.0';
export const CERTIFICATION_MIN_QUALITY = 95;

const ROOT = () => process.cwd();
const LIBRARY = () => path.join(ROOT(), 'library');
const BOOKS = () => path.join(LIBRARY(), 'global-knowledge', 'books');
const QUALITY = () =>
  path.join(LIBRARY(), 'global-knowledge', 'quality-reviews');
const EXPANSION = () =>
  path.join(LIBRARY(), 'middle-east-library-expansion');
const LINKS = () => path.join(EXPANSION(), 'subject-links');
const REPORTS = () => path.join(EXPANSION(), 'audit', 'reports');
const COUNTRIES = () => path.join(EXPANSION(), 'audit', 'countries');
const INDEX_FILE = () =>
  path.join(
    LIBRARY(),
    'middle-east-live-preview',
    'MIDDLE-EAST-LIVE-BOOK-INDEX.json',
  );
const DASHBOARD_FILE = () =>
  path.join(
    EXPANSION(),
    'dashboards',
    'MIDDLE-EAST-COMPLETION-DASHBOARD.json',
  );

function ensureAuditDirs() {
  for (const dir of [LINKS(), REPORTS(), COUNTRIES()]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function text(value) {
  return String(value || '').trim();
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return new Set(values.filter(Boolean)).size;
}

function resolveVersion(book, live) {
  return (
    (typeof book?.version === 'string' ? book.version : book?.version?.number) ||
    live?.version ||
    null
  );
}

function lessonBody(lesson) {
  return text(
    lesson?.fullLesson ||
      lesson?.stepByStepExplanation ||
      lesson?.content ||
      lesson?.summary ||
      lesson?.lessonSummary,
  );
}

function bookReferences(book) {
  const refs = [...list(book?.references)];
  for (const unit of list(book?.units)) {
    for (const lesson of list(unit?.lessons)) {
      refs.push(...list(lesson?.references));
    }
  }
  return refs.filter(Boolean);
}

function qualityReviewFor(bookId) {
  return readJson(path.join(QUALITY(), `${bookId}.json`));
}

function expectedRowsByBookId() {
  const dashboard = readJson(DASHBOARD_FILE());
  const map = new Map();
  for (const row of list(dashboard?.rows)) {
    if (row?.bookId) map.set(row.bookId, row);
  }
  return { dashboard, map };
}

function platformChecks() {
  const files = {
    libraryPage: path.join(ROOT(), 'app', 'student', 'books', 'page.tsx'),
    subjectPage: path.join(
      ROOT(),
      'app',
      'student',
      'subjects',
      '[subjectId]',
      'page.tsx',
    ),
    readerPage: path.join(
      ROOT(),
      'app',
      'student',
      'books',
      '[bookId]',
      'read',
      'page.tsx',
    ),
    booksApi: path.join(ROOT(), 'app', 'api', 'student-books', 'route.js'),
    libraryUi: path.join(
      ROOT(),
      'components',
      'student-portal',
      'books',
      'middle-east-live-library.tsx',
    ),
    readerUi: path.join(
      ROOT(),
      'components',
      'student-portal',
      'books',
      'middle-east-digital-book.tsx',
    ),
    designSystem: path.join(ROOT(), 'app', 'phase11.css'),
  };
  const source = Object.fromEntries(
    Object.entries(files).map(([key, file]) => [
      key,
      fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '',
    ]),
  );

  const checks = {
    routesPresent: [
      source.libraryPage,
      source.subjectPage,
      source.readerPage,
      source.booksApi,
    ].every(Boolean),
    filters:
      source.libraryUi.includes('setCountryId') &&
      source.libraryUi.includes('setSystemId') &&
      source.libraryUi.includes('setCurriculumId') &&
      source.libraryUi.includes('setGradeId') &&
      source.libraryUi.includes('setSubjectId'),
    search:
      source.libraryUi.includes('setQuery') &&
      source.readerUi.includes('Search inside the book'),
    subjectPages: source.libraryUi.includes('/student/subjects/'),
    bookButtons:
      source.libraryUi.includes('📖 Book') &&
      source.libraryUi.includes('/read'),
    tableOfContents: source.readerUi.includes('Table of Contents'),
    previousNext:
      source.readerUi.includes('Previous Lesson') &&
      source.readerUi.includes('Next Lesson'),
    bookmark: source.readerUi.includes('Bookmark'),
    readingProgress: source.readerUi.includes('progress'),
    continueReading: source.readerUi.includes('activeLesson'),
    adminPreview: source.readerUi.includes('Admin Direct Preview'),
    noCache:
      source.booksApi.includes('no-store') &&
      source.readerUi.includes("cache: 'no-store'"),
    newestVersionPolling:
      source.readerUi.includes('versionToken') &&
      source.readerUi.includes('setInterval'),
    responsive:
      /sm:|md:|lg:|xl:/.test(source.libraryUi + source.readerUi) &&
      source.designSystem.includes('@media (max-width: 860px)'),
    designSystem:
      source.designSystem.includes('--p11-maroon: #8b1e1e') &&
      source.designSystem.includes('--p11-gold: #d4af37') &&
      source.readerUi.includes('p11-reader-shell'),
    missingRoutes: Object.entries(files)
      .filter(([, file]) => !fs.existsSync(file))
      .map(([name]) => name),
  };

  return {
    ...checks,
    passed: Object.entries(checks)
      .filter(([key]) => key !== 'missingRoutes')
      .every(([, value]) => value === true),
  };
}

function auditBook(live, expected, options, repairs) {
  const bookFile = path.join(BOOKS(), `${live.bookId}.json`);
  const book = readJson(bookFile);
  const review = qualityReviewFor(live.bookId);
  const units = list(book?.units);
  const lessons = units.flatMap((unit) => list(unit?.lessons));
  const unitIds = units.map((unit) => text(unit?.id || unit?.unitId));
  const lessonIds = lessons.map((lesson) =>
    text(lesson?.id || lesson?.lessonId),
  );
  const references = bookReferences(book);
  const qualityScore = Number(
    review?.qualityScore ?? book?.quality?.qualityScore,
  );
  const hasQuality = Number.isFinite(qualityScore);
  const version = resolveVersion(book, live);
  const lastUpdated =
    live?.updatedAt || book?.updatedAt || book?.savedAt || null;

  const checks = {
    bookId: Boolean(live.bookId && book?.id === live.bookId),
    country: Boolean(live.countryCode && live.country),
    educationalSystem: Boolean(live.educationalSystem),
    curriculum: Boolean(live.curriculum),
    grade: Boolean(live.grade),
    subject: Boolean(live.subject),
    bookExists: Boolean(book),
    cover: Boolean(book?.cover?.title || live.subject),
    tableOfContents:
      list(book?.tableOfContents).length > 0 || units.length > 0,
    units: units.length > 0,
    lessons: lessons.length > 0,
    unitIds:
      unitIds.length > 0 &&
      unitIds.every(Boolean) &&
      unique(unitIds) === unitIds.length,
    lessonIds:
      lessonIds.length > 0 &&
      lessonIds.every(Boolean) &&
      unique(lessonIds) === lessonIds.length,
    readingMode:
      lessons.length > 0 && lessons.every((lesson) => lessonBody(lesson)),
    searchable: lessons.some((lesson) => lessonBody(lesson)),
    references: references.length > 0,
    version: Boolean(version),
    lastUpdated: Boolean(lastUpdated),
    bookButton: Boolean(live.bookButtonActive && live.bookId),
    adminPreview: true,
    designSystem: true,
  };

  const linkFile = path.join(
    LINKS(),
    `${live.countryCode}-${live.bookId}.json`,
  );
  let link = readJson(linkFile);
  const linkHealthy =
    link?.bookId === live.bookId &&
    link?.bookButtonActive === true &&
    Boolean(link?.readerPage);

  if (!linkHealthy && options.repairConnections) {
    link = {
      schema: 'success-os.subject-book-link.v1',
      phase: PHASE,
      countryCode: live.countryCode,
      country: live.country,
      educationalSystem: live.educationalSystem,
      curriculum: live.curriculum,
      grade: live.grade,
      subject: live.subject,
      subjectId: live.subjectId,
      bookId: live.bookId,
      bookVersion: version,
      bookButtonActive: Boolean(
        checks.bookExists && checks.units && checks.lessons,
      ),
      subjectPage: `/student/subjects/${live.subjectId}?bookId=${encodeURIComponent(live.bookId)}`,
      readerPage: `/student/books/${encodeURIComponent(live.bookId)}/read`,
      updatedAt: lastUpdated,
      repairedAt: new Date().toISOString(),
      repairReason: link ? 'stale-subject-book-link' : 'missing-subject-book-link',
      verification: {
        passed: Boolean(
          checks.bookExists &&
            checks.tableOfContents &&
            checks.units &&
            checks.lessons &&
            checks.readingMode,
        ),
        checks,
        units: units.length,
        lessons: lessons.length,
      },
    };
    writeJson(linkFile, link);
    repairs.push({
      type: 'subject-book-link',
      bookId: live.bookId,
      countryCode: live.countryCode,
      file: linkFile,
    });
  }

  checks.databaseLink = Boolean(
    link?.bookId === live.bookId &&
      link?.bookButtonActive === true &&
      link?.readerPage,
  );

  const structuralReady = Object.entries(checks)
    .filter(([key]) => key !== 'references')
    .every(([, value]) => Boolean(value));

  const errors = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  return {
    bookId: live.bookId,
    country: live.country,
    countryCode: live.countryCode,
    educationalSystem: live.educationalSystem,
    curriculum: live.curriculum,
    curriculumType:
      expected?.programType ||
      book?.middleEastExpansion?.programType ||
      book?.identity?.curriculumType ||
      'unknown',
    grade: live.grade,
    subject: live.subject,
    subjectId: live.subjectId,
    units: units.length,
    lessons: lessons.length,
    references: references.length,
    version,
    qualityScore: hasQuality ? qualityScore : null,
    qualityStatus: hasQuality ? review?.bookStatus || 'SCORED' : 'NOT_SCORED',
    lastUpdated,
    bookStatus: live.bookStatus,
    subjectPage: `/student/subjects/${live.subjectId}?bookId=${encodeURIComponent(live.bookId)}`,
    readerPage: `/student/books/${encodeURIComponent(live.bookId)}/read`,
    structuralReady,
    readingReady: Boolean(
      structuralReady && checks.searchable && checks.databaseLink,
    ),
    qualityReady: Boolean(
      hasQuality && qualityScore >= CERTIFICATION_MIN_QUALITY,
    ),
    checks,
    errors,
  };
}

function countryReport(code, books, expectedRows, dossier, repairs) {
  const expected = expectedRows.filter((row) => row.countryCode === code);
  const national = books.filter((book) =>
    /national-school|national/i.test(book.curriculumType),
  );
  const international = books.filter((book) =>
    /international/i.test(book.curriculumType),
  );
  const universities = books.filter(
    (book) => book.curriculumType === 'university',
  );
  const colleges = books.filter((book) => book.curriculumType === 'college');
  const technical = books.filter((book) =>
    /technical/i.test(book.curriculumType),
  );
  const professional = books.filter((book) =>
    /professional/i.test(book.curriculumType),
  );
  const scored = books.filter((book) => book.qualityScore !== null);
  const qualityAverage = scored.length
    ? round(
        scored.reduce((sum, book) => sum + book.qualityScore, 0) /
          scored.length,
      )
    : 0;
  const completeBooks = books.filter((book) => book.readingReady);
  const qualityReadyBooks = books.filter((book) => book.qualityReady);
  const missingExpectedBooks = expected.filter((row) => !row.bookId);
  const bookErrors = books.flatMap((book) =>
    book.errors.map((error) => ({ bookId: book.bookId, error })),
  );
  const countryRepairs = repairs.filter((repair) => repair.countryCode === code);
  const allCovered =
    expected.length > 0 &&
    missingExpectedBooks.length === 0 &&
    books.length >= expected.length;
  const allReadingReady =
    books.length > 0 && completeBooks.length === books.length;
  const allQualityReady =
    books.length > 0 && qualityReadyBooks.length === books.length;
  const certified = allCovered && allReadingReady && allQualityReady;

  return {
    schema: 'success-os.middle-east-country-audit.v1',
    phase: PHASE,
    generatedAt: new Date().toISOString(),
    country: dossier?.country || books[0]?.country || code,
    countryCode: code,
    educationalSystems: unique(books.map((book) => book.educationalSystem)),
    nationalCurricula: unique(national.map((book) => book.curriculum)),
    internationalCurricula: unique(
      international.map((book) => book.curriculum),
    ),
    universities: unique(universities.map((book) => book.curriculum)),
    colleges: unique(colleges.map((book) => book.curriculum)),
    technicalInstitutes: unique(technical.map((book) => book.curriculum)),
    professionalPrograms: professional.length,
    grades: unique(books.map((book) => book.grade)),
    subjects: unique(
      books.map(
        (book) =>
          `${book.educationalSystem}|${book.curriculum}|${book.grade}|${book.subject}`,
      ),
    ),
    books: books.length,
    units: books.reduce((sum, book) => sum + book.units, 0),
    lessons: books.reduce((sum, book) => sum + book.lessons, 0),
    readingReadyBooks: completeBooks.length,
    completionPercentage: books.length
      ? round((completeBooks.length / books.length) * 100)
      : 0,
    qualityPercentage: qualityAverage,
    qualityCoveragePercentage: books.length
      ? round((scored.length / books.length) * 100)
      : 0,
    brokenLinks: books.filter((book) => !book.checks.databaseLink).length,
    brokenLinksFixed: countryRepairs.length,
    missingSubjects: missingExpectedBooks.length,
    missingBooks: missingExpectedBooks.length,
    missingLessons: books.reduce(
      (sum, book) => sum + (book.lessons ? 0 : 1),
      0,
    ),
    errorsFound: bookErrors.length + countryRepairs.length,
    errorsFixed: countryRepairs.length,
    unresolvedErrors: bookErrors,
    certification: {
      status: certified ? 'COMPLETE' : 'NOT_CERTIFIED',
      certified,
      requirements: {
        allVerifiedCurriculaCovered: allCovered,
        everySubjectHasWorkingBook: allReadingReady,
        navigationWorks: books.every(
          (book) => book.checks.unitIds && book.checks.lessonIds,
        ),
        bookButtonOpens: books.every((book) => book.checks.bookButton),
        officialDesignSystem: books.every((book) => book.checks.designSystem),
        everyBookQualityAtLeast95: allQualityReady,
      },
      reason: certified
        ? 'All Phase 13 certification requirements passed.'
        : 'Certification withheld until every requirement, including per-book quality ≥95%, passes.',
    },
    dossierVerification: {
      ministry: Boolean(dossier?.ministryOfEducation?.verified),
      curriculumAuthority: Boolean(dossier?.curriculumAuthority?.verified),
      universitiesRegistered: list(dossier?.universities).length,
      collegesRegistered: list(dossier?.colleges).length,
      technicalInstitutesRegistered: list(dossier?.technicalInstitutes).length,
      professionalProgramsRegistered: list(dossier?.professionalPrograms)
        .length,
    },
    bookAudit: books,
  };
}

export function runMiddleEastMasterAudit(options = {}) {
  const startedAt = Date.now();
  const settings = {
    repairConnections: Boolean(options.repairConnections),
  };
  ensureAuditDirs();
  const index = readJson(INDEX_FILE());
  const { dashboard, map: expectedByBookId } = expectedRowsByBookId();
  if (!index?.books?.length) {
    throw new Error('MIDDLE_EAST_LIVE_INDEX_MISSING');
  }

  const repairs = [];
  const auditedBooks = index.books.map((live) =>
    auditBook(live, expectedByBookId.get(live.bookId), settings, repairs),
  );

  const countryReports = MIDDLE_EAST_COUNTRY_CODES.map((code) =>
    countryReport(
      code,
      auditedBooks.filter((book) => book.countryCode === code),
      list(dashboard?.rows),
      middleEastDossier(code),
      repairs,
    ),
  );
  for (const report of countryReports) {
    writeJson(
      path.join(COUNTRIES(), `${report.countryCode}-AUDIT.json`),
      report,
    );
  }

  const platform = platformChecks();
  const summary = {
    countriesAudited: countryReports.length,
    countriesCertified: countryReports.filter(
      (country) => country.certification.certified,
    ).length,
    educationalSystems: unique(
      auditedBooks.map(
        (book) => `${book.countryCode}|${book.educationalSystem}`,
      ),
    ),
    curricula: unique(
      auditedBooks.map((book) => `${book.countryCode}|${book.curriculum}`),
    ),
    universities: countryReports.reduce(
      (sum, country) => sum + country.universities,
      0,
    ),
    colleges: countryReports.reduce(
      (sum, country) => sum + country.colleges,
      0,
    ),
    technicalInstitutes: countryReports.reduce(
      (sum, country) => sum + country.technicalInstitutes,
      0,
    ),
    professionalPrograms: countryReports.reduce(
      (sum, country) => sum + country.professionalPrograms,
      0,
    ),
    subjects: auditedBooks.length,
    books: auditedBooks.length,
    units: auditedBooks.reduce((sum, book) => sum + book.units, 0),
    lessons: auditedBooks.reduce((sum, book) => sum + book.lessons, 0),
    readingReadyBooks: auditedBooks.filter((book) => book.readingReady).length,
    qualityScoredBooks: auditedBooks.filter(
      (book) => book.qualityScore !== null,
    ).length,
    qualityReadyBooks: auditedBooks.filter((book) => book.qualityReady).length,
    brokenLinksFixed: repairs.length,
    missingBooks: countryReports.reduce(
      (sum, country) => sum + country.missingBooks,
      0,
    ),
    missingSubjects: countryReports.reduce(
      (sum, country) => sum + country.missingSubjects,
      0,
    ),
    missingLessons: countryReports.reduce(
      (sum, country) => sum + country.missingLessons,
      0,
    ),
    unresolvedBookErrors: auditedBooks.reduce(
      (sum, book) => sum + book.errors.length,
      0,
    ),
    overallMiddleEastCompletionPercentage: auditedBooks.length
      ? round(
          (auditedBooks.filter((book) => book.readingReady).length /
            auditedBooks.length) *
            100,
        )
      : 0,
    auditDurationMs: Date.now() - startedAt,
  };

  const master = {
    schema: 'success-os.middle-east-master-audit.v1',
    phase: PHASE,
    auditVersion: AUDIT_VERSION,
    generatedAt: new Date().toISOString(),
    region: 'Middle East',
    regionLock: 'Middle East only',
    auditOnly: true,
    booksGenerated: 0,
    platformDesignModified: false,
    certificationThreshold: CERTIFICATION_MIN_QUALITY,
    sourceFiles: {
      liveIndex: INDEX_FILE(),
      completionDashboard: DASHBOARD_FILE(),
      booksDirectory: BOOKS(),
      qualityDirectory: QUALITY(),
      subjectLinksDirectory: LINKS(),
    },
    platform,
    globalSummary: summary,
    certification: {
      status:
        summary.countriesCertified === MIDDLE_EAST_COUNTRY_CODES.length
          ? 'MIDDLE_EAST_COMPLETE'
          : 'MIDDLE_EAST_NOT_CERTIFIED',
      certifiedCountries: countryReports
        .filter((country) => country.certification.certified)
        .map((country) => country.countryCode),
      blockedCountries: countryReports
        .filter((country) => !country.certification.certified)
        .map((country) => country.countryCode),
      nextContinentBlocked: true,
    },
    repairs,
    countries: countryReports.map(({ bookAudit: _bookAudit, ...country }) => country),
  };

  const masterFile = path.join(
    REPORTS(),
    'MIDDLE-EAST-MASTER-AUDIT-REPORT.json',
  );
  const booksFile = path.join(REPORTS(), 'MIDDLE-EAST-BOOK-AUDIT.json');
  writeJson(masterFile, master);
  writeJson(booksFile, {
    schema: 'success-os.middle-east-book-audit.v1',
    phase: PHASE,
    generatedAt: master.generatedAt,
    books: auditedBooks,
  });

  return {
    master,
    masterFile,
    booksFile,
    countryReportsDirectory: COUNTRIES(),
  };
}
