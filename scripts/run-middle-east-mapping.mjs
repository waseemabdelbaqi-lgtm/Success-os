/* eslint-disable no-console -- CLI status printer */
import {
  middleEastMappingStatus,
  persistMiddleEastEducationMaps,
} from '../app/lib/ai/middle-east-mapping-engine.js';

const args = new Set(process.argv.slice(2));

if (args.has('--status')) {
  console.log(JSON.stringify(middleEastMappingStatus(), null, 2));
  process.exit(0);
}

console.log('PHASE 2 — MIDDLE EAST EDUCATION MAPPING');
console.log('Mapping only. Digital books will NOT be generated.');
console.log('');

const result = persistMiddleEastEducationMaps();

for (const profile of result.profiles) {
  console.log('──────── COUNTRY EDUCATION PROFILE ────────');
  console.log(`Country: ${profile.country}`);
  console.log(`Ministries: MoE + MoHE mapped`);
  console.log(
    `Accreditation: ${profile.accreditationAuthorities?.name || 'n/a'}`,
  );
  console.log(
    `Educational Systems: ${(profile.educationalSystems || []).join(' | ')}`,
  );
  console.log(`National Curriculum: ${profile.nationalCurriculum?.name}`);
  console.log(
    `International Curricula flagged: ${(profile.internationalCurricula || []).length}`,
  );
  console.log(`Universities: ${profile.universities.length}`);
  console.log(`Colleges: ${profile.colleges.length}`);
  console.log(`Technical Institutes: ${profile.technicalInstitutes.length}`);
  console.log(
    `Professional Education Providers: ${profile.professionalEducationProviders.length}`,
  );
  console.log(`School Subjects: ${profile.schoolSubjects.length}`);
  console.log(`University Programs (known seeds): ${profile.degreePrograms.length}`);
  console.log(
    `Languages: ${(profile.languagesOfInstruction || []).join(', ')}`,
  );
  console.log(`Accreditation Status: ${profile.accreditationStatus}`);
  console.log(`Official Sources Used: ${profile.officialSourcesUsed.length}`);
  console.log(`Missing Information: ${profile.missingInformation.length}`);
  console.log(`Readiness Score: ${profile.readinessScorePercent}%`);
  console.log(`Profile: ${profile.profilePath}`);
  console.log('');
}

const master = result.master;
console.log('════════ MIDDLE EAST MASTER INDEX ════════');
console.log(`Countries: ${master.totals.countries}`);
console.log(
  `Average map completeness: ${master.readiness.averageMapCompletenessPercent}%`,
);
console.log(`Countries ≥95%: ${master.readiness.countriesAtOrAbove95}`);
console.log(`Digital books allowed: ${master.readiness.digitalBooksAllowed}`);
console.log(`Reason: ${master.readiness.reason}`);
console.log(`Master index: ${result.masterPath}`);
console.log(`Storage root: ${result.root}`);

if (master.bookGenerationAllowed) {
  console.error('ERROR: books must remain disabled in mapping phase');
  process.exit(1);
}
