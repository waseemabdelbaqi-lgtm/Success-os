import { NextResponse } from "next/server";
import {
  buildCoverageReport,
  getBookById,
  getPilotBook,
  listInventory,
  listStructuredBooks,
} from "@/src/lib/jordan-books/registry";
import { readEditorialOverrides, upsertEditorialOverride } from "@/src/lib/jordan-books/store/editorial-store";
import type { EditorialStatus } from "@/src/lib/jordan-books/schema/types";
import { buildCompletenessMatrix } from "@/src/lib/jordan-books/matrix/completeness";
import { inventoryStats, MASTER_INVENTORY } from "@/src/lib/jordan-books/matrix/master-inventory";
import { loadProductionStore } from "@/src/lib/jordan-books/matrix/queue-store";
import { loadStubBooks, processProductionQueue, getStubBookById } from "@/src/lib/jordan-books/production/queue-processor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "coverage";
  const overrides = await readEditorialOverrides();

  if (view === "inventory") {
    return NextResponse.json({ ok: true, inventory: listInventory(), overrides });
  }

  if (view === "matrix") {
    const store = await loadProductionStore();
    const matrix = buildCompletenessMatrix(store.cells.length ? store.cells : MASTER_INVENTORY);
    return NextResponse.json({
      ok: true,
      matrix,
      inventoryStats: inventoryStats(matrix.cells),
      honestCompleteClaim: false,
    });
  }

  if (view === "queue") {
    const store = await loadProductionStore();
    return NextResponse.json({
      ok: true,
      updatedAt: store.updatedAt,
      queue: store.queue,
      summary: {
        pending: store.queue.filter((q) => q.state === "pending").length,
        done: store.queue.filter((q) => q.state === "done").length,
        blocked: store.queue.filter((q) => q.state === "blocked").length,
        running: store.queue.filter((q) => q.state === "running").length,
      },
      processedBookIds: store.processedBookIds,
    });
  }

  if (view === "books") {
    const store = await loadProductionStore();
    const authored = listStructuredBooks(overrides);
    const stubMeta = store.cells.filter((c) => c.bookType === "sos_companion" && c.matrixStatus === "STRUCTURED");
    return NextResponse.json({
      ok: true,
      books: authored,
      authored: authored.length,
      stubs: stubMeta.length,
      stubIds: stubMeta.map((c) => c.structuredBookId).filter(Boolean),
    });
  }

  if (view === "book") {
    const id = searchParams.get("id") || "";
    let book = id ? getBookById(id, overrides) : getPilotBook(overrides);
    if (!book && id) {
      book = await getStubBookById(id);
    }
    if (!book) return NextResponse.json({ ok: false, error: "book_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, book });
  }

  if (view === "validation") {
    const stubs = await loadStubBooks();
    const books = [...listStructuredBooks(overrides), ...stubs];
    const { summarizeValidation, validateBook } = await import(
      "@/src/lib/jordan-books/validation/validate-book"
    );
    return NextResponse.json({
      ok: true,
      results: books.map((b) => ({
        bookId: b.id,
        completenessClaim: b.completenessClaim,
        ...summarizeValidation(validateBook(b)),
      })),
    });
  }

  if (view === "pilot") {
    return NextResponse.json({
      ok: true,
      book: getPilotBook(overrides),
      route: "/jordan-books/jordan/national/grade-1/semester-1/math/student-book",
      library: "/jordan-books/jordan/national/grade-1/semester-1",
      videoDevelopmentStopped: true,
    });
  }

  return NextResponse.json({ ok: true, coverage: buildCoverageReport(overrides) });
}

const ALLOWED: EditorialStatus[] = [
  "discovered",
  "source_verified",
  "rights_checked",
  "structured",
  "draft",
  "content_draft",
  "academic_review",
  "language_review",
  "technical_review",
  "corrections_required",
  "approved",
  "published",
  "archived",
  "replaced",
];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    bookId?: string;
    lessonId?: string;
    editorialStatus?: EditorialStatus;
    updatedBy?: string;
    note?: string;
    limit?: number;
  };

  if (body.action === "process_queue") {
    const result = await processProductionQueue(Math.min(body.limit || 40, 100));
    const store = await loadProductionStore();
    return NextResponse.json({
      ok: true,
      result,
      matrix: buildCompletenessMatrix(store.cells),
      message: "Queue processed. Foundation stubs are STRUCTURED not COMPLETE. Video development remains stopped.",
    });
  }

  if (body.action !== "set_editorial_status") {
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  }
  if (!body.bookId || !body.editorialStatus || !ALLOWED.includes(body.editorialStatus)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const overrides = await upsertEditorialOverride({
    bookId: body.bookId,
    lessonId: body.lessonId,
    editorialStatus: body.editorialStatus,
    updatedBy: body.updatedBy || "admin",
    note: body.note,
  });

  return NextResponse.json({
    ok: true,
    overrides,
    coverage: buildCoverageReport(overrides),
    message: "Editorial status updated. Content remains gated until approved/published by authorized staff.",
  });
}
