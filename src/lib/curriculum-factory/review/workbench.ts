import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import { transitionJob } from "@/src/lib/curriculum-factory/queue/factory-queue";
import { validateBookVersion } from "@/src/lib/curriculum-factory/validation/validate-book";
import { scoreBookCompleteness } from "@/src/lib/curriculum-factory/completeness/score";

export type ReviewType =
  | "SOURCE_REVIEW"
  | "RIGHTS_REVIEW"
  | "SUBJECT_REVIEW"
  | "LANGUAGE_REVIEW"
  | "TECHNICAL_REVIEW"
  | "FINAL_APPROVAL";

export function listReviewQueue(reviewType?: string, limit = 50): Array<Record<string, unknown>> {
  applyMigrations();
  if (reviewType) {
    return getBookEngineDb()
      .prepare(
        `SELECT rt.*, b.title_ar, b.id AS book_id
         FROM review_tasks rt
         JOIN book_versions bv ON bv.id = rt.book_version_id
         JOIN books b ON b.id = bv.book_id
         WHERE rt.status='open' AND rt.review_type=?
         ORDER BY rt.created_at ASC LIMIT ?`,
      )
      .all(reviewType, limit) as Array<Record<string, unknown>>;
  }
  return getBookEngineDb()
    .prepare(
      `SELECT rt.*, b.title_ar, b.id AS book_id
       FROM review_tasks rt
       JOIN book_versions bv ON bv.id = rt.book_version_id
       JOIN books b ON b.id = bv.book_id
       WHERE rt.status='open'
       ORDER BY rt.created_at ASC LIMIT ?`,
    )
    .all(limit) as Array<Record<string, unknown>>;
}

export function submitReviewDecision(input: {
  reviewTaskId: string;
  decision: "approve" | "reject" | "corrections";
  reviewer: string;
  comment?: string;
}): { ok: boolean; message: string } {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();
  const task = db.prepare(`SELECT * FROM review_tasks WHERE id=?`).get(input.reviewTaskId) as
    | Record<string, unknown>
    | undefined;
  if (!task) return { ok: false, message: "Review task not found" };

  const status = input.decision === "approve" ? "approved" : input.decision === "reject" ? "rejected" : "corrections";
  db.prepare(`UPDATE review_tasks SET status=?, assignee=?, updated_at=? WHERE id=?`).run(
    status,
    input.reviewer,
    t,
    input.reviewTaskId,
  );
  db.prepare(
    `INSERT INTO review_comments (id, review_task_id, author, body, created_at) VALUES (?,?,?,?,?)`,
  ).run(uuid(), input.reviewTaskId, input.reviewer, input.comment || input.decision, t);

  if (input.decision === "approve") {
    db.prepare(
      `INSERT INTO approvals (id, book_version_id, approval_type, decision, reviewer, comments, decided_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(uuid(), task.book_version_id, task.review_type, "approve", input.reviewer, input.comment || null, t);
  }

  // Advance factory job when all required reviews approved for this version
  const open = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM review_tasks WHERE book_version_id=? AND status='open'
           AND review_type IN ('SUBJECT_REVIEW','LANGUAGE_REVIEW','TECHNICAL_REVIEW')`,
      )
      .get(task.book_version_id) as { n: number }
  ).n;

  const job = db
    .prepare(`SELECT id, status FROM factory_jobs WHERE book_version_id=? ORDER BY updated_at DESC LIMIT 1`)
    .get(task.book_version_id) as { id: string; status: string } | undefined;

  if (job && input.decision === "corrections") {
    transitionJob(job.id, "CORRECTIONS_REQUIRED", {
      actor: input.reviewer,
      role: String(task.review_type),
      reviewDecision: "corrections",
      message: input.comment,
    });
  } else if (job && open === 0 && input.decision === "approve") {
    transitionJob(job.id, "FINAL_APPROVAL", {
      actor: input.reviewer,
      role: String(task.review_type),
      message: "All open subject/language/technical reviews cleared — awaiting final approval",
    });
  } else if (job && input.decision === "approve") {
    const next =
      task.review_type === "SUBJECT_REVIEW"
        ? "LANGUAGE_REVIEW"
        : task.review_type === "LANGUAGE_REVIEW"
          ? "TECHNICAL_REVIEW"
          : job.status;
    if (next !== job.status) {
      transitionJob(job.id, next as "LANGUAGE_REVIEW" | "TECHNICAL_REVIEW", {
        actor: input.reviewer,
        role: String(task.review_type),
        message: `Approved ${task.review_type}`,
      });
    }
  }

  return { ok: true, message: `Review ${status}` };
}

