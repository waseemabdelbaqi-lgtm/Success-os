/**
 * Map start-journey university filters → /admissions query params.
 */

import { ADMISSION_COUNTRIES } from '../data/admissions-regions';

/** ISO / common aliases → Arabic country keys used in ADMISSION_COUNTRIES */
const COUNTRY_ALIASES = {
  JO: 'الأردن',
  AE: 'الإمارات',
  SA: 'السعودية',
  QA: 'قطر',
  EG: 'مصر',
  DZ: 'الجزائر',
  MA: 'المغرب',
  TR: 'تركيا',
  US: 'الولايات المتحدة',
  GB: 'المملكة المتحدة',
  UK: 'المملكة المتحدة',
  CA: 'كندا',
  AU: 'أستراليا',
  NZ: 'نيوزيلندا',
  DE: 'ألمانيا',
  FR: 'فرنسا',
  NL: 'هولندا',
  IE: 'أيرلندا',
  CN: 'الصين',
  JP: 'اليابان',
  KR: 'كوريا الجنوبية',
  IN: 'الهند',
  MY: 'ماليزيا',
  SG: 'سنغافورة',
  ZA: 'جنوب أفريقيا',
  NG: 'نيجيريا',
  KE: 'كينيا',
};

export const ADMISSION_STUDY_COUNTRIES = Object.keys(ADMISSION_COUNTRIES);

export const UNIVERSITY_JOURNEY_FIELDS = [
  'داخل الدولة أو خارجها',
  'دولة الوجهة',
  'نمط الدراسة',
  'الدرجة',
  'التخصص',
];

export const UNIVERSITY_STUDY_MODES = ['الكل', 'وجاهي', 'أونلاين'];
export const UNIVERSITY_DEGREES = ['الكل', 'دبلوم', 'بكالوريوس', 'ماجستير', 'دكتوراه', 'دورة قصيرة'];

const FIELD_CHOICES = [
  'الكل',
  'هندسة',
  'حوسبة',
  'علوم',
  'أعمال',
  'طب وصحة',
  'آداب',
  'قانون',
  'تصميم',
  'عمارة وتصميم',
  'اقتصاد',
  'علوم اجتماعية',
  'إدارة',
];

export function universityFieldChoices() {
  return FIELD_CHOICES;
}

export function resolveAdmissionCountry(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (ADMISSION_COUNTRIES[raw]) return raw;
  const upper = raw.toUpperCase();
  if (COUNTRY_ALIASES[upper]) return COUNTRY_ALIASES[upper];
  // Arabic display name from Intl may differ slightly — fuzzy match
  const hit = ADMISSION_STUDY_COUNTRIES.find(
    (c) => c === raw || c.includes(raw) || raw.includes(c),
  );
  return hit || '';
}

export function applicantFromJourney(value) {
  if (value === 'داخل دولتي') return 'local';
  if (value === 'خارج دولتي') return 'international';
  return ''; // كلاهما / unset → wizard chooses
}

/** Normalize mode for admissions registry (no هجين in data). */
export function modeFromJourney(value) {
  if (!value || value === 'الكل' || value === 'هجين') return '';
  if (value === 'وجاهي' || value === 'أونلاين') return value;
  return '';
}

/**
 * Build /admissions?... from journey form filters.
 */
export function admissionsUrlFromJourney(form = {}) {
  const filters = form.filters || {};
  const params = new URLSearchParams({ from: 'journey' });

  const studyCountry = resolveAdmissionCountry(
    filters['دولة الوجهة'] || form.country,
  );
  if (studyCountry) {
    params.set('country', studyCountry);
    const region = ADMISSION_COUNTRIES[studyCountry]?.region;
    if (region) params.set('region', region);
  }

  const applicant = applicantFromJourney(filters['داخل الدولة أو خارجها']);
  if (applicant) params.set('applicant', applicant);

  const degree = filters['الدرجة'];
  if (degree && degree !== 'الكل') params.set('degree', degree);

  const mode = modeFromJourney(filters['نمط الدراسة']);
  if (mode) params.set('mode', mode);

  const field = filters['التخصص'];
  if (field && field !== 'الكل') params.set('field', field);

  if (form.name) params.set('name', form.name);

  return `/admissions?${params.toString()}`;
}
