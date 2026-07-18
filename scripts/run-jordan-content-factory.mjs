/* eslint-disable no-console -- CLI */
/**
 * PHASE JO-09 — Success OS Content Factory CLI
 * Does NOT publish educational content directly.
 *
 *   node scripts/run-jordan-content-factory.mjs
 *   node scripts/run-jordan-content-factory.mjs --dashboard
 *   node scripts/run-jordan-content-factory.mjs --approve --recordId=...
 *   node scripts/run-jordan-content-factory.mjs --publish --recordId=...
 */
import {
  buildJordanContentFactoryDashboard,
  getJordanContentFactoryMeta,
  jordanContentFactoryAdminAction,
  listJordanContentFactoryQueue,
  runJordanContentFactory,
} from '../app/lib/ai/jordan-content-factory-engine.js';

const args = process.argv.slice(2);
const get = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

console.log('PHASE JO-09 — SUCCESS OS CONTENT FACTORY');
console.log('No direct publication. Full pipeline required.');
console.log('');

if (args.includes('--dashboard')) {
  console.log(JSON.stringify(buildJordanContentFactoryDashboard(), null, 2));
  process.exit(0);
}

if (args.includes('--meta')) {
  console.log(JSON.stringify(getJordanContentFactoryMeta(), null, 2));
  process.exit(0);
}

if (args.includes('--queue')) {
  console.log(JSON.stringify(listJordanContentFactoryQueue('Admin Review'), null, 2));
  process.exit(0);
}

const recordId = get('recordId');
const adminActions = [
  'approve',
  'reject',
  'publish',
  'republish',
  'archive',
  'requestRevision',
  'comment',
  'preview',
];
for (const action of adminActions) {
  if (args.includes(`--${action}`)) {
    if (!recordId && action !== 'preview') {
      console.error(`--recordId required for --${action}`);
      process.exit(1);
    }
    const result = jordanContentFactoryAdminAction(recordId, action, {
      by: get('by') || 'cli-admin',
      comment: get('comment') || '',
    });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 2);
  }
}

const result = runJordanContentFactory();
console.log('──────── CONTENT FACTORY ────────');
console.log(`Factory: v${result.factoryVersion}`);
console.log(`Enrolled lessons: ${result.enrolled}`);
console.log(`Pipeline stages: ${result.pipelineStages}`);
console.log(`Lessons under review: ${result.metrics?.lessonsUnderReview}`);
console.log(`Approved: ${result.metrics?.approvedLessons}`);
console.log(`Rejected: ${result.metrics?.rejectedLessons}`);
console.log(`Published (factory): ${result.metrics?.publishedLessons}`);
console.log(`Avg quality score: ${result.metrics?.averageQualityScore}`);
console.log(`Missing references: ${result.metrics?.missingReferences}`);
console.log(`Broken links: ${result.metrics?.brokenLinks}`);
console.log('');
console.log('By status:');
for (const [status, count] of Object.entries(result.metrics?.byStatus || {})) {
  if (count) console.log(`  ${status}: ${count}`);
}
console.log('');
console.log(result.rule);
process.exit(0);