/**
 * Final approval + publication. Creates published_versions only if validation passes.
 * Does NOT set completeness_claim=complete (Gate 4 honesty).
 */
export function finalApproveAndPublish(input: {
  bookVersionId: string;
  approver: string;
  notes?: string;
}): { ok: boolean; message: string; publishedId?: string } {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();

  const validation = validateBookVersion(input.bookVersionId);
  if (!validation.passed) {
    return { ok: false, message: `Publication blocked: ${validation.critical.map((c) => c.code).join(", ")}` };
  }

  const openReviews = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM review_tasks WHERE book_version_id=? AND status='open'
           AND review_type IN ('SUBJECT_REVIEW','LANGUAGE_REVIEW','TECHNICAL_REVIEW','FINAL_APPROVAL')`,
      )
      .get(input.bookVersionId) as { n: number }
  ).n;
  // Allow explicit final approve to close remaining FINAL_APPROVAL tasks
  if (openReviews > 0) {
    db.prepare(
      `UPDATE review_tasks SET status='approved', assignee=?, updated_at=?
       WHERE book_version_id=? AND status='open'`,
    ).run(input.approver, t, input.bookVersionId);
  }

  db.prepare(
    `INSERT INTO approvals (id, book_version_id, approval_type, decision, reviewer, comments, decided_at) VALUES (?,?,?,?,?,?,?)`,
  ).run(uuid(), input.bookVersionId, "FINAL_APPROVAL", "approve", input.approver, input.notes || null, t);

  db.prepare(`UPDATE book_versions SET status='PUBLISHED', published_at=?, updated_at=? WHERE id=?`).run(
    t,
    t,
    input.bookVersionId,
  );

  const book = db
    .prepare(`SELECT book_id FROM book_versions WHERE id=?`)
    .get(input.bookVersionId) as { book_id: string };

  const publishedId = uuid();
  db.prepare(
    `INSERT INTO published_versions (id, book_id, book_version_id, published_by, published_at, notes) VALUES (?,?,?,?,?,?)`,
  ).run(publishedId, book.book_id, input.bookVersionId, input.approver, t, input.notes || "Gate 4 companion publication");

  // Keep honest claim — never flip to complete here
  db.prepare(
    `UPDATE books SET completeness_claim=CASE
       WHEN completeness_claim='complete' THEN completeness_claim
       ELSE 'published_companion_pending_official_edition'
     END, updated_at=? WHERE id=?`,
  ).run(t, book.book_id);

  const job = db
    .prepare(`SELECT id FROM factory_jobs WHERE book_version_id=? OR book_id=? ORDER BY updated_at DESC LIMIT 1`)
    .get(input.bookVersionId, book.book_id) as { id?: string } | undefined;
  if (job?.id) {
    transitionJob(job.id, "PUBLISHING", { actor: input.approver, role: "final_approver" });
    transitionJob(job.id, "PUBLISHED", {
      actor: input.approver,
      role: "final_approver",
      message: "Published companion — not official COMPLETE",
      reviewDecision: "published",
    });
  }

  scoreBookCompleteness(book.book_id);
  return { ok: true, message: "Published", publishedId };
}

export function getReviewBacklog(): Record<string, number> {
  applyMigrations();
  const rows = getBookEngineDb()
    .prepare(`SELECT review_type, COUNT(*) AS n FROM review_tasks WHERE status='open' GROUP BY review_type`)
    .all() as Array<{ review_type: string; n: number }>;
  const out: Record<string, number> = {};
  for (const r of rows) out[r.review_type] = r.n;
  return out;
}
