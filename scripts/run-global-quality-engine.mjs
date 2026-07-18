import {
  globalQualityStatus,
  runGlobalQualityEngine,
} from '../app/lib/ai/global-quality-engine.js';

const args = new Set(process.argv.slice(2));

function formatDuration(ms) {
  if (ms == null) return 'n/a';
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

if (args.has('--status')) {
  console.log(JSON.stringify(globalQualityStatus(), null, 2));
  process.exit(0);
}

console.log('🛡 SUCCESS OS GLOBAL QUALITY ENGINE');
console.log(
  'Validate lessons → duplication → scientific evidence → coverage → final version',
);
console.log('');

const report = await runGlobalQualityEngine({
  includeFixtures: args.has('--include-fixtures'),
  onProgress(event) {
    if (event.type === 'subject') {
      console.log(
        [
          `Country: ${event.country}`,
          `Educational System: ${event.educationalSystem}`,
          `Curriculum: ${event.curriculum}`,
          `Grade: ${event.grade}`,
          `Subject: ${event.subject}`,
          `Book Status: ${event.bookStatus}`,
          `Quality Score: ${event.qualityScore}`,
          `Units: ${event.units}`,
          `Lessons: ${event.lessons}`,
          `Coverage: ${event.coveragePercentage}%`,
          `Completion Time: ${event.completionTimeMs}ms`,
        ].join(' | '),
      );
      return;
    }

    if (event.type === 'batch') {
      console.log('');
      console.log('──────── QUALITY PROGRESS (50 BOOKS) ────────');
      console.log(`Books Completed: ${event.booksCompleted}`);
      console.log(`Books Under Review: ${event.booksUnderReview}`);
      console.log(`Average Quality Score: ${event.averageQualityScore}`);
      console.log(`Countries Completed: ${event.countriesCompleted}`);
      console.log(`Curricula Completed: ${event.curriculaCompleted}`);
      console.log(`Subjects Completed: ${event.subjectsCompleted}`);
      console.log(
        `Estimated Remaining Time: ${formatDuration(event.estimatedRemainingTimeMs)}`,
      );
      console.log('─────────────────────────────────────────────');
      console.log('');
    }
  },
});

console.log('');
console.log('════════ FINAL QUALITY REPORT ════════');
console.log(`Books Processed: ${report.totals.booksProcessed}`);
console.log(`Books Completed: ${report.totals.booksCompleted}`);
console.log(`Books Under Review: ${report.totals.booksUnderReview}`);
console.log(`Average Quality Score: ${report.totals.averageQualityScore}`);
console.log(`Countries Completed: ${report.totals.countriesCompleted}`);
console.log(`Curricula Completed: ${report.totals.curriculaCompleted}`);
console.log(`Subjects Completed: ${report.totals.subjectsCompleted}`);
console.log(
  `Manual Review Required: ${report.totals.manualReviewRequired}`,
);
console.log(`Processing Time: ${formatDuration(report.processingTimeMs)}`);
console.log(`Report: ${report.reportPath}`);
console.log('');
console.log('Subjects requiring manual review:');
for (const item of report.manualReviewSubjects) {
  console.log(
    `- ${item.country} → ${item.curriculum} → ${item.grade} → ${item.subject} (score ${item.qualityScore}): ${item.reasons.join(' ')}`,
  );
}
