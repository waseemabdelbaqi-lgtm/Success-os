import { getBookEngineDb } from "@/src/lib/book-engine/db/client";
import { validateContentBlock, BLOCK_TYPES } from "@/src/lib/book-engine/schema/blocks";

export type ValidationIssue = {
  severity: "critical" | "warning";
  code: string;
  message: string;
  entityId?: string;
};

export function validateBookVersion(bookVersionId: string): {
  passed: boolean;
  critical: number;
  warnings: number;
  issues: ValidationIssue[];
} {
  const db = getBookEngineDb();
  const issues: ValidationIssue[] = [];
  const push = (severity: ValidationIssue["severity"], code: string, message: string, entityId?: string) =>
    issues.push({ severity, code, message, entityId });

  const version = db.prepare("SELECT * FROM book_versions WHERE id = ?").get(bookVersionId) as
    | Record<string, unknown>
    | undefined;
  if (!version) {
    return {
      passed: false,
      critical: 1,
      warnings: 0,
      issues: [{ severity: "critical", code: "missing_version", message: "book version not found" }],
    };
  }

  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(version.book_id) as Record<string, unknown>;
  const sources = db
    .prepare("SELECT * FROM book_sources WHERE book_version_id = ?")
    .all(bookVersionId) as unknown[];
  const rights = db
    .prepare("SELECT * FROM book_rights WHERE book_version_id = ?")
    .all(bookVersionId) as unknown[];
  const units = db
    .prepare("SELECT * FROM units WHERE book_version_id = ? AND deleted_at IS NULL ORDER BY position")
    .all(bookVersionId) as Array<Record<string, unknown>>;

  if (!sources.length) push("critical", "missing_source", "No book_sources rows");
  if (!rights.length) push("critical", "missing_rights", "No book_rights rows");
  if (!book?.academic_year_id) push("critical", "missing_academic_year", "Book missing academic_year_id");
  if (String(book?.completeness_claim || "").includes("100%") || book?.completeness_claim === "complete") {
    push("critical", "false_complete", "Book falsely marked complete");
  }

  const year = db.prepare("SELECT * FROM academic_years WHERE id = ?").get(book.academic_year_id) as
    | { label?: string }
    | undefined;
  if (!year?.label || year.label.includes("NEEDS VERIFICATION")) {
    push("warning", "edition_unverified", "Academic year / edition still NEEDS VERIFICATION (Gate 1 open)");
  }

  if (!units.length) push("critical", "missing_unit", "No units");

  const unitPositions = new Set<number>();
  for (const u of units) {
    if (unitPositions.has(Number(u.position))) push("critical", "duplicate_unit", "Duplicate unit position", String(u.id));
    unitPositions.add(Number(u.position));
    const lessons = db
      .prepare("SELECT * FROM lessons WHERE unit_id = ? AND deleted_at IS NULL ORDER BY position")
      .all(u.id) as Array<Record<string, unknown>>;
    if (!lessons.length) push("critical", "missing_lesson", "Unit has no lessons", String(u.id));
    const lessonPos = new Set<number>();
    for (const l of lessons) {
      if (lessonPos.has(Number(l.position))) {
        push("critical", "duplicate_lesson", "Duplicate lesson position", String(l.id));
      }
      lessonPos.add(Number(l.position));
      const outcomes = db
        .prepare("SELECT id FROM learning_outcomes WHERE lesson_id = ?")
        .all(l.id) as unknown[];
      if (!outcomes.length) push("critical", "missing_outcome", "Lesson missing learning outcomes", String(l.id));

      const blocks = db
        .prepare("SELECT * FROM content_blocks WHERE lesson_id = ? AND deleted_at IS NULL ORDER BY position")
        .all(l.id) as Array<Record<string, unknown>>;
      if (!blocks.length) push("critical", "empty_lesson", "Lesson has no content blocks", String(l.id));
      for (const b of blocks) {
        if (!BLOCK_TYPES.includes(b.type as never)) {
          push("critical", "invalid_block_type", `Unknown block type ${b.type}`, String(b.id));
        }
        const content = JSON.parse(String(b.content_json || "{}"));
        const v = validateContentBlock({
          blockId: b.id,
          type: b.type,
          position: b.position,
          language: b.language,
          direction: b.direction,
          content,
          rightsStatus: b.rights_status,
          accessibilityText: b.accessibility_text || undefined,
          reviewStatus: b.review_status,
          version: b.version,
          officialPageReference: b.official_page_reference || undefined,
        });
        if (!v.ok) {
          for (const e of v.errors) push("critical", "invalid_block", e, String(b.id));
        }
        if (!String(b.content_json || "").trim() || b.content_json === "{}") {
          push("critical", "empty_block", "Empty content block", String(b.id));
        }
      }

      const activities = db
        .prepare("SELECT * FROM activities WHERE lesson_id = ? AND deleted_at IS NULL")
        .all(l.id) as Array<Record<string, unknown>>;
      for (const a of activities) {
        const questions = db
          .prepare("SELECT * FROM questions WHERE activity_id = ?")
          .all(a.id) as Array<Record<string, unknown>>;
        for (const q of questions) {
          const answers = db.prepare("SELECT id FROM answers WHERE question_id = ?").all(q.id) as unknown[];
          const explanations = db
            .prepare("SELECT id FROM answer_explanations WHERE question_id = ?")
            .all(q.id) as unknown[];
          if (!answers.length) push("critical", "question_without_answer", "Question has no answer", String(q.id));
          if (!explanations.length) {
            push("critical", "answer_without_explanation", "Question has no explanation", String(q.id));
          }
        }
      }
    }
  }

  const pages = db
    .prepare("SELECT id FROM book_pages WHERE book_version_id = ?")
    .all(bookVersionId) as unknown[];
  if (!pages.length) push("warning", "missing_page", "No book_pages mapped yet");

  if (version.status === "PUBLISHED") {
    const approvals = db
      .prepare("SELECT id FROM approvals WHERE book_version_id = ? AND decision = 'approved'")
      .all(bookVersionId) as unknown[];
    if (!approvals.length) push("critical", "missing_reviewer", "Published without approval record");
  }

  const critical = issues.filter((i) => i.severity === "critical").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  return { passed: critical === 0, critical, warnings, issues };
}
