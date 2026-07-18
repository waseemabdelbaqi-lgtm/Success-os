/**
 * Phase 10 — Middle East Digital Library Expansion
 * Generates and integrates Success OS Digital Books for Middle East only.
 * Permanently versions every book. Never copies copyrighted textbooks.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  MIDDLE_EAST_COUNTRY_CODES,
  middleEastDossier,
} from '../../data/middle-east-research-registry.js';
import { nationalProfile } from '../../data/national-curricula.js';
import { autoBuildBaseline } from './curriculum-content-generator.js';
import {
  assertJordanBookGenerationAllowed,
} from './jordan-national-knowledge-engine.js';
import { assembleDigitalBookFromBaseline } from './global-knowledge-engine.js';
import {
  bookIdFromIdentity,
  loadLibraryBook,
  saveLibraryBook,
} from './library-store.js';
import {
  getMiddleEastLiveBookIndex,
  rebuildMiddleEastLiveBookIndex,
} from '../student/middle-east-live-book-store.js';
import {
  assertCurriculumResearchComplete,
  canGenerateDigitalBook,
  evaluateBookContentPolicy,
} from './middle-east-curriculum-knowledge-extraction-engine.js';

export const PHASE = 'PHASE_10_MIDDLE_EAST_DIGITAL_LIBRARY_EXPANSION';
export const ENGINE_VERSION = '1.0.0';
/** Phase 15.1: scaffold auto-generation is blocked until official objectives are verified. */
export const CONTENT_POLICY_PHASE = 'PHASE_15_1';
export const SCAFFOLD_GENERATION_ALLOWED = false;

const ME_CODES = new Set(MIDDLE_EAST_COUNTRY_CODES);

function expansionRoot() {
  return path.resolve(
    process.env.SUCCESS_OS_ME_EXPANSION_ROOT ||
      path.join(process.cwd(), 'library', 'middle-east-library-expansion'),
  );
}

function ensureDirs() {
  const root = expansionRoot();
  for (const dir of [
    'versions',
    'dashboards',
    'reports',
    'subject-links',
  ]) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  return root;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

/** Normalize Arabic/Latin whitespace and punctuation for stable keys. */
function normalizeKeyPart(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ـ]/g, '')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strict identity key (system + curriculum + grade + subject). */
function strictBookKey(item) {
  return [
    item.countryCode || '',
    item.educationalSystem,
    item.curriculum,
    item.grade || item.academicLevel,
    item.subject,
  ]
    .map(normalizeKeyPart)
    .join('|');
}

/**
 * Soft key used to link expansion queue rows to existing live ME books
 * when educational-system labels differ (EN dossier vs AR catalog).
 */
function softBookKey(item) {
  return [
    item.countryCode || '',
    item.grade || item.academicLevel,
    item.subject,
  ]
    .map(normalizeKeyPart)
    .join('|');
}

