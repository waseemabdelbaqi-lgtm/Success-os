import { applyMigrations, getBookEngineDb } from "@/src/lib/book-engine/db/client";
import { getFactoryQueueStats, listBlockedJobs } from "@/src/lib/curriculum-factory/queue/factory-queue";
import { getReviewBacklog } from "@/src/lib/curriculum-factory/review/workbench";
import { JORDAN_COUNTRY_ID } from "@/src/lib/global-curriculum/profiles/jordan";
import { getReadinessChecks, listActiveCountries } from "@/src/lib/global-curriculum/repository";

export function getProductionMonitorSnapshot(): Record<string, unknown> {
  applyMigrations();
  const db = getBookEngineDb();

  const queue = getFactoryQueueStats();
  const backlog = getReviewBacklog();
  const blockedSample = listBlockedJobs(20);

  const alerts = db
    .prepare(`SELECT * FROM factory_alerts ORDER BY created_at DESC LIMIT 20`)
    .all();
  const deadLetters = (
    db.prepare(`SELECT COUNT(*) AS n FROM factory_dead_letters`).get() as { n: number }
  ).n;
  const workers = db.prepare(`SELECT * FROM factory_worker_heartbeats`).all();
  const published = (db.prepare(`SELECT COUNT(*) AS n FROM published_versions`).get() as { n: number }).n;
  const completeClaim = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM books WHERE completeness_claim='complete' AND deleted_at IS NULL`)
      .get() as { n: number }
  ).n;
  const inventory = db
    .prepare(
      `SELECT COUNT(*) AS expected,
              SUM(CASE WHEN matrix_status='COMPLETE' THEN 1 ELSE 0 END) AS complete_cells
       FROM inventory_matrix_cells WHERE country_id=?`,
    )
    .get(JORDAN_COUNTRY_ID) as { expected: number; complete_cells: number };

  const ocrLow = (
    db.prepare(`SELECT COUNT(*) AS n FROM ocr_page_results WHERE needs_manual_review=1`).get() as { n: number }
  ).n;
  const validationFails = (
    db.prepare(`SELECT COUNT(*) AS n FROM validation_reports WHERE passed=0`).get() as { n: number }
  ).n;

  return {
    generatedAt: new Date().toISOString(),
    global: {
      countries: listActiveCountries(),
      readiness: getReadinessChecks(),
    },
    jordan: {
      inventoryExpected: inventory.expected,
      inventoryCompleteCells: inventory.complete_cells,
      queue,
      publishedBooks: published,
      booksClaimedComplete: completeClaim,
      reviewBacklog: backlog,
      blockedSample,
    },
    quality: {
      ocrNeedsManualReview: ocrLow,
      validationFailures: validationFails,
      deadLetters,
    },
    alerts,
    workers,
  };
}
