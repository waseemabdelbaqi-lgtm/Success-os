import {
  globalQualityStatus,
  reviewBookQuality,
} from '../app/lib/ai/global-quality-engine.js';
import {
  listLibraryBooks,
  loadBaseline,
} from '../app/lib/ai/library-store.js';

const failures = [];
const book = listLibraryBooks().find(
  (item) => item.identity?.country !== 'Testland',
);

if (!book) {
  failures.push('No production library book found');
} else {
  const baseline = loadBaseline(book.identity);
  const { review } = reviewBookQuality(book, baseline);

  if (review.coveragePercentage < 98) {
    failures.push(`Expected coverage >=98, got ${review.coveragePercentage}`);
  }
  if (!review.checks.lessonOrder.passed) {
    failures.push('Expected lesson order verification to pass');
  }
  if (!review.checks.duplicates.passed) {
    failures.push('Expected no exact duplicate lessons');
  }
  if (!review.checks.definitions.passed) {
    failures.push('Expected definitions and terminology to pass');
  }
  if (!review.checks.references.passed) {
    failures.push('Expected references to pass');
  }
  if (review.bookStatus === 'COMPLETE') {
    failures.push(
      'Book must remain UNDER_REVIEW without documented scientific accuracy >=99',
    );
  }
  if (!review.manualReviewRequired) {
    failures.push('Expected manual scientific review requirement');
  }
  if (review.qualityScore < 0 || review.qualityScore > 100) {
    failures.push(`Invalid quality score ${review.qualityScore}`);
  }
}

const status = globalQualityStatus();
for (const gate of [
  'curriculumCoverage',
  'scientificAccuracy',
  'lessonOrderVerified',
  'unitsVerified',
  'definitionsVerified',
  'referencesVerified',
  'noDuplicatedLessons',
  'noMissingLearningObjectives',
]) {
  if (!(gate in status.completionThresholds)) {
    failures.push(`Missing completion threshold ${gate}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  'GLOBAL QUALITY ENGINE PASS',
  JSON.stringify({
    bookId: book.id,
    status: reviewBookQuality(book, loadBaseline(book.identity)).review
      .bookStatus,
    qualityScore: reviewBookQuality(book, loadBaseline(book.identity)).review
      .qualityScore,
    coverage: reviewBookQuality(book, loadBaseline(book.identity)).review
      .coveragePercentage,
    scientificAccuracy:
      reviewBookQuality(book, loadBaseline(book.identity)).review
        .scientificAccuracyPercentage,
    libraryBooks: status.books,
  }),
);
