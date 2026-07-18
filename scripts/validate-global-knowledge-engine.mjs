import {
  globalKnowledgeEngineStatus,
  buildGlobalKnowledgeQueue,
  runGlobalKnowledgeEngine,
  assembleDigitalBookFromBaseline,
} from '../app/lib/ai/global-knowledge-engine.js';
import {
  libraryStatus,
  saveLibraryBook,
  listLibraryBooks,
  saveReport,
} from '../app/lib/ai/library-store.js';

const failures = [];

const status = globalKnowledgeEngineStatus();
for (const token of [
  'Country',
  'Educational System',
  'Curriculum',
  'Grade',
  'Subject',
  'Book',
  'Units',
  'Lessons',
  'Lesson Summary',
  'Full Lesson',
]) {
  if (!status.hierarchy.includes(token)) failures.push(`hierarchy missing ${token}`);
}

if (!libraryStatus().configured) failures.push('library not configured');

const jordanQueue = buildGlobalKnowledgeQueue({ countries: ['JO'] });
if (!jordanQueue.processableSubjects) {
  failures.push('Jordan verified subject lists produced zero processable subjects');
}

// Auto-build workflow: every processable subject must produce a book, no skips
// for missing baselines. Content is original (no copyrighted text).
let batchEvents = 0;
let subjectEvents = 0;
const report = await runGlobalKnowledgeEngine({
  countries: ['JO'],
  onProgress(event) {
    if (event.type === 'batch') batchEvents += 1;
    if (event.type === 'subject') subjectEvents += 1;
  },
});
if (report.totals.subjectsCompleted !== jordanQueue.processableSubjects) {
  failures.push(
    `expected ${jordanQueue.processableSubjects} auto-generated subjects, got ${report.totals.subjectsCompleted}`,
  );
}
if (report.totals.booksCreated !== jordanQueue.processableSubjects) {
  failures.push('expected one book per processable subject');
}
if (!report.totals.units || !report.totals.lessons) {
  failures.push('expected units and lessons to be generated');
}
if (subjectEvents < jordanQueue.processableSubjects) {
  failures.push('expected a live progress event per subject');
}
if (jordanQueue.processableSubjects >= 10 && batchEvents < 1) {
  failures.push('expected an every-10-subjects progress batch event');
}

// Isolated synthetic fixture proves book assembly + permanent save without
// claiming any real ministry curriculum structure.
const fixtureItem = {
  country: 'Testland',
  educationalSystem: 'Test System',
  curriculum: 'Test Curriculum',
  authority: 'Test Authority',
  source: 'https://example.org/oer/test-curriculum',
  grade: 'Grade 0',
  subject: 'Sample Subject',
  countryCode: 'ZZ',
};

const fixtureBaseline = {
  verificationStatus: 'verified',
  identity: {
    country: 'Testland',
    educationalSystem: 'Test System',
    curriculumType: 'national',
    curriculum: 'Test Curriculum',
    authority: 'Test Authority',
    stage: 'Test System',
    grade: 'Grade 0',
    subject: 'Sample Subject',
    language: 'en',
  },
  units: [
    {
      title: 'Unit A',
      learningOutcomes: ['Outcome A'],
      lessons: [
        {
          title: 'Lesson A1',
          learningOutcomes: ['Lesson outcome A1'],
          summary: 'Original test summary.',
          fullLesson: 'Original test full lesson.',
          keyConcepts: ['Concept'],
          definitions: [{ term: 'Concept', meaning: 'A test definition.' }],
          importantNotes: ['Test note'],
          glossary: [{ term: 'Concept', meaning: 'A test definition.' }],
          references: ['https://example.org/oer/test-curriculum'],
        },
      ],
    },
  ],
  references: [{ name: 'Test OER', url: 'https://example.org/oer/test-curriculum' }],
};

const book = assembleDigitalBookFromBaseline({
  item: fixtureItem,
  baseline: fixtureBaseline,
});
const saved = saveLibraryBook(book);
if (!saved.id) failures.push('fixture book was not saved permanently');
if (!listLibraryBooks().some((item) => item.id === saved.id)) {
  failures.push('fixture book missing from library listing');
}

saveReport('validator-fixture-note', {
  note: 'Testland fixture is for pipeline validation only and is not an official curriculum.',
  bookId: saved.id,
});

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  'GLOBAL KNOWLEDGE ENGINE PASS',
  JSON.stringify({
    jordanSubjectsQueued: jordanQueue.processableSubjects,
    jordanSubjectsCompleted: report.totals.subjectsCompleted,
    jordanBooksCreated: report.totals.booksCreated,
    unitsCreated: report.totals.units,
    lessonsCreated: report.totals.lessons,
    subjectProgressEvents: subjectEvents,
    batchProgressEvents: batchEvents,
    fixtureBookId: saved.id,
    libraryRoot: libraryStatus().root,
    finalReportPath: report.reportPath,
  }),
);
