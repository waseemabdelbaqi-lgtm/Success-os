import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function assertOrder(source, markers, label) {
  let lastIndex = -1;
  for (const marker of markers) {
    const index = source.indexOf(marker);
    assert(index >= 0, `${label} marker missing: ${marker}`);
    assert(index > lastIndex, `${label} order changed near: ${marker}`);
    lastIndex = index;
  }
}

const landing = fs.readFileSync(path.join(root, 'app', 'page.jsx'), 'utf8');
assertOrder(
  landing,
  [
    'portal-first-stage',
    'className="hero"',
    'home-gateway organized',
    'knowledge-entry',
    'home-core-summary',
    'cta-section',
    'footer-grid',
  ],
  'Landing',
);

const controlCenter = fs.readFileSync(
  path.join(
    root,
    'components',
    'control-center',
    'phase11',
    'control-center-2050.tsx',
  ),
  'utf8',
);
assertOrder(
  controlCenter,
  [
    'p11-cc-side',
    'p11-cc-security',
    'p11-cc-top',
    'p11-cc-nav',
    'p11-cc-welcome',
    'p11-cc-stats',
    'p11-cc-grid',
    'p11-cc-services',
    'p11-cc-assistant',
  ],
  'Control Center',
);

const subjectCatalog = fs.readFileSync(
  path.join(root, 'app', 'subject-catalog', 'page.jsx'),
  'utf8',
);
assert(
  subjectCatalog.includes('selectCountry') &&
    subjectCatalog.includes('selectSystem') &&
    subjectCatalog.includes('selectStage') &&
    subjectCatalog.includes('selectGrade') &&
    subjectCatalog.includes('selectSubject'),
  'Subject catalog dependent filter handlers missing',
);
assert(
  subjectCatalog.includes('subject-learning-hub?'),
  'Subject catalog action links missing',
);

const liveLibrary = fs.readFileSync(
  path.join(
    root,
    'components',
    'student-portal',
    'books',
    'middle-east-live-library.tsx',
  ),
  'utf8',
);
assert(
  liveLibrary.includes('setCountryId') &&
    liveLibrary.includes('setSystemId') &&
    liveLibrary.includes('setCurriculumId') &&
    liveLibrary.includes('setGradeId') &&
    liveLibrary.includes('setSubjectId'),
  'Live library dependent filter handlers missing',
);
assert(
  (liveLibrary.includes('/student/subjects/') ||
    liveLibrary.includes('STUDENT_ROUTES.subject')) &&
    (liveLibrary.includes('/student/books/') ||
      liveLibrary.includes('STUDENT_ROUTES.read') ||
      liveLibrary.includes('STUDENT_ROUTES.book')),
  'Live library subject/book links missing',
);

const index = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'library',
      'middle-east-live-preview',
      'MIDDLE-EAST-LIVE-BOOK-INDEX.json',
    ),
    'utf8',
  ),
);
const firstCountry = index.hierarchy.countries[0];
const countrySystems = index.hierarchy.systems.filter(
  (item) => item.countryId === firstCountry.id,
);
const systemCurricula = index.hierarchy.curricula.filter(
  (item) => item.systemId === countrySystems[0]?.id,
);
const curriculumGrades = index.hierarchy.grades.filter(
  (item) => item.curriculumId === systemCurricula[0]?.id,
);
const gradeSubjects = index.hierarchy.subjects.filter(
  (item) => item.gradeId === curriculumGrades[0]?.id,
);

assert(countrySystems.length > 0, 'Live country → system filter is empty');
assert(systemCurricula.length > 0, 'Live system → curriculum filter is empty');
assert(curriculumGrades.length > 0, 'Live curriculum → grade filter is empty');
assert(gradeSubjects.length > 0, 'Live grade → subject filter is empty');
assert(
  gradeSubjects.every((subject) => subject.bookId),
  'A filtered live subject has no Book link',
);

const css = fs.readFileSync(path.join(root, 'app', 'phase11.css'), 'utf8');
assert(css.includes('--p11-maroon: #8b1e1e'), 'Maroon token missing');
assert(css.includes('--p11-gold: #d4af37'), 'Gold token missing');
assert(css.includes('--p11-ivory: #fffff0'), 'Ivory token missing');
assert(css.includes('--p11-gray: #f2f2f2'), 'Gray token missing');
assert(css.includes('.success-wordmark'), 'Success wordmark styles missing');

const result = {
  landingOrderPreserved: !failures.some((item) => item.startsWith('Landing')),
  controlCenterOrderPreserved: !failures.some((item) =>
    item.startsWith('Control Center'),
  ),
  filtersAndLinksPreserved: !failures.some(
    (item) =>
      item.includes('filter') ||
      item.includes('link') ||
      item.includes('Book'),
  ),
  paletteUnified: !failures.some((item) => item.includes('token')),
  liveBookFilters: {
    countries: index.hierarchy.countries.length,
    systems: countrySystems.length,
    curricula: systemCurricula.length,
    grades: curriculumGrades.length,
    subjects: gradeSubjects.length,
  },
  failures,
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
