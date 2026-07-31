import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function loadStore() {
  return import(
    /* webpackIgnore: true */ path.join(
      process.cwd(),
      "workers/curriculum-ingestion/src/db/store.js",
    )
  );
}

async function loadRecovery() {
  try {
    return await import(
      /* webpackIgnore: true */ path.join(
        process.cwd(),
        "workers/curriculum-ingestion/src/pipelines/jordan-recovery.js",
      )
    );
  } catch {
    return null;
  }
}

async function loadQueue() {
  try {
    return await import(
      /* webpackIgnore: true */ path.join(
        process.cwd(),
        "workers/curriculum-ingestion/src/queue/bull.js",
      )
    );
  } catch {
    return null;
  }
}

async function loadStorage() {
  try {
    return await import(
      /* webpackIgnore: true */ path.join(
        process.cwd(),
        "workers/curriculum-ingestion/src/storage/object-store.js",
      )
    );
  } catch {
    return null;
  }
}

function summarizeBook(b: Record<string, unknown>) {
  return {
    id: b.id,
    title: b.title,
    grade: b.grade,
    semester: b.semester,
    subject: b.subject,
    bookType: b.book_type,
    rights: b.rights_status,
    status: b.status,
    pageCount: b.page_count,
    fileSize: b.file_size,
    lastError: b.last_error,
    officialUrl: b.official_url,
    catalogUrl: b.catalog_url,
  };
}

export async function GET() {
  try {
    const store = await loadStore();
    store.getDb();
    const metrics = store.getMetrics();
    const recovery = await loadRecovery();
    const jordanMetrics = recovery ? recovery.getJordanSeparatedMetrics() : null;
    const books = store.listBooks({ country_code: "JO" }).slice(0, 200);
    const oer = store.listBooks({ country_code: "OER" }).slice(0, 20);
    const jobs = store.listJobs(40);
    const sample = store.getLatestSampleLesson();
    const pack = recovery ? recovery.getEvidencePack() : null;
    const queueMod = await loadQueue();
    const storageMod = await loadStorage();
    const queue = queueMod
      ? await queueMod.queueHealth().catch((e: Error) => ({ error: e.message }))
      : null;
    const storage = storageMod ? storageMod.storageStats() : null;

    const sampleIsJordan =
      sample &&
      !String(sample.status || "").startsWith("QUARANTINED") &&
      books.some((b: { id: string }) => b.id === sample.book_id);

    // Explicit Jordan-safe overrides — never let OpenStax inflate Jordan counters.
    const safeMetrics = {
      ...metrics,
      ...(jordanMetrics || {}),
      downloadableBooks: jordanMetrics?.jordanDownloadableBooks ?? metrics.downloadableBooks ?? 0,
      verifiedBooks: jordanMetrics?.verifiedJordanBooks ?? metrics.verifiedJordanBooks ?? 0,
      processedBooks: jordanMetrics?.processedJordanBooks ?? metrics.processedJordanBooks ?? 0,
      blockedBooks: jordanMetrics?.blockedJordanBooks ?? metrics.blockedBooks ?? 0,
      openStaxDownloadableBooks:
        jordanMetrics?.openStaxDownloadableBooks ?? metrics.openStaxDownloadableBooks ?? 0,
      jordanCurriculumStatus: "FAIL",
      infrastructureStatus: "PASS",
      globalProductionStatus: "NOT_READY",
    };

    return json({
      workerHint: "Run: npm run curriculum:worker",
      statusBanner: {
        INFRASTRUCTURE_STATUS: "PASS",
        JORDAN_CURRICULUM_STATUS: "FAIL",
        GLOBAL_PRODUCTION_STATUS: "NOT_READY",
        note: "OpenStax is never counted as Jordan curriculum success.",
      },
      metrics: safeMetrics,
      storage,
      queue,
      jordanBooks: books.map(summarizeBook),
      oerBooksExcludedFromJordan: oer.map(summarizeBook),
      jobs: jobs.map((j: Record<string, unknown>) => ({
        id: j.id,
        type: j.type,
        status: j.status,
        progress: j.progress,
        error: j.error,
        updatedAt: j.updated_at,
      })),
      evidencePack: pack
        ? {
            id: pack.id,
            status: pack.status,
            mode: pack.mode,
            verifiedUnits: pack.counts?.verifiedUnits || 0,
            verifiedLessons: pack.counts?.verifiedLessons || 0,
            verifiedLearningOutcomes: pack.counts?.verifiedLearningOutcomes || 0,
          }
        : null,
      sampleLesson: sampleIsJordan
        ? {
            id: sample.id,
            title: sample.title,
            status: sample.status,
            sourcePages: sample.source_pages,
            bookId: sample.book_id,
          }
        : {
            status: jordanMetrics?.sampleLessonStatus || "BLOCKED_PENDING_CURRICULUM_MAP_APPROVAL",
            title: null,
            note: "No Jordan-traceable sample lesson. Non-Jordan samples quarantined.",
          },
      links: {
        evidencePack: "/api/admin/curriculum-map",
        curriculumMapReview: "/admin/curriculum-map",
        studentPreview: "/student/curriculum-sample",
      },
    });
  } catch (err) {
    return json(
      {
        error: String((err as Error)?.message || err),
        metrics: null,
        statusBanner: {
          INFRASTRUCTURE_STATUS: "PASS",
          JORDAN_CURRICULUM_STATUS: "FAIL",
          GLOBAL_PRODUCTION_STATUS: "NOT_READY",
        },
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action === "discover-jordan" || body.action === "run-recovery" || body.action === "run-phase") {
    const child = spawn(
      "node",
      [path.join(process.cwd(), "workers/curriculum-ingestion/src/index.js"), "recovery"],
      {
        cwd: process.cwd(),
        detached: true,
        stdio: "ignore",
        env: process.env,
      },
    );
    child.unref();
    return json({
      ok: true,
      started: true,
      pid: child.pid,
      message: "بدأ Jordan Content Recovery (اكتشاف/تنظيف/تشخيص/Evidence Pack) — بدون توليد درس",
    });
  }
  return json({ ok: false, error: "UNKNOWN_ACTION" }, 400);
}
