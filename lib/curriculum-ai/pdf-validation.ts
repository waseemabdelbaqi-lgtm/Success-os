import "server-only";

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";

export const OFFICIAL_BOOK_TITLE_AR =
  "الرياضيات — الصف الأول — الفصل الدراسي الأول — كتاب الطالب";

export const OFFICIAL_PDF_URL =
  "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf";

export const OFFICIAL_CATALOG_URL = "https://www.nccd.gov.jo/Ar/Pages/textbooks";

export const BOOK_STORAGE_DIR = path.join(
  process.cwd(),
  "data/curriculum-ai/jordan/grade-01/math/semester-01/student-book",
);

export const SOURCE_PDF_PATH = path.join(BOOK_STORAGE_DIR, "source.pdf");
export const PREVIEW_DIR = path.join(BOOK_STORAGE_DIR, "previews");
export const STATUS_PATH = path.join(BOOK_STORAGE_DIR, "status.json");
export const UPLOAD_SESSIONS_DIR = path.join(BOOK_STORAGE_DIR, "upload-sessions");

export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB
export const MIN_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export type ImportStatus = {
  state: "EMPTY" | "UPLOADING" | "ASSEMBLING" | "VALIDATING" | "VERIFIED" | "REJECTED";
  officialTitle: string;
  officialUrl: string;
  localFile?: string;
  fileSize?: number;
  pageCount?: number;
  sha256?: string;
  firstPageValid?: boolean;
  lastPageValid?: boolean;
  failReason?: string;
  extractionEnabled: boolean;
  extractionStarted: boolean;
  updatedAt: string;
};

export function ensureBookDirs() {
  fs.mkdirSync(BOOK_STORAGE_DIR, { recursive: true });
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_SESSIONS_DIR, { recursive: true });
}

export function readImportStatus(): ImportStatus {
  ensureBookDirs();
  if (!fs.existsSync(STATUS_PATH)) {
    return {
      state: "EMPTY",
      officialTitle: OFFICIAL_BOOK_TITLE_AR,
      officialUrl: OFFICIAL_PDF_URL,
      extractionEnabled: false,
      extractionStarted: false,
      updatedAt: new Date().toISOString(),
    };
  }
  return JSON.parse(fs.readFileSync(STATUS_PATH, "utf8")) as ImportStatus;
}