function subjectQueueFromDossier(code) {
  const dossier = middleEastDossier(code);
  if (!dossier) return [];
  const profile = nationalProfile(code);
  const authority =
    dossier.curriculumAuthority?.name ||
    dossier.ministryOfEducation?.name ||
    profile?.authority ||
    'Ministry of Education';
  const source =
    dossier.curriculumAuthority?.url ||
    dossier.ministryOfEducation?.url ||
    profile?.source ||
    null;
  const curriculum =
    dossier.nationalCurriculum?.name ||
    profile?.label ||
    `${dossier.country} National Curriculum`;

  const rows = [];
  for (const stage of dossier.nationalCurriculum?.stages || []) {
    for (const grade of stage.grades || []) {
      for (const subject of stage.subjects || []) {
        if (/قيد الحصر|pending/i.test(String(subject))) continue;
        rows.push({
          countryCode: code,
          country: dossier.country,
          educationalSystem: stage.name || 'National Education',
          curriculumType: 'national',
          curriculum,
          authority,
          source,
          stage: stage.name,
          grade,
          subject,
          language: 'ar',
          programType: 'national-school',
          action: 'process-subject',
        });
      }
    }
  }

  // International systems (seeded presence) — one overview subject shell per system
  for (const intl of dossier.internationalCurricula || []) {
    rows.push({
      countryCode: code,
      country: dossier.country,
      educationalSystem: 'International',
      curriculumType: 'international',
      curriculum: intl.name || 'International Curriculum',
      authority: intl.name,
      source: intl.url,
      stage: 'International Secondary',
      grade: 'IGCSE / Diploma',
      subject: `${intl.name} Pathway Overview`,
      language: 'en',
      programType: 'international-school',
      action: 'process-subject',
    });
  }

  // Higher education / professional samples from Phase 1 seeds
  for (const uni of dossier.universities || []) {
    rows.push({
      countryCode: code,
      country: dossier.country,
      educationalSystem: 'Higher Education',
      curriculumType: 'university',
      curriculum: `${uni.name} Programme Catalogue`,
      authority: uni.name,
      source: uni.url,
      stage: 'Undergraduate Foundation',
      grade: 'Year 1',
      subject: 'University Study Skills Foundation',
      language: 'ar',
      programType: 'university',
      action: 'process-subject',
    });
  }
  for (const college of dossier.colleges || []) {
    rows.push({
      countryCode: code,
      country: dossier.country,
      educationalSystem: 'College / Applied',
      curriculumType: 'college',
      curriculum: `${college.name} Applied Pathways`,
      authority: college.name,
      source: college.url,
      stage: 'Diploma',
      grade: 'Year 1',
      subject: 'Applied Professional Foundations',
      language: 'ar',
      programType: 'college',
      action: 'process-subject',
    });
  }
  for (const tech of dossier.technicalInstitutes || []) {
    rows.push({
      countryCode: code,
      country: dossier.country,
      educationalSystem: 'Technical / Vocational',
      curriculumType: 'technical',
      curriculum: `${tech.name} Technical Pathways`,
      authority: tech.name,
      source: tech.url,
      stage: 'Technical Diploma',
      grade: 'Level 1',
      subject: 'Technical Skills Foundations',
      language: 'ar',
      programType: 'technical-institute',
      action: 'process-subject',
    });
  }
  for (const program of dossier.professionalPrograms || []) {
    rows.push({
      countryCode: code,
      country: dossier.country,
      educationalSystem: 'Professional Certification',
      curriculumType: 'professional',
      curriculum: 'National Professional Pathways',
      authority: program.name,
      source: dossier.ministryOfHigherEducation?.url || null,
      stage: 'Professional',
      grade: 'Certificate',
      subject: program.name,
      language: 'ar',
      programType: 'professional-certification',
      action: 'process-subject',
    });
  }

  return rows;
}

export function buildMiddleEastExpansionQueue(options = {}) {
  const codes = options.countries?.length
    ? options.countries.filter((code) => ME_CODES.has(code))
    : MIDDLE_EAST_COUNTRY_CODES;
  const queue = codes.flatMap(subjectQueueFromDossier);
  return {
    schema: 'success-os.middle-east-expansion-queue.v1',
    phase: PHASE,
    generatedAt: new Date().toISOString(),
    countries: codes,
    totalItems: queue.length,
    queue,
  };
}

function savePermanentVersion(book) {
  const root = ensureDirs();
  const bookId = book.id || bookIdFromIdentity(book.identity || {});
  const version =
    book.version?.number ||
    book.version ||
    `me-${ENGINE_VERSION}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const dir = path.join(root, 'versions', bookId);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${String(version).replace(/[^\w.-]+/g, '-')}.json`);
  if (fs.existsSync(file)) {
    const stamped = path.join(
      dir,
      `${String(version).replace(/[^\w.-]+/g, '-')}-${Date.now()}.json`,
    );
    fs.writeFileSync(stamped, JSON.stringify(book, null, 2), 'utf8');
    return stamped;
  }
  fs.writeFileSync(file, JSON.stringify(book, null, 2), 'utf8');
  return file;
}

