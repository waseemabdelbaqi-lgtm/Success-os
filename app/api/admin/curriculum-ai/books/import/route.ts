import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  BOOK_STORAGE_DIR,
  CHUNK_SIZE,
  MAX_FILE_SIZE,
  OFFICIAL_BOOK_TITLE_AR,
  OFFICIAL_PDF_URL,
  PREVIEW_DIR,
  SOURCE_PDF_PATH,
  UPLOAD_SESSIONS_DIR,
  assembleChunks,
  ensureBookDirs,
  readImportStatus,
  renderPreviewPngs,
  streamRequestToFile,
  validateOfficialPdf,
  writeImportStatus,
} from "@/lib/curriculum-ai/pdf-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

// Allow large-ish chunk bodies in this route segment (5MB chunks + overhead).
export const preferredRegion = "auto";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

type SessionMeta = {
  sessionId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  chunkSize: number;
  received: number[];
  createdAt: string;
  updatedAt: string;
};

function sessionDir(sessionId: string) {
  return path.join(UPLOAD_SESSIONS_DIR, sessionId);
}

function sessionMetaPath(sessionId: string) {
  return path.join(sessionDir(sessionId), "session.json");
}

function readSession(sessionId: string): SessionMeta | null {
  const p = sessionMetaPath(sessionId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as SessionMeta;
}

function writeSession(meta: SessionMeta) {
  fs.mkdirSync(sessionDir(meta.sessionId), { recursive: true });
  fs.writeFileSync(
    sessionMetaPath(meta.sessionId),
    `${JSON.stringify({ ...meta, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
}

function listReceivedChunks(sessionId: string): number[] {
  const dir = sessionDir(sessionId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((f) => {
      const m = /^chunk-(\d+)\.part$/.exec(f);
      return m ? Number(m[1]) : null;
    })
    .filter((n): n is number => n != null)
    .sort((a, b) => a - b);
}

export async function GET(request: Request) {
  ensureBookDirs();
  const url = new URL(request.url);
  const preview = url.searchParams.get("preview");
  const sessionId = url.searchParams.get("sessionId");

  if (preview) {
    const file = path.join(PREVIEW_DIR, `preview-page-${Number(preview)}.png`);
    if (!fs.existsSync(file)) return json({ ok: false, error: "PREVIEW_MISSING" }, 404);
    const buf = fs.readFileSync(file);
    return new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  if (sessionId) {
    const meta = readSession(sessionId);
    if (!meta) return json({ ok: false, error: "SESSION_NOT_FOUND" }, 404);
    const received = listReceivedChunks(sessionId);
    return json({
      ok: true,
      sessionId,
      fileSize: meta.fileSize,
      totalChunks: meta.totalChunks,
      chunkSize: meta.chunkSize,
      received,
      missing: Array.from({ length: meta.totalChunks }, (_, i) => i).filter(
        (i) => !received.includes(i),
      ),
      bytesReceived: received.reduce((sum, i) => {
        const p = path.join(sessionDir(sessionId), `chunk-${String(i).padStart(6, "0")}.part`);
        return sum + (fs.existsSync(p) ? fs.statSync(p).size : 0);
      }, 0),
    });
  }

  const status = readImportStatus();
  const verified = status.state === "VERIFIED" && fs.existsSync(SOURCE_PDF_PATH);
  const previews = verified
    ? [1, 2, 3]
        .filter((n) => fs.existsSync(path.join(PREVIEW_DIR, `preview-page-${n}.png`)))
        .map((n) => `/api/admin/curriculum-ai/books/import?preview=${n}`)
    : [];

  return json({
    officialTitle: OFFICIAL_BOOK_TITLE_AR,
    officialUrl: OFFICIAL_PDF_URL,
    maxFileSize: MAX_FILE_SIZE,
    chunkSize: CHUNK_SIZE,
    status,
    verified,
    localFile: verified ? path.relative(process.cwd(), SOURCE_PDF_PATH) : null,
    previews,
    coverPreview: previews[0] || null,
    extractionEnabled: Boolean(status.extractionEnabled && verified),
  });
}

export async function POST(request: Request) {
  ensureBookDirs();
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "";

  // ---- init upload session ----
  if (action === "init") {
    const body = (await request.json()) as {
      fileName?: string;
      fileSize?: number;
    };
    const fileSize = Number(body.fileSize || 0);
    const fileName = String(body.fileName || "source.pdf");
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return json({ ok: false, error: "INVALID_FILE_SIZE" }, 400);
    }
    if (fileSize > MAX_FILE_SIZE) {
      return json({ ok: false, error: "FILE_TOO_LARGE", maxFileSize: MAX_FILE_SIZE }, 400);
    }
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const sessionId = randomUUID();
    const meta: SessionMeta = {
      sessionId,
      fileName,
      fileSize,
      totalChunks,
      chunkSize: CHUNK_SIZE,
      received: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeSession(meta);
    writeImportStatus({
      state: "UPLOADING",
      officialTitle: OFFICIAL_BOOK_TITLE_AR,
      officialUrl: OFFICIAL_PDF_URL,
      extractionEnabled: false,
      extractionStarted: false,
      updatedAt: new Date().toISOString(),
    });
    return json({
      ok: true,
      sessionId,
      chunkSize: CHUNK_SIZE,
      totalChunks,
      maxFileSize: MAX_FILE_SIZE,
    });
  }

  // ---- upload one chunk (streamed to disk) ----
  if (action === "chunk") {
    const sessionId = url.searchParams.get("sessionId") || "";
    const index = Number(url.searchParams.get("index"));
    const meta = readSession(sessionId);
    if (!meta) return json({ ok: false, error: "SESSION_NOT_FOUND" }, 404);
    if (!Number.isInteger(index) || index < 0 || index >= meta.totalChunks) {
      return json({ ok: false, error: "INVALID_CHUNK_INDEX" }, 400);
    }

    const chunkPath = path.join(
      sessionDir(sessionId),
      `chunk-${String(index).padStart(6, "0")}.part`,
    );

    // Idempotent: skip rewrite if chunk already present with expected size.
    const expectedSize =
      index === meta.totalChunks - 1
        ? meta.fileSize - meta.chunkSize * (meta.totalChunks - 1)
        : meta.chunkSize;

    if (fs.existsSync(chunkPath) && fs.statSync(chunkPath).size === expectedSize) {
      const received = listReceivedChunks(sessionId);
      return json({
        ok: true,
        skipped: true,
        index,
        received,
        progress: received.length / meta.totalChunks,
      });
    }

    try {
      const written = await streamRequestToFile(
        request,
        chunkPath,
        meta.chunkSize + 64 * 1024,
      );
      if (written !== expectedSize) {
        // Allow final chunk variance already handled; reject mismatch
        if (fs.existsSync(chunkPath)) fs.unlinkSync(chunkPath);
        return json(
          {
            ok: false,
            error: "CHUNK_SIZE_MISMATCH",
            expectedSize,
            written,
          },
          400,
        );
      }
    } catch (err) {
      if (fs.existsSync(chunkPath)) fs.unlinkSync(chunkPath);
      return json(
        { ok: false, error: String((err as Error)?.message || err) },
        500,
      );
    }

    const received = listReceivedChunks(sessionId);
    meta.received = received;
    writeSession(meta);
    return json({
      ok: true,
      skipped: false,
      index,
      received,
      progress: received.length / meta.totalChunks,
    });
  }

  // ---- complete: assemble + validate + preview ----
  if (action === "complete") {
    const body = (await request.json()) as { sessionId?: string };
    const sessionId = String(body.sessionId || "");
    const meta = readSession(sessionId);
    if (!meta) return json({ ok: false, error: "SESSION_NOT_FOUND" }, 404);

    const received = listReceivedChunks(sessionId);
    if (received.length !== meta.totalChunks) {
      return json(
        {
          ok: false,
          error: "INCOMPLETE_UPLOAD",
          received,
          totalChunks: meta.totalChunks,
        },
        409,
      );
    }

    writeImportStatus({
      state: "ASSEMBLING",
      officialTitle: OFFICIAL_BOOK_TITLE_AR,
      officialUrl: OFFICIAL_PDF_URL,
      extractionEnabled: false,
      extractionStarted: false,
      updatedAt: new Date().toISOString(),
    });

    const assembledPath = path.join(sessionDir(sessionId), "assembled.pdf");
    try {
      await assembleChunks(sessionDir(sessionId), meta.totalChunks, assembledPath);
    } catch (err) {
      writeImportStatus({
        state: "REJECTED",
        officialTitle: OFFICIAL_BOOK_TITLE_AR,
        officialUrl: OFFICIAL_PDF_URL,
        failReason: `فشل تجميع الأجزاء: ${String((err as Error)?.message || err)}`,
        extractionEnabled: false,
        extractionStarted: false,
        updatedAt: new Date().toISOString(),
      });
      return json({ ok: false, error: "ASSEMBLE_FAILED" }, 500);
    }

    writeImportStatus({
      state: "VALIDATING",
      officialTitle: OFFICIAL_BOOK_TITLE_AR,
      officialUrl: OFFICIAL_PDF_URL,
      extractionEnabled: false,
      extractionStarted: false,
      updatedAt: new Date().toISOString(),
    });

    const validation = await validateOfficialPdf(assembledPath);
    if (!validation.ok) {
      const rejected = path.join(
        BOOK_STORAGE_DIR,
        `REJECTED_${validation.reason}_${Date.now()}.bin`,
      );
      fs.renameSync(assembledPath, rejected);
      writeImportStatus({
        state: "REJECTED",
        officialTitle: OFFICIAL_BOOK_TITLE_AR,
        officialUrl: OFFICIAL_PDF_URL,
        failReason: `الملف مرفوض: ${validation.reason}`,
        fileSize: validation.fileSize,
        extractionEnabled: false,
        extractionStarted: false,
        updatedAt: new Date().toISOString(),
      });
      return json(
        {
          ok: false,
          state: "REJECTED",
          failReason: validation.reason,
        },
        400,
      );
    }

    if (fs.existsSync(SOURCE_PDF_PATH)) fs.unlinkSync(SOURCE_PDF_PATH);
    fs.renameSync(assembledPath, SOURCE_PDF_PATH);

    // clear old previews
    if (fs.existsSync(PREVIEW_DIR)) {
      for (const f of fs.readdirSync(PREVIEW_DIR)) {
        if (f.endsWith(".png")) fs.unlinkSync(path.join(PREVIEW_DIR, f));
      }
    }
    renderPreviewPngs(SOURCE_PDF_PATH, PREVIEW_DIR, 3);

    writeImportStatus({
      state: "VERIFIED",
      officialTitle: OFFICIAL_BOOK_TITLE_AR,
      officialUrl: OFFICIAL_PDF_URL,
      localFile: path.relative(process.cwd(), SOURCE_PDF_PATH),
      fileSize: validation.fileSize,
      pageCount: validation.pageCount,
      sha256: validation.sha256,
      firstPageValid: true,
      lastPageValid: true,
      extractionEnabled: true,
      extractionStarted: false,
      updatedAt: new Date().toISOString(),
    });

    // Cleanup chunk parts (keep session meta lightly)
    for (const f of fs.readdirSync(sessionDir(sessionId))) {
      if (f.endsWith(".part")) fs.unlinkSync(path.join(sessionDir(sessionId), f));
    }

    return json({
      ok: true,
      state: "VERIFIED",
      officialTitle: OFFICIAL_BOOK_TITLE_AR,
      localFile: path.relative(process.cwd(), SOURCE_PDF_PATH),
      fileSize: validation.fileSize,
      pageCount: validation.pageCount,
      sha256: validation.sha256,
      firstPageValid: true,
      lastPageValid: true,
      extractionEnabled: true,
      previews: [1, 2, 3]
        .filter((n) => fs.existsSync(path.join(PREVIEW_DIR, `preview-page-${n}.png`)))
        .map((n) => `/api/admin/curriculum-ai/books/import?preview=${n}`),
    });
  }

  // ---- enable extraction button only (do not start) ----
  if (action === "arm-extraction") {
    const status = readImportStatus();
    if (status.state !== "VERIFIED" || !fs.existsSync(SOURCE_PDF_PATH)) {
      return json({ ok: false, error: "NOT_VERIFIED" }, 409);
    }
    // Explicitly do NOT start extraction — only acknowledge arming.
    writeImportStatus({
      ...status,
      extractionEnabled: true,
      extractionStarted: false,
      updatedAt: new Date().toISOString(),
    });
    return json({
      ok: true,
      extractionEnabled: true,
      extractionStarted: false,
      message: "الاستخراج جاهز للبدء يدوياً — لم يبدأ تلقائياً.",
    });
  }

  return json({ ok: false, error: "UNKNOWN_ACTION" }, 400);
}
