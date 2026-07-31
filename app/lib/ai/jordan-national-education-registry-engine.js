/**
 * PHASE JO-10 — Jordan National Education Registry
 *
 * Master registry for every Jordanian National Curriculum entity.
 * Does NOT generate educational content.
 * Single source of truth for all Success OS Jordan modules.
 */

import path from 'node:path';
import { createNationalEducationRegistry } from './national-education-registry-engine.js';
import { isJordanNationalBookId } from '../../data/jordan-national-knowledge-sources.js';
import { listLibraryBooks } from './library-store.js';
import { readJordanReferenceLibrary } from './jordan-educational-reference-library-engine.js';
import {
  REGISTRY_VERSION,
  REGISTRY_ENTITY_KINDS,
  REGISTRY_SEARCH_FACETS,
} from '../../data/national-education-registry.js';

export const PHASE = 'JO-10_JORDAN_NATIONAL_EDUCATION_REGISTRY';
export const ENGINE_VERSION = '10.0.0';

function list(v) {
  return Array.isArray(v) ? v : [];
}

function _text(v) {
  return String(v || '').trim();
}

function registryRoot() {
  return path.join(process.cwd(), 'library', 'national-education-registry');
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
  const books = (produced.length ? produced : all).map((book) => {
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
      semesters: ['الفصل الأول', 'الفصل الثاني'],
      units: list(book.units).map((unit, ui) => ({
        unitId: unit.id || unit.unitId || `U${ui + 1}`,
        title: unit.title || unit.titleAr,
        sequence: ui + 1,
        lessons: list(unit.lessons).map((lesson, li) => ({
          lessonId: lesson.id || `L${ui + 1}.${li + 1}`,
          title: lesson.title,
          sequence: li + 1,
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
          rulesLawsFormulas: list(lesson.rulesLawsFormulas),
          formulas: list(lesson.formulasVerified || lesson.formulas),
          formulasVerified: list(lesson.formulasVerified),
          laws: list(lesson.laws),
          laboratoryActivities: list(
            lesson.laboratoryActivities || lesson.labs || lesson.experiments,
          ),
          illustrations: list(lesson.illustrations),
          educationalImages: list(lesson.educationalImages || lesson.images),
          diagrams: list(lesson.diagrams),
          visualRecommendations: list(lesson.visualRecommendations),
          references: list(lesson.references),
        })),
      })),
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

export function getJordanNationalEducationRegistry() {
  if (engineSingleton) return engineSingleton;
  engineSingleton = createNationalEducationRegistry({
    countryCode: 'JO',
    country: 'Jordan',
    rootDir: registryRoot(),
    buildCountryPayload: () => booksToPayload(),
  });
  return engineSingleton;
}

export function registerJordanNationalEducation(options = {}) {
  return getJordanNationalEducationRegistry().runRegistration(options);
}

export function buildJordanNationalEducationRegistryDashboard() {
  return getJordanNationalEducationRegistry().buildDashboard();
}

export function searchJordanNationalEducationRegistry(query, options = {}) {
  return getJordanNationalEducationRegistry().search(query, options);
}

export function readJordanNationalEducationRegistry() {
  return getJordanNationalEducationRegistry().readRegistry();
}

export function getJordanRegistryEntity(globalId) {
  return getJordanNationalEducationRegistry().getEntity(globalId);
}

export function runJordanNationalEducationRegistry(options = {}) {
  if (options.dashboardOnly) {
    return { dashboard: buildJordanNationalEducationRegistryDashboard() };
  }
  if (options.search != null) {
    return searchJordanNationalEducationRegistry(options.search, options);
  }
  const result = registerJordanNationalEducation(options);
  return {
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    registryVersion: REGISTRY_VERSION,
    countryCode: 'JOR',
    registrationStatus: result.registration.status,
    validationOk: result.validation.ok,
    validationErrors: result.validation.validationErrors,
    missingRelationships: result.validation.missingRelationships,
    totals: result.registry.countryTotals?.JOR || result.registry.totals,
    stats: result.registration.stats,
    searchDocuments: result.registry.searchDocumentCount,
    dashboard: result.dashboard,
    entityKinds: REGISTRY_ENTITY_KINDS.length,
    searchFacets: REGISTRY_SEARCH_FACETS,
    rule: 'Single source of truth. No module may create independent educational data outside the registry.',
  };
}