function verifyBookShell(book) {
  const units = Array.isArray(book.units) ? book.units : [];
  const lessons = units.flatMap((unit) => unit.lessons || []);
  const contentPolicy = evaluateBookContentPolicy(book);
  const checks = {
    bookExists: Boolean(book?.id),
    tableOfContents: Array.isArray(book.tableOfContents)
      ? book.tableOfContents.length > 0
      : units.length > 0,
    units: units.length > 0,
    lessons: lessons.length > 0,
    navigation: units.every((unit) => (unit.lessons || []).every((lesson) => lesson.id)),
    searchable: lessons.some(
      (lesson) =>
        String(lesson.fullLesson || lesson.summary || '').trim().length > 0,
    ),
    readingModeReady: lessons.every(
      (lesson) =>
        String(lesson.fullLesson || lesson.summary || 'Pending').length > 0,
    ),
    opensSuccessfully: Boolean(book.id && units.length),
    realEducationalContent: contentPolicy.publishAllowed,
    notScaffoldPlaceholder: contentPolicy.status === 'CURRICULUM_CONTENT_READY',
  };
  const structuralPassed = [
    'bookExists',
    'tableOfContents',
    'units',
    'lessons',
    'navigation',
    'searchable',
    'readingModeReady',
    'opensSuccessfully',
  ].every((key) => checks[key]);
  const passed =
    structuralPassed &&
    checks.realEducationalContent &&
    checks.notScaffoldPlaceholder;
  return {
    passed,
    structuralPassed,
    contentPolicy,
    checks,
    units: units.length,
    lessons: lessons.length,
    completionPercent: round(
      (Object.values(checks).filter(Boolean).length / Object.keys(checks).length) *
        100,
    ),
  };
}

export function generateOrRefreshMiddleEastBook(item) {
  const gate = canGenerateDigitalBook(item);
  if (!SCAFFOLD_GENERATION_ALLOWED || !gate.allowed) {
    const packet = gate.packet;
    return {
      created: false,
      updated: false,
      blocked: true,
      phase: CONTENT_POLICY_PHASE,
      reason:
        packet?.blockedReason ||
        'PHASE_15_1_BLOCKED_MISSING_OFFICIAL_CURRICULUM_OBJECTIVES',
      researchPacket: packet,
      book: null,
      verification: {
        passed: false,
        checks: { generationBlockedByPhase151: true },
      },
      link: {
        bookButtonActive: false,
        bookId: null,
        verification: { passed: false },
      },
    };
  }

  // PHASE JO-01 — Jordan national only after knowledge DB ≥ 98%.
  const prospectiveId = bookIdFromIdentity({
    country: item.country || 'Jordan',
    educationalSystem: item.educationalSystem || item.systemId,
    curriculum: item.curriculum || 'Jordan National Curriculum',
    grade: item.grade,
    subject: item.subject,
    language: item.language || 'ar',
  });
  if (
    String(item.countryCode || item.country || '').match(/^(JO|Jordan)$/i) &&
    /jordan-national-curriculum|Jordan National Curriculum/i.test(
      String(item.curriculum || item.curriculumId || 'Jordan National Curriculum'),
    )
  ) {
    try {
      assertJordanBookGenerationAllowed({
        bookId: prospectiveId,
        action: 'middle-east-expansion',
      });
    } catch (error) {
      return {
        created: false,
        updated: false,
        blocked: true,
        phase: 'JO-01',
        reason: error.code || error.message || 'JO_01_BOOK_GENERATION_BLOCKED',
        details: error.details || null,
        book: null,
        verification: {
          passed: false,
          checks: { jo01KnowledgeGate: false },
        },
        link: {
          bookButtonActive: false,
          bookId: null,
          verification: { passed: false },
        },
      };
    }
  }

  // Verified path only — research packet required before baseline assembly.
  const researchPacket = assertCurriculumResearchComplete(item);
  const identity = {
    country: item.country,
    educationalSystem: item.educationalSystem,
    curriculumType: item.curriculumType || 'national',
    curriculum: item.curriculum,
    authority: item.authority,
    stage: item.stage || item.educationalSystem,
    grade: item.grade,
    subject: item.subject,
    language: item.language || 'ar',
  };
  const bookId = bookIdFromIdentity(identity);
  const existing = loadLibraryBook(bookId);
  const verifiedItem = {
    ...item,
    requireOfficialObjectives: true,
    contentPolicy: {
      ...(item.contentPolicy || {}),
      officialObjectivesVerified: true,
      phase: CONTENT_POLICY_PHASE,
    },
  };
  const baseline = autoBuildBaseline({ item: verifiedItem });
  let book = assembleDigitalBookFromBaseline({
    item: verifiedItem,
    baseline,
    generateBlueprint: false,
  });
  book.id = bookId;
  book.version = {
    number: existing
      ? `me-${ENGINE_VERSION}-${Date.now()}`
      : `me-${ENGINE_VERSION}-1`,
    status: 'LIBRARY_INTEGRATED',
    previousVersion: existing?.version?.number || existing?.version || null,
  };
  book.updatedAt = new Date().toISOString();
  book.middleEastExpansion = {
    phase: PHASE,
    programType: item.programType,
    countryCode: item.countryCode,
    permanentlyVersioned: true,
    copyrightedTextCopied: false,
    officialObjectivesVerified: true,
    researchPacketId: `${item.countryCode}:${item.grade}:${item.subject}`,
  };
  book.contentPolicy = {
    phase: CONTENT_POLICY_PHASE,
    researchCompleted: true,
    officialObjectivesVerified: true,
    researchedAt: researchPacket.researchedAt,
  };
  book.publication = {
    ...(book.publication || {}),
    libraryPermanent: true,
    studentPortalVisible: false,
    adminPreviewImmediate: true,
    reason:
      'Phase 15.1 — visible only after curriculum-aligned educational content validation',
  };

  const saved = saveLibraryBook(book);
  const versionPath = savePermanentVersion(saved);
  const verification = verifyBookShell(saved);

  const root = ensureDirs();
  const link = {
    schema: 'success-os.subject-book-link.v1',
    countryCode: item.countryCode,
    country: item.country,
    educationalSystem: item.educationalSystem,
    curriculum: item.curriculum,
    grade: item.grade,
    subject: item.subject,
    bookId: saved.id,
    bookVersion: saved.version.number,
    bookButtonActive: verification.passed,
    updatedAt: saved.updatedAt,
    verification,
  };
  const linkPath = path.join(
    root,
    'subject-links',
    `${item.countryCode}-${saved.id}.json`,
  );
  fs.writeFileSync(linkPath, JSON.stringify(link, null, 2), 'utf8');

  return {
    created: !existing,
    updated: Boolean(existing),
    blocked: false,
    book: saved,
    versionPath,
    link,
    verification,
  };
}

