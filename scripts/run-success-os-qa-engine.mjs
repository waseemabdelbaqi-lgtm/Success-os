/* eslint-disable no-console -- CLI printer */
import {
  runQaEngineBootstrap,
  successOsQaStatus,
  reviewSingleLibraryBook,
} from '../app/lib/ai/success-os-qa-engine.js';

const args = process.argv.slice(2);
const set = new Set(args);

if (set.has('--status')) {
  console.log(JSON.stringify(successOsQaStatus(), null, 2));
  process.exit(0);
}

const bookIdFlag = args.find((arg) => arg.startsWith('--book='));
if (bookIdFlag) {
  const bookId = bookIdFlag.slice('--book='.length);
  const result = reviewSingleLibraryBook(bookId);
  console.log('PHASE 7 — SINGLE BOOK QA REVIEW');
  console.log(`Book: ${result.qaReview.bookId}`);
  console.log(`Score: ${result.qaReview.overallBookQualityScore}`);
  console.log(`Band: ${result.qaReview.publishingBand}`);
  console.log(`Status: ${result.qaReview.validationStatus}`);
  console.log(`Publication allowed: ${result.publicationAllowed}`);
  console.log(`History: ${result.paths?.historyPath}`);
  process.exit(0);
}

console.log('PHASE 7 — SUCCESS OS QUALITY ASSURANCE ENGINE');
console.log('Validate QA pipeline. Do not publish books.');
console.log('');

const sampleArg = args.find((arg) => arg.startsWith('--sample='));
const sampleLimit = sampleArg ? Number(sampleArg.slice('--sample='.length)) : 0;

const result = runQaEngineBootstrap({ sampleLimit });

console.log('──────── QA ENGINE VALIDATION ────────');
console.log(`Production ready: ${result.validation.productionReady}`);
console.log(`Score: ${result.validation.scorePercent}%`);
console.log(`Sample reviewed: ${result.sampleReviewed}`);
console.log(`Publication allowed: ${result.publicationAllowed}`);
console.log(`Summary: ${result.validation.summary}`);
console.log('');
console.log('──────── GLOBAL QA DASHBOARD ────────');
console.log(`Books Reviewed: ${result.dashboard.booksReviewed}`);
console.log(`Books Approved: ${result.dashboard.booksApproved}`);
console.log(`Books Rejected: ${result.dashboard.booksRejected}`);
console.log(`Average Quality Score: ${result.dashboard.averageQualityScore}`);
console.log(
  `Estimated Review Progress: ${result.dashboard.estimatedReviewProgressPercent}%`,
);
console.log(`Validation report: ${result.validationPath}`);
console.log(`Dashboard: ${result.dashboardPath}`);

if (!result.validation.productionReady) process.exit(1);
