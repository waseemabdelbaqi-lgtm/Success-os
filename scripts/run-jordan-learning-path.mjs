/* eslint-disable no-console -- CLI */
/**
 * PHASE JO-07 — Jordan Learning Path Engine CLI
 * Does NOT generate curriculum content.
 *
 *   node scripts/run-jordan-learning-path.mjs
 *   node scripts/run-jordan-learning-path.mjs --dashboard
 *   node scripts/run-jordan-learning-path.mjs --progress --studentId=demo --bookId=...
 */
import {
  buildJordanLearningPathDashboard,
  buildJordanLearningPaths,
  getJordanStudentProgression,
  recommendJordanNextLesson,
  runJordanLearningPathEngine,
} from '../app/lib/ai/jordan-learning-path-engine.js';

const args = process.argv.slice(2);
const get = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

console.log('PHASE JO-07 — JORDAN LEARNING PATH ENGINE');
console.log('No new curriculum content. Guided journeys from existing JO books.');
console.log('');

if (args.includes('--dashboard')) {
  console.log(JSON.stringify(buildJordanLearningPathDashboard(), null, 2));
  process.exit(0);
}

if (args.includes('--progress')) {
  const studentId = get('studentId') || 'demo-student-jo';
  const bookId = get('bookId');
  if (!bookId) {
    console.error('--bookId required with --progress');
    process.exit(1);
  }
  const progression = getJordanStudentProgression(studentId, bookId);
  const next = recommendJordanNextLesson(studentId, bookId);
  console.log(JSON.stringify({ progression, next }, null, 2));
  process.exit(progression.ok ? 0 : 2);
}

if (args.includes('--build-only')) {
  const index = buildJordanLearningPaths();
  console.log(`Paths: ${index.totals.books} books · ${index.totals.lessons} lessons`);
  process.exit(0);
}

const result = runJordanLearningPathEngine({
  seedDemo: !args.includes('--no-demo'),
});

console.log('──────── JO-07 LEARNING PATHS ────────');
console.log(`Books with paths: ${result.index.totals.books}`);
console.log(`Lessons mapped: ${result.index.totals.lessons}`);
console.log(`Est. study minutes: ${result.index.totals.minutes}`);
if (result.demo?.ok) {
  const p = result.demo.progression;
  console.log(`Demo student: ${result.demo.studentId}`);
  console.log(`Demo book: ${result.demo.bookId}`);
  console.log(
    `Position: ${p.currentPosition?.title || '—'} · Book ${p.bookProgress?.percent}% · Remaining ${p.remainingLessons}`,
  );
  console.log(
    `Next: ${p.recommendation?.recommendedLessonId || p.recommendation?.reason}`,
  );
}
console.log(
  `Analytics — started ${result.dashboard.analytics.studentsStarted}, curriculum ${result.dashboard.analytics.curriculumCompletionPercentage}%`,
);
process.exit(0);
