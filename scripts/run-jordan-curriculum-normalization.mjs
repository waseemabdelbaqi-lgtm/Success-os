/* eslint-disable no-console -- CLI */
/**
 * PHASE JO-08 — Jordan Curriculum Normalization CLI
 * Does NOT generate content or create books.
 *
 *   node scripts/run-jordan-curriculum-normalization.mjs
 *   node scripts/run-jordan-curriculum-normalization.mjs --dashboard
 */
import {
  buildJordanNormalizationDashboard,
  runJordanCurriculumNormalization,
} from '../app/lib/ai/jordan-curriculum-normalization-engine.js';
import { UEM_ENTITY_KINDS, UEM_VERSION } from '../app/data/universal-education-model.js';

const args = process.argv.slice(2);

console.log('PHASE JO-08 — CURRICULUM NORMALIZATION ENGINE');
console.log(`Universal Education Model v${UEM_VERSION}`);
console.log('No new content. No new books. Normalize Jordan → UEM.');
console.log('');

if (args.includes('--dashboard')) {
  console.log(JSON.stringify(buildJordanNormalizationDashboard(), null, 2));
  process.exit(0);
}

const result = runJordanCurriculumNormalization();
console.log('──────── UEM NORMALIZATION ────────');
console.log(`Status: ${result.normalizationStatus}`);
console.log(`Validation: ${result.validationStatus}`);
console.log(`Entity kinds: ${UEM_ENTITY_KINDS.length}`);
console.log('Jordan totals:');
for (const [kind, count] of Object.entries(result.totals || {})) {
  console.log(`  ${kind}: ${count}`);
}
console.log('');
console.log('Reuse (dedupe) samples:');
const reused = result.stats?.reused || {};
console.log(`  concepts reused: ${reused.concept || 0}`);
console.log(`  skills reused: ${reused.skill || 0}`);
console.log(`  subjects reused: ${reused.subject || 0}`);
if (result.issueCount) console.log(`Issues: ${result.issueCount}`);
console.log('');
console.log('UEM is permanent. Future countries add data only — no schema redesign.');
process.exit(result.validationStatus === 'passed' ? 0 : 2);
