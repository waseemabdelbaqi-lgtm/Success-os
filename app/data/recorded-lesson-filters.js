/**
 * Recorded Lessons catalog filters + sort.
 *
 * Cascade:
 * Country → Curriculum → Grade → Subject → Teacher Gender →
 * Language → Price → Rating → Duration → Newest/Popularity → Results
 */

import {
  matchesLessonSourceFilter,
  normalizeLessonSource,
} from './recorded-lesson-sources.js';

export const TEACHER_GENDERS = Object.freeze([
  { id: 'all', label: 'All' },
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
]);

export const LESSON_LANGUAGES = Object.freeze([
  { id: 'all', label: 'All' },
  { id: 'ar', label: 'Arabic' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'French' },
]);

export const PRICE_FILTERS = Object.freeze([
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
  { id: 'under_10', label: 'Under 10' },
  { id: 'under_25', label: 'Under 25' },
  { id: 'under_50', label: 'Under 50' },
]);

export const RATING_FILTERS = Object.freeze([
  { id: 'all', label: 'All' },
  { id: '3_plus', label: '3.0+' },
  { id: '4_plus', label: '4.0+' },
  { id: '4_5_plus', label: '4.5+' },
]);

export const DURATION_FILTERS = Object.freeze([
  { id: 'all', label: 'All' },
  { id: 'under_15', label: 'Under 15 min' },
  { id: '15_30', label: '15–30 min' },
  { id: '30_60', label: '30–60 min' },
  { id: 'over_60', label: 'Over 60 min' },
]);

export const SORT_OPTIONS = Object.freeze([
  { id: 'newest', label: 'Newest' },
  { id: 'popularity', label: 'Popularity' },
  { id: 'rating', label: 'Rating' },
  { id: 'price_asc', label: 'Price: low to high' },
  { id: 'price_desc', label: 'Price: high to low' },
  { id: 'duration', label: 'Duration' },
]);

/** Ordered filter steps for UI (matches product wireframe). */
export const RECORDED_LESSON_FILTER_STEPS = Object.freeze([
  { key: 'country', label: 'Country' },
  { key: 'curriculum', label: 'Curriculum' },
  { key: 'grade', label: 'Grade' },
  { key: 'subject', label: 'Subject' },
  { key: 'teacherGender', label: 'Teacher Gender' },
  { key: 'language', label: 'Language' },
  { key: 'price', label: 'Price' },
  { key: 'rating', label: 'Rating' },
  { key: 'duration', label: 'Duration' },
  { key: 'sort', label: 'Sort' },
  { key: 'results', label: 'Results' },
]);

export function defaultRecordedLessonFilters() {
  return {
    country: 'all',
    curriculum: 'all',
    grade: 'all',
    subject: 'all',
    teacherGender: 'all',
    language: 'all',
    price: 'all',
    rating: 'all',
    duration: 'all',
    lessonSource: 'all',
    sort: 'newest',
    q: '',
  };
}

function norm(v) {
  return String(v || '')
    .trim()
    .toLowerCase();
}

function emptyToAll(v) {
  const t = String(v || '').trim();
  return !t || t === '*' ? 'all' : t;
}

export function parseRecordedLessonFilters(input = {}) {
  const base = defaultRecordedLessonFilters();
  return {
    country: emptyToAll(input.country ?? input.countryId ?? base.country),
    curriculum: emptyToAll(input.curriculum ?? input.curriculumId ?? base.curriculum),
    grade: emptyToAll(input.grade ?? input.gradeId ?? base.grade),
    subject: emptyToAll(input.subject ?? input.subjectId ?? base.subject),
    teacherGender: emptyToAll(input.teacherGender ?? base.teacherGender).toLowerCase(),
    language: emptyToAll(input.language ?? base.language).toLowerCase(),
    price: emptyToAll(input.price ?? base.price).toLowerCase(),
    rating: emptyToAll(input.rating ?? base.rating).toLowerCase(),
    duration: emptyToAll(input.duration ?? base.duration).toLowerCase(),
    lessonSource: normalizeLessonSource(input.lessonSource) || 'all',
    sort: emptyToAll(input.sort ?? base.sort).toLowerCase(),
    q: String(input.q || input.search || '').trim(),
  };
}

function matchesPrice(row, filter) {
  if (!filter || filter === 'all') return true;
  const price = Number(row.price);
  const isFree = !Number.isFinite(price) || price <= 0 || row.isFree === true;
  if (filter === 'free') return isFree;
  if (filter === 'paid') return !isFree;
  if (!Number.isFinite(price)) return false;
  if (filter === 'under_10') return price < 10;
  if (filter === 'under_25') return price < 25;
  if (filter === 'under_50') return price < 50;
  return true;
}

function matchesRating(row, filter) {
  if (!filter || filter === 'all') return true;
  const rating = Number(row.rating);
  if (!Number.isFinite(rating)) return false;
  if (filter === '3_plus') return rating >= 3;
  if (filter === '4_plus') return rating >= 4;
  if (filter === '4_5_plus') return rating >= 4.5;
  return true;
}

function matchesDuration(row, filter) {
  if (!filter || filter === 'all') return true;
  const mins = Number(row.durationMinutes ?? row.duration);
  if (!Number.isFinite(mins)) return false;
  if (filter === 'under_15') return mins < 15;
  if (filter === '15_30') return mins >= 15 && mins <= 30;
  if (filter === '30_60') return mins > 30 && mins <= 60;
  if (filter === 'over_60') return mins > 60;
  return true;
}

function fieldMatch(rowValue, filter) {
  if (!filter || filter === 'all') return true;
  return norm(rowValue) === norm(filter);
}

/**
 * Apply catalog filters (excluding pagination).
 */
