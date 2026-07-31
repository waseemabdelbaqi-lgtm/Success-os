/**
 * Phase 15.1 — Middle East Official Curriculum Knowledge Extraction
 *
 * Policy: never generate empty / scaffold / generic placeholder books.
 * Research official curriculum → extract learning objectives → only then
 * may original Success OS content be authored. If objectives cannot be
 * verified from official sources, STOP and report — do not invent.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  MIDDLE_EAST_COUNTRY_CODES,
  middleEastDossier,
} from '../../data/middle-east-research-registry.js';
import {
  GLOBAL_OFFICIAL_SOURCES,
  MIDDLE_EAST_OFFICIAL_SOURCES,
  officialSourcesForCountry,
} from '../../data/middle-east-official-sources.js';
import { nationalProfile } from '../../data/national-curricula.js';

export const PHASE = 'PHASE_15_1_MIDDLE_EAST_OFFICIAL_CURRICULUM_KNOWLEDGE_EXTRACTION';
export const ENGINE_VERSION = '15.1.0';

/** Scaffold fingerprints from curriculum-content-generator templates. */
export const SCAFFOLD_FINGERPRINTS = [
  'شرح أصلي متدرّج للفكرة الرئيسية',
  'مثال يوضّح الناتج التعليمي مع تفسير المنطق',
  'Verified structure only — original teaching prose required',
  'Pending original',
  'structure-ready-prose-pending',
  'تنشيط المعرفة السابقة المرتبطة بـ',
  'تقديم الناتج التعليمي الرسمي',
];

const MIN_REAL_LESSON_CHARS = 280;
const MIN_REAL_SUMMARY_CHARS = 40;

function rootDir() {
  return process.cwd();
}

function extractionRoot() {
  return path.join(
    rootDir(),
    'library',
    'middle-east-curriculum-extraction',
  );
}

function booksDir() {
  return path.join(rootDir(), 'library', 'global-knowledge', 'books');
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
          educationalSystem: stage.name || dossier.nationalCurriculum?.name,
          curriculumType: 'national',
          curriculum,
          authority,
          stage: stage.name,
          grade,
          subject,
          language: 'ar',
          programType: 'national-school',
        });
      }
    }
  }
  for (const program of list(dossier.internationalCurricula)) {
    rows.push({
      countryCode: code,
      country: dossier.country,
      educationalSystem: 'International',
      curriculumType: 'international',
      curriculum: program.name || program.id || 'International',
      authority: program.authority || 'International curriculum authority',
      stage: 'International',
      grade: program.level || 'IGCSE/Diploma',
      subject: program.focus || program.name || 'International pathway overview',
      language: 'en',
      programType: 'international-school',
    });
  }
  for (const uni of list(dossier.universities).slice(0, 3)) {
    rows.push({
      countryCode: code,
      country: dossier.country,
      educationalSystem: 'Higher Education',
      curriculumType: 'university',
      curriculum: uni.name,
      authority: dossier.ministryOfHigherEducation?.name || authority,
      stage: 'University',
      grade: 'Year 1',
      subject: 'University study skills foundation',
      language: 'ar',
      programType: 'university',
    });
  }
  return rows;
}

function buildResearchQueue() {
  return MIDDLE_EAST_COUNTRY_CODES.flatMap(subjectQueueFromDossier);
}

