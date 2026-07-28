import "server-only";

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const OFFICIAL_BOOK_TITLE_AR =
  "الرياضيات — الصف الأول — الفصل الدراسي الأول — كتاب الطالب";

export const OFFICIAL_PDF_URL =
  "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf";

export const OFFICIAL_CATALOG_URL = "https://www.nccd.gov.jo/Ar/Pages/textbooks";

const MIN_BYTES = 20 * 1024 * 1024;

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

export function validateOfficialPdf(filePath: string): PdfValidationResult {
  if (!fs.existsSync(filePath)) {
    return { ok: false, reason: "missing", localFile: null, fileSize: 0 };
  }
  const st = fs.statSync(filePath);
  if (st.size <= MIN_BYTES) {
    return {
      ok: false,
      reason: `size_too_small:${st.size}`,
      localFile: filePath,
      fileSize: st.size,
    };
  }

  const fd = fs.openSync(filePath, "r");
  const head = Buffer.alloc(8);
  fs.readSync(fd, head, 0, 8, 0);
  const tail = Buffer.alloc(4096);
  fs.readSync(fd, tail, 0, 4096, Math.max(0, st.size - 4096));
  fs.closeSync(fd);

  if (!head.toString("utf8").startsWith("%PDF")) {
    return {
      ok: false,
      reason: "bad_header",
      localFile: filePath,
      fileSize: st.size,
    };
  }
  if (!tail.includes(Buffer.from("%%EOF"))) {
    return {
      ok: false,
      reason: "missing_eof",
      localFile: filePath,
      fileSize: st.size,
    };
  }

  const sha256 = createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

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
    timeout: 120000,
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

export function renderPreviewPngs(
  pdfPath: string,
  outDir: string,
  pages = [0, 1, 2],
): string[] {
  fs.mkdirSync(outDir, { recursive: true });
  const py = `
import fitz, sys, os
pdf, out, count = sys.argv[1], sys.argv[2], int(sys.argv[3])
doc = fitz.open(pdf)
paths = []
for i in range(min(count, doc.page_count)):
    pix = doc[i].get_pixmap(matrix=fitz.Matrix(1.2, 1.2), alpha=False)
    p = os.path.join(out, f'preview-page-{i+1}.png')
    pix.save(p)
    paths.append(p)
print('\\n'.join(paths))
doc.close()
`;
  const r = spawnSync(
    "python3",
    ["-c", py, pdfPath, outDir, String(pages.length)],
    { encoding: "utf8", timeout: 120000 },
  );
  if (r.status !== 0) return [];
  return (r.stdout || "")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((p) => path.resolve(p));
}
