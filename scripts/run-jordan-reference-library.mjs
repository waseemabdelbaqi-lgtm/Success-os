/* eslint-disable no-console -- CLI */
/**
 * PHASE JO-05 — Jordan Educational Reference Library CLI
 * Does NOT generate educational content.
 *
 *   node scripts/run-jordan-reference-library.mjs
 *   node scripts/run-jordan-reference-library.mjs --dashboard
 *   node scripts/run-jordan-reference-library.mjs --link
 *   node scripts/run-jordan-reference-library.mjs --probe
 */
import {
  buildReferenceLibraryDashboard,
  linkJordanBooksToReferenceLibrary,
  probeReferenceUrls,
  registerCurriculumUpdate,
  runJordanEducationalReferenceLibrary,
} from '../app/lib/ai/jordan-educational-reference-library-engine.js';
import { JO05_CATEGORIES } from '../app/data/jordan-educational-reference-seed.js';

const args = process.argv.slice(2);
const get = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

console.log('PHASE JO-05 — JORDAN EDUCATIONAL REFERENCE LIBRARY');
console.log('No educational content generation in this phase.');
console.log(`Categories: ${JO05_CATEGORIES.length}`);
console.log('');

if (args.includes('--dashboard')) {
  console.log(JSON.stringify(buildReferenceLibraryDashboard(), null, 2));
  process.exit(0);
}

if (args.includes('--link')) {
  const report = linkJordanBooksToReferenceLibrary({ onlyJo02: true });
  console.log(`Linked books: ${report.books.length}`);
  console.log(`Complete: ${report.books.filter((b) => b.linkComplete).length}`);
  process.exit(0);
}

if (args.includes('--probe')) {
  const results = await probeReferenceUrls({ limit: Number(get('limit') || 20) });
  const ok = results.filter((r) => r.ok).length;
  console.log(`URL probe: ${ok}/${results.length} ok`);
  for (const r of results.filter((x) => !x.ok).slice(0, 10)) {
    console.log(`  ✗ ${r.sourceId}: ${r.error || r.status}`);
  }
  process.exit(0);
}

if (args.includes('--curriculum-update')) {
  const result = registerCurriculumUpdate({
    title: get('title') || 'MoE curriculum update',
    officialUrl: get('url') || undefined,
    edition: get('edition') || undefined,
    affectedGrades: (get('grades') || '').split(',').filter(Boolean),
    affectedSubjects: (get('subjects') || '').split(',').filter(Boolean),
    notes: get('notes') || '',
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

const result = runJordanEducationalReferenceLibrary({ onlyJo02: true });
console.log('──────── JO-05 LIBRARY BUILD ────────');
console.log(`Total references: ${result.totals.totalReferences}`);
console.log(`Verified: ${result.totals.verifiedReferences}`);
console.log(`Pending: ${result.totals.pendingVerification}`);
console.log(`Broken: ${result.totals.brokenReferences}`);
console.log(`Library version: ${result.libraryVersion}`);
if (result.linking) {
  console.log(`Books linked: ${result.linking.books.length}`);
  console.log(`Link complete: ${result.linking.books.filter((b) => b.linkComplete).length}`);
}
console.log('');
console.log('Reference library is the permanent foundation for Jordan national books.');
console.log('No content may be generated/updated/published without verified sources here.');
