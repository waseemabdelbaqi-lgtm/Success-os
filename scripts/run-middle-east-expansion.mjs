/* eslint-disable no-console -- CLI printer */
import {
  middleEastExpansionStatus,
  runMiddleEastLibraryExpansion,
  buildMiddleEastCompletionDashboard,
  persistMiddleEastCompletionDashboard,
} from '../app/lib/ai/middle-east-library-expansion-engine.js';
import { rebuildMiddleEastLiveBookIndex } from '../app/lib/student/middle-east-live-book-store.js';

const args = process.argv.slice(2);
const set = new Set(args);

if (set.has('--status')) {
  console.log(JSON.stringify(middleEastExpansionStatus(), null, 2));
  process.exit(0);
}

if (set.has('--dashboard')) {
  rebuildMiddleEastLiveBookIndex();
  const dashboard = buildMiddleEastCompletionDashboard();
  const path = persistMiddleEastCompletionDashboard(dashboard);
  console.log('MIDDLE EAST COMPLETION DASHBOARD');
  console.log(JSON.stringify(dashboard.totals, null, 2));
  console.log(`Saved: ${path}`);
  process.exit(0);
}

const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) : 25;
const countryArg = args.find((arg) => arg.startsWith('--countries='));
const countries = countryArg
  ? countryArg
      .slice('--countries='.length)
      .split(',')
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean)
  : null;

console.log('PHASE 10 — MIDDLE EAST DIGITAL LIBRARY EXPANSION');
console.log('Region lock: Middle East only. No other continent.');
console.log(`Batch limit: ${limit}`);
console.log('');

const result = runMiddleEastLibraryExpansion({
  limit,
  countries,
  refreshExisting: set.has('--refresh'),
});

console.log('──────── EXPANSION REPORT ────────');
console.log(`Processed: ${result.report.processed}`);
console.log(`Created: ${result.report.created}`);
console.log(`Updated: ${result.report.updated}`);
console.log(`Remaining missing: ${result.report.remainingMissing}`);
console.log(`Live books indexed: ${result.report.liveBooksIndexed}`);
console.log(
  `Overall ME completion: ${result.report.dashboardTotals.overallMiddleEastCompletionPercentage}%`,
);
console.log(`Report: ${result.reportPath}`);
console.log(`Dashboard: ${result.dashboardPath}`);
