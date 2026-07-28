import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  JORDAN_G1_MATH_BOOK_ID,
  bookDir,
  listPdfCandidates,
  loadAcquisition,
  readJsonIfExists,
  writeJson,
} from "@/lib/curriculum-ai/store";
import {
  OFFICIAL_BOOK_TITLE_AR,
  OFFICIAL_CATALOG_URL,
  OFFICIAL_PDF_URL,
  renderPreviewPngs,
  validateOfficialPdf,
} from "@/lib/curriculum-ai/pdf-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const maxDuration = 300;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function sourceDir(bookId = JORDAN_G1_MATH_BOOK_ID) {
  return path.join(bookDir(bookId), "source");
}

function importStatusPath(bookId = JORDAN_G1_MATH_BOOK_ID) {
  return path.join(bookDir(bookId), "import-status.json");
}

function downloadAttempt(bookId = JORDAN_G1_MATH_BOOK_ID) {
  return readJsonIfExists<Record<string, unknown>>(
    path.join(bookDir(bookId), "download-attempt.json"),
  );
}

function getValidPdf(bookId = JORDAN_G1_MATH_BOOK_ID) {
  const preferred = path.join(sourceDir(bookId), "MA.01.ST.BOOK_WEB.pdf");
  const candidates = [
    preferred,
    ...listPdfCandidates(bookId).filter((p) => p !== preferred),
  ];
  for (const file of candidates) {
    const v = validateOfficialPdf(file);
    if (v.ok) return v;
  }
  return null;
}

function ensurePreviews(bookId: string, pdfPath: string, pageCount: number) {
  const previewDir = path.join(bookDir(bookId), "previews");
  const needed = Math.min(3, pageCount);
  const existing = Array.from({ length: needed }, (_, i) =>
    path.join(previewDir, `preview-page-${i + 1}.png`),
  );
  if (existing.every((p) => fs.existsSync(p))) {
    return existing.map((p) => path.relative(process.cwd(), p));
  }
  const rendered = renderPreviewPngs(pdfPath, previewDir, [0, 1, 2].slice(0, needed));
  return rendered.map((p) => path.relative(process.cwd(), p));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bookId = url.searchParams.get("bookId") || JORDAN_G1_MATH_BOOK_ID;
  const preview = url.searchParams.get("preview");

  if (preview) {
    const file = path.join(
      bookDir(bookId),
      "previews",
      `preview-page-${Number(preview)}.png`,
    );
    if (!fs.existsSync(file)) return json({ ok: false, error: "PREVIEW_MISSING" }, 404);
    const buf = fs.readFileSync(file);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  }

  const valid = getValidPdf(bookId);
  const attempt = downloadAttempt(bookId);
  const acquisition = loadAcquisition(bookId);
  const status = readJsonIfExists<Record<string, unknown>>(importStatusPath(bookId));

  if (!valid) {
    const failReason =
      (status?.failReason as string) ||
      (attempt?.failReason as string) ||
      (Array.isArray(acquisition?.blockers) ? acquisition?.blockers?.[0] : null) ||
      "لم يتم استيراد ملف PDF رسمي صالح بعد.";
    return json({
      imported: false,
      message: "لم يتم استيراد الكتاب بعد",
      failReason,
      officialUrl: (attempt?.officialUrl as string) || OFFICIAL_PDF_URL,
      catalogUrl: OFFICIAL_CATALOG_URL,
      officialTitle: OFFICIAL_BOOK_TITLE_AR,
      needsManualUpload: true,
    });
  }

  const previews = ensurePreviews(bookId, valid.localFile, valid.pageCount);
  writeJson(importStatusPath(bookId), {
    imported: true,
    officialUrl: (attempt?.officialUrl as string) || OFFICIAL_PDF_URL,
    localFile: path.relative(process.cwd(), valid.localFile),
    fileSize: valid.fileSize,
    pageCount: valid.pageCount,
    sha256: valid.sha256,
    firstPageValid: valid.firstPageValid,
    lastPageValid: valid.lastPageValid,
    updatedAt: new Date().toISOString(),
  });

  return json({
    imported: true,
    officialTitle: OFFICIAL_BOOK_TITLE_AR,
    officialUrl: (attempt?.officialUrl as string) || OFFICIAL_PDF_URL,
    localFile: path.relative(process.cwd(), valid.localFile),
    fileSize: valid.fileSize,
    pageCount: valid.pageCount,
    sha256: valid.sha256,
    firstPageValid: valid.firstPageValid,
    lastPageValid: valid.lastPageValid,
    previews: previews.map((_, i) => `/api/admin/curriculum-ai/books/import?preview=${i + 1}`),
    coverPreview: previews.length
      ? `/api/admin/curriculum-ai/books/import?preview=1`
      : null,
  });
}

