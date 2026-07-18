/* eslint-disable no-console -- CLI printer */
import { runMiddleEastProductionReadiness } from '../app/lib/ai/middle-east-production-readiness-engine.js';

console.log('PHASE 14 — MIDDLE EAST PRODUCTION READINESS');
console.log('Validate + repair only. No mass content generation.');
console.log('');

const result = runMiddleEastProductionReadiness({ repairConnections: true });
const { report } = result;
const summary = report.globalSummary;
const certification = report.certification;

console.log('──────── GLOBAL SUMMARY ────────');
console.log(`Countries: ${summary.countriesAudited}`);
console.log(`Production Ready Countries: ${summary.countriesProductionReady}`);
console.log(`Books: ${summary.books}`);
console.log(`Reading Ready: ${summary.readingReadyBooks}`);
console.log(`Quality Reviews Backfilled: ${report.qualityReviewsBackfilled}`);
console.log(`Broken Links Fixed: ${summary.brokenLinksFixed}`);
console.log(`Overall Completion: ${summary.overallMiddleEastCompletionPercentage}%`);
console.log(`Overall Quality: ${summary.overallQualityPercentage}%`);
console.log(`Certification: ${certification.status}`);
console.log(`Freeze Version: ${summary.freezeVersion || 'not frozen'}`);
console.log(`Report: ${result.reportFile}`);
if (result.freezePath) console.log(`Frozen Release: ${result.freezePath}`);
console.log('');
console.log('Country production readiness:');
for (const country of report.countries) {
  console.log(
    `- ${country.country} (${country.countryCode}): ${country.productionReady} | completion ${country.completionPercentage}% | quality ${country.qualityPercentage}% | books ${country.books}`,
  );
}
