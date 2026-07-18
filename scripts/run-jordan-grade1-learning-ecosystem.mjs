/* eslint-disable no-console -- CLI */
/**
 * PHASE JO-01.2 — Grade 1 Complete Learning Ecosystem CLI
 *
 *   node scripts/run-jordan-grade1-learning-ecosystem.mjs
 *   node scripts/run-jordan-grade1-learning-ecosystem.mjs --subject=الرياضيات
 *   node scripts/run-jordan-grade1-learning-ecosystem.mjs --dashboard
 *   node scripts/run-jordan-grade1-learning-ecosystem.mjs --maxLessons=1
 */
import {
  buildGrade1EcosystemDashboard,
  listGrade1EcosystemPackages,
  runJordanGrade1LearningEcosystem,
} from '../app/lib/ai/jordan-grade1-learning-ecosystem-engine.js';
import {
  G1_OFFICIAL_CATALOG_URL,
  G1_OFFICIAL_SUBJECTS,
  G1_COMPLETION_CHECKLIST,
} from '../app/data/jordan-grade1-learning-ecosystem.js';

const args = process.argv.slice(2);
const get = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

console.log('PHASE JO-01.2 — JORDAN GRADE 1 COMPLETE LEARNING ECOSYSTEM');
console.log(`Official source: ${G1_OFFICIAL_CATALOG_URL}`);
console.log(`Checklist items per lesson: ${G1_COMPLETION_CHECKLIST.length}`);
console.log('Hard gate: 100% per lesson before next. Grade 2 locked until G1 complete.');
console.log('');

if (args.includes('--dashboard')) {
  console.log(JSON.stringify(buildGrade1EcosystemDashboard(), null, 2));
  process.exit(0);
}

if (args.includes('--list')) {
  console.log(JSON.stringify(listGrade1EcosystemPackages(get('subject')), null, 2));
  process.exit(0);
}

const result = runJordanGrade1LearningEcosystem({
  subject: get('subject') || undefined,
  maxLessons: get('maxLessons') ? Number(get('maxLessons')) : undefined,
  force: args.includes('--force'),
  stopOnIncomplete: !args.includes('--continue-on-error'),
});

console.log('──────── GRADE 1 ECOSYSTEM ────────');
console.log(`Completed lessons: ${result.completedLessons}`);
console.log(`Incomplete: ${result.incompleteLessons}`);
console.log(`Grade 1 complete: ${result.grade1Complete}`);
console.log(`Grade 2 unlocked: ${result.grade2Unlocked}`);
if (result.blockedAt) {
  console.log('Blocked at:', JSON.stringify(result.blockedAt, null, 2));
}
console.log('');
console.log('Subjects:');
for (const s of G1_OFFICIAL_SUBJECTS) {
  const st = result.subjects?.[s];
  if (!st) {
    console.log(`  ${s}: not started`);
    continue;
  }
  console.log(
    `  ${s}: ${st.completed || 0}/${st.totalLessons || 0} (${st.status || '—'})` +
      (st.jo02Produced ? ' [JO-02 book]' : ' [from JO-01 knowledge]'),
  );
}
console.log('');
console.log(result.rule);
process.exit(result.incompleteLessons > 0 && result.blockedAt ? 2 : 0);
