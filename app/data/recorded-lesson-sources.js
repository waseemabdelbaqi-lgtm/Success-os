/**
 * Recorded Lessons — Lesson Source filter options.
 * Used by Enterprise Admin Recorded Lessons module (and shared catalogs).
 */

export const RECORDED_LESSON_SOURCES = Object.freeze([
  {
    id: 's4s_intelligence',
    label: 'S4S Intelligence',
    description: 'AI-produced recorded lessons from Success 4 Sure Intelligence',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    description: 'Human teacher recorded lessons',
  },
  {
    id: 'female_teacher',
    label: 'Female Teacher',
    description: 'Recorded lessons from female teachers',
  },
  {
    id: 'all',
    label: 'All',
    description: 'All lesson sources',
  },
]);

export const RECORDED_LESSON_SOURCE_IDS = Object.freeze(
  RECORDED_LESSON_SOURCES.map((s) => s.id),
);

/** Sources that match a concrete producer (excludes "all"). */
export const RECORDED_LESSON_CONCRETE_SOURCES = Object.freeze(
  RECORDED_LESSON_SOURCES.filter((s) => s.id !== 'all').map((s) => s.id),
);

export function normalizeLessonSource(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (!v || v === 'all') return 'all';
  if (v === 's4s' || v === 's4s_ai' || v === 'intelligence') return 's4s_intelligence';
  if (v === 'female' || v === 'female-teacher') return 'female_teacher';
  if (RECORDED_LESSON_SOURCE_IDS.includes(v)) return v;
  return null;
}

export function lessonSourceLabel(id) {
  const hit = RECORDED_LESSON_SOURCES.find((s) => s.id === id);
  return hit?.label || id || '—';
}

export function matchesLessonSourceFilter(rowSource, filter) {
  const normalizedFilter = normalizeLessonSource(filter);
  if (!normalizedFilter || normalizedFilter === 'all') return true;
  const row = normalizeLessonSource(rowSource);
  return row === normalizedFilter;
}