export function filterRecordedLessons(items, rawFilters = {}) {
  const f = parseRecordedLessonFilters(rawFilters);
  const q = f.q.toLowerCase();
  return (Array.isArray(items) ? items : []).filter((row) => {
    if (q) {
      const hay = [
        row.title,
        row.name,
        row.subject,
        row.grade,
        row.curriculum,
        row.country,
        row.teacherName,
        row.language,
      ]
        .map((x) => String(x || '').toLowerCase())
        .join(' ');
      if (!hay.includes(q)) return false;
    }
    if (!fieldMatch(row.country || row.countryId, f.country)) return false;
    if (!fieldMatch(row.curriculum || row.curriculumId, f.curriculum)) return false;
    if (!fieldMatch(row.grade || row.gradeId, f.grade)) return false;
    if (!fieldMatch(row.subject || row.subjectId, f.subject)) return false;
    if (!fieldMatch(row.teacherGender || row.gender, f.teacherGender)) return false;
    if (!fieldMatch(row.language, f.language)) return false;
    if (!matchesPrice(row, f.price)) return false;
    if (!matchesRating(row, f.rating)) return false;
    if (!matchesDuration(row, f.duration)) return false;
    if (!matchesLessonSourceFilter(row.lessonSource, f.lessonSource)) return false;
    return true;
  });
}

export function sortRecordedLessons(items, sort = 'newest') {
  const mode = emptyToAll(sort).toLowerCase();
  const list = [...(Array.isArray(items) ? items : [])];
  const byNum = (getter, dir = -1) =>
    list.sort((a, b) => {
      const av = Number(getter(a));
      const bv = Number(getter(b));
      const an = Number.isFinite(av) ? av : dir > 0 ? Infinity : -Infinity;
      const bn = Number.isFinite(bv) ? bv : dir > 0 ? Infinity : -Infinity;
      return (an - bn) * dir;
    });

  if (mode === 'popularity') {
    return byNum((r) => r.popularity ?? r.views ?? r.enrollments ?? 0, -1);
  }
  if (mode === 'rating') {
    return byNum((r) => r.rating ?? 0, -1);
  }
  if (mode === 'price_asc') {
    return byNum((r) => (r.isFree ? 0 : r.price ?? 0), 1);
  }
  if (mode === 'price_desc') {
    return byNum((r) => (r.isFree ? 0 : r.price ?? 0), -1);
  }
  if (mode === 'duration') {
    return byNum((r) => r.durationMinutes ?? r.duration ?? 0, 1);
  }
  // newest (default)
  return list.sort((a, b) => {
    const av = a.publishedAt || a.createdAt || a.updatedAt || '';
    const bv = b.publishedAt || b.createdAt || b.updatedAt || '';
    if (av < bv) return 1;
    if (av > bv) return -1;
    return 0;
  });
}

function uniqueSorted(values) {
  return [...new Set(values.map((v) => String(v || '').trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * Build cascading facet options from the current item set (pre-filter cascade).
 */
export function buildRecordedLessonFacets(items = []) {
  const rows = Array.isArray(items) ? items : [];
  return {
    countries: uniqueSorted(rows.map((r) => r.country || r.countryId)),
    curricula: uniqueSorted(rows.map((r) => r.curriculum || r.curriculumId)),
    grades: uniqueSorted(rows.map((r) => r.grade || r.gradeId)),
    subjects: uniqueSorted(rows.map((r) => r.subject || r.subjectId)),
    teacherGenders: TEACHER_GENDERS,
    languages: LESSON_LANGUAGES,
    prices: PRICE_FILTERS,
    ratings: RATING_FILTERS,
    durations: DURATION_FILTERS,
    sorts: SORT_OPTIONS,
  };
}

/**
 * Cascading facet narrowing: each step options depend on upstream selections.
 */
export function buildCascadingFacets(items = [], rawFilters = {}) {
  const f = parseRecordedLessonFilters(rawFilters);
  const all = Array.isArray(items) ? items : [];

  const afterCountry = all.filter((r) => fieldMatch(r.country || r.countryId, f.country));
  const afterCurriculum = afterCountry.filter((r) =>
    fieldMatch(r.curriculum || r.curriculumId, f.curriculum),
  );
  const afterGrade = afterCurriculum.filter((r) => fieldMatch(r.grade || r.gradeId, f.grade));

  return {
    countries: [{ id: 'all', label: 'All' }, ...uniqueSorted(all.map((r) => r.country || r.countryId)).map((id) => ({ id, label: id }))],
    curricula: [
      { id: 'all', label: 'All' },
      ...uniqueSorted(afterCountry.map((r) => r.curriculum || r.curriculumId)).map((id) => ({
        id,
        label: id,
      })),
    ],
    grades: [
      { id: 'all', label: 'All' },
      ...uniqueSorted(afterCurriculum.map((r) => r.grade || r.gradeId)).map((id) => ({
        id,
        label: id,
      })),
    ],
    subjects: [
      { id: 'all', label: 'All' },
      ...uniqueSorted(afterGrade.map((r) => r.subject || r.subjectId)).map((id) => ({
        id,
        label: id,
      })),
    ],
    teacherGenders: TEACHER_GENDERS,
    languages: LESSON_LANGUAGES,
    prices: PRICE_FILTERS,
    ratings: RATING_FILTERS,
    durations: DURATION_FILTERS,
    sorts: SORT_OPTIONS,
  };
}

export function applyRecordedLessonCatalog(items, rawFilters = {}) {
  const filters = parseRecordedLessonFilters(rawFilters);
  const filtered = filterRecordedLessons(items, filters);
  const sorted = sortRecordedLessons(filtered, filters.sort);
  return {
    filters,
    facets: buildCascadingFacets(items, filters),
    total: sorted.length,
    items: sorted,
  };
}
