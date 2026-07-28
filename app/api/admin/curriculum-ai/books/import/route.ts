import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  JORDAN_G1_MATH_BOOK_ID,
  listPdfCandidates,
  loadAcquisition,
  loadCheckpoint,
  loadExtraction,
  loadPageExtractions,
  loadReviewState,
  saveReviewState,
  bookDir,
  writeJson,
} from "@/lib/curriculum-ai/store";
import {
  BookExtractionSchema,
  validateBookExtraction,
} from "@/lib/curriculum-ai/book-extraction-schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bookId = url.searchParams.get("bookId") || JORDAN_G1_MATH_BOOK_ID;
  const page = url.searchParams.get("page");

  const acquisition = loadAcquisition(bookId);
  const extraction = loadExtraction(bookId);
  const checkpoint = loadCheckpoint(bookId);
  const review = loadReviewState(bookId);
  const pdfs = listPdfCandidates(bookId);

  if (page) {
    const pages = loadPageExtractionsSafe(bookId);
    const idx = Number(page);
    const record = pages.find(
      (p) =>
        Number((p as { pdfPageIndex?: number }).pdfPageIndex) === idx - 1 ||
        Number((p as { officialPageNumber?: number }).officialPageNumber) ===
          idx,
    );
    return json({ page: record || null, total: pages.length });
  }

  return json({
    bookId,
    acquisition,
    extraction,
    checkpoint,
    review,
    pdfAvailable: pdfs.length > 0,
    pdfRelativePaths: pdfs.map((p) => path.relative(process.cwd(), p)),
    controls: {
      generateLesson: false,
      canApproveMetadata: true,
      canApproveStructure: true,
      canReprocessPage: pdfs.length > 0,
      canRejectBook: true,
    },
  });
}

function loadPageExtractionsSafe(bookId: string) {
  try {
    return loadPageExtractions(bookId);
  } catch {
    return [];
  }
}

type ReviewAction =
  | { action: "approve_metadata" }
  | { action: "approve_structure" }
  | { action: "reject_book"; reason?: string }
  | {
      action: "edit_metadata";
      patch: Record<string, string | number>;
    }
  | {
      action: "correct_unit";
      partIndex: number;
      unitIndex: number;
      title?: string;
      startPage?: number;
      endPage?: number;
    }
  | {
      action: "correct_lesson";
      partIndex: number;
      unitIndex: number;
      lessonIndex: number;
      title?: string;
      startPage?: number;
      endPage?: number;
    }
  | { action: "reprocess_page"; page: number }
  | { action: "save_structure"; structure: unknown };