export function buildMiddleEastCompletionDashboard() {
  const index = getMiddleEastLiveBookIndex();
  const queue = buildMiddleEastExpansionQueue();
  const byStrict = new Map();
  const bySoft = new Map();
  for (const book of index.books) {
    byStrict.set(strictBookKey(book), book);
    const soft = softBookKey(book);
    if (!bySoft.has(soft)) bySoft.set(soft, book);
  }

  const rows = queue.queue.map((item) => {
    const live = byStrict.get(strictBookKey(item)) || bySoft.get(softBookKey(item));
    const units = Number(live?.unitCount || 0);
    const lessons = Number(live?.lessonCount || 0);
    const verifiedShell =
      Boolean(live?.bookId) &&
      (live.bookButtonActive || (units > 0 && lessons > 0));
    return {
      country: item.country,
      countryCode: item.countryCode,
      educationalSystem: item.educationalSystem,
      curriculum: item.curriculum,
      academicLevel: item.grade,
      subject: item.subject,
      programType: item.programType,
      bookStatus: live?.bookStatus || 'MISSING',
      bookVersion: live?.version || null,
      bookId: live?.bookId || null,
      units,
      lessons,
      completionPercent: live?.bookId ? (verifiedShell ? 100 : 50) : 0,
      qualityScore: null,
      lastUpdated: live?.updatedAt || null,
      bookButtonActive: verifiedShell,
    };
  });

  const completed = rows.filter((row) => row.bookStatus !== 'MISSING' && row.bookId);
  const totals = {
    totalCountriesCompleted: new Set(
      completed.map((row) => row.countryCode),
    ).size,
    totalEducationalSystems: new Set(
      completed.map((row) => `${row.countryCode}|${row.educationalSystem}`),
    ).size,
    totalCurricula: new Set(
      completed.map((row) => `${row.countryCode}|${row.curriculum}`),
    ).size,
    totalUniversities: completed.filter((row) => row.programType === 'university')
      .length,
    totalColleges: completed.filter((row) => row.programType === 'college').length,
    totalProfessionalPrograms: completed.filter((row) =>
      /professional/i.test(row.programType),
    ).length,
    totalSubjects: queue.totalItems,
    totalBooks: completed.length,
    totalUnits: completed.reduce((sum, row) => sum + (row.units || 0), 0),
    totalLessons: completed.reduce((sum, row) => sum + (row.lessons || 0), 0),
    overallMiddleEastCompletionPercentage: queue.totalItems
      ? round((completed.length / queue.totalItems) * 100)
      : 0,
    liveBooksIndexed: index.books.length,
    remainingMissing: rows.filter((row) => !row.bookId).length,
  };

  return {
    schema: 'success-os.middle-east-completion-dashboard.v1',
    phase: PHASE,
    generatedAt: new Date().toISOString(),
    region: 'Middle East',
    totals,
    rows,
  };
}

