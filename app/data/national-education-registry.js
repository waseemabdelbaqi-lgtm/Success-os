/**
 * Success OS National Education Registry
 *
 * Master database for every educational entity in a national curriculum.
 * Jordan (JOR) is the first implementation. Architecture supports unlimited countries.
 *
 * PHASE JO-10 — Jordan National Education Registry
 * Do NOT generate educational content — register existing entities only.
 */

export const REGISTRY_SCHEMA = 'success-os.national-education-registry.v1';
export const REGISTRY_VERSION = '1.0.0';

/**
 * All registerable entity kinds.
 * New countries add data only — never change this list casually.
 */
export const REGISTRY_ENTITY_KINDS = Object.freeze([
  'country',
  'educationalSystem',
  'academicYear',
  'semester',
  'grade',
  'subject',
  'book',
  'unit',
  'lesson',
  'learningOutcome',
  'skill',
  'concept',
  'vocabulary',
  'scientificLaw',
  'mathematicalFormula',
  'laboratoryActivity',
  'educationalImage',
  'diagram',
  'reference',
]);

/** Required metadata on every registry entity. */
export const REGISTRY_REQUIRED_METADATA = Object.freeze([
  'globalId',
  'kind',
  'countryCode',
  'country',
  'label',
  'language',
  'status',
  'createdAt',
  'updatedAt',
]);

/** Search facets supported by the registry index. */
export const REGISTRY_SEARCH_FACETS = Object.freeze([
  'grade',
  'subject',
  'lesson',
  'keyword',
  'formula',
  'scientificTerm',
  'vocabulary',
  'learningOutcome',
  'skill',
  'concept',
]);

/**
 * Parent relationship rules (child → parent kind).
 * Used for validation of broken relationships.
 */
export const REGISTRY_PARENT_RULES = Object.freeze({
  educationalSystem: 'country',
  academicYear: 'educationalSystem',
  grade: 'educationalSystem',
  semester: 'grade',
  subject: 'grade',
  book: 'subject',
  unit: 'book',
  lesson: 'unit',
  learningOutcome: 'lesson',
  skill: 'learningOutcome', // primary; also linked to lessons
  concept: 'lesson',
  vocabulary: 'lesson',
  scientificLaw: 'lesson',
  mathematicalFormula: 'lesson',
  laboratoryActivity: 'lesson',
  educationalImage: 'lesson',
  diagram: 'lesson',
  reference: 'lesson',
});

export function registrySlug(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\u064b-\u065f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'unknown';
}

export function registryCountryPrefix(code) {
  const c = String(code || '')
    .trim()
    .toUpperCase();
  if (c === 'JO' || c === 'JOR' || c === 'JORDAN') return 'JOR';
  if (c.length === 3) return c;
  if (c.length === 2) {
    const map = {
      SA: 'SAU',
      AE: 'ARE',
      QA: 'QAT',
      KW: 'KWT',
      OM: 'OMN',
      BH: 'BHR',
      EG: 'EGY',
      IQ: 'IRQ',
      SY: 'SYR',
      LB: 'LBN',
      PS: 'PSE',
      YE: 'YEM',
      US: 'USA',
      GB: 'GBR',
      UK: 'GBR',
      CA: 'CAN',
      AU: 'AUS',
      DE: 'DEU',
      FR: 'FRA',
    };
    return map[c] || `${c}X`;
  }
  return c.slice(0, 3) || 'XXX';
}

/**
 * Map grade labels → stable grade codes (GKG, G01…G12).
 * Deterministic — do not change once IDs are issued.
 */
export function gradeCodeFromLabel(label) {
  const t = String(label || '').trim();
  if (/رياض|kg|kindergarten|روضة/i.test(t)) return 'GKG';
  const m = t.match(/(\d{1,2})/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 12) return `G${String(n).padStart(2, '0')}`;
  }
  return `G${registrySlug(t).slice(0, 6).toUpperCase()}`;
}

/**
 * Map subject labels → stable subject codes.
 * Order matters: PE/Arts/Islamic must be matched before generic "رياض" (math).
 */
export function subjectCodeFromLabel(label) {
  const t = String(label || '').trim();
  if (/تربي.*رياضي|physical\s*education|\bpe\b/i.test(t)) return 'PE';
  if (/فني|موسيق|مسرح|art|music|theatre|theater/i.test(t)) return 'ARTS';
  if (/اسلام|إسلام|islamic/i.test(t)) return 'ISL';
  if (/مهارات.*رقمي|digital|\bict\b|computer/i.test(t)) return 'ICT';
  if (/اجتماعي|social/i.test(t)) return 'SOC';
  if (/انجليز|إنجليز|english/i.test(t)) return 'ENG';
  if (/عربي|arabic/i.test(t)) return 'ARAB';
  if (/علوم|science/i.test(t)) return 'SCI';
  if (/رياضيات\s*ال?مبكرة|early\s*math/i.test(t)) return 'EMATH';
  if (/رياضيات|(^|[^اأإ])math/i.test(t) || /math/i.test(t)) return 'MATH';
  return registrySlug(t)
    .replace(/-/g, '')
    .slice(0, 8)
    .toUpperCase() || 'SUBJ';
}

export function padSeq(n, width = 6) {
  return String(n).padStart(width, '0');
}

/**
 * Hierarchical Global ID builders for structural entities.
 * Format examples:
 *   JOR-G01
 *   JOR-G01-MATH
 *   JOR-G01-MATH-U01
 *   JOR-G01-MATH-U01-L05
 */
export function buildStructuralId(prefix, parts) {
  return [prefix, ...parts.filter(Boolean)].join('-');
}

/**
 * Sequential Global ID kinds (immutable once allocated).
 * Examples: JOR-CONCEPT-000145, JOR-SKILL-000083, JOR-REFERENCE-000972
 */
export const SEQUENTIAL_ID_KINDS = Object.freeze({
  concept: 'CONCEPT',
  skill: 'SKILL',
  vocabulary: 'VOCAB',
  learningOutcome: 'OUTCOME',
  scientificLaw: 'LAW',
  mathematicalFormula: 'FORMULA',
  laboratoryActivity: 'LAB',
  educationalImage: 'IMAGE',
  diagram: 'DIAGRAM',
  reference: 'REFERENCE',
  academicYear: 'YEAR',
  semester: 'SEM',
  educationalSystem: 'SYS',
  book: 'BOOK',
  country: 'COUNTRY',
});

export function createRegistryMetadata({
  globalId,
  kind,
  countryCode,
  country,
  label,
  language = 'ar',
  status = 'active',
  parentId = null,
  relationships = {},
  createdAt = null,
  updatedAt = null,
  extra = {},
}) {
  const now = new Date().toISOString();
  return {
    globalId,
    kind,
    countryCode: registryCountryPrefix(countryCode),
    country,
    label,
    language,
    status,
    parentId,
    relationships,
    createdAt: createdAt || now,
    updatedAt: updatedAt || now,
    ...extra,
  };
}

export function validateRegistryMetadata(entity) {
  const missing = REGISTRY_REQUIRED_METADATA.filter((key) => {
    const v = entity?.[key];
    return v === undefined || v === null || v === '';
  });
  return { ok: missing.length === 0, missing };
}
