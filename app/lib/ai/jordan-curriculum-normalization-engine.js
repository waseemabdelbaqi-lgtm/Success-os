/**
 * PHASE JO-08 — Jordan Curriculum Normalization Engine
 *
 * Maps Jordan National Curriculum into the Success OS Universal Education Model.
 * Does NOT generate educational content. Does NOT create books.
 */

import path from 'node:path';
import { createNormalizationEngine } from './universal-education-model-engine.js';
import { isJordanNationalBookId } from '../../data/jordan-national-knowledge-sources.js';
import { listLibraryBooks } from './library-store.js';
import { readJordanReferenceLibrary } from './jordan-educational-reference-library-engine.js';

export const PHASE = 'JO-08_JORDAN_CURRICULUM_NORMALIZATION';
export const ENGINE_VERSION = '8.0.0';

function list(v) {
  return Array.isArray(v) ? v : [];
}

function text(v) {
  return String(v || '').trim();
}

function uemRoot() {
  return path.join(process.cwd(), 'library', 'universal-education-model');
}

function extractLessonSkills(lesson) {
  const fromOutcomes = list(lesson.learningOutcomes || lesson.learningObjectives);
  const fromAlignment = list(lesson.curriculumAlignment?.requiredSkills);
  const fromPath = list(lesson.skillsGained);
  return [...new Set([...fromAlignment, ...fromPath, ...fromOutcomes.slice(0, 2)])].filter(
    Boolean,
  );
}

function booksToPayload() {
  const all = listLibraryBooks().filter((b) => isJordanNationalBookId(b.id));
  const produced = all.filter((b) => b.jo02?.producedAt);
  const books = (produced.length ? produced : all).map((book, bookIndex) => {
    const identity = book.identity || {};
    return {
      legacyBookId: book.id,
      bookId: book.id,
      grade: identity.grade,
      gradeKey: identity.grade,
      subject: identity.subject,
      subjectKey: identity.subject,
      language: identity.language || 'ar',
      title: book.cover?.title || `Success OS — ${identity.subject}`,
      officialSource:
        book.jo05?.referenceSourceIds?.[0] ||
        list(book.references)[0]?.url ||
        'https://www.nccd.gov.jo/Ar/Pages/textbooks',
      verificationStatus: book.jo03?.verificationStatus === 'ADMIN_APPROVED_PUBLISHED' ||
        book.jo03?.verificationStatus === 'VERIFIED_PENDING_ADMIN'
        ? 'verified'
        : book.jo02?.producedAt
          ? 'verified'
          : 'pending-verification',
      semesters: ['الفصل الأول', 'الفصل الثاني'],
      units: list(book.units).map((unit, ui) => ({
        unitId: unit.id || unit.unitId || `U${ui + 1}`,
        unitKey: unit.id || unit.unitId || unit.title || `U${ui + 1}`,
        title: unit.title || unit.titleAr,
        sequence: ui + 1,
        lessons: list(unit.lessons).map((lesson, li) => ({
          lessonId: lesson.id || `L${ui + 1}.${li + 1}`,
          lessonKey: lesson.id || lesson.title || `L${ui + 1}.${li + 1}`,
          title: lesson.title,
          sequence: li + 1,
          topic: lesson.title,
          learningOutcomes: list(lesson.learningOutcomes || lesson.learningObjectives),
          keyConcepts: list(lesson.keyConcepts),
          scientificConcepts: list(lesson.scientificConcepts),
          concepts: list(lesson.keyConcepts).concat(list(lesson.scientificConcepts)),
          skills: extractLessonSkills(lesson),
          skillsGained: extractLessonSkills(lesson),
          vocabulary: [
            ...list(lesson.vocabulary),
            ...list(lesson.keyVocabulary),
            ...list(lesson.definitions),
            ...list(lesson.scientificTerms),
          ],
          definitions: list(lesson.definitions),
          verificationStatus: lesson.adminReview?.status === 'REJECTED' ? 'pending-verification' : 'verified',
        })),
      })),
      _order: bookIndex,
    };
  });

  const refLib = readJordanReferenceLibrary();
  const references = list(refLib?.sources).map((s) => ({
    sourceId: s.sourceId,
    title: s.title,
    name: s.title,
    publisher: s.publisher,
    category: s.category,
    url: s.officialUrl,
    officialUrl: s.officialUrl,
    status: s.status,
    language: s.language || 'ar',
  }));

  return {
    countryAr: 'الأردن',
    educationalSystem: 'Jordan National Curriculum',
    systemKey: 'national',
    systemType: 'national',
    academicYear: '2025-2026',
    language: 'ar',
    officialSource: 'https://www.nccd.gov.jo/Ar/Pages/textbooks',
    books,
    references,
  };
}

let engineSingleton = null;

export function getJordanNormalizationEngine() {
  if (engineSingleton) return engineSingleton;
  engineSingleton = createNormalizationEngine({
    countryCode: 'JO',
    country: 'Jordan',
    rootDir: uemRoot(),
    buildCountryPayload: () => booksToPayload(),
  });
  return engineSingleton;
}

export function normalizeJordanCurriculum(options = {}) {
  return getJordanNormalizationEngine().runNormalization(options);
}

export function buildJordanNormalizationDashboard() {
  return getJordanNormalizationEngine().buildDashboard();
}

export function readUniversalEducationModel() {
  return getJordanNormalizationEngine().readRegistry();
}

export function runJordanCurriculumNormalization(options = {}) {
  if (options.dashboardOnly) {
    return { dashboard: buildJordanNormalizationDashboard() };
  }
  const result = normalizeJordanCurriculum(options);
  return {
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    countryCode: 'JO',
    normalizationStatus: result.normalization.status,
    validationStatus: result.validation.ok ? 'passed' : 'failed',
    totals: result.registry.countryTotals?.JO || result.registry.totals,
    stats: result.normalization.stats,
    dashboard: result.dashboard,
    issueCount: result.validation.issues.length,
  };
}