export function persistMiddleEastCompletionDashboard(dashboard) {
  const root = ensureDirs();
  const file = path.join(root, 'dashboards', 'MIDDLE-EAST-COMPLETION-DASHBOARD.json');
  fs.writeFileSync(file, JSON.stringify(dashboard, null, 2), 'utf8');
  return file;
}

/**
 * Expand Middle East library in controlled batches.
 * Always rebuilds live index + completion dashboard afterwards.
 */
export function runMiddleEastLibraryExpansion(options = {}) {
  const limit = Math.max(1, Math.min(Number(options.limit) || 25, 200));
  const queue = buildMiddleEastExpansionQueue({
    countries: options.countries || null,
  });
  const index = getMiddleEastLiveBookIndex();
  const existingStrict = new Set(index.books.map((book) => strictBookKey(book)));
  const existingSoft = new Set(index.books.map((book) => softBookKey(book)));

  const missing = queue.queue.filter((item) => {
    return (
      !existingStrict.has(strictBookKey(item)) &&
      !existingSoft.has(softBookKey(item))
    );
  });

  const targets = options.refreshExisting
    ? queue.queue.slice(0, limit)
    : missing.slice(0, limit);

  const results = [];
  for (const item of targets) {
    results.push(generateOrRefreshMiddleEastBook(item));
  }

  const blocked = results.filter((item) => item.blocked);
  const written = results.filter((item) => !item.blocked && item.book);
  const live = rebuildMiddleEastLiveBookIndex();
  const dashboard = buildMiddleEastCompletionDashboard();
  const dashboardPath = persistMiddleEastCompletionDashboard(dashboard);

  const report = {
    schema: 'success-os.middle-east-expansion-report.v1',
    phase: PHASE,
    contentPolicyPhase: CONTENT_POLICY_PHASE,
    scaffoldGenerationAllowed: SCAFFOLD_GENERATION_ALLOWED,
    generatedAt: new Date().toISOString(),
    processed: results.length,
    created: written.filter((item) => item.created).length,
    updated: written.filter((item) => item.updated).length,
    blockedByPhase151: blocked.length,
    blockedReasons: blocked.slice(0, 20).map((item) => ({
      reason: item.reason,
      subject: item.researchPacket?.identity?.subject,
      grade: item.researchPacket?.identity?.grade,
      countryCode: item.researchPacket?.identity?.countryCode,
    })),
    remainingMissing: Math.max(
      0,
      missing.length - written.filter((item) => item.created).length,
    ),
    queueTotal: queue.totalItems,
    liveBooksIndexed: live.index.books.length,
    dashboardTotals: dashboard.totals,
    copyrightedTextCopied: false,
    regionLock: 'Middle East only',
    note: SCAFFOLD_GENERATION_ALLOWED
      ? null
      : 'Phase 15.1 blocks empty/scaffold generation until official lesson-level objectives are verified.',
  };
  const root = ensureDirs();
  const reportPath = path.join(root, 'reports', 'MIDDLE-EAST-EXPANSION-REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  return {
    report,
    reportPath,
    dashboard,
    dashboardPath,
    liveIndexPath: live.indexPath,
    results: results.map((item) => ({
      bookId: item.book?.id || null,
      created: item.created,
      blocked: Boolean(item.blocked),
      reason: item.reason || null,
      verification: item.verification,
      bookButtonActive: item.link?.bookButtonActive || false,
    })),
  };
}

export function middleEastExpansionStatus() {
  const queue = buildMiddleEastExpansionQueue();
  let dashboard = null;
  const dashboardFile = path.join(
    expansionRoot(),
    'dashboards',
    'MIDDLE-EAST-COMPLETION-DASHBOARD.json',
  );
  if (fs.existsSync(dashboardFile)) {
    dashboard = JSON.parse(fs.readFileSync(dashboardFile, 'utf8'));
  }
  return {
    engine: 'SUCCESS OS Middle East Digital Library Expansion',
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    region: 'Middle East',
    queueTotal: queue.totalItems,
    liveBooks: getMiddleEastLiveBookIndex().books.length,
    dashboardTotals: dashboard?.totals || null,
    storageRoot: expansionRoot(),
    nextContinentBlocked: true,
  };
}
