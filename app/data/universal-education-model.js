/**
 * Success OS Universal Education Model (UEM)
 *
 * Permanent educational architecture. Every country maps into this model.
 * Never redesign for a new country — only add data.
 *
 * PHASE JO-08 establishes Jordan as the first implementation.
 */

export const UEM_SCHEMA = 'success-os.universal-education-model.v1';
export const UEM_VERSION = '1.0.0';

/** Entity kinds in the universal hierarchy (+ shared knowledge nodes). */
export const UEM_ENTITY_KINDS = Object.freeze([
  'country',
  'educationalSystem',
  'academicYear',
  'grade',
  'semester',
  'subject',
  'book',
  'unit',
  'lesson',
  'topic',
  'subtopic',
  'learningOutcome',
  'concept',
  'skill',
  'vocabulary',
  'reference',
]);

/**
 * System types supported without structural change.
 * National curricula, HE, vocational, certifications, AI content.
 */
export const UEM_SYSTEM_TYPES = Object.freeze([
  'national',
  'higher-education',
  'vocational',
  'professional-certification',
  'international-pathway', // reserved; JO-08 excludes for Jordan national normalize
  'ai-generated',
]);

export const UEM_STATUSES = Object.freeze([
  'active',
  'draft',
  'archived',
  'deprecated',
  'pending-verification',
  'verified',
]);

/** Standard metadata required on every educational object. */
export const UEM_REQUIRED_METADATA = Object.freeze([
  'universalId',
  'country',
  'educationSystem',
  'language',
  'academicYear',
  'version',
  'officialSource',
  'verificationStatus',
  'createdDate',
  'updatedDate',
  'status',
]);

/**
 * Stable slug for IDs — deterministic, never random.
 * Changing this function breaks permanence — do not alter casually.
 */
export function uemSlug(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\u064b-\u065f]/g, '') // Arabic diacritics
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'unknown';
}

export function uemCountryCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .slice(0, 3);
}

/**
 * Permanent Universal ID builders.
 * Format: uem:<kind>:<country>:<…stable path…>
 * IDs must never change once published into the model.
 */
export const uemId = {
  country: (code) => `uem:country:${uemSlug(code)}`,
  educationalSystem: (code, systemKey) =>
    `uem:system:${uemSlug(code)}:${uemSlug(systemKey)}`,
  academicYear: (code, systemKey, year) =>
    `uem:year:${uemSlug(code)}:${uemSlug(systemKey)}:${uemSlug(year)}`,
  grade: (code, systemKey, gradeKey) =>
    `uem:grade:${uemSlug(code)}:${uemSlug(systemKey)}:${uemSlug(gradeKey)}`,
  semester: (code, systemKey, gradeKey, semesterKey) =>
    `uem:semester:${uemSlug(code)}:${uemSlug(systemKey)}:${uemSlug(gradeKey)}:${uemSlug(semesterKey)}`,
  subject: (code, systemKey, subjectKey) =>
    `uem:subject:${uemSlug(code)}:${uemSlug(systemKey)}:${uemSlug(subjectKey)}`,
  book: (code, systemKey, gradeKey, subjectKey, language = 'ar') =>
    `uem:book:${uemSlug(code)}:${uemSlug(systemKey)}:${uemSlug(gradeKey)}:${uemSlug(subjectKey)}:${uemSlug(language)}`,
  unit: (bookId, unitKey) => `${bookId}:unit:${uemSlug(unitKey)}`,
  lesson: (unitId, lessonKey) => `${unitId}:lesson:${uemSlug(lessonKey)}`,
  topic: (lessonId, topicKey) => `${lessonId}:topic:${uemSlug(topicKey)}`,
  subtopic: (topicId, subtopicKey) => `${topicId}:subtopic:${uemSlug(subtopicKey)}`,
  learningOutcome: (lessonId, outcomeKey) =>
    `${lessonId}:outcome:${uemSlug(outcomeKey)}`,
  /** Country-scoped reusable concept — shared across subjects when term matches. */
  concept: (code, conceptKey) => `uem:concept:${uemSlug(code)}:${uemSlug(conceptKey)}`,
  skill: (code, skillKey) => `uem:skill:${uemSlug(code)}:${uemSlug(skillKey)}`,
  vocabulary: (code, termKey, language = 'ar') =>
    `uem:vocab:${uemSlug(code)}:${uemSlug(language)}:${uemSlug(termKey)}`,
  reference: (code, referenceKey) =>
    `uem:reference:${uemSlug(code)}:${uemSlug(referenceKey)}`,
};

export function createUemMetadata({
  universalId,
  country,
  countryCode,
  educationSystem,
  language = 'ar',
  academicYear = '2025-2026',
  version = '1.0.0',
  officialSource = null,
  verificationStatus = 'verified',
  status = 'active',
  createdDate = null,
  updatedDate = null,
  extra = {},
}) {
  const now = new Date().toISOString();
  return {
    universalId,
    country,
    countryCode: uemCountryCode(countryCode),
    educationSystem,
    language,
    academicYear,
    version,
    officialSource,
    verificationStatus,
    createdDate: createdDate || now,
    updatedDate: updatedDate || now,
    status,
    ...extra,
  };
}

export function validateUemMetadata(obj) {
  const missing = UEM_REQUIRED_METADATA.filter((key) => {
    const value = obj?.[key];
    return value === undefined || value === null || value === '';
  });
  return { ok: missing.length === 0, missing };
}
