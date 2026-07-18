/* eslint-disable no-console -- CLI printer */
/**
 * PHASE JO-01 — Jordan National Curriculum Knowledge Engine CLI
 * Usage:
 *   node scripts/run-jordan-national-knowledge.mjs
 *   node scripts/run-jordan-national-knowledge.mjs --status
 *   node scripts/run-jordan-national-knowledge.mjs --harvest-nccd
 *   node scripts/run-jordan-national-knowledge.mjs --dashboard
 */
import {
  buildJordanKnowledgeDashboard,
  harvestNccdCatalogues,
  readJordanKnowledgeStatus,
  runJordanNationalKnowledgeEngine,
} from '../app/lib/ai/jordan-national-knowledge-engine.js';
import { JO_VERIFICATION_GATE, JO_EXCLUDED_CURRICULA } from '../app/data/jordan-national-knowledge-sources.js';

const args = process.argv.slice(2);
const statusOnly = args.includes('--status');
const dashboardOnly = args.includes('--dashboard');
const harvest = args.includes('--harvest-nccd');

console.log('PHASE JO-01 — JORDAN NATIONAL CURRICULUM KNOWLEDGE ENGINE');
console.log('Scope: Jordan National Curriculum ONLY');
console.log(`Excluded: ${JO_EXCLUDED_CURRICULA.slice(0, 6).join(', ')}, …`);
console.log(`Book generation gate: ≥ ${JO_VERIFICATION_GATE}% verified`);
console.log('');

if (statusOnly) {
  const status = readJordanKnowledgeStatus();
  if (!status) {
    console.log('No knowledge database yet. Run without --status to build.');
    process.exit(1);
  }
  console.log(JSON.stringify(status, null, 2));
  process.exit(status.bookGenerationAllowed ? 0 : 2);
}

if (dashboardOnly) {
  console.log(JSON.stringify(buildJordanKnowledgeDashboard(), null, 2));
  process.exit(0);
}

if (harvest) {
  console.log('Harvesting NCCD grade catalogues (metadata only, no textbook prose)…');
  const results = await harvestNccdCatalogues();
  const ok = results.filter((r) => r.ok).length;
  console.log(`NCCD scans: ${ok}/${results.length} succeeded`);
  for (const r of results) {
    console.log(
      r.ok
        ? `  ✓ ${r.grade}: ${r.subjects} subjects`
        : `  ✗ ${r.grade}: ${r.error}`,
    );
  }
  console.log('');
}

const result = runJordanNationalKnowledgeEngine();
console.log('──────── JO-01 KNOWLEDGE BUILD ────────');
console.log(`Grade×subject cells: ${result.totals.gradeSubjectCells}`);
console.log(`Units: ${result.totals.units}`);
console.log(`Lessons: ${result.totals.lessons}`);
console.log(`Learning outcomes: ${result.totals.learningOutcomes}`);
console.log(`Verified completion: ${result.verifiedCompletionPercent}%`);
console.log(`Gate (≥${JO_VERIFICATION_GATE}%): ${result.bookGenerationAllowed ? 'PASSED — book generation ALLOWED' : 'FAILED — book generation BLOCKED'}`);
console.log(`Database: ${result.dbFile}`);
console.log('');
if (!result.bookGenerationAllowed) {
  console.log('Books will NOT be generated until the knowledge database reaches 98% verified completion.');
  process.exitCode = 2;
} else {
  console.log('Knowledge gate open for Jordan national book authoring (still no copyrighted textbook copy).');
}
