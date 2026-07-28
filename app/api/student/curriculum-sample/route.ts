import { NextResponse } from "next/server";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const store = await import(
    /* webpackIgnore: true */ path.join(
      process.cwd(),
      "workers/curriculum-ingestion/src/db/store.js",
    )
  );
  store.getDb();
  const sample = store.getLatestSampleLesson();
  if (!sample) {
    return NextResponse.json(
      { ok: false, error: "NO_SAMPLE_LESSON" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    {
      ok: true,
      id: sample.id,
      title: sample.title,
      status: sample.status,
      sourcePages: sample.source_pages,
      content: JSON.parse(sample.content_json),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
