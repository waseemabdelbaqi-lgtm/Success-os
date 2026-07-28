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
import { getMetrics, listBooks, getLatestSampleLesson, updateBook } from "./db/store.js";
import { BOOK_STATUS } from "./rights/policy.js";
import { storageStats } from "./storage/object-store.js";

const mode = process.argv[2] || "worker";

async function runDiscoveryCli() {
  console.log(JSON.stringify(await runJordanDiscovery(), null, 2));
}

async function runPhaseCli() {
  const discovery = await runJordanDiscovery();
  console.log("discovery", discovery);

  // Probe Jordan blocked downloads independently (should not stop pipeline)
  const jordanBlockedProbe = listBooks({ country_code: "JO" })
    .filter((b) => b.official_url)
    .slice(0, 3);
  for (const b of jordanBlockedProbe) {
    const r = await downloadAndVerifyBook(b.id);
    console.log("jordan_probe", b.title, r.status);
  }

  // Download up to 3 open-license books
  const openBooks = listBooks({ country_code: "OER" })
    .filter((b) => b.official_url && b.rights_status === "OPEN_LICENSE")
    .slice(0, 3);
  const verified = [];
  for (const b of openBooks) {
    console.log("downloading", b.title);
    const r = await downloadAndVerifyBook(b.id);
    console.log("result", b.title, r.status, r.pageCount || "");
    if (r.status === BOOK_STATUS.VERIFIED) verified.push(b.id);
  }

  let structured = null;
  let sample = null;
  if (verified[0]) {
    structured = await extractStructure(verified[0], { maxPages: 30 });
    sample = await createSampleLessonFromBook(verified[0]);
  }

  const metrics = getMetrics();
  const report = {
    discovery,
    verifiedBookIds: verified,
    structuredUnits: structured?.units?.length || 0,
    structuredLessons: structured?.lessons?.length || 0,
    sampleLessonTitle: sample?.title || null,
    metrics,
    storage: storageStats(),
    queue: await queueHealth().catch((e) => ({ error: String(e.message || e) })),
  };
  console.log(JSON.stringify(report, null, 2));
  return report;
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
} else if (mode === "phase") {
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
