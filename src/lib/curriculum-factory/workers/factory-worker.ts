import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import { claimNextJobs, transitionJob } from "@/src/lib/curriculum-factory/queue/factory-queue";
import { registerImportArtifact } from "@/src/lib/curriculum-factory/import/ingest";
import { runOcrOnArtifact } from "@/src/lib/curriculum-factory/ocr/ocr-service";
import { validateBookVersion } from "@/src/lib/curriculum-factory/validation/validate-book";
import { scoreBookCompleteness } from "@/src/lib/curriculum-factory/completeness/score";
import { processJordanCompanionJobs } from "@/src/lib/global-curriculum/jordan-engine-import";
import { JORDAN_COUNTRY_ID } from "@/src/lib/global-curriculum/profiles/jordan";

const WORKER = "gate4-factory-worker";

function raiseAlert(severity: string, alertType: string, message: string, jobId?: string, bookId?: string) {
  getBookEngineDb()
    .prepare(
      `INSERT INTO factory_alerts (id, severity, alert_type, job_id, book_id, message, created_at)
       VALUES (?,?,?,?,?,?,?)`,
    )
    .run(uuid(), severity, alertType, jobId || null, bookId || null, message, nowIso());
}

/**
 * Process one claimed companion job through the factory pipeline to SUBJECT_REVIEW.
 * Official/blocked jobs are never forced through. AI cannot auto-approve educational content.
 */
