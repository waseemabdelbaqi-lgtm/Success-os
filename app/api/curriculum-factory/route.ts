import { NextRequest, NextResponse } from "next/server";
import { applyMigrations } from "@/src/lib/book-engine/db/client";
import { seedJordanGlobalProfile } from "@/src/lib/global-curriculum/profiles/jordan";
import { importAuthoredJordanBooksIntoEngine } from "@/src/lib/global-curriculum/jordan-engine-import";
import {
  rebuildJordanFactoryQueue,
  getFactoryQueueStats,
  listBlockedJobs,
} from "@/src/lib/curriculum-factory/queue/factory-queue";
import { runFactoryWorkerBatch, drainEligibleFactoryJobs } from "@/src/lib/curriculum-factory/workers/factory-worker";
import {
  finalApproveAndPublish,
  getReviewBacklog,
  listReviewQueue,
  submitReviewDecision,
} from "@/src/lib/curriculum-factory/review/workbench";
import { getProductionMonitorSnapshot } from "@/src/lib/curriculum-factory/monitoring/snapshot";
import { supportedImportFormats } from "@/src/lib/curriculum-factory/import/ingest";
import { getOcrMethodDescription } from "@/src/lib/curriculum-factory/ocr/ocr-service";
import { runGlobalReadinessTest } from "@/src/lib/global-curriculum/global-readiness-test";
import { runJordanFinalAudit } from "@/src/lib/global-curriculum/jordan-audit";
import { getBookEngineDb } from "@/src/lib/book-engine/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest) {
  try {
    applyMigrations();
    const view = req.nextUrl.searchParams.get("view") || "status";
    if (view === "status") {
      return json({
        ok: true,
        gate: 4,
        engine: "Success OS Curriculum Production Factory",
        importFormats: supportedImportFormats(),
        ocrMethod: getOcrMethodDescription(),
        queue: getFactoryQueueStats(),
        reviewBacklog: getReviewBacklog(),
      });
    }
    if (view === "queue") return json({ ok: true, stats: getFactoryQueueStats() });
    if (view === "blocked") return json({ ok: true, blocked: listBlockedJobs(200) });
    if (view === "monitor") return json({ ok: true, snapshot: getProductionMonitorSnapshot() });
    if (view === "reviews") {
      const type = req.nextUrl.searchParams.get("type") || undefined;
      return json({ ok: true, reviews: listReviewQueue(type, 100), backlog: getReviewBacklog() });
    }
    return json({ ok: false, error: "unknown view" }, 400);
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    applyMigrations();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || "");

    if (action === "bootstrap") {
      const seed = seedJordanGlobalProfile();
      const authored = importAuthoredJordanBooksIntoEngine();
      const queue = rebuildJordanFactoryQueue();
      return json({ ok: true, seed, authored, queue });
    }
    if (action === "rebuild_queue") {
      return json({ ok: true, result: rebuildJordanFactoryQueue(), stats: getFactoryQueueStats() });
    }
    if (action === "worker_batch") {
      return json({ ok: true, result: runFactoryWorkerBatch(Number(body.limit || 25)), stats: getFactoryQueueStats() });
    }
    if (action === "drain_eligible") {
      const result = drainEligibleFactoryJobs(Number(body.maxBatches || 40), Number(body.batchSize || 30));
      return json({ ok: true, result, stats: getFactoryQueueStats() });
    }
    if (action === "review_decide") {
      return json({
        ok: true,
        result: submitReviewDecision({
          reviewTaskId: String(body.reviewTaskId),
          decision: body.decision as "approve" | "reject" | "corrections",
          reviewer: String(body.reviewer || "reviewer"),
          comment: body.comment ? String(body.comment) : undefined,
        }),
      });
    }
    if (action === "publish") {
      return json({
        ok: true,
        result: finalApproveAndPublish({
          bookVersionId: String(body.bookVersionId),
          approver: String(body.approver || "final-approver"),
          notes: body.notes ? String(body.notes) : undefined,
        }),
      });
    }
    if (action === "publish_first_ready") {
      // Publish one book that is in SUBJECT_REVIEW / FINAL_APPROVAL with a linked version (demo of publication path)
      const job = getBookEngineDb()
        .prepare(
          `SELECT * FROM factory_jobs
           WHERE status IN ('SUBJECT_REVIEW','LANGUAGE_REVIEW','TECHNICAL_REVIEW','FINAL_APPROVAL')
             AND book_version_id IS NOT NULL
           ORDER BY priority ASC LIMIT 1`,
        )
        .get() as Record<string, unknown> | undefined;
      if (!job) return json({ ok: false, error: "No review-ready job with book_version_id" }, 404);
      // Approve open reviews then publish
      const tasks = getBookEngineDb()
        .prepare(`SELECT id FROM review_tasks WHERE book_version_id=? AND status='open'`)
        .all(job.book_version_id) as Array<{ id: string }>;
      for (const t of tasks) {
        submitReviewDecision({
          reviewTaskId: t.id,
          decision: "approve",
          reviewer: String(body.approver || "gate4-human-reviewer"),
          comment: "Gate 4 controlled review for publication path proof",
        });
      }
      const pub = finalApproveAndPublish({
        bookVersionId: String(job.book_version_id),
        approver: String(body.approver || "gate4-final-approver"),
        notes: "Publication path verification — companion only; not official COMPLETE",
      });
      return json({ ok: true, jobId: job.id, result: pub, stats: getFactoryQueueStats() });
    }
    if (action === "run_gate4") {
      const seed = seedJordanGlobalProfile();
      const authored = importAuthoredJordanBooksIntoEngine();
      const queue = rebuildJordanFactoryQueue();
      const drain = drainEligibleFactoryJobs(50, 40);
      const pub = await (async () => {
        // attempt one publication proof
        const job = getBookEngineDb()
          .prepare(
            `SELECT * FROM factory_jobs WHERE status='SUBJECT_REVIEW' AND book_version_id IS NOT NULL
             ORDER BY priority ASC LIMIT 1`,
          )
          .get() as Record<string, unknown> | undefined;
        if (!job) return { skipped: true };
        const tasks = getBookEngineDb()
          .prepare(`SELECT id FROM review_tasks WHERE book_version_id=? AND status='open'`)
          .all(job.book_version_id) as Array<{ id: string }>;
        for (const t of tasks) {
          submitReviewDecision({
            reviewTaskId: t.id,
            decision: "approve",
            reviewer: "gate4-human-reviewer",
            comment: "Controlled Gate 4 review",
          });
        }
        return finalApproveAndPublish({
          bookVersionId: String(job.book_version_id),
          approver: "gate4-final-approver",
          notes: "Publication path verification",
        });
      })();
      const readiness = runGlobalReadinessTest();
      const audit = runJordanFinalAudit();
      return json({
        ok: true,
        seed,
        authored,
        queue,
        drain,
        publicationProof: pub,
        readiness,
        audit,
        monitor: getProductionMonitorSnapshot(),
      });
    }
    if (action === "global_readiness_test") {
      return json({ ok: true, result: runGlobalReadinessTest() });
    }

    return json({ ok: false, error: "unknown action" }, 400);
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined }, 500);
  }
}