export async function POST(request: Request) {
  const bookId = JORDAN_G1_MATH_BOOK_ID;
  const contentType = request.headers.get("content-type") || "";

  // Multipart upload
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return json({ ok: false, error: "FILE_REQUIRED" }, 400);
    }
    const destDir = sourceDir(bookId);
    fs.mkdirSync(destDir, { recursive: true });
    const dest = path.join(destDir, "MA.01.ST.BOOK_WEB.pdf");
    const partial = `${dest}.upload-partial`;
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(partial, buf);

    const validation = validateOfficialPdf(partial);
    if (!validation.ok) {
      const rejected = path.join(
        destDir,
        `REJECTED_UPLOAD_${validation.reason}_${Date.now()}.bin`,
      );
      fs.renameSync(partial, rejected);
      writeJson(importStatusPath(bookId), {
        imported: false,
        failReason: `UPLOAD_VALIDATION_FAILED:${validation.reason}`,
        updatedAt: new Date().toISOString(),
      });
      return json(
        {
          ok: false,
          imported: false,
          message: "لم يتم استيراد الكتاب بعد",
          failReason: `فشل التحقق من الملف المرفوع: ${validation.reason}`,
        },
        400,
      );
    }

    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(partial, dest);
    // Clear stale previews then regenerate
    const previewDir = path.join(bookDir(bookId), "previews");
    if (fs.existsSync(previewDir)) {
      for (const f of fs.readdirSync(previewDir)) {
        if (f.endsWith(".png")) fs.unlinkSync(path.join(previewDir, f));
      }
    }
    const previews = ensurePreviews(bookId, dest, validation.pageCount);
    writeJson(importStatusPath(bookId), {
      imported: true,
      source: "manual_upload",
      officialUrl: OFFICIAL_PDF_URL,
      localFile: path.relative(process.cwd(), dest),
      fileSize: validation.fileSize,
      pageCount: validation.pageCount,
      sha256: validation.sha256,
      firstPageValid: true,
      lastPageValid: true,
      updatedAt: new Date().toISOString(),
    });
    return json({
      ok: true,
      imported: true,
      officialTitle: OFFICIAL_BOOK_TITLE_AR,
      officialUrl: OFFICIAL_PDF_URL,
      localFile: path.relative(process.cwd(), dest),
      fileSize: validation.fileSize,
      pageCount: validation.pageCount,
      sha256: validation.sha256,
      firstPageValid: true,
      lastPageValid: true,
      previews: previews.map((_, i) => `/api/admin/curriculum-ai/books/import?preview=${i + 1}`),
    });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action === "redownload") {
    // Fire Playwright download; do not claim success until validation passes on next GET.
    writeJson(importStatusPath(bookId), {
      imported: false,
      failReason: "إعادة التنزيل الرسمي قيد التنفيذ…",
      updatedAt: new Date().toISOString(),
    });
    const child = spawn(
      "node",
      [path.join(process.cwd(), "scripts/curriculum-ai/download-official-pdf.mjs")],
      {
        cwd: process.cwd(),
        detached: true,
        stdio: "ignore",
      },
    );
    child.unref();
    return json({
      ok: true,
      started: true,
      pid: child.pid,
      message: "بدأت محاولة إعادة التنزيل الرسمي. حدّث الصفحة بعد اكتمالها.",
      officialUrl: OFFICIAL_PDF_URL,
    });
  }

  return json({ ok: false, error: "UNKNOWN_ACTION" }, 400);
}
