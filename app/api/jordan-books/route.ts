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

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "coverage";
  const overrides = await readEditorialOverrides();

  if (view === "inventory") {
    return NextResponse.json({ ok: true, inventory: listInventory(), overrides });
  }

  if (view === "books") {
    return NextResponse.json({ ok: true, books: listStructuredBooks(overrides) });
  }

  if (view === "book") {
    const id = searchParams.get("id") || "";
    const book = id ? getBookById(id, overrides) : getPilotBook(overrides);
    if (!book) return NextResponse.json({ ok: false, error: "book_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, book });
  }

  if (view === "pilot") {
    return NextResponse.json({
      ok: true,
      book: getPilotBook(overrides),
      route: "/jordan-books/jordan/national/grade-1/semester-1/math/student-book/unit-1",
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
  "academic_review",
  "language_review",
  "technical_review",
  "approved",
  "published",
  "archived",
];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    bookId?: string;
    lessonId?: string;
    editorialStatus?: EditorialStatus;
    updatedBy?: string;
    note?: string;
  };

  if (body.action !== "set_editorial_status") {
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  }
  if (!body.bookId || !body.editorialStatus || !ALLOWED.includes(body.editorialStatus)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  // No auto-publish of AI content — explicit human action only.
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