function ensureDirs() {
  const root = extractionRoot();
  for (const dir of [
    root,
    path.join(root, 'objectives'),
    path.join(root, 'country-reports'),
    path.join(root, 'blocked'),
    path.join(root, 'reports'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return root;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

function text(value) {
  return String(value || '').trim();
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value) {
  return text(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function _lessonBody(lesson) {
  return text(
    lesson?.stepByStepExplanation ||
      lesson?.fullLesson ||
      lesson?.content ||
      lesson?.summary ||
      '',
  );
}

export function isScaffoldProse(value) {
  const body = text(value);
  if (!body) return true;
  return SCAFFOLD_FINGERPRINTS.some((finger) => body.includes(finger));
}

export function evaluateLessonContentDepth(lesson) {
  const explanation = text(
    lesson?.stepByStepExplanation || lesson?.fullLesson || lesson?.content,
  );
  const summary = text(lesson?.summary || lesson?.lessonSummary);
  const examples = list(
    lesson?.practicalExamples || lesson?.workedExamples,
  ).length;
  const objectives = list(
    lesson?.learningOutcomes || lesson?.learningObjectives,
  ).length;
  const scaffold = isScaffoldProse(explanation) || isScaffoldProse(summary);
  const deepEnough =
    !scaffold &&
    explanation.length >= MIN_REAL_LESSON_CHARS &&
    (summary.length >= MIN_REAL_SUMMARY_CHARS || examples > 0);

  return {
    deepEnough,
    scaffold,
    explanationChars: explanation.length,
    summaryChars: summary.length,
    examples,
    objectives,
    hasStepByStep: Boolean(text(lesson?.stepByStepExplanation)),
  };
}

export function evaluateBookContentPolicy(book) {
  const units = list(book?.units);
  const lessons = units.flatMap((unit) => list(unit.lessons));
  const lessonReviews = lessons.map((lesson) =>
    evaluateLessonContentDepth(lesson),
  );
  const realLessons = lessonReviews.filter((item) => item.deepEnough).length;
  const scaffoldLessons = lessonReviews.filter((item) => item.scaffold).length;
  const emptyLessons = lessonReviews.filter(
    (item) => item.explanationChars === 0,
  ).length;
  const references = [
    ...list(book?.references),
    ...lessons.flatMap((lesson) => list(lesson.references)),
  ].filter(Boolean);
  const curriculumAligned = Boolean(
    book?.contentPolicy?.officialObjectivesVerified ||
      book?.middleEastExpansion?.officialObjectivesVerified,
  );

  const status =
    lessons.length === 0
      ? 'EMPTY_BOOK'
      : emptyLessons === lessons.length
        ? 'EMPTY_LESSONS'
        : scaffoldLessons >= Math.ceil(lessons.length * 0.5)
          ? 'SCAFFOLD_NOT_CURRICULUM_COMPLETE'
          : realLessons === lessons.length && references.length > 0
            ? 'CURRICULUM_CONTENT_READY'
            : 'PARTIAL_CONTENT';

  return {
    status,
    publishAllowed: status === 'CURRICULUM_CONTENT_READY' && curriculumAligned,
    units: units.length,
    lessons: lessons.length,
    realLessons,
    scaffoldLessons,
    emptyLessons,
    references: references.length,
    curriculumAligned,
    reason:
      status === 'CURRICULUM_CONTENT_READY'
        ? 'Every lesson has real educational depth and verified curriculum alignment metadata.'
        : 'Book fails Phase 15.1 content policy — research official objectives before publishing original content.',
  };
}

function dossierObjectiveStatus(dossier) {
  const status = text(dossier?.nationalCurriculum?.learningObjectivesStatus);
  if (!status) return 'missing';
  if (/verified-lesson-level|lesson-level.*verified/i.test(status)) {
    return 'verified-lesson-level';
  }
  if (/partial|structure verified|catalogue/i.test(status)) {
    return 'partial-structure-only';
  }
  if (/insufficient|pending|not captured|not fully/i.test(status)) {
    return 'insufficient';
  }
  return 'unknown';
}

function gradeObjectiveHint(dossier, grade) {
  const map = dossier?.nationalCurriculum?.gradeCatalogueStatus || {};
  return map[grade] || map[text(grade)] || null;
}

/**
 * Identify identity + official sources + whether lesson-level objectives
 * are verified. Never invents objectives.
 */
export function researchCurriculumIdentity(item) {
  const code = String(item.countryCode || '').toUpperCase();
  const dossier = middleEastDossier(code);
  const sources = officialSourcesForCountry(code);
  const ministry = dossier?.ministryOfEducation || null;
  const authority = dossier?.curriculumAuthority || null;
  const objectiveStatus = dossierObjectiveStatus(dossier);
  const gradeHint = gradeObjectiveHint(dossier, item.grade);
  const officialUrls = [
    ...list(sources.country).map((source) => source.url),
    ministry?.url,
    authority?.url,
    ...list(dossier?.officialSources).map((source) => source.url || source),
  ].filter(Boolean);

  const identity = {
    country: item.country || dossier?.country || code,
    countryCode: code,
    educationalSystem: item.educationalSystem,
    curriculum: item.curriculum,
    grade: item.grade || item.academicLevel,
    subject: item.subject,
    programType: item.programType || 'national-school',
    language: item.language || 'ar',
  };

  const missing = [];
  if (!ministry?.url && !authority?.url && sources.country.length === 0) {
    missing.push('official-ministry-or-curriculum-portal');
  }
  if (objectiveStatus !== 'verified-lesson-level') {
    missing.push('verified-lesson-level-learning-objectives');
  }
  if (!gradeHint && objectiveStatus === 'partial-structure-only') {
    missing.push(`grade-catalogue-capture:${identity.grade}`);
  }

  const generationAllowed =
    objectiveStatus === 'verified-lesson-level' && missing.length === 0;

  return {
    schema: 'success-os.curriculum-research-packet.v1',
    phase: PHASE,
    identity,
    officialSources: {
      countryPriority: sources.country,
      ministry,
      curriculumAuthority: authority,
      globalPriority: GLOBAL_OFFICIAL_SOURCES,
      urls: [...new Set(officialUrls)],
    },
    learningObjectives: {
      status: objectiveStatus,
      gradeCatalogueStatus: gradeHint,
      extracted: [],
      note:
        objectiveStatus === 'verified-lesson-level'
          ? 'Lesson-level objectives verified in research dossier.'
          : 'STOP: official lesson-level learning objectives are not verified. Do not invent content.',
    },
    generationAllowed,
    blockedReason: generationAllowed
      ? null
      : 'MISSING_OR_UNVERIFIED_OFFICIAL_CURRICULUM_OBJECTIVES',
    missingOfficialInformation: missing,
    copyrightPolicy:
      'Do NOT reproduce copyrighted textbooks. Use standards, objectives, and openly licensed resources only.',
    researchedAt: new Date().toISOString(),
  };
}

/**
 * Hard gate used by expansion / factory before any book write.
 */
export function assertCurriculumResearchComplete(item) {
  const packet = researchCurriculumIdentity(item);
  if (!packet.generationAllowed) {
    const error = new Error(
      `PHASE_15_1_BLOCKED: ${packet.blockedReason} for ${packet.identity.countryCode} / ${packet.identity.grade} / ${packet.identity.subject}`,
    );
    error.code = 'PHASE_15_1_BLOCKED';
    error.researchPacket = packet;
    throw error;
  }
  return packet;
}

export function canGenerateDigitalBook(item) {
  try {
    assertCurriculumResearchComplete(item);
    return { allowed: true, packet: researchCurriculumIdentity(item) };
  } catch (error) {
    return {
      allowed: false,
      reason: error.code || 'PHASE_15_1_BLOCKED',
      packet: error.researchPacket || researchCurriculumIdentity(item),
    };
  }
}

function slugPart(value) {
  return normalize(value)
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function extractionFileFor(item) {
  const code = String(item.countryCode || 'XX').toUpperCase();
  const name = [
    slugPart(item.grade || item.academicLevel),
    slugPart(item.subject),
  ].join('__');
  return path.join(
    extractionRoot(),
    'objectives',
    code,
    `${name || 'subject'}.json`,
  );
}

function extractOfficialObjectives(packet) {
  // Never invent. Only persist verified extractions when present.
  const extracted = list(packet.learningObjectives.extracted);
  return {
    ...packet,
    learningObjectives: {
      ...packet.learningObjectives,
      extracted,
      extractionMethod:
        extracted.length > 0
          ? 'official-document-capture'
          : 'none — awaiting verified official curriculum capture',
    },
  };
}

function scanLibraryBooks() {
  const dir = booksDir();
  if (!fs.existsSync(dir)) return [];
  const meCountries = new Set(
    [
      'Jordan',
      'Saudi Arabia',
      'United Arab Emirates',
      'Qatar',
      'Bahrain',
      'Kuwait',
      'Oman',
      'Egypt',
      'Iraq',
      'Syria',
      'Lebanon',
      'Palestine',
      'Yemen',
      'الأردن',
      'المملكة العربية السعودية',
      'الإمارات',
      'قطر',
      'البحرين',
      'الكويت',
      'عُمان',
      'مصر',
      'العراق',
      'سوريا',
      'لبنان',
      'فلسطين',
      'اليمن',
    ].map(normalize),
  );
  const meCodes = new Set(MIDDLE_EAST_COUNTRY_CODES);
  const results = [];

  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    const book = readJson(path.join(dir, name));
    if (!book) continue;
    const country = text(book.identity?.country);
    const code = text(book.middleEastExpansion?.countryCode).toUpperCase();
    const isMe =
      meCodes.has(code) ||
      meCountries.has(normalize(country)) ||
      /jordan|saudi|emirates|qatar|bahrain|kuwait|oman|egypt|iraq|syria|lebanon|palestine|yemen|الأردن|السعود|الإمارات|قطر|البحرين|الكويت|عمان|مصر|العراق|سوريا|لبنان|فلسطين|اليمن/i.test(
        name,
      );
    if (!isMe) continue;

    const policy = evaluateBookContentPolicy(book);
    results.push({
      bookId: book.id || name.replace(/\.json$/, ''),
      country: country || code,
      countryCode: code || null,
      grade: book.identity?.grade,
      subject: book.identity?.subject,
      ...policy,
    });
  }
  return results;
}

function countryExtractionReport(code, queueRows, bookScan) {
  const dossier = middleEastDossier(code);
  const sources = MIDDLE_EAST_OFFICIAL_SOURCES[code] || [];
  const packets = queueRows.map((row) =>
    extractOfficialObjectives(researchCurriculumIdentity(row)),
  );
  const allowed = packets.filter((packet) => packet.generationAllowed);
  const blocked = packets.filter((packet) => !packet.generationAllowed);
  const countryBooks = bookScan.filter(
    (book) =>
      book.countryCode === code ||
      normalize(book.country) === normalize(dossier?.country),
  );

  return {
    schema: 'success-os.middle-east-country-curriculum-extraction.v1',
    phase: PHASE,
    countryCode: code,
    country: dossier?.country || code,
    officialSources: sources,
    ministryVerified: Boolean(dossier?.ministryOfEducation?.verified),
    learningObjectivesStatus:
      dossier?.nationalCurriculum?.learningObjectivesStatus || 'missing',
    queueSubjects: queueRows.length,
    generationAllowedSubjects: allowed.length,
    blockedSubjects: blocked.length,
    existingBooks: countryBooks.length,
    scaffoldBooks: countryBooks.filter((book) =>
      /SCAFFOLD|EMPTY/.test(book.status),
    ).length,
    curriculumReadyBooks: countryBooks.filter(
      (book) => book.status === 'CURRICULUM_CONTENT_READY',
    ).length,
    blockedSamples: blocked.slice(0, 12).map((packet) => ({
      grade: packet.identity.grade,
      subject: packet.identity.subject,
      reason: packet.blockedReason,
      missing: packet.missingOfficialInformation,
      objectiveStatus: packet.learningObjectives.status,
    })),
  };
}

export function runMiddleEastCurriculumKnowledgeExtraction(options = {}) {
  const started = Date.now();
  const root = ensureDirs();
  const queue = buildResearchQueue();
  const bookScan = scanLibraryBooks();

  const byCountry = {};
  for (const code of MIDDLE_EAST_COUNTRY_CODES) {
    byCountry[code] = [];
  }
  for (const row of queue) {
    const code = String(row.countryCode || '').toUpperCase();
    if (!byCountry[code]) byCountry[code] = [];
    byCountry[code].push(row);
  }

  const countryReports = [];
  let packetsWritten = 0;
  let generationAllowed = 0;
  let generationBlocked = 0;

  for (const code of MIDDLE_EAST_COUNTRY_CODES) {
    const rows = byCountry[code] || [];
    for (const row of rows) {
      const packet = extractOfficialObjectives(researchCurriculumIdentity(row));
      writeJson(extractionFileFor(row), packet);
      packetsWritten += 1;
      if (packet.generationAllowed) generationAllowed += 1;
      else {
        generationBlocked += 1;
        writeJson(
          path.join(
            root,
            'blocked',
            `${code}-${slugPart(row.grade)}-${slugPart(row.subject)}.json`,
          ),
          packet,
        );
      }
    }
    const report = countryExtractionReport(code, rows, bookScan);
    countryReports.push(report);
    writeJson(
      path.join(root, 'country-reports', `${code}-CURRICULUM-EXTRACTION.json`),
      report,
    );
  }

  const scaffoldBooks = bookScan.filter((book) =>
    /SCAFFOLD|EMPTY/.test(book.status),
  );
  const readyBooks = bookScan.filter(
    (book) => book.status === 'CURRICULUM_CONTENT_READY',
  );

  const master = {
    schema: 'success-os.middle-east-curriculum-knowledge-extraction.v1',
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    policy: {
      stopEmptyBooks: true,
      stopGenericAiPlaceholders: true,
      requireOfficialCurriculumResearch: true,
      requireExtractedLearningObjectives: true,
      neverCopyCopyrightedTextbooks: true,
      stopIfCurriculumUnverified: true,
    },
    contentPolicyGates: {
      minLessonChars: MIN_REAL_LESSON_CHARS,
      minSummaryChars: MIN_REAL_SUMMARY_CHARS,
      scaffoldFingerprints: SCAFFOLD_FINGERPRINTS,
    },
    totals: {
      countries: MIDDLE_EAST_COUNTRY_CODES.length,
      queueSubjects: queue.length,
      researchPacketsWritten: packetsWritten,
      generationAllowedSubjects: generationAllowed,
      generationBlockedSubjects: generationBlocked,
      existingMeBooksScanned: bookScan.length,
      scaffoldOrEmptyBooks: scaffoldBooks.length,
      curriculumContentReadyBooks: readyBooks.length,
      durationMs: Date.now() - started,
    },
    nextActions: [
      'Capture lesson-level official learning objectives from Ministry / NCCD / Madrasati / iEN / MoE portals.',
      'Store verified objectives under library/middle-east-curriculum-extraction/objectives/{CC}/.',
      'Only after verified objectives exist, author original Success OS lessons (no textbook copying).',
      'Do not run me:expand content generation until Phase 15.1 gates pass for that subject.',
    ],
    countryReports,
    scaffoldBookSamples: scaffoldBooks.slice(0, 40),
    options,
  };

  const reportFile = path.join(
    root,
    'reports',
    'MIDDLE-EAST-CURRICULUM-KNOWLEDGE-EXTRACTION-REPORT.json',
  );
  writeJson(reportFile, master);
  writeJson(
    path.join(root, 'reports', 'MIDDLE-EAST-SCAFFOLD-BOOK-AUDIT.json'),
    {
      schema: 'success-os.middle-east-scaffold-book-audit.v1',
      phase: PHASE,
      generatedAt: master.generatedAt,
      total: scaffoldBooks.length,
      books: scaffoldBooks,
    },
  );

  return { master, reportFile, root };
}
