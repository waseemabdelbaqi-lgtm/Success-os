/* eslint-disable no-console -- CLI printer */
import {
  contentEngineStatus,
  runContentEngineBootstrap,
  generateSubjectDraftContent,
} from '../app/lib/ai/educational-content-generation-engine.js';

const args = new Set(process.argv.slice(2));

if (args.has('--status')) {
  console.log(JSON.stringify(contentEngineStatus(), null, 2));
  process.exit(0);
}

if (args.has('--sample')) {
  console.log('PHASE 8 — SAMPLE SUBJECT DRAFT (not full library)');
  const result = generateSubjectDraftContent(
    {
      countryId: 'JO',
      country: 'Jordan',
      curriculum: 'Jordan National Curriculum',
      curriculumId: 'jo-national',
      subject: 'الرياضيات',
      subjectId: 'jo-math',
      grade: 'الصف 5',
      academicLevel: 'Basic education',
      educationalSystem: 'national',
      authority: 'Ministry of Education — Jordan',
      source: 'https://moe.gov.jo/',
      language: 'ar',
    },
    { persist: true },
  );
  console.log(`Subject: ${result.subjectDraft.identity.subject}`);
  console.log(`Units: ${result.subjectDraft.units.length}`);
  console.log(`Lessons: ${result.subjectDraft.subjectCompletionReport.lessonsCompleted}`);
  console.log(`Blocks: ${result.contentBlocks.length}`);
  console.log(`Status: ${result.subjectDraft.status}`);
  console.log(`Publication allowed: ${result.subjectDraft.publicationAllowed}`);
  console.log(`Draft: ${result.paths?.draftPath}`);
  console.log(`Subject report: ${result.paths?.subjectReportPath}`);
  process.exit(0);
}

console.log('PHASE 8 — EDUCATIONAL CONTENT GENERATION ENGINE');
console.log('Validate engine only. Full library will NOT be generated.');
console.log('');

const result = runContentEngineBootstrap({
  generateSampleSubject: false,
});

console.log('──────── CONTENT ENGINE VALIDATION ────────');
console.log(`Production ready: ${result.validation.productionReady}`);
console.log(`Score: ${result.validation.scorePercent}%`);
console.log(`Mass library generation: ${result.massLibraryGenerationAllowed}`);
console.log(`Auto publish: false`);
console.log(`Summary: ${result.validation.summary}`);
console.log(`Report: ${result.validationPath}`);

if (!result.validation.productionReady) process.exit(1);
