import { applyMigrations, getBookEngineDb } from "@/src/lib/book-engine/db/client";

export type ValidationIssue = {
  code: string;
  severity: "critical" | "warning";
  message: string;
};

/**
 * Automated validation — critical issues block publication.
 */
export function validateBookVersion(bookVersionId: string): {
  passed: boolean;
  critical: ValidationIssue[];
  warnings: ValidationIssue[];
} {
  applyMigrations();
  const db = getBookEngineDb();
  const critical: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const book = db
    .prepare(
      `SELECT b.*, bv.status AS version_status, bv.edition_label
       FROM book_versions bv JOIN books b ON b.id = bv.book_id
       WHERE bv.id=?`,
    )
    .get(bookVersionId) as Record<string, unknown> | undefined;

  if (!book) {
    critical.push({ code: "book_missing", severity: "critical", message: "Book version not found" });
    return { passed: false, critical, warnings };
  }

  if (!book.title_ar) critical.push({ code: "title_missing", severity: "critical", message: "Missing title" });
  if (String(book.completeness_claim || "") === "complete") {
    warnings.push({
      code: "complete_claim_present",
      severity: "warning",
      message: "completeness_claim=complete requires full audit evidence",
    });
  }

  const units = (
    db.prepare(`SELECT COUNT(*) AS n FROM units WHERE book_version_id=? AND deleted_at IS NULL`).get(bookVersionId) as {
      n: number;
    }
  ).n;
  if (units < 1) critical.push({ code: "no_units", severity: "critical", message: "No units" });

  const lessons = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM lessons l JOIN units u ON u.id=l.unit_id
         WHERE u.book_version_id=? AND l.deleted_at IS NULL`,
      )
      .get(bookVersionId) as { n: number }
  ).n;
  if (lessons < 1) critical.push({ code: "no_lessons", severity: "critical", message: "No lessons" });

  const emptyLessons = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM lessons l
         JOIN units u ON u.id=l.unit_id
         WHERE u.book_version_id=? AND l.deleted_at IS NULL
           AND NOT EXISTS (SELECT 1 FROM content_blocks b WHERE b.lesson_id=l.id AND b.deleted_at IS NULL)`,
      )
      .get(bookVersionId) as { n: number }
  ).n;
  if (emptyLessons > 0) {
    critical.push({
      code: "empty_lessons",
      severity: "critical",
      message: `${emptyLessons} lessons without content blocks`,
    });
  }

  const questionsWithoutAnswers = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM questions q
         JOIN activities a ON a.id=q.activity_id
         JOIN lessons l ON l.id=a.lesson_id
         JOIN units u ON u.id=l.unit_id
         WHERE u.book_version_id=?
           AND NOT EXISTS (SELECT 1 FROM answers ans WHERE ans.question_id=q.id)`,
      )
      .get(bookVersionId) as { n: number }
  ).n;
  if (questionsWithoutAnswers > 0) {
    critical.push({
      code: "questions_without_answers",
      severity: "critical",
      message: `${questionsWithoutAnswers} questions without answers`,
    });
  }

  const placeholderBlocks = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM content_blocks b
         JOIN lessons l ON l.id=b.lesson_id
         JOIN units u ON u.id=l.unit_id
         WHERE u.book_version_id=?
           AND (b.content_json LIKE '%TODO%' OR b.content_json LIKE '%PLACEHOLDER%' OR b.content_json LIKE '%lorem ipsum%')`,
      )
      .get(bookVersionId) as { n: number }
  ).n;
  if (placeholderBlocks > 0) {
    critical.push({
      code: "placeholder_content",
      severity: "critical",
      message: `${placeholderBlocks} blocks contain placeholder text`,
    });
  }

  if (String(book.edition_label || "") === "NEEDS VERIFICATION") {
    warnings.push({
      code: "edition_unverified",
      severity: "warning",
      message: "Edition still NEEDS VERIFICATION",
    });
  }

  const rights = db
    .prepare(`SELECT rights_status FROM book_rights WHERE book_version_id=? LIMIT 1`)
    .get(bookVersionId) as { rights_status?: string } | undefined;
  if (!rights?.rights_status) {
    critical.push({ code: "rights_missing", severity: "critical", message: "Missing rights record" });
  }

  return { passed: critical.length === 0, critical, warnings };
}
