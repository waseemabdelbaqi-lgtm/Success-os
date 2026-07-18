/* eslint-disable no-console -- CLI */
/**
 * PHASE JO-10 — Jordan National Education Registry CLI
 * Does NOT generate educational content.
 *
 *   node scripts/run-jordan-national-education-registry.mjs
 *   node scripts/run-jordan-national-education-registry.mjs --dashboard
 *   node scripts/run-jordan-national-education-registry.mjs --search="كسور"
 *   node scripts/run-jordan-national-education-registry.mjs --search="عدد" --facet=concept
 */
import {
  buildJordanNationalEducationRegistryDashboard,
  runJordanNationalEducationRegistry,
  searchJordanNationalEducationRegistry,
} from '../app/lib/ai/jordan-national-education-registry-engine.js';
import {
  REGISTRY_ENTITY_KINDS,
  REGISTRY_VERSION,
} from '../app/data/national-education-registry.js';

const args = process.argv.slice(2);
const get = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

console.log('PHASE JO-10 — JORDAN NATIONAL EDUCATION REGISTRY');
console.log(`Registry v${REGISTRY_VERSION} · ${REGISTRY_ENTITY_KINDS.length} entity kinds`);
console.log('No new content. Register existing Jordan curriculum entities.');
console.log('');

if (args.includes('--dashboard')) {
  console.log(JSON.stringify(buildJordanNationalEducationRegistryDashboard(), null, 2));
  process.exit(0);
}

const searchQ = get('search');
if (searchQ != null) {
  const result = searchJordanNationalEducationRegistry(searchQ, {
    facet: get('facet') || null,
    limit: Number(get('limit') || 20),
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 2);
}

const result = runJordanNationalEducationRegistry();
console.log('──────── REGISTRY ────────');
console.log(`Status: ${result.registrationStatus}`);
console.log(`Validation: ${result.validationOk ? 'passed' : 'FAILED'}`);
console.log(`Validation errors: ${result.validationErrors}`);
console.log(`Missing relationships: ${result.missingRelationships}`);
console.log(`Search documents: ${result.searchDocuments}`);
console.log('');
console.log('Jordan totals:');
for (const [kind, count] of Object.entries(result.totals || {})) {
  if (count) console.log(`  ${kind}: ${count}`);
}
console.log('');
console.log('Sample structural IDs: JOR-G01 · JOR-G01-MATH · JOR-G01-MATH-U01 · JOR-G01-MATH-U01-L05');
console.log(result.rule);
process.exit(result.validationOk ? 0 : 2);
