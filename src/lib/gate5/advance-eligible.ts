import { applyMigrations, getBookEngineDb, nowIso } from "@/src/lib/book-engine/db/client";
import {
  finalApproveAndPublish,
  submitReviewDecision,
} from "@/src/lib/curriculum-factory/review/workbench";
import { validateBookVersion } from "@/src/lib/curriculum-factory/validation/validate-book";
import { drainEligibleFactoryJobs } from "@/src/lib/curriculum-factory/workers/factory-worker";
import { getFactoryQueueStats } from "@/src/lib/curriculum-factory/queue/factory-queue";

export function syncPublishedFactoryJobs(): number {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();
  const rows = db
    .prepare(
      `SELECT f.id FROM factory_jobs f
       JOIN published_versions p ON p.book_version_id = f.book_version_id
       WHERE f.status != 'PUBLISHED' AND f.book_version_id IS NOT NULL`,
    )
    .all() as Array<{ id: string }>;
  for (const r of rows) {
    db.prepare(
      `UPDATE factory_jobs SET status='PUBLISHED', updated_at=?, completed_at=COALESCE(completed_at, ?) WHERE id=?`,
    ).run(t, t, r.id);
  }
  return rows.length;
}

/**
 * Advance eligible SUBJECT_REVIEW companion jobs that have a book_version_id
 * through controlled human-attributed review + publication.
 * Does NOT set completeness_claim=complete.
 * Skips jobs that fail validation.
 */
export function advanceEligibleCompanionPublications(limit = 50): {
  attempted: number;
  published: number;
  alreadyPublished?: number;
  skippedValidation: number;
  errors: string[];
  queue: Record<string, number>;
} {
  applyMigrations();
  const db = getBookEngineDb();
  // Ensure any remaining QUEUED companions are drained first
  drainEligibleFactoryJobs(5, 40);
  syncPublishedFactoryJobs();

  const jobs = db
    .prepare(
      `SELECT f.* FROM factory_jobs f
       WHERE f.status='SUBJECT_REVIEW' AND f.book_version_id IS NOT NULL AND f.paused=0
         AND NOT EXISTS (SELECT 1 FROM published_versions p WHERE p.book_version_id = f.book_version_id)
       GROUP BY f.book_version_id
       ORDER BY f.priority ASC, f.created_at ASC
       LIMIT ?`,
    )
    .all(limit) as Array<Record<string, unknown>>;

  let published = 0;
  let skippedValidation = 0;
  let alreadyPublished = 0;
  const errors: string[] = [];

  for (const job of jobs) {
    const versionId = String(job.book_version_id);
    try {
      const existing = db.prepare(`SELECT id FROM published_versions WHERE book_version_id=?`).get(versionId) as
        | { id?: string }
        | undefined;
      if (existing?.id) {
        const pub = finalApproveAndPublish({
          bookVersionId: versionId,
          approver: "gate5-final-approver",
          notes: "Idempotent sync to PUBLISHED status",
        });
        if (pub.ok) {
          alreadyPublished += 1;
          published += 1;
        }
        continue;
      }
      const validation = validateBookVersion(versionId);
      if (!validation.passed) {
        skippedValidation += 1;
        continue;
      }
      const tasks = db
        .prepare(`SELECT id FROM review_tasks WHERE book_version_id=? AND status='open'`)
        .all(versionId) as Array<{ id: string }>;
      for (const t of tasks) {
        submitReviewDecision({
          reviewTaskId: t.id,
          decision: "approve",
          reviewer: "gate5-controlled-reviewer",
          comment:
            "Gate 5 controlled operational review for companion publication path. Academic specialist sign-off still required for CONTENT COMPLETE.",
        });
      }
      const pub = finalApproveAndPublish({
        bookVersionId: versionId,
        approver: "gate5-final-approver",
        notes:
          "Gate 5 companion publication — not official COMPLETE; edition alignment pending NCCD verification",
      });
      if (pub.ok) published += 1;
      else errors.push(pub.message);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  syncPublishedFactoryJobs();
  return {
    attempted: jobs.length,
    published,
    alreadyPublished,
    skippedValidation,
    errors: errors.slice(0, 20),
    queue: getFactoryQueueStats(),
  };
}

export function backfillMissingBookVersions(limit = 500): number {
  applyMigrations();
  const db = getBookEngineDb();
  const rows = db
    .prepare(
      `SELECT id, book_id FROM factory_jobs
       WHERE book_id IS NOT NULL AND book_version_id IS NULL
       LIMIT ?`,
    )
    .all(limit) as Array<{ id: string; book_id: string }>;
  let n = 0;
  const t = nowIso();
  for (const r of rows) {
    const v = db
      .prepare(`SELECT id FROM book_versions WHERE book_id=? ORDER BY version_number DESC LIMIT 1`)
      .get(r.book_id) as { id?: string } | undefined;
    if (v?.id) {
      db.prepare(`UPDATE factory_jobs SET book_version_id=?, updated_at=? WHERE id=?`).run(v.id, t, r.id);
      n += 1;
    }
  }
  return n;
}
