/* eslint-disable no-console -- CLI printer */
/**
 * PHASE JO-02 — Jordan Book Production Engine CLI
 *
 *   node scripts/run-jordan-book-production.mjs
 *   node scripts/run-jordan-book-production.mjs --subject=الرياضيات
 *   node scripts/run-jordan-book-production.mjs --next
 *   node scripts/run-jordan-book-production.mjs --dashboard
 */
import {
  buildJordanProductionDashboard,
  produceNextJordanBook,
  produceJordanSubject,
  runJordanBookProduction,
} from '../app/lib/ai/jordan-book-production-engine.js';
import { JO_EXCLUDED_CURRICULA } from '../app/data/jordan-national-knowledge-sources.js';

const args = process.argv.slice(2);
const get = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

console.log('PHASE JO-02 — JORDAN BOOK PRODUCTION ENGINE');
console.log('Scope: Jordan National Curriculum ONLY');
console.log(`Excluded: ${JO_EXCLUDED_CURRICULA.slice(0, 5).join(', ')}, …`);
console.log('Rule: one subject at a time · quality over quantity');
console.log('');

if (args.includes('--dashboard')) {
  const dashboard = buildJordanProductionDashboard();
  console.log(JSON.stringify(dashboard, null, 2));
  process.exit(0);
}

const subject = get('subject');
if (subject) {
  console.log(`Producing entire subject: ${subject}`);
  const result = produceJordanSubject(subject, { force: args.includes('--force') });
  console.log('──────── SUBJECT RESULT ────────');
  console.log(`Subject: ${result.subject}`);
  console.log(`Complete: ${result.subjectComplete}`);
  console.log(`Books attempted: ${result.booksAttempted}`);
  console.log(`Books published: ${result.booksPublished}`);
  for (const r of result.results || []) {
    console.log(
      `  - ${r.bookId || '?'}: ${r.skipped ? 'skipped' : r.publishStatus || r.error} · QA ${r.qualityScore ?? '—'} · lessons ${r.lessonsCompleted ?? 0}/${(r.lessonsCompleted || 0) + (r.lessonsRejected || 0)}`,
    );
  }
  process.exit(result.ok && result.subjectComplete ? 0 : 2);
}

if (args.includes('--next') || args.length === 0) {
  const result = produceNextJordanBook({ force: args.includes('--force') });
  console.log('──────── NEXT BOOK ────────');
  console.log(JSON.stringify({
    ok: result.ok,
    subject: result.subject,
    bookId: result.bookId,
    subjectComplete: result.subjectComplete,
    remainingInSubject: result.remainingInSubject,
    publishStatus: result.publishStatus,
    qualityScore: result.qualityScore,
    lessonsCompleted: result.lessonsCompleted,
    lessonsRejected: result.lessonsRejected,
    error: result.error,
    nextSubject: result.nextSubject,
  }, null, 2));
  process.exit(result.ok ? 0 : 2);
}

const result = runJordanBookProduction({ subject: get('subject') });
console.log(JSON.stringify(result, null, 2));
