/* eslint-disable no-console -- CLI */
/**
 * PHASE JO-06 — Jordan Curriculum Update Engine CLI
 * Does NOT create new books.
 *
 *   node scripts/run-jordan-curriculum-update.mjs
 *   node scripts/run-jordan-curriculum-update.mjs --detect-only
 *   node scripts/run-jordan-curriculum-update.mjs --dashboard
 *   node scripts/run-jordan-curriculum-update.mjs --approve --draftId=...
 *   node scripts/run-jordan-curriculum-update.mjs --notice --grade=الصف-5 --subject=الرياضيات
 */
import {
  approveJordanUpdateDraft,
  buildJordanUpdateDashboard,
  rejectJordanUpdateDraft,
  registerJordanCurriculumNotice,
  runJordanCurriculumUpdateMonitor,
} from '../app/lib/ai/jordan-curriculum-update-engine.js';

const args = process.argv.slice(2);
const get = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

console.log('PHASE JO-06 — JORDAN CURRICULUM UPDATE ENGINE');
console.log('No new books. Monitor → detect → impact → safe drafts → Admin.');
console.log('');

if (args.includes('--dashboard')) {
  console.log(JSON.stringify(buildJordanUpdateDashboard(), null, 2));
  process.exit(0);
}

if (args.includes('--approve')) {
  const draftId = get('draftId');
  if (!draftId) {
    console.error('--draftId required');
    process.exit(1);
  }
  const result = approveJordanUpdateDraft(draftId, { approvedBy: 'cli-admin' });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 2);
}

if (args.includes('--reject')) {
  const draftId = get('draftId');
  if (!draftId) {
    console.error('--draftId required');
    process.exit(1);
  }
  const result = rejectJordanUpdateDraft(draftId, {
    rejectedBy: 'cli-admin',
    notes: get('notes') || 'Rejected via CLI',
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 2);
}

if (args.includes('--notice')) {
  const result = registerJordanCurriculumNotice({
    title: get('title') || 'MoE/NCCD curriculum notice',
    grade: get('grade') || 'all',
    subject: get('subject') || 'all',
    changeType: get('type') || 'new-curriculum-version',
    officialSource: get('url') || 'https://moe.gov.jo/',
    notes: get('notes') || '',
  });
  console.log('──────── NOTICE INJECTED ────────');
  console.log(`Changes: ${result.changeCount}`);
  console.log(`Books impacted: ${result.impacts?.length || 0}`);
  console.log(`Drafts: ${result.drafts?.length || 0}`);
  process.exit(result.ok ? 0 : 2);
}

const result = runJordanCurriculumUpdateMonitor({
  detectOnly: args.includes('--detect-only'),
});

console.log('──────── MONITOR CYCLE ────────');
console.log(`Snapshot: ${result.snapshotId}`);
console.log(`Changes: ${result.changeCount}`);
console.log(`Books impacted: ${result.impacts?.length || 0}`);
console.log(`Drafts created: ${result.drafts?.length || 0}`);
console.log(`Pending drafts: ${result.dashboard?.updateProgress?.pendingDrafts ?? '—'}`);
console.log(`Unread notifications: ${result.dashboard?.updateProgress?.unreadNotifications ?? '—'}`);
if (result.changeCount === 0) {
  console.log('No curriculum delta vs previous snapshot (baseline or unchanged).');
}
process.exit(0);
