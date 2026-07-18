/* eslint-disable no-console -- CLI status / validation printer */
import {
  createSingleBookShell,
  digitalBookFactoryStatus,
  requestMassBookGeneration,
  validateAndPersistBookFactory,
} from '../app/lib/ai/digital-book-factory.js';

const args = new Set(process.argv.slice(2));

if (args.has('--status')) {
  console.log(JSON.stringify(digitalBookFactoryStatus(), null, 2));
  process.exit(0);
}

if (args.has('--request-mass')) {
  console.log(JSON.stringify(requestMassBookGeneration({ confirmMassGeneration: true }), null, 2));
  process.exit(0);
}

if (args.has('--shell-preview')) {
  const result = createSingleBookShell(
    {
      countryId: 'JO',
      country: 'Jordan',
      curriculumId: 'jo-national',
      curriculum: 'Jordan National Curriculum',
      subjectId: 'math-g5',
      subject: 'الرياضيات',
      educationalSystem: 'national',
      grade: 'الصف 5',
      academicLevel: 'Basic education',
      language: 'ar',
      programType: 'school-education',
    },
    { persist: args.has('--persist') },
  );
  console.log(JSON.stringify({
    phase: result.phase,
    massGenerationAllowed: result.massGenerationAllowed,
    persisted: result.persisted,
    shellPath: result.shellPath,
    bookId: result.shell.bookInformation.bookId,
    requiredBookSections: result.shell.requiredBookSections.length,
    requiredLessonFields: result.shell.requiredLessonFields.length,
  }, null, 2));
  process.exit(0);
}

console.log('PHASE 6 — SUCCESS OS DIGITAL BOOK FACTORY');
console.log('Template validation only. Full library will NOT be generated.');
console.log('');

const result = validateAndPersistBookFactory();
const validation = result.validation;
const report = result.report;

console.log('──────── UNIVERSAL BOOK TEMPLATE VALIDATION ────────');
console.log(`Template version: ${validation.templateVersion}`);
console.log(`Production ready: ${validation.productionReady}`);
console.log(`Score: ${validation.scorePercent}%`);
console.log(`Mass generation allowed: ${report.massGenerationAllowed}`);
console.log(`Summary: ${validation.summary}`);
console.log(`Template: ${result.templatePath}`);
console.log(`Report: ${result.reportPath}`);
console.log('');
console.log('Prerequisites:');
for (const [name, ok] of Object.entries(report.prerequisites.checks)) {
  console.log(`  ${ok ? '✓' : '✗'} ${name}`);
}
console.log(`Note: ${report.prerequisites.note}`);
console.log('');
console.log('Next steps:');
for (const step of report.nextSteps) {
  console.log(`  - ${step}`);
}

if (!validation.productionReady) {
  process.exit(1);
}