export async function POST(request: Request) {
  const body = (await request.json()) as ReviewAction & { bookId?: string };
  const bookId = body.bookId || JORDAN_G1_MATH_BOOK_ID;
  const review = loadReviewState(bookId) || {};

  if (body.action === "approve_metadata") {
    saveReviewState(bookId, { ...review, metadataApproved: true });
    return json({ ok: true, review: loadReviewState(bookId) });
  }
  if (body.action === "approve_structure") {
    saveReviewState(bookId, { ...review, structureApproved: true });
    return json({ ok: true, review: loadReviewState(bookId) });
  }
  if (body.action === "reject_book") {
    saveReviewState(bookId, {
      ...review,
      rejected: true,
      rejectReason: body.reason || "rejected_by_admin",
      metadataApproved: false,
      structureApproved: false,
    });
    return json({ ok: true, review: loadReviewState(bookId) });
  }
  if (body.action === "edit_metadata") {
    const extraction = loadExtraction(bookId);
    if (!extraction) return json({ ok: false, error: "NO_EXTRACTION" }, 404);
    extraction.book = { ...extraction.book, ...body.patch } as typeof extraction.book;
    const validated = BookExtractionSchema.parse(extraction);
    writeJson(
      path.join(bookDir(bookId), "extraction", "structure.json"),
      validated,
    );
    saveReviewState(bookId, { ...review, metadataApproved: false, metadataEdited: true });
    return json({ ok: true, extraction: validated });
  }
  if (body.action === "correct_unit") {
    const extraction = loadExtraction(bookId);
    if (!extraction) return json({ ok: false, error: "NO_EXTRACTION" }, 404);
    const unit = extraction.parts[body.partIndex]?.units[body.unitIndex];
    if (!unit) return json({ ok: false, error: "UNIT_NOT_FOUND" }, 404);
    if (body.title != null) unit.title = body.title;
    if (body.startPage != null) unit.startPage = body.startPage;
    if (body.endPage != null) unit.endPage = body.endPage;
    const validated = validateBookExtraction(extraction);
    writeJson(
      path.join(bookDir(bookId), "extraction", "structure.json"),
      validated,
    );
    saveReviewState(bookId, { ...review, structureApproved: false });
    return json({ ok: true, extraction: validated });
  }
  if (body.action === "correct_lesson") {
    const extraction = loadExtraction(bookId);
    if (!extraction) return json({ ok: false, error: "NO_EXTRACTION" }, 404);
    const lesson =
      extraction.parts[body.partIndex]?.units[body.unitIndex]?.lessons[
        body.lessonIndex
      ];
    if (!lesson) return json({ ok: false, error: "LESSON_NOT_FOUND" }, 404);
    if (body.title != null) lesson.title = body.title;
    if (body.startPage != null) lesson.startPage = body.startPage;
    if (body.endPage != null) lesson.endPage = body.endPage;
    const validated = validateBookExtraction(extraction);
    writeJson(
      path.join(bookDir(bookId), "extraction", "structure.json"),
      validated,
    );
    saveReviewState(bookId, { ...review, structureApproved: false });
    return json({ ok: true, extraction: validated });
  }
  if (body.action === "save_structure") {
    const validated = validateBookExtraction(body.structure);
    writeJson(
      path.join(bookDir(bookId), "extraction", "structure.json"),
      validated,
    );
    saveReviewState(bookId, { ...review, structureApproved: false });
    return json({ ok: true, extraction: validated });
  }
  if (body.action === "reprocess_page") {
    const pdfs = listPdfCandidates(bookId);
    if (!pdfs.length) {
      return json(
        {
          ok: false,
          error: "PDF_MISSING",
          message: "Official complete PDF is not available locally yet.",
        },
        409,
      );
    }
    const pageNum = Number(body.page);
    if (!Number.isFinite(pageNum) || pageNum < 1) {
      return json({ ok: false, error: "INVALID_PAGE" }, 400);
    }
    // Reset checkpoint to page-1 so extractor resumes from selected page without wiping earlier pages:
    // delete only the selected page file, set checkpoint to pageNum-1.
    const pageFile = path.join(
      bookDir(bookId),
      "extraction",
      "pages",
      `page-${String(pageNum).padStart(4, "0")}.json`,
    );
    if (fs.existsSync(pageFile)) fs.unlinkSync(pageFile);
    writeJson(path.join(bookDir(bookId), "extraction", "checkpoints", "progress.json"), {
      lastCompletedPage: pageNum - 1,
      updatedAt: new Date().toISOString(),
      reprocessRequestedPage: pageNum,
    });

    const child = spawn(
      "python3",
      [
        path.join(process.cwd(), "scripts/curriculum-ai/extract-book.py"),
        "--pdf",
        pdfs[0],
        "--book-dir",
        bookDir(bookId),
        "--batch-size",
        "1",
      ],
      { detached: true, stdio: "ignore" },
    );
    child.unref();
    saveReviewState(bookId, {
      ...review,
      lastReprocessPage: pageNum,
      lastReprocessAt: new Date().toISOString(),
    });
    return json({ ok: true, started: true, page: pageNum, pid: child.pid });
  }

  return json({ ok: false, error: "UNKNOWN_ACTION" }, 400);
}
