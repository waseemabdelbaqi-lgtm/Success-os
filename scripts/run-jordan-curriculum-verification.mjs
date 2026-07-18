/* eslint-disable no-console -- CLI */
/**
 * PHASE JO-03 — Jordan Curriculum Verification CLI
 *
 *   node scripts/run-jordan-curriculum-verification.mjs
 *   node scripts/run-jordan-curriculum-verification.mjs --bookId=...
 *   node scripts/run-jordan-curriculum-verification.mjs --dashboard
 *   node scripts/run-jordan-curriculum-verification.mjs --approve --bookId=...
 */
import {
  adminApproveJordanBook,
  adminRejectJordanBook,
  adminRegenerateJordanBook,
  buildJo03Dashboard,
  compareBookWithCurriculum,
  previewJordanBook,
  runJordanCurriculumVerification,
  verifyJordanBook,
} from '../app/lib/ai/jordan-curriculum-verification-engine.js';
import { JO03_PUBLISH_GATE } from '../app/lib/ai/jordan-curriculum-verification-engine.js';

const args = process.argv.slice(2);
const get = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

console.log('PHASE JO-03 — JORDAN CURRICULUM VERIFICATION ENGINE');
console.log(`Publish gate: ≥ ${JO03_PUBLISH_GATE}% + Admin approval`);
console.log('Never publish simply because a book has pages.');
console.log('');

if (args.includes('--dashboard')) {
  console.log(JSON.stringify(buildJo03Dashboard(), null, 2));
  process.exit(0);
}

const bookId = get('bookId');

if (args.includes('--approve')) {
  if (!bookId) {
    console.error('--bookId required for --approve');
    process.exit(1);
  }
  const result = adminApproveJordanBook(bookId, { notes: get('notes') || '' });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 2);
}

if (args.includes('--reject')) {
  if (!bookId) {
    console.error('--bookId required for --reject');
    process.exit(1);
  }
  const result = adminRejectJordanBook(bookId, { notes: get('notes') || '' });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 2);
}

if (args.includes('--regenerate')) {
  if (!bookId) {
    console.error('--bookId required for --regenerate');
    process.exit(1);
  }
  const result = adminRegenerateJordanBook(bookId);
  console.log(JSON.stringify({
    ok: result.ok,
    bookId,
    produced: result.produced?.publishStatus,
    verification: result.verification?.verificationStatus,
    quality: result.verification?.qualityScore,
    error: result.error,
  }, null, 2));
  process.exit(result.ok ? 0 : 2);
}

if (args.includes('--compare')) {
  if (!bookId) {
    console.error('--bookId required for --compare');
    process.exit(1);
  }
  const result = compareBookWithCurriculum(bookId);
  console.log(JSON.stringify({
    ok: result.ok,
    curriculumAccuracy: result.comparison?.curriculumMatch?.curriculumAccuracy,
    passed: result.comparison?.curriculumMatch?.passed,
    lessonsChecked: result.comparison?.curriculumMatch?.lessonsChecked,
  }, null, 2));
  process.exit(result.ok ? 0 : 2);
}

if (args.includes('--preview')) {
  if (!bookId) {
    console.error('--bookId required for --preview');
    process.exit(1);
  }
  console.log(JSON.stringify(previewJordanBook(bookId), null, 2));
  process.exit(0);
}

if (bookId) {
  const result = verifyJordanBook(bookId);
  console.log(JSON.stringify({
    ok: result.ok,
    bookId: result.bookId,
    verificationPassed: result.verificationPassed,
    qualityScore: result.qualityScore,
    meetsPublishGate: result.meetsPublishGate,
    verificationStatus: result.verificationStatus,
    publishStatus: result.publishStatus,
    error: result.error,
  }, null, 2));
  process.exit(result.ok && result.verificationPassed ? 0 : 2);
}

const result = runJordanCurriculumVerification();
console.log('──────── JO-03 VERIFICATION SUMMARY ────────');
console.log(`Books verified: ${result.verified}`);
console.log(`Pending admin: ${result.dashboard?.totals?.awaitingAdmin}`);
console.log(`Failed: ${result.dashboard?.totals?.failed}`);
console.log(`≥${JO03_PUBLISH_GATE}%: ${result.dashboard?.totals?.atOrAbove98}`);
console.log(`Published (admin): ${result.dashboard?.totals?.published}`);
console.log('');
const sample = (result.results || []).slice(0, 8);
for (const r of sample) {
  console.log(
    `  ${r.bookId}: ${r.verificationStatus} · score ${r.qualityScore} · ${r.publishStatus}`,
  );
}
if ((result.results || []).length > sample.length) {
  console.log(`  … +${result.results.length - sample.length} more`);
}
process.exit(0);