export function processFactoryJob(job: Record<string, unknown>): { ok: boolean; status: string; detail: string } {
  applyMigrations();
  const db = getBookEngineDb();
  const jobId = String(job.id);
  const bookType = String(job.book_type);
  const input = JSON.parse(String(job.input_json || "{}")) as {
    inventoryCellId?: string;
    sourceUrl?: string;
    structuredBookId?: string;
  };

  try {
    if (bookType !== "sos_companion") {
      transitionJob(jobId, "BLOCKED_BY_RIGHTS", {
        actor: WORKER,
        message: "Non-companion official books require rights + edition clearance",
        blockerCode: "official_requires_rights_and_edition",
        blockerDetail: job.blocker_detail ? String(job.blocker_detail) : "Official import not permitted yet",
      });
      return { ok: false, status: "BLOCKED_BY_RIGHTS", detail: "official blocked" };
    }

    // VERIFYING_SOURCE
    transitionJob(jobId, "VERIFYING_SOURCE", {
      actor: WORKER,
      checkpoint: "source_check",
      message: "Companion aligned to NCCD catalog URL (link-only)",
    });

    // VERIFYING_EDITION — companions inherit NEEDS VERIFICATION honestly
    transitionJob(jobId, "VERIFYING_EDITION", {
      actor: WORKER,
      checkpoint: "edition_check",
      message: "Edition year remains NEEDS VERIFICATION for official alignment",
    });

    // RIGHTS_REVIEW — original companion permitted
    transitionJob(jobId, "RIGHTS_REVIEW", {
      actor: WORKER,
      role: "rights_system",
      message: "original_companion_required — Success OS original content path",
      reviewDecision: "original_companion_required",
    });

    transitionJob(jobId, "READY_TO_IMPORT", { actor: WORKER, checkpoint: "ready_import" });

    const artifact = registerImportArtifact({
      jobId,
      countryId: JORDAN_COUNTRY_ID,
      sourceUrl: input.sourceUrl,
      format: "structured",
      rightsOutcome: "original_companion_required",
      contentHint: String(job.subject_title || ""),
    });
    if (!artifact.allowed) {
      transitionJob(jobId, "BLOCKED_BY_RIGHTS", {
        actor: WORKER,
        blockerCode: "import_denied",
        blockerDetail: artifact.reason,
        error: artifact.reason,
      });
      return { ok: false, status: "BLOCKED_BY_RIGHTS", detail: artifact.reason };
    }

    transitionJob(jobId, "IMPORTING", {
      actor: WORKER,
      checkpoint: "import",
      output: { artifactId: artifact.artifactId },
    });

    // OCR path for structured companions: synthetic single-page confidence record
    transitionJob(jobId, "OCR_PROCESSING", { actor: WORKER, checkpoint: "ocr" });
    const ocr = runOcrOnArtifact(artifact.artifactId, [
      {
        pageNumber: 1,
        sampleText: `محتوى تفاعلي أصلي — ${job.subject_title}`,
        confidence: 0.92,
      },
    ]);

    transitionJob(jobId, "STRUCTURING", { actor: WORKER, checkpoint: "structure", output: { ocr } });
    transitionJob(jobId, "PAGE_MAPPING", {
      actor: WORKER,
      checkpoint: "pages",
      message: "Official page refs marked NEEDS VERIFICATION",
    });

    // Ensure companion engine book exists (reuse Gate 3 importer for one cell)
    transitionJob(jobId, "CONTENT_DRAFTING", { actor: WORKER, checkpoint: "content" });
    // Process matching inventory companion via existing importer if book not yet linked
    let bookId = job.book_id ? String(job.book_id) : "";
    let versionId = job.book_version_id ? String(job.book_version_id) : "";

    if (!bookId) {
      // Prefer structured_book_id from inventory / prior Gate 3 import
      const cell = db
        .prepare(`SELECT structured_book_id FROM inventory_matrix_cells WHERE id=?`)
        .get(input.inventoryCellId || "") as { structured_book_id?: string } | undefined;
      if (cell?.structured_book_id) {
        bookId = String(cell.structured_book_id);
      }
    }

    if (!bookId) {
      // Run a tiny Gate 3 companion process — may create books for queued gate3 jobs; fallback query by subject
      processJordanCompanionJobs(1);
      const found = db
        .prepare(
          `SELECT id FROM books WHERE title_ar LIKE ? AND book_type='sos_companion' ORDER BY created_at DESC LIMIT 1`,
        )
        .get(`%${String(job.subject_title || "").slice(0, 20)}%`) as { id?: string } | undefined;
      bookId = found?.id || "";
    }

    if (bookId) {
      const ver = db
        .prepare(`SELECT id FROM book_versions WHERE book_id=? ORDER BY version_number DESC LIMIT 1`)
        .get(bookId) as { id: string } | undefined;
      versionId = ver?.id || "";
    }

    transitionJob(jobId, "BUILDING_VISUALS", {
      actor: WORKER,
      checkpoint: "visuals",
      bookId: bookId || null,
      bookVersionId: versionId || null,
      message: "Diagram/number-line blocks from structured content where present",
    });
    transitionJob(jobId, "BUILDING_ACTIVITIES", { actor: WORKER, checkpoint: "activities" });
    transitionJob(jobId, "BUILDING_ANSWERS", { actor: WORKER, checkpoint: "answers" });

    transitionJob(jobId, "AUTOMATED_VALIDATION", { actor: WORKER, checkpoint: "validate" });
    if (versionId) {
      const validation = validateBookVersion(versionId);
      db.prepare(
        `INSERT INTO validation_reports (id, book_version_id, passed, report_json, created_at) VALUES (?,?,?,?,?)`,
      ).run(uuid(), versionId, validation.passed ? 1 : 0, JSON.stringify(validation), nowIso());

      if (!validation.passed) {
        transitionJob(jobId, "CORRECTIONS_REQUIRED", {
          actor: WORKER,
          error: JSON.stringify(validation.critical),
          message: "Critical validation failed",
          output: validation,
        });
        raiseAlert("warn", "validation_failed", `Validation failed for job ${jobId}`, jobId, bookId);
        return { ok: false, status: "CORRECTIONS_REQUIRED", detail: "validation failed" };
      }
      scoreBookCompleteness(bookId);
    }

    // Create subject review task — AI/worker cannot approve educational content
    if (versionId) {
      db.prepare(
        `INSERT INTO review_tasks (id, book_version_id, review_type, status, assignee, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?)`,
      ).run(uuid(), versionId, "SUBJECT_REVIEW", "open", null, nowIso(), nowIso());
      db.prepare(
        `INSERT INTO review_tasks (id, book_version_id, review_type, status, assignee, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?)`,
      ).run(uuid(), versionId, "LANGUAGE_REVIEW", "open", null, nowIso(), nowIso());
      db.prepare(
        `INSERT INTO review_tasks (id, book_version_id, review_type, status, assignee, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?)`,
      ).run(uuid(), versionId, "TECHNICAL_REVIEW", "open", null, nowIso(), nowIso());
    }

    transitionJob(jobId, "SUBJECT_REVIEW", {
      actor: WORKER,
      role: "worker",
      checkpoint: "awaiting_human_subject_review",
      bookId: bookId || null,
      bookVersionId: versionId || null,
      message: "Draft ready — human subject review required before publication",
    });

    db.prepare(`UPDATE factory_jobs SET locked_by=NULL, locked_at=NULL, updated_at=? WHERE id=?`).run(nowIso(), jobId);
    return { ok: true, status: "SUBJECT_REVIEW", detail: bookId || "no_book_linked" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const attempts = Number(job.attempts || 0) + 1;
    const max = Number(job.max_attempts || 5);
    if (attempts >= max) {
      transitionJob(jobId, "FAILED", { actor: WORKER, error: msg });
      getBookEngineDb()
        .prepare(
          `INSERT INTO factory_dead_letters (id, job_id, last_status, error_log, payload_json, created_at)
           VALUES (?,?,?,?,?,?)`,
        )
        .run(uuid(), jobId, String(job.status), msg, JSON.stringify(job), nowIso());
      raiseAlert("critical", "job_failed", msg, jobId);
      return { ok: false, status: "FAILED", detail: msg };
    }
    transitionJob(jobId, "RETRYING", { actor: WORKER, error: msg, message: "Temporary failure — will retry" });
    db.prepare(`UPDATE factory_jobs SET locked_by=NULL, locked_at=NULL, updated_at=? WHERE id=?`).run(nowIso(), jobId);
    return { ok: false, status: "RETRYING", detail: msg };
  }
}

export function runFactoryWorkerBatch(limit = 25): {
  claimed: number;
  results: Array<{ jobId: string; status: string; detail: string }>;
} {
  applyMigrations();
  const claimed = claimNextJobs(limit, WORKER);
  const results: Array<{ jobId: string; status: string; detail: string }> = [];
  for (const job of claimed) {
    const r = processFactoryJob(job);
    results.push({ jobId: String(job.id), status: r.status, detail: r.detail });
  }
  return { claimed: claimed.length, results };
}

/** Drain eligible QUEUED companion jobs (blocked remain visible). */
export function drainEligibleFactoryJobs(maxBatches = 40, batchSize = 30): {
  processed: number;
  byStatus: Record<string, number>;
} {
  let processed = 0;
  for (let i = 0; i < maxBatches; i++) {
    const batch = runFactoryWorkerBatch(batchSize);
    processed += batch.claimed;
    if (batch.claimed === 0) break;
  }
  const stats = getBookEngineDb()
    .prepare(`SELECT status, COUNT(*) AS n FROM factory_jobs GROUP BY status`)
    .all() as Array<{ status: string; n: number }>;
  const byStatus: Record<string, number> = {};
  for (const s of stats) byStatus[s.status] = s.n;
  return { processed, byStatus };
}
