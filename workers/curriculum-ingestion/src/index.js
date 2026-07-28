#!/usr/bin/env node
/**
 * Curriculum Ingestion Worker — independent of Next.js request lifecycle.
 */
import { startWorker, QUEUE_NAMES, queueHealth, enqueue } from "./queue/bull.js";
import {
  runJordanDiscovery,
  downloadAndVerifyBook,
  extractStructure,
  createSampleLessonFromBook,
  queueDownloadJobsForOpenBooks,
} from "./pipelines/ingest.js";
import { runJordanContentRecovery } from "./pipelines/jordan-recovery.js";
import { getMetrics, listBooks, getLatestSampleLesson, updateBook } from "./db/store.js";
import { BOOK_STATUS } from "./rights/policy.js";
import { storageStats } from "./storage/object-store.js";

const mode = process.argv[2] || "worker";

async function runDiscoveryCli() {
  console.log(JSON.stringify(await runJordanDiscovery(), null, 2));
}

async function runRecoveryCli() {
  const report = await runJordanContentRecovery();
  console.log(JSON.stringify(report, null, 2));
  return report;
}

async function runPhaseCli() {
  // Phase now = Jordan Content Recovery only. OpenStax is NOT a Jordan substitute.
  return runRecoveryCli();
}

async function startWorkers() {
  console.log("Starting curriculum ingestion workers…");
  startWorker(QUEUE_NAMES.discovery, async () => runJordanDiscovery(), 1);
  startWorker(
    QUEUE_NAMES.download,
    async (job) => {
      const bookId = job.data.bookId;
      const result = await downloadAndVerifyBook(bookId);
      if (result.status === BOOK_STATUS.VERIFIED) {
        await enqueue(QUEUE_NAMES.extract, { bookId });
      }
      return result;
    },
    1,
  );
  startWorker(
    QUEUE_NAMES.extract,
    async (job) => {
      const structured = await extractStructure(job.data.bookId, { maxPages: 30 });
      await enqueue(QUEUE_NAMES.aiDraft, { bookId: job.data.bookId });
      return { units: structured.units?.length || 0, lessons: structured.lessons?.length || 0 };
    },
    1,
  );
  startWorker(
    QUEUE_NAMES.aiDraft,
    async (job) => {
      // Only one sample lesson in this phase.
      const existing = getLatestSampleLesson();
      if (existing) return { skipped: true, reason: "sample_already_exists" };
      const lesson = await createSampleLessonFromBook(job.data.bookId);
      return { title: lesson.title };
    },
    1,
  );

  console.log("Workers online. Redis + queues ready.");
  // keep process alive
  setInterval(async () => {
    const q = await queueHealth();
    const m = getMetrics();
    console.log("[heartbeat]", JSON.stringify({ queue: q.redis, metrics: m }));
  }, 60000);
}

if (mode === "discover") {
  runDiscoveryCli()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
} else if (mode === "phase" || mode === "recovery") {
  runPhaseCli()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
} else if (mode === "enqueue-open") {
  queueDownloadJobsForOpenBooks(3)
    .then((ids) => {
      console.log(JSON.stringify({ queued: ids }, null, 2));
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
} else {
  startWorkers().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