export function writeImportStatus(status: ImportStatus) {
  ensureBookDirs();
  fs.writeFileSync(
    STATUS_PATH,
    `${JSON.stringify({ ...status, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
}

export async function sha256FileStreaming(filePath: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    const h = createHash("sha256");
    const s = createReadStream(filePath);
    s.on("data", (d) => h.update(d));
    s.on("error", reject);
    s.on("end", () => resolve(h.digest("hex")));
  });
}

export type PdfValidationResult =
  | {
      ok: true;
      localFile: string;
      fileSize: number;
      pageCount: number;
      sha256: string;
      firstPageValid: boolean;
      lastPageValid: boolean;
    }
  | {
      ok: false;
      reason: string;
      localFile: string | null;
      fileSize: number;
    };

export async function validateOfficialPdf(filePath: string): Promise<PdfValidationResult> {
  if (!fs.existsSync(filePath)) {
    return { ok: false, reason: "missing", localFile: null, fileSize: 0 };
  }
  const st = fs.statSync(filePath);
  if (st.size <= MIN_FILE_SIZE) {
    return {
      ok: false,
      reason: `size_too_small:${st.size}`,
      localFile: filePath,
      fileSize: st.size,
    };
  }
  if (st.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      reason: `size_too_large:${st.size}`,
      localFile: filePath,
      fileSize: st.size,
    };
  }

  const fd = fs.openSync(filePath, "r");
  const head = Buffer.alloc(8);
  fs.readSync(fd, head, 0, 8, 0);
  const tail = Buffer.alloc(8192);
  fs.readSync(fd, tail, 0, 8192, Math.max(0, st.size - 8192));
  fs.closeSync(fd);

  if (!head.toString("utf8").startsWith("%PDF")) {
    return { ok: false, reason: "bad_header", localFile: filePath, fileSize: st.size };
  }
  if (!tail.includes(Buffer.from("%%EOF"))) {
    return { ok: false, reason: "missing_eof", localFile: filePath, fileSize: st.size };
  }

  const sha256 = await sha256FileStreaming(filePath);

  const py = `
import fitz, sys
path = sys.argv[1]
doc = fitz.open(path)
n = doc.page_count
if n <= 0:
    raise SystemExit('pageCount_zero')
doc[0].get_pixmap(matrix=fitz.Matrix(0.15, 0.15))
doc[n-1].get_pixmap(matrix=fitz.Matrix(0.15, 0.15))
print(n)
doc.close()
`;
  const r = spawnSync("python3", ["-c", py, filePath], {
    encoding: "utf8",
    timeout: 180000,
  });
  if (r.status !== 0) {
    return {
      ok: false,
      reason: `page_open_failed:${(r.stderr || r.stdout || "").slice(0, 180)}`,
      localFile: filePath,
      fileSize: st.size,
    };
  }
  const pageCount = Number((r.stdout || "").trim());
  if (!Number.isFinite(pageCount) || pageCount <= 0) {
    return {
      ok: false,
      reason: "pageCount_zero",
      localFile: filePath,
      fileSize: st.size,
    };
  }

  return {
    ok: true,
    localFile: filePath,
    fileSize: st.size,
    pageCount,
    sha256,
    firstPageValid: true,
    lastPageValid: true,
  };
}

export function renderPreviewPngs(pdfPath: string, outDir: string, count = 3): string[] {
  fs.mkdirSync(outDir, { recursive: true });
  const py = `
import fitz, sys, os
pdf, out, count = sys.argv[1], sys.argv[2], int(sys.argv[3])
doc = fitz.open(pdf)
paths = []
for i in range(min(count, doc.page_count)):
    pix = doc[i].get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
    p = os.path.join(out, f'preview-page-{i+1}.png')
    pix.save(p)
    paths.append(p)
print('\\n'.join(paths))
doc.close()
`;
  const r = spawnSync("python3", ["-c", py, pdfPath, outDir, String(count)], {
    encoding: "utf8",
    timeout: 180000,
  });
  if (r.status !== 0) return [];
  return (r.stdout || "")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((p) => path.resolve(p));
}

export async function streamRequestToFile(
  request: Request,
  destPath: string,
  maxBytes: number,
): Promise<number> {
  if (!request.body) throw new Error("EMPTY_BODY");
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const reader = request.body.getReader();
  const ws = createWriteStream(destPath);
  let written = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const buf = Buffer.from(value);
      written += buf.length;
      if (written > maxBytes) throw new Error("CHUNK_TOO_LARGE");
      if (!ws.write(buf)) {
        await new Promise<void>((resolve) => ws.once("drain", () => resolve()));
      }
    }
    await new Promise<void>((resolve, reject) => {
      ws.end(() => resolve());
      ws.on("error", reject);
    });
  } catch (err) {
    ws.destroy();
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
    throw err;
  }
  return written;
}

export async function assembleChunks(
  sessionDir: string,
  totalChunks: number,
  outPath: string,
): Promise<number> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const tmp = `${outPath}.assembling`;
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  const out = createWriteStream(tmp);
  let total = 0;
  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(sessionDir, `chunk-${String(i).padStart(6, "0")}.part`);
    if (!fs.existsSync(chunkPath)) {
      out.destroy();
      throw new Error(`MISSING_CHUNK_${i}`);
    }
    await new Promise<void>((resolve, reject) => {
      const rs = createReadStream(chunkPath);
      rs.on("data", (d) => {
        total += d.length;
        if (!out.write(d)) {
          rs.pause();
          out.once("drain", () => rs.resume());
        }
      });
      rs.on("error", reject);
      rs.on("end", () => resolve());
    });
  }
  await new Promise<void>((resolve, reject) => {
    out.end(() => resolve());
    out.on("error", reject);
  });
  fs.renameSync(tmp, outPath);
  return total;
}
