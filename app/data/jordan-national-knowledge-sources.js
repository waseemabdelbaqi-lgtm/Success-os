/**
 * PHASE JO-01 — Official sources for Jordan National Curriculum ONLY.
 * International curricula are explicitly excluded from this phase.
 */

export const JO_PHASE = 'JO-01';
export const JO_KNOWLEDGE_SCHEMA = 'success-os.jordan-national-knowledge-db.v1';
export const JO_VERIFICATION_GATE = 98;

/** Hard exclusions — never research or store in JO-01 knowledge DB. */
export const JO_EXCLUDED_CURRICULA = Object.freeze([
  'AP',
  'SAT',
  'ACT',
  'IB',
  'Cambridge',
  'Pearson Edexcel',
  'Oxford AQA',
  'International GCSE',
  'A Level',
  'American Curriculum',
  'British Curriculum',
  'International Baccalaureate',
  'College Board',
]);

export const JO_EXCLUDED_BOOK_ID_PATTERNS = Object.freeze([
  'jordan__international__',
  'jordan__higher-education__',
  'jordan__college-applied__',
  'jordan__technical-vocational__',
  'jordan__professional-certification__',
  '__cambridge__',
  '__college-board',
  '__international-baccalaureate__',
  '__oxfordaqa__',
  '__pearson-edexcel__',
  '__ib__',
  '__ap__',
  '__sat__',
  '__act__',
]);

/** Priority 1 — Jordanian official authorities & platforms. */
export const JO_PRIORITY_1_SOURCES = Object.freeze([
  {
    id: 'moe-jordan',
    name: 'Jordan Ministry of Education',
    nameAr: 'وزارة التربية والتعليم الأردنية',
    url: 'https://moe.gov.jo/',
    type: 'ministry-education',
    priority: 1,
    usage: 'curriculum-policy-structure-editions',
  },
  {
    id: 'nccd-textbooks',
    name: 'National Center for Curriculum Development (NCCD)',
    nameAr: 'المركز الوطني لتطوير المناهج',
    url: 'https://www.nccd.gov.jo/Ar/Pages/textbooks',
    type: 'curriculum-authority',
    priority: 1,
    usage: 'grade-catalogues-teacher-guides-framework-indexing',
  },
  {
    id: 'nccd-portal',
    name: 'NCCD Official Portal',
    url: 'https://www.nccd.gov.jo/',
    type: 'curriculum-authority',
    priority: 1,
    usage: 'official-discovery-and-indexing-only',
  },
  {
    id: 'darsak',
    name: 'Darsak Platform',
    nameAr: 'منصة درسك',
    url: 'https://darsak.gov.jo/',
    type: 'digital-learning-platform',
    priority: 1,
    usage: 'official-digital-lesson-structure-reference-never-copy',
  },
  {
    id: 'moe-curricula-admin',
    name: 'MoE Curricula and School Textbooks Administration',
    url: 'https://moe.gov.jo/ar/%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D9%85%D9%86%D8%A7%D9%87%D8%AC-%D9%88%D8%A7%D9%84%D9%83%D8%AA%D8%A8-%D8%A7%D9%84%D9%85%D8%AF%D8%B1%D8%B3%D9%8A%D8%A9',
    type: 'ministry',
    priority: 1,
    usage: 'structure-and-outcomes-only',
  },
  {
    id: 'moe-editions-2025-2026',
    name: 'MoE Approved Textbook Editions 2025–2026',
    url: 'https://moe.gov.jo/ar/node/79818',
    type: 'ministry',
    priority: 1,
    usage: 'edition-verification-only',
  },
]);

/** Priority 2 — concept verification / OER only (never as curriculum authority). */
export const JO_PRIORITY_2_SOURCES = Object.freeze([
  {
    id: 'unesco-ibe',
    name: 'UNESCO IBE Curriculum Resources',
    url: 'https://www.ibe.unesco.org/',
    type: 'concept-verification',
    priority: 2,
  },
  {
    id: 'unesco-oer',
    name: 'UNESCO Open Educational Resources',
    url: 'https://www.unesco.org/en/open-educational-resources',
    type: 'concept-verification',
    priority: 2,
  },
  {
    id: 'openstax',
    name: 'OpenStax',
    url: 'https://openstax.org',
    type: 'concept-verification-only',
    priority: 2,
  },
  {
    id: 'ck12',
    name: 'CK-12 Foundation',
    url: 'https://www.ck12.org',
    type: 'concept-verification-only',
    priority: 2,
  },
  {
    id: 'phet',
    name: 'PhET Interactive Simulations',
    url: 'https://phet.colorado.edu',
    type: 'concept-verification-simulation',
    priority: 2,
  },
  {
    id: 'libretexts',
    name: 'LibreTexts',
    url: 'https://libretexts.org',
    type: 'concept-verification-only',
    priority: 2,
  },
]);

export const JO_RIGHTS = Object.freeze({
  copyBookText: false,
  copyTeacherGuideProse: false,
  generateOriginalSuccessOsContentOnly: true,
  humanReviewRequired: true,
  note: 'Never copy copyrighted Jordanian textbooks. Study official curriculum structure and objectives; author original Success OS educational content.',
});

export const JO_NCCD_GRADE_CATALOGUES = Object.freeze([
  { grade: 'الصف 1', stage: 'التعليم الأساسي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68' },
  { grade: 'الصف 2', stage: 'التعليم الأساسي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/69' },
  { grade: 'الصف 3', stage: 'التعليم الأساسي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/70' },
  { grade: 'الصف 4', stage: 'التعليم الأساسي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/71' },
  { grade: 'الصف 5', stage: 'التعليم الأساسي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/72' },
  { grade: 'الصف 6', stage: 'التعليم الأساسي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/73' },
  { grade: 'الصف 7', stage: 'التعليم الأساسي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/74' },
  { grade: 'الصف 8', stage: 'التعليم الأساسي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/75' },
  { grade: 'الصف 9', stage: 'التعليم الأساسي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/76' },
  { grade: 'الصف 10', stage: 'التعليم الأساسي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/77' },
  { grade: 'الصف 11', stage: 'التعليم الثانوي — المسار الأكاديمي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/117' },
  { grade: 'الصف 12', stage: 'التعليم الثانوي — المسار الأكاديمي', url: 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/83' },
]);

export function isJordanNationalBookId(bookId) {
  const id = String(bookId || '');
  if (!id.startsWith('jordan__')) return false;
  if (!id.includes('jordan-national-curriculum')) return false;
  return !JO_EXCLUDED_BOOK_ID_PATTERNS.some((p) => id.includes(p));
}

export function isExcludedInternationalLabel(text) {
  const t = String(text || '').toLowerCase();
  return JO_EXCLUDED_CURRICULA.some((label) => t.includes(String(label).toLowerCase()));
}
