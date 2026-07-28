import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function loadStore() {
  const mod = await import(
    /* webpackIgnore: true */ path.join(
      process.cwd(),
      "workers/curriculum-ingestion/src/db/store.js",
    )
  );
  return mod;
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

export async function GET() {
  try {
    const store = await loadStore();
    store.getDb();
    const metrics = store.getMetrics();
    const books = store.listBooks({ country_code: "JO" }).slice(0, 200);
    const oer = store.listBooks({ country_code: "OER" }).slice(0, 50);
    const jobs = store.listJobs(40);
    const sample = store.getLatestSampleLesson();
    const queueMod = await loadQueue();
    const storageMod = await loadStorage();
    const queue = queueMod ? await queueMod.queueHealth().catch((e: Error) => ({ error: e.message })) : null;
    const storage = storageMod ? storageMod.storageStats() : null;
    return json({
      workerHint: "Run: npm run curriculum:worker",
      metrics,
      storage,
      queue,
      jordanBooks: books.map(summarizeBook),
      oerBooks: oer.map(summarizeBook),
      jobs: jobs.map((j: Record<string, unknown>) => ({
        id: j.id,
        type: j.type,
        status: j.status,
        progress: j.progress,
        error: j.error,
        updatedAt: j.updated_at,
      })),
      sampleLesson: sample
        ? {
            id: sample.id,
            title: sample.title,
            status: sample.status,
            sourcePages: sample.source_pages,
            bookId: sample.book_id,
          }
        : null,
    });
  } catch (err) {
    return json(
      {
        error: String((err as Error)?.message || err),
        metrics: null,
      },
      500,
    );
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
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action === "discover-jordan") {
    // Fire discovery in background worker process — not inside request timeout critically.
    const child = spawn(
      "node",
      [path.join(process.cwd(), "workers/curriculum-ingestion/src/index.js"), "discover"],
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
      message: "بدأ اكتشاف منهاج الأردن في الخلفية",
    });
  }
  if (body.action === "run-phase") {
    const child = spawn(
      "node",
      [path.join(process.cwd(), "workers/curriculum-ingestion/src/index.js"), "phase"],
      {
        cwd: process.cwd(),
        detached: true,
        stdio: "ignore",
        env: process.env,
      },
    );
    child.unref();
    return json({ ok: true, started: true, pid: child.pid });
  }
  return json({ ok: false, error: "UNKNOWN_ACTION" }, 400);
}
