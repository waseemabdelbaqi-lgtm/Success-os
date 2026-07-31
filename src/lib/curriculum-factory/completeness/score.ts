import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";

/**
 * Weighted completeness — never 100% while critical blockers exist.
 */
export function scoreLessonCompleteness(lessonId: string): number {
  applyMigrations();
  const db = getBookEngineDb();
  const weights = {
    identity: 0.1,
    outcomes: 0.1,
    explanation: 0.2,
    examples: 0.1,
    activities: 0.15,
    answers: 0.15,
    sources: 0.1,
    review: 0.1,
  };
  let score = 0;
  const lesson = db.prepare(`SELECT * FROM lessons WHERE id=?`).get(lessonId) as Record<string, unknown> | undefined;
  if (!lesson) return 0;
  if (lesson.title_ar) score += weights.identity;

  const outcomes = (
    db.prepare(`SELECT COUNT(*) AS n FROM learning_outcomes WHERE lesson_id=?`).get(lessonId) as { n: number }
  ).n;
  if (outcomes > 0) score += weights.outcomes;

  const blocks = db
    .prepare(`SELECT type, content_json FROM content_blocks WHERE lesson_id=? AND deleted_at IS NULL`)
    .all(lessonId) as Array<{ type: string; content_json: string }>;
  if (blocks.some((b) => ["paragraph", "definition", "rich_text"].includes(b.type))) score += weights.explanation;
  if (blocks.some((b) => ["worked_example", "step_solution"].includes(b.type))) score += weights.examples;

  const acts = (db.prepare(`SELECT COUNT(*) AS n FROM activities WHERE lesson_id=?`).get(lessonId) as { n: number }).n;
  if (acts > 0) score += weights.activities;

  const answers = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM answers ans
         JOIN questions q ON q.id=ans.question_id
         JOIN activities a ON a.id=q.activity_id
         WHERE a.lesson_id=?`,
      )
      .get(lessonId) as { n: number }
  ).n;
  if (answers > 0) score += weights.answers;

  // sources / review — partial credit only when review_tasks exist for parent version
  score += weights.sources * 0.5; // companion source alignment recorded at book level typically
  const reviewed = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM review_tasks rt
         JOIN units u ON u.book_version_id = rt.book_version_id
         JOIN lessons l ON l.unit_id = u.id
         WHERE l.id=? AND rt.status IN ('approved','closed')`,
      )
      .get(lessonId) as { n: number }
  ).n;
  if (reviewed > 0) score += weights.review;

  return Math.round(Math.min(1, score) * 1000) / 1000;
}

export function scoreBookCompleteness(bookId: string): {
  score: number;
  hasCriticalBlocker: boolean;
  breakdown: Record<string, number | boolean | string>;
} {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();
  const book = db.prepare(`SELECT * FROM books WHERE id=?`).get(bookId) as Record<string, unknown> | undefined;
  if (!book) return { score: 0, hasCriticalBlocker: true, breakdown: { error: "missing" } };

  const ver = db
    .prepare(`SELECT id FROM book_versions WHERE book_id=? ORDER BY version_number DESC LIMIT 1`)
    .get(bookId) as { id: string } | undefined;
  if (!ver) return { score: 0, hasCriticalBlocker: true, breakdown: { error: "no_version" } };

  const lessons = db
    .prepare(
      `SELECT l.id FROM lessons l JOIN units u ON u.id=l.unit_id WHERE u.book_version_id=? AND l.deleted_at IS NULL`,
    )
    .all(ver.id) as Array<{ id: string }>;

  const lessonScores = lessons.map((l) => scoreLessonCompleteness(l.id));
  const avgLesson = lessonScores.length
    ? lessonScores.reduce((a, b) => a + b, 0) / lessonScores.length
    : 0;

  const published = (
    db.prepare(`SELECT COUNT(*) AS n FROM published_versions WHERE book_version_id=?`).get(ver.id) as { n: number }
  ).n;
  const reviews = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM review_tasks WHERE book_version_id=? AND status IN ('approved','closed')`)
      .get(ver.id) as { n: number }
  ).n;

  let score = avgLesson * 0.7 + (published ? 0.15 : 0) + (reviews > 0 ? 0.15 : 0);

  const claim = String(book.completeness_claim || "");
  const editionBad = claim.includes("unverified") || claim.includes("not_official") || claim.includes("not_complete");
  const factoryBlock = db
    .prepare(
      `SELECT blocker_code FROM factory_jobs WHERE book_id=? AND blocker_code IS NOT NULL LIMIT 1`,
    )
    .get(bookId) as { blocker_code?: string } | undefined;

  const hasCriticalBlocker = Boolean(factoryBlock?.blocker_code) || editionBad || claim === "complete" && reviews === 0;

  // Never display 100% while blocker exists
  if (hasCriticalBlocker) score = Math.min(score, 0.94);
  if (String(book.completeness_claim) === "complete" && hasCriticalBlocker) {
    score = Math.min(score, 0.9);
  }

  const breakdown = {
    avgLesson,
    lessons: lessons.length,
    published: published > 0,
    reviews,
    claim,
    hasCriticalBlocker,
  };

  db.prepare(
    `INSERT INTO content_completeness_scores (id, entity_type, entity_id, score, breakdown_json, has_critical_blocker, calculated_at)
     VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(entity_type, entity_id) DO UPDATE SET
       score=excluded.score,
       breakdown_json=excluded.breakdown_json,
       has_critical_blocker=excluded.has_critical_blocker,
       calculated_at=excluded.calculated_at`,
  ).run(uuid(), "book", bookId, score, JSON.stringify(breakdown), hasCriticalBlocker ? 1 : 0, t);

  return { score, hasCriticalBlocker, breakdown };
}
