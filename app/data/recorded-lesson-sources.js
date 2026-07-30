/**
 * Recorded Lessons — Lesson Source taxonomy (approved).
 *
 * Top-level sources only:
 *   ALL | S4S_INTELLIGENCE | TEACHER_RECORDED
 *
 * Teacher gender is NOT a top-level source. It is an optional
 * privacy-safe filter under TEACHER_RECORDED only.
 */

export const RECORDED_LESSON_SOURCES = Object.freeze([
  {
    id: 'ALL',
    label: 'All',
    sectionTitle: 'All Lessons',
    description: 'All lesson sources',
    recommended: false,
  },
  {
    id: 'S4S_INTELLIGENCE',
    label: 'S4S Intelligence',
    sectionTitle: 'S4S Intelligence',
    description: 'Official AI-produced recorded courses from Success 4 Sure Intelligence',
    recommended: true,
  },
  {
    id: 'TEACHER_RECORDED',
    label: 'Teachers',
    sectionTitle: 'Teacher Lessons',
    description: 'Human teacher recorded courses',
    recommended: false,
  },
]);

export const RECORDED_LESSON_SOURCE_IDS = Object.freeze(
  RECORDED_LESSON_SOURCES.map((s) => s.id),
);

/** Concrete producer sources (excludes ALL). */
export const RECORDED_LESSON_CONCRETE_SOURCES = Object.freeze(
  RECORDED_LESSON_SOURCES.filter((s) => s.id !== 'ALL').map((s) => s.id),
);

/**
 * Canonical teacher gender values for optional TEACHER_RECORDED filter.
 * Privacy-safe: prefer_not_to_say / not_specified never expose private identity.
 */
export const TEACHER_GENDER_VALUES = Object.freeze([
  'male',
  'female',
  'prefer_not_to_say',
  'not_specified',
]);

/**
 * Normalize legacy / loose source ids to the approved taxonomy.
 * Maps removed top-level female_teacher → TEACHER_RECORDED.
 */
export function normalizeLessonSource(value) {
  const v = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (!v || v === 'ALL' || v === '*') return 'ALL';

  if (
    v === 'S4S' ||
    v === 'S4S_AI' ||
    v === 'INTELLIGENCE' ||
    v === 'S4S_INTELLIGENCE'
  ) {
    return 'S4S_INTELLIGENCE';
  }

  if (
    v === 'TEACHER' ||
    v === 'TEACHERS' ||
    v === 'TEACHER_RECORDED' ||
    v === 'FEMALE_TEACHER' || // legacy top-level source — corrected
    v === 'FEMALE' ||
    v === 'MALE_TEACHER'
  ) {
    return 'TEACHER_RECORDED';
  }

  // Accept lowercase legacy ids from older catalogs
  const lower = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (lower === 's4s_intelligence') return 'S4S_INTELLIGENCE';
  if (lower === 'teacher' || lower === 'teacher_recorded' || lower === 'female_teacher') {
    return 'TEACHER_RECORDED';
  }
  if (lower === 'all') return 'ALL';

  if (RECORDED_LESSON_SOURCE_IDS.includes(v)) return v;
  return null;
}

export function normalizeTeacherGender(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (!v || v === 'all' || v === '*') return 'all';
  if (v === 'prefer_not' || v === 'prefer_not_say') return 'prefer_not_to_say';
  if (v === 'unspecified' || v === 'unknown') return 'not_specified';
  if (TEACHER_GENDER_VALUES.includes(v)) return v;
  return null;
}

export function lessonSourceLabel(id) {
  const normalized = normalizeLessonSource(id);
  const hit = RECORDED_LESSON_SOURCES.find((s) => s.id === normalized);
  return hit?.label || id || '—';
}

export function matchesLessonSourceFilter(rowSource, filter) {
  const normalizedFilter = normalizeLessonSource(filter);
  if (!normalizedFilter || normalizedFilter === 'ALL') return true;
  const row = normalizeLessonSource(rowSource);
  return row === normalizedFilter;
}

export function isTeacherRecordedSource(source) {
  return normalizeLessonSource(source) === 'TEACHER_RECORDED';
}

export function isS4sIntelligenceSource(source) {
  return normalizeLessonSource(source) === 'S4S_INTELLIGENCE';
}
