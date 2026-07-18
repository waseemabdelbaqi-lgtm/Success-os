import {
  middleEastResearchStatus,
  persistMiddleEastResearch,
  buildCountryReport,
} from '../app/lib/ai/middle-east-research-engine.js';

const args = new Set(process.argv.slice(2));

if (args.has('--status')) {
  console.log(JSON.stringify(middleEastResearchStatus(), null, 2));
  process.exit(0);
}

console.log('PHASE 1 — MIDDLE EAST EDUCATION RESEARCH');
console.log('Research and verification ONLY. Books will NOT be generated.');
console.log('');

const result = persistMiddleEastResearch();

for (const report of result.countryReports) {
  console.log('──────── COUNTRY REPORT ────────');
  console.log(`Country: ${report.country}`);
  console.log(`Ministry of Education: ${report.ministryOfEducation?.name}`);
  console.log(
    `Ministry of Higher Education: ${report.ministryOfHigherEducation?.name}`,
  );
  console.log(
    `Educational Systems: ${(report.educationalSystems || [])
      .map((system) => system.name)
      .join(' | ')}`,
  );
  console.log(`National Curriculum: ${report.nationalCurriculum}`);
  console.log(
    `International Curricula: ${(report.internationalCurricula || [])
      .map((item) => item.name)
      .join(' | ')}`,
  );
  console.log(
    `Universities: ${(report.universities || []).map((item) => item.name).join(' | ')}`,
  );
  console.log(
    `Colleges: ${(report.colleges || []).map((item) => item.name).join(' | ')}`,
  );
  console.log(
    `Technical Institutes: ${(report.technicalInstitutes || [])
      .map((item) => item.name)
      .join(' | ')}`,
  );
  console.log(
    `Professional Programs: ${(report.professionalPrograms || [])
      .map((item) => item.name || item.status)
      .join(' | ')}`,
  );
  console.log(`Official Subjects: ${(report.officialSubjects || []).length}`);
  console.log(`Grades: ${(report.grades || []).join(', ')}`);
  console.log(
    `Official Sources Used: ${(report.officialSourcesUsed || []).length}`,
  );
  console.log(
    `Missing Information: ${(report.missingInformation || []).length} items`,
  );
  console.log(
    `Readiness Score for Book Generation: ${report.readinessScoreForBookGeneration}%`,
  );
  console.log(`Report: ${report.reportPath}`);
  console.log('');
}

const master = result.master;
console.log('════════ MIDDLE EAST MASTER REPORT ════════');
console.log(
  `Countries processed: ${master.totals.countries}`,
);
console.log(
  `Average readiness: ${master.readinessForDigitalBookGeneration.averageReadinessScore}%`,
);
console.log(
  `Countries ≥95%: ${master.readinessForDigitalBookGeneration.countriesAtOrAbove95}`,
);
console.log(
  `Phase 2 allowed: ${master.readinessForDigitalBookGeneration.phase2Allowed}`,
);
console.log(`Reason: ${master.readinessForDigitalBookGeneration.reason}`);
console.log(`Database: ${result.databasePath}`);
console.log(`Master report: ${result.masterPath}`);
console.log('');
console.log('Top remaining gaps:');
for (const gap of master.remainingGapsAndRecommendations.slice(0, 12)) {
  console.log(`- ${gap}`);
}

// Sanity: ensure book generation remains blocked in this phase.
const jordan = buildCountryReport('JO');
if (jordan.bookGenerationAllowed) {
  console.error('ERROR: book generation must remain disabled in Phase 1');
  process.exit(1);
}
