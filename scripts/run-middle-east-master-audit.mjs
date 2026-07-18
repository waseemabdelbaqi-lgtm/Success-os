/* eslint-disable no-console -- CLI printer */
import { runMiddleEastMasterAudit } from '../app/lib/ai/middle-east-master-audit-engine.js';

const args = new Set(process.argv.slice(2));
const repairConnections = args.has('--repair') || !args.has('--no-repair');

console.log('PHASE 13 — MIDDLE EAST VERIFICATION & AUDIT');
console.log('Audit only. No book generation. No design changes.');
console.log(`Repair connections: ${repairConnections}`);
console.log('');

const result = runMiddleEastMasterAudit({ repairConnections });
const summary = result.master.globalSummary;
const certification = result.master.certification;

console.log('──────── GLOBAL SUMMARY ────────');
console.log(`Countries Audited: ${summary.countriesAudited}`);
console.log(`Countries Certified: ${summary.countriesCertified}`);
console.log(`Educational Systems: ${summary.educationalSystems}`);
console.log(`Curricula: ${summary.curricula}`);
console.log(`Universities: ${summary.universities}`);
console.log(`Colleges: ${summary.colleges}`);
console.log(`Professional Programs: ${summary.professionalPrograms}`);
console.log(`Subjects: ${summary.subjects}`);
console.log(`Books: ${summary.books}`);
console.log(`Units: ${summary.units}`);
console.log(`Lessons: ${summary.lessons}`);
console.log(`Reading Ready Books: ${summary.readingReadyBooks}`);
console.log(`Broken Links Fixed: ${summary.brokenLinksFixed}`);
console.log(`Missing Books: ${summary.missingBooks}`);
console.log(`Missing Subjects: ${summary.missingSubjects}`);
console.log(
  `Overall Middle East Completion: ${summary.overallMiddleEastCompletionPercentage}%`,
);
console.log(`Certification: ${certification.status}`);
console.log(`Blocked Countries: ${certification.blockedCountries.join(', ') || 'none'}`);
console.log(`Master Report: ${result.masterFile}`);
