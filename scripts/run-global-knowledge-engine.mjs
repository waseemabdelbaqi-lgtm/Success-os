import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const engineUrl = pathToFileURL(
  path.join(root, 'app/lib/ai/global-knowledge-engine.js'),
).href;

const {
  runGlobalKnowledgeEngine,
  globalKnowledgeEngineStatus,
  buildGlobalKnowledgeQueue,
} = await import(engineUrl);

const args = new Set(process.argv.slice(2));
const countriesArg = process.argv.find((arg) => arg.startsWith('--countries='));
const countries = countriesArg
  ? countriesArg
      .slice('--countries='.length)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  : null;

if (args.has('--status')) {
  console.log(JSON.stringify(globalKnowledgeEngineStatus(), null, 2));
  process.exit(0);
}

if (args.has('--queue')) {
  console.log(JSON.stringify(buildGlobalKnowledgeQueue({ countries }), null, 2));
  process.exit(0);
}

console.log('🌍 SUCCESS OS Global Knowledge Engine');
console.log('Collecting official/open curricula → verify → organize → books → reports');
console.log('');

const status = globalKnowledgeEngineStatus();
console.log(
  `Queue: ${status.inventory.processableSubjects} subjects, ${status.inventory.skippedGrades} grades pending subject verification`,
);
console.log(
  `Verified baselines available: ${status.baselines.verified}/${status.baselines.total}`,
);
console.log(`Library: ${status.library.root}`);
console.log('');

function fmtEta(ms) {
  if (!ms || ms < 0) return 'n/a';
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

const report = await runGlobalKnowledgeEngine({
  countries,
  generateBlueprints: args.has('--blueprints'),
  force: args.has('--force'),
  onProgress(event) {
    if (event.type === 'subject') {
      console.log(
        [
          `✓ Country: ${event.country}`,
          `Educational System: ${event.educationalSystem}`,
          `Curriculum: ${event.curriculum}`,
          `Grade: ${event.grade}`,
          `Subject: ${event.subject}`,
          `Book Created: ${event.bookCreated}`,
          `Units: ${event.unitsCreated}`,
          `Lessons: ${event.lessonsCreated}`,
        ].join(' | '),
      );
    } else if (event.type === 'batch') {
      console.log('');
      console.log('──────── PROGRESS ────────');
      console.log(`Books Created: ${event.booksCreated}`);
      console.log(`Subjects Completed: ${event.subjectsCompleted}`);
      console.log(`Countries Completed: ${event.countriesCompleted}`);
      console.log(`Current Country: ${event.currentCountry}`);
      console.log(`Estimated Time Remaining: ${fmtEta(event.estimatedTimeRemainingMs)}`);
      console.log('──────────────────────────');
      console.log('');
    }
  },
});

console.log(`Curricula processed: ${report.totals.curriculaProcessed}`);
console.log(`Subjects completed: ${report.totals.subjectsCompleted}`);
console.log(`Books created (this run): ${report.totals.booksCreated}`);
console.log(`Library books total: ${report.totals.libraryBooksTotal}`);
console.log(`Units: ${report.totals.units}`);
console.log(`Lessons: ${report.totals.lessons}`);
console.log(`Subjects skipped: ${report.totals.subjectsSkipped}`);
console.log(`Processing time: ${fmtEta(report.processingTimeMs)} (${report.processingTimeMs}ms)`);
console.log(`Report saved: ${report.reportPath}`);
console.log('');
console.log('Next required human actions (approval gates before publication):');
for (const action of report.nextRequiredHumanActions) {
  console.log(`  • ${action}`);
}
