/**
 * Recorded Lessons marketplace catalog filters + sort.
 *
 * Primary Lesson Source: All | S4S Intelligence | Teachers
 * Teacher Gender appears only when Teachers is selected.
 */

import {
  matchesLessonSourceFilter,
  normalizeLessonSource,
  normalizeTeacherGender,
  TEACHER_GENDER_VALUES,
} from './recorded-lesson-sources.js';

export const TEACHER_GENDERS = Object.freeze([
  { id: 'all', label: 'All' },
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
  { id: 'not_specified', label: 'Not specified' },
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

export const LEVEL_FILTERS = Object.freeze([
  { id: 'all', label: 'All' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]);

export const SORT_OPTIONS = Object.freeze([
  { id: 'newest', label: 'Newest' },
  { id: 'last_updated', label: 'Last Updated' },
  { id: 'popularity', label: 'Most Popular' },
  { id: 'rating', label: 'Best Rated' },
  { id: 'price_asc', label: 'Price: low to high' },
  { id: 'price_desc', label: 'Price: high to low' },
  { id: 'duration', label: 'Duration' },
]);

/** Ordered filter steps for UI. Teacher Gender is conditional. */
export const RECORDED_LESSON_FILTER_STEPS = Object.freeze([
  { key: 'country', label: 'Country' },
  { key: 'educationalSystem', label: 'Educational System' },
  { key: 'curriculum', label: 'Curriculum' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'grade', label: 'Grade or Year' },
  { key: 'subjectFamily', label: 'Subject Family' },
  { key: 'subject', label: 'Subject' },
  { key: 'lessonSource', label: 'Lesson Source' },
  { key: 'teacherGender', label: 'Teacher Gender', conditionalOn: 'TEACHER_RECORDED' },
  { key: 'language', label: 'Language' },
  { key: 'subtitleLanguage', label: 'Subtitle Language' },
  { key: 'price', label: 'Price Range' },
  { key: 'rating', label: 'Rating' },
  { key: 'duration', label: 'Duration' },
  { key: 'level', label: 'Level' },
  { key: 'sort', label: 'Sort' },
  { key: 'results', label: 'Results' },
]);

export function defaultRecordedLessonFilters() {
  return {
    country: 'all',
    educationalSystem: 'all',
    curriculum: 'all',
    qualification: 'all',
    grade: 'all',
    subjectFamily: 'all',
    subject: 'all',
    lessonSource: 'ALL',
    teacherGender: 'all',
    language: 'all',
    subtitleLanguage: 'all',
    price: 'all',
    rating: 'all',
    duration: 'all',
    level: 'all',
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
  const lessonSource = normalizeLessonSource(input.lessonSource) || 'ALL';
  let teacherGender =
    normalizeTeacherGender(input.teacherGender ?? base.teacherGender) || 'all';

  // Gender filter only applies under Teachers; clear otherwise (privacy-safe).
  if (lessonSource !== 'TEACHER_RECORDED') {
    teacherGender = 'all';
  }

  return {
    country: emptyToAll(input.country ?? input.countryId ?? base.country),
    educationalSystem: emptyToAll(
      input.educationalSystem ?? input.educational_system ?? base.educationalSystem,
    ),
    curriculum: emptyToAll(input.curriculum ?? input.curriculumId ?? base.curriculum),
    qualification: emptyToAll(input.qualification ?? base.qualification),
    grade: emptyToAll(input.grade ?? input.gradeId ?? input.gradeLevel ?? base.grade),
    subjectFamily: emptyToAll(input.subjectFamily ?? input.subject_family ?? base.subjectFamily),
    subject: emptyToAll(input.subject ?? input.subjectId ?? base.subject),
    lessonSource,
    teacherGender,
    language: emptyToAll(input.language ?? base.language).toLowerCase(),
    subtitleLanguage: emptyToAll(
      input.subtitleLanguage ?? input.subtitle_language ?? base.subtitleLanguage,
    ).toLowerCase(),
    price: emptyToAll(input.price ?? base.price).toLowerCase(),
    rating: emptyToAll(input.rating ?? base.rating).toLowerCase(),
    duration: emptyToAll(input.duration ?? base.duration).toLowerCase(),
    level: emptyToAll(input.level ?? input.courseLevel ?? base.level).toLowerCase(),
    sort: emptyToAll(input.sort ?? base.sort).toLowerCase(),
    q: String(input.q || input.search || '').trim(),
  };
}

export function teacherGenderFilterVisible(filters = {}) {
  return normalizeLessonSource(filters.lessonSource) === 'TEACHER_RECORDED';
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
  const rating = Number(row.rating_average ?? row.ratingAverage ?? row.rating);
  if (!Number.isFinite(rating)) return false;
  if (filter === '3_plus') return rating >= 3;
  if (filter === '4_plus') return rating >= 4;
  if (filter === '4_5_plus') return rating >= 4.5;
  return true;
}

function matchesDuration(row, filter) {
  if (!filter || filter === 'all') return true;
  const mins = Number(
    row.total_duration_minutes ?? row.totalDurationMinutes ?? row.durationMinutes ?? row.duration,
  );
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

function subtitleMatch(row, filter) {
  if (!filter || filter === 'all') return true;
  const list = row.subtitle_languages || row.subtitleLanguages || [];
  if (Array.isArray(list)) {
    return list.some((x) => norm(x) === norm(filter));
  }
  return fieldMatch(list, filter);
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
        row.grade_level,
        row.curriculum,
        row.country,
        row.teacherName,
        row.teacher_name,
        row.language,
      ]
        .map((x) => String(x || '').toLowerCase())
        .join(' ');
      if (!hay.includes(q)) return false;
    }
    if (!fieldMatch(row.country || row.countryId, f.country)) return false;
    if (!fieldMatch(row.educational_system || row.educationalSystem, f.educationalSystem)) {
      return false;
    }
    if (!fieldMatch(row.curriculum || row.curriculumId, f.curriculum)) return false;
    if (!fieldMatch(row.qualification, f.qualification)) return false;
    if (!fieldMatch(row.grade || row.gradeId || row.grade_level || row.gradeLevel, f.grade)) {
      return false;
    }
    if (!fieldMatch(row.subject_family || row.subjectFamily, f.subjectFamily)) return false;
    if (!fieldMatch(row.subject || row.subjectId, f.subject)) return false;
    if (!matchesLessonSourceFilter(row.source_type || row.lessonSource || row.sourceType, f.lessonSource)) {
      return false;
    }
    if (f.lessonSource === 'TEACHER_RECORDED' && f.teacherGender !== 'all') {
      const gender = normalizeTeacherGender(row.teacherGender || row.teacher_gender || row.gender);
      if (gender !== f.teacherGender) return false;
    }
    if (!fieldMatch(row.language, f.language)) return false;
    if (!subtitleMatch(row, f.subtitleLanguage)) return false;
    if (!matchesPrice(row, f.price)) return false;
    if (!matchesRating(row, f.rating)) return false;
    if (!matchesDuration(row, f.duration)) return false;
    if (!fieldMatch(row.course_level || row.courseLevel || row.level, f.level)) return false;
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
    return byNum(
      (r) => r.enrolment_count ?? r.enrolmentCount ?? r.popularity ?? r.views ?? r.enrollments ?? 0,
      -1,
    );
  }
  if (mode === 'rating') {
    return byNum((r) => r.rating_average ?? r.ratingAverage ?? r.rating ?? 0, -1);
  }
  if (mode === 'price_asc') {
    return byNum((r) => (r.isFree ? 0 : r.price ?? 0), 1);
  }
  if (mode === 'price_desc') {
    return byNum((r) => (r.isFree ? 0 : r.price ?? 0), -1);
  }
  if (mode === 'duration') {
    return byNum(
      (r) => r.total_duration_minutes ?? r.totalDurationMinutes ?? r.durationMinutes ?? r.duration ?? 0,
      1,
    );
  }
  if (mode === 'last_updated') {
    return list.sort((a, b) => {
      const av = a.updated_at || a.updatedAt || a.published_at || a.publishedAt || '';
      const bv = b.updated_at || b.updatedAt || b.published_at || b.publishedAt || '';
      if (av < bv) return 1;
      if (av > bv) return -1;
      return 0;
    });
  }
  // newest (default)
  return list.sort((a, b) => {
    const av = a.published_at || a.publishedAt || a.created_at || a.createdAt || a.updatedAt || '';
    const bv = b.published_at || b.publishedAt || b.created_at || b.createdAt || b.updatedAt || '';
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

export function buildRecordedLessonFacets(items = []) {
  const rows = Array.isArray(items) ? items : [];
  return {
    countries: uniqueSorted(rows.map((r) => r.country || r.countryId)),
    educationalSystems: uniqueSorted(rows.map((r) => r.educational_system || r.educationalSystem)),
    curricula: uniqueSorted(rows.map((r) => r.curriculum || r.curriculumId)),
    qualifications: uniqueSorted(rows.map((r) => r.qualification)),
    grades: uniqueSorted(rows.map((r) => r.grade || r.gradeId || r.grade_level || r.gradeLevel)),
    subjectFamilies: uniqueSorted(rows.map((r) => r.subject_family || r.subjectFamily)),
    subjects: uniqueSorted(rows.map((r) => r.subject || r.subjectId)),
    teacherGenders: TEACHER_GENDERS,
    languages: LESSON_LANGUAGES,
    subtitleLanguages: LESSON_LANGUAGES,
    prices: PRICE_FILTERS,
    ratings: RATING_FILTERS,
    durations: DURATION_FILTERS,
    levels: LEVEL_FILTERS,
    sorts: SORT_OPTIONS,
  };
}

export function buildCascadingFacets(items = [], rawFilters = {}) {
  const f = parseRecordedLessonFilters(rawFilters);
  const all = Array.isArray(items) ? items : [];

  const afterCountry = all.filter((r) => fieldMatch(r.country || r.countryId, f.country));
  const afterSystem = afterCountry.filter((r) =>
    fieldMatch(r.educational_system || r.educationalSystem, f.educationalSystem),
  );
  const afterCurriculum = afterSystem.filter((r) =>
    fieldMatch(r.curriculum || r.curriculumId, f.curriculum),
  );
  const afterGrade = afterCurriculum.filter((r) =>
    fieldMatch(r.grade || r.gradeId || r.grade_level || r.gradeLevel, f.grade),
  );

  return {
    countries: [
      { id: 'all', label: 'All' },
      ...uniqueSorted(all.map((r) => r.country || r.countryId)).map((id) => ({ id, label: id })),
    ],
    educationalSystems: [
      { id: 'all', label: 'All' },
      ...uniqueSorted(afterCountry.map((r) => r.educational_system || r.educationalSystem)).map(
        (id) => ({ id, label: id }),
      ),
    ],
    curricula: [
      { id: 'all', label: 'All' },
      ...uniqueSorted(afterSystem.map((r) => r.curriculum || r.curriculumId)).map((id) => ({
        id,
        label: id,
      })),
    ],
    qualifications: [
      { id: 'all', label: 'All' },
      ...uniqueSorted(afterCurriculum.map((r) => r.qualification)).map((id) => ({ id, label: id })),
    ],
    grades: [
      { id: 'all', label: 'All' },
      ...uniqueSorted(
        afterCurriculum.map((r) => r.grade || r.gradeId || r.grade_level || r.gradeLevel),
      ).map((id) => ({ id, label: id })),
    ],
    subjectFamilies: [
      { id: 'all', label: 'All' },
      ...uniqueSorted(afterGrade.map((r) => r.subject_family || r.subjectFamily)).map((id) => ({
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
    teacherGenderVisible: teacherGenderFilterVisible(f),
    languages: LESSON_LANGUAGES,
    subtitleLanguages: LESSON_LANGUAGES,
    prices: PRICE_FILTERS,
    ratings: RATING_FILTERS,
    durations: DURATION_FILTERS,
    levels: LEVEL_FILTERS,
    sorts: SORT_OPTIONS,
    lessonSources: [
      { id: 'ALL', label: 'All' },
      { id: 'S4S_INTELLIGENCE', label: 'S4S Intelligence' },
      { id: 'TEACHER_RECORDED', label: 'Teachers' },
    ],
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

export { TEACHER_GENDER_VALUES };
