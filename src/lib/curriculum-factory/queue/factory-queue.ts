import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import { JORDAN_COUNTRY_ID, JORDAN_CURRICULUM_ID } from "@/src/lib/global-curriculum/profiles/jordan";
import { gradePriority, type FactoryStatus } from "@/src/lib/curriculum-factory/types";

export function ensureFactorySchema(): void {
  applyMigrations();
}

export function appendJobEvent(
  jobId: string,
  toStatus: string,
  opts: { fromStatus?: string; role?: string; actor?: string; message?: string; payload?: unknown } = {},
): void {
  const db = getBookEngineDb();
  db.prepare(
    `INSERT INTO factory_job_events (id, job_id, from_status, to_status, role_name, actor, message, payload_json, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(
    uuid(),
    jobId,
    opts.fromStatus || null,
    toStatus,
    opts.role || null,
    opts.actor || "system",
    opts.message || null,
    opts.payload ? JSON.stringify(opts.payload) : null,
    nowIso(),
  );
}

export function transitionJob(
  jobId: string,
  toStatus: FactoryStatus,
  opts: {
    actor?: string;
    role?: string;
    message?: string;
    checkpoint?: string;
    checkpointJson?: unknown;
    output?: unknown;
    error?: string;
    blockerCode?: string | null;
    blockerDetail?: string | null;
    bookId?: string | null;
    bookVersionId?: string | null;
    reviewDecision?: string | null;
  } = {},
): void {
  const db = getBookEngineDb();
  const t = nowIso();
  const row = db.prepare("SELECT status FROM factory_jobs WHERE id=?").get(jobId) as { status: string } | undefined;
  if (!row) throw new Error(`factory job missing: ${jobId}`);
  db.prepare(
    `UPDATE factory_jobs SET
      status=?,
      checkpoint_label=COALESCE(?, checkpoint_label),
      checkpoint_json=COALESCE(?, checkpoint_json),
      output_json=COALESCE(?, output_json),
      error_log=COALESCE(?, error_log),
      blocker_code=?,
      blocker_detail=?,
      book_id=COALESCE(?, book_id),
      book_version_id=COALESCE(?, book_version_id),
      review_decision=COALESCE(?, review_decision),
      started_at=CASE WHEN started_at IS NULL AND ? NOT IN ('QUEUED','NOT_READY','BLOCKED_BY_SOURCE','BLOCKED_BY_RIGHTS') THEN ? ELSE started_at END,
      completed_at=CASE WHEN ? IN ('COMPLETE','PUBLISHED','BLOCKED_BY_SOURCE','BLOCKED_BY_RIGHTS','ARCHIVED','FAILED') THEN ? ELSE completed_at END,
      updated_at=?
     WHERE id=?`,
  ).run(
    toStatus,
    opts.checkpoint || null,
    opts.checkpointJson ? JSON.stringify(opts.checkpointJson) : null,
    opts.output ? JSON.stringify(opts.output) : null,
    opts.error || null,
    opts.blockerCode ?? null,
    opts.blockerDetail ?? null,
    opts.bookId ?? null,
    opts.bookVersionId ?? null,
    opts.reviewDecision ?? null,
    toStatus,
    t,
    toStatus,
    t,
    t,
    jobId,
  );
  appendJobEvent(jobId, toStatus, {
    fromStatus: row.status,
    actor: opts.actor || "system",
    role: opts.role,
    message: opts.message,
    payload: opts.checkpointJson || opts.output,
  });
}

/**
 * Syncs Jordan inventory into factory_jobs (idempotent upsert by inventory_cell_id+book_type).
 * Official edition/rights blockers → BLOCKED_* statuses (visible, not silent).
 * SOS companions → QUEUED for production.
 */
export function rebuildJordanFactoryQueue(): {
  created: number;
  updated: number;
  blocked: number;
  queued: number;
} {
  ensureFactorySchema();
  const db = getBookEngineDb();
  const t = nowIso();
  const cells = db
    .prepare(`SELECT * FROM inventory_matrix_cells WHERE country_id=? AND deleted_at IS NULL`)
    .all(JORDAN_COUNTRY_ID) as Array<Record<string, unknown>>;

  let created = 0;
  let updated = 0;
  let blocked = 0;
  let queued = 0;

  const insert = db.prepare(
    `INSERT INTO factory_jobs (
      id, country_id, curriculum_id, inventory_cell_id, book_id, stage_code, grade_code, term_code, pathway_code,
      subject_code, subject_title, book_type, status, priority, attempts, max_attempts,
      checkpoint_label, input_json, blocker_code, blocker_detail, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  const update = db.prepare(
    `UPDATE factory_jobs SET
      status=CASE WHEN status IN ('PUBLISHED','COMPLETE','SUBJECT_REVIEW','LANGUAGE_REVIEW','TECHNICAL_REVIEW','FINAL_APPROVAL','PUBLISHING') THEN status ELSE ? END,
      priority=?,
      book_id=COALESCE(book_id, ?),
      blocker_code=?,
      blocker_detail=?,
      input_json=?,
      updated_at=?
     WHERE inventory_cell_id=? AND book_type=?`,
  );

  const tx = db.transaction(() => {
    for (const c of cells) {
      const bookType = String(c.book_type);
      const isCompanion = bookType === "sos_companion";
      const editionBad =
        String(c.edition_label || "") === "NEEDS VERIFICATION" ||
        String(c.curriculum_version_label || "") === "NEEDS VERIFICATION";
      const notDiscovered = String(c.matrix_status) === "NOT_DISCOVERED";

      let status: FactoryStatus = "QUEUED";
      let blockerCode: string | null = null;
      let blockerDetail: string | null = null;

      if (notDiscovered) {
        status = "BLOCKED_BY_SOURCE";
        blockerCode = "subject_list_not_discovered";
        blockerDetail = String(c.blocker || "Official subject list not discovered");
        blocked += 1;
      } else if (!isCompanion && editionBad) {
        status = "BLOCKED_BY_SOURCE";
        blockerCode = "edition_unverified_nccd_unreachable";
        blockerDetail =
          "Official edition/academic year NEEDS VERIFICATION — NCCD/MoE unreachable; cannot import official PDF.";
        blocked += 1;
      } else if (!isCompanion && String(c.rights_status) === "rights_review_required") {
        status = "BLOCKED_BY_RIGHTS";
        blockerCode = "rights_review_required";
        blockerDetail = "Official book requires human rights classification before import.";
        blocked += 1;
      } else if (isCompanion) {
        status = "QUEUED";
        queued += 1;
      } else {
        status = "QUEUED";
        queued += 1;
      }

      const priority =
        gradePriority(String(c.grade_code)) * 10 +
        (String(c.term_code) === "1" || String(c.term_code) === "year" ? 0 : 1) +
        (isCompanion ? 0 : 5);

      const input = {
        inventoryCellId: c.id,
        sourceUrl: c.source_url,
        rightsStatus: c.rights_status,
        subjectListStatus: c.subject_list_status,
        structuredBookId: c.structured_book_id,
      };

      const existing = db
        .prepare(`SELECT id, status FROM factory_jobs WHERE inventory_cell_id=? AND book_type=?`)
        .get(c.id, bookType) as { id: string; status: string } | undefined;

      if (existing) {
        update.run(
          status,
          priority,
          c.structured_book_id ? String(c.structured_book_id) : null,
          blockerCode,
          blockerDetail,
          JSON.stringify(input),
          t,
          c.id,
          bookType,
        );
        updated += 1;
      } else {
        const id = uuid();
        insert.run(
          id,
          JORDAN_COUNTRY_ID,
          JORDAN_CURRICULUM_ID,
          c.id,
          c.structured_book_id ? String(c.structured_book_id) : null,
          c.stage_code,
          c.grade_code,
          c.term_code,
          c.pathway_code,
          c.subject_code,
          c.subject_title_ar,
          bookType,
          status,
          priority,
          0,
          5,
          "synced",
          JSON.stringify(input),
          blockerCode,
          blockerDetail,
          t,
          t,
        );
        appendJobEvent(id, status, {
          message: "Job created from inventory sync",
          payload: input,
        });
        created += 1;
      }
    }
  });
  tx();

  return { created, updated, blocked, queued };
}

export function getFactoryQueueStats(): Record<string, number> {
  ensureFactorySchema();
  const rows = getBookEngineDb()
    .prepare(`SELECT status, COUNT(*) AS n FROM factory_jobs WHERE deleted_at IS NULL GROUP BY status`)
    .all() as Array<{ status: string; n: number }>;
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export function listBlockedJobs(limit = 100): Array<Record<string, unknown>> {
  ensureFactorySchema();
  return getBookEngineDb()
    .prepare(
      `SELECT id, grade_code, term_code, pathway_code, subject_title, book_type, status, blocker_code, blocker_detail
       FROM factory_jobs
       WHERE status IN ('BLOCKED_BY_SOURCE','BLOCKED_BY_RIGHTS','FAILED')
       ORDER BY grade_code, subject_title LIMIT ?`,
    )
    .all(limit) as Array<Record<string, unknown>>;
}

export function claimNextJobs(limit: number, workerName: string): Array<Record<string, unknown>> {
  ensureFactorySchema();
  const db = getBookEngineDb();
  const t = nowIso();
  const jobs = db
    .prepare(
      `SELECT * FROM factory_jobs
       WHERE deleted_at IS NULL AND paused=0
         AND status IN ('QUEUED','RETRYING')
         AND attempts < max_attempts
       ORDER BY priority ASC, created_at ASC
       LIMIT ?`,
    )
    .all(limit) as Array<Record<string, unknown>>;

  const claimed: Array<Record<string, unknown>> = [];
  const tx = db.transaction(() => {
    for (const job of jobs) {
      const res = db
        .prepare(
          `UPDATE factory_jobs SET locked_by=?, locked_at=?, status='DISCOVERING', attempts=attempts+1, updated_at=?
           WHERE id=? AND status IN ('QUEUED','RETRYING') AND (locked_by IS NULL OR locked_at < ?)`,
        )
        .run(workerName, t, t, job.id, new Date(Date.now() - 30 * 60 * 1000).toISOString());
      if (res.changes > 0) {
        appendJobEvent(String(job.id), "DISCOVERING", {
          actor: workerName,
          role: "worker",
          message: "Job claimed",
        });
        claimed.push({ ...job, status: "DISCOVERING", locked_by: workerName });
      }
    }
    db.prepare(
      `INSERT INTO factory_worker_heartbeats (id, worker_name, last_seen_at, current_job_id, meta_json)
       VALUES (?,?,?,?,?)
       ON CONFLICT(worker_name) DO UPDATE SET last_seen_at=excluded.last_seen_at, current_job_id=excluded.current_job_id`,
    ).run(uuid(), workerName, t, claimed[0] ? String(claimed[0].id) : null, JSON.stringify({ claimed: claimed.length }));
  });
  tx();
  return claimed;
}
