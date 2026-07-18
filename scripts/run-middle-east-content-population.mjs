/* eslint-disable no-console -- CLI */
import {
  runMiddleEastContentPopulation,
  approveMiddleEastBook,
  buildPopulationDashboard,
} from '../app/lib/ai/middle-east-content-population-engine.js';

const args = process.argv.slice(2);
const get = (flag) => {
  const hit = args.find((arg) => arg.startsWith(`${flag}=`));
  return hit ? hit.slice(flag.length + 1) : null;
};

if (args.includes('--dashboard')) {
  console.log(JSON.stringify(buildPopulationDashboard(), null, 2));
  process.exit(0);
}

if (args.includes('--approve')) {
  const bookId = get('--bookId');
  if (!bookId) {
    console.error('--bookId required with --approve');
    process.exit(1);
  }
  console.log(JSON.stringify(approveMiddleEastBook(bookId), null, 2));
  process.exit(0);
}

const limit = Number(get('--limit') || 1);
const countryCode = get('--country');
const bookId = get('--bookId');

console.log('PHASE 15.2 — MIDDLE EAST DIGITAL BOOK CONTENT POPULATION');
console.log('Populate existing books only. Admin approval required to publish.');
console.log(`limit=${limit}${countryCode ? ` country=${countryCode}` : ''}${bookId ? ` bookId=${bookId}` : ''}`);
console.log('');

const { report, reportFile, dashboard } = runMiddleEastContentPopulation({
  limit,
  countryCode,
  bookId,
  force: args.includes('--force'),
});

console.log('──────── RESULT ────────');
console.log(`Processed: ${report.processed}`);
console.log(`Succeeded: ${report.succeeded}`);
console.log(`Failed: ${report.failed}`);
for (const item of report.results) {
  console.log(
    `- ${item.bookId || item.error}: ok=${item.ok} lessons=${item.lessonsCompleted ?? '-'} rejected=${item.lessonsRejected ?? '-'}`,
  );
}
console.log(`Populated total: ${dashboard.totals.booksPopulated}/${dashboard.totals.booksDetected}`);
console.log(`Approved: ${dashboard.totals.booksApproved}`);
console.log(`Report: ${reportFile}`);
