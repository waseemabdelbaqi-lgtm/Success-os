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
  if (!sample || String(sample.status || "").startsWith("QUARANTINED")) {
    return NextResponse.json(
      {
        ok: false,
        error: "NO_JORDAN_SAMPLE_LESSON",
        status: "BLOCKED_PENDING_CURRICULUM_MAP_APPROVAL",
        message:
          "لا يوجد درس أردني معتمد. لازم اعتماد Evidence Pack أولاً. دروس OpenStax محظورة كمنهاج أردني.",
      },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const book = store.getBook(sample.book_id);
  if (!book || book.country_code !== "JO") {
    return NextResponse.json(
      {
        ok: false,
        error: "SAMPLE_NOT_JORDAN_TRACEABLE",
        status: "BLOCKED",
      },
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
      sourceTrace: {
        country: "Jordan",
        bookId: book.id,
        bookTitle: book.title,
        catalogUrl: book.catalog_url,
        rights: book.rights_status,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
