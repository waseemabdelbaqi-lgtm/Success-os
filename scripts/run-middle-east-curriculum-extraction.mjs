/* eslint-disable no-console -- CLI printer */
import { runMiddleEastCurriculumKnowledgeExtraction } from '../app/lib/ai/middle-east-curriculum-knowledge-extraction-engine.js';

console.log('PHASE 15.1 — MIDDLE EAST OFFICIAL CURRICULUM KNOWLEDGE EXTRACTION');
console.log('Research first. No empty books. No invented objectives.');
console.log('');

const { master, reportFile } = runMiddleEastCurriculumKnowledgeExtraction();
const totals = master.totals;

console.log('──────── EXTRACTION SUMMARY ────────');
console.log(`Countries: ${totals.countries}`);
console.log(`Queue subjects researched: ${totals.queueSubjects}`);
console.log(`Research packets written: ${totals.researchPacketsWritten}`);
console.log(`Generation ALLOWED (verified objectives): ${totals.generationAllowedSubjects}`);
console.log(`Generation BLOCKED (missing official objectives): ${totals.generationBlockedSubjects}`);
console.log(`Existing ME books scanned: ${totals.existingMeBooksScanned}`);
console.log(`Scaffold / empty books detected: ${totals.scaffoldOrEmptyBooks}`);
console.log(`Curriculum-content-ready books: ${totals.curriculumContentReadyBooks}`);
console.log(`Report: ${reportFile}`);
console.log('');
console.log('Country blockers:');
for (const country of master.countryReports) {
  console.log(
    `- ${country.country} (${country.countryCode}): allow ${country.generationAllowedSubjects} / block ${country.blockedSubjects} | scaffolds ${country.scaffoldBooks} | objectives: ${String(country.learningObjectivesStatus).slice(0, 72)}`,
  );
}
console.log('');
console.log('Next: capture official lesson-level objectives before any book generation.');
