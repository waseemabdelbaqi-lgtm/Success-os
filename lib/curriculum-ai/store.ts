import "server-only";

import fs from "node:fs";
import path from "node:path";
import {
  type BookExtraction,
  validateBookExtraction,
} from "@/lib/curriculum-ai/book-extraction-schema";

export const CURRICULUM_AI_ROOT = path.join(
  process.cwd(),
  "data",
  "curriculum-ai",
);

export const JORDAN_G1_MATH_BOOK_ID = "jordan-g1-s1-math-student";

export function bookDir(bookId = JORDAN_G1_MATH_BOOK_ID): string {
  return path.join(CURRICULUM_AI_ROOT, "jordan", bookId.replace(/^jordan-/, ""));
}

export function readJsonIfExists<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export type AcquisitionRecord = {
  target: {
    country: "Jordan";
    curriculum: "Jordanian National Curriculum";
    grade: "1";
    semester: "1";
    subject: "Mathematics";
    bookType: "Student Book";
  };
  officialTitleAr: string;
  officialSourceUrl: string;
  catalogUrl: string;
  editionHint: string;
  authority: string;
  rightsStatus: string;
  downloadStatus:
    | "blocked"
    | "incomplete_capture_rejected"
    | "downloaded"
    | "pending";
  blockers: string[];
  searchOrderResults: Array<{ source: string; result: string }>;
  localPdfPath: string | null;
  rejectedArtifacts: string[];
  retrievedAt: string;
};

export function loadAcquisition(
  bookId = JORDAN_G1_MATH_BOOK_ID,
): AcquisitionRecord | null {
  return readJsonIfExists<AcquisitionRecord>(
    path.join(bookDir(bookId), "acquisition.json"),
  );
}

export function loadExtraction(
  bookId = JORDAN_G1_MATH_BOOK_ID,
): BookExtraction | null {
  const raw = readJsonIfExists<unknown>(
    path.join(bookDir(bookId), "extraction", "structure.json"),
  );
  if (!raw) return null;
  try {
    return validateBookExtraction(raw);
  } catch {
    return raw as BookExtraction;
  }
}

export function loadPageExtractions(bookId = JORDAN_G1_MATH_BOOK_ID): unknown[] {
  const pagesDir = path.join(bookDir(bookId), "extraction", "pages");
  if (!fs.existsSync(pagesDir)) return [];
  return fs
    .readdirSync(pagesDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) =>
      JSON.parse(fs.readFileSync(path.join(pagesDir, f), "utf8")),
    );
}

export function loadCheckpoint(
  bookId = JORDAN_G1_MATH_BOOK_ID,
): { lastCompletedPage: number; updatedAt: string } | null {
  return readJsonIfExists(
    path.join(bookDir(bookId), "extraction", "checkpoints", "progress.json"),
  );
}

export function saveReviewState(
  bookId: string,
  state: Record<string, unknown>,
): void {
  writeJson(path.join(bookDir(bookId), "review-state.json"), {
    ...state,
    updatedAt: new Date().toISOString(),
  });
}

export function loadReviewState(
  bookId = JORDAN_G1_MATH_BOOK_ID,
): Record<string, unknown> | null {
  return readJsonIfExists(path.join(bookDir(bookId), "review-state.json"));
}

export function listPdfCandidates(bookId = JORDAN_G1_MATH_BOOK_ID): string[] {
  const sourceDir = path.join(bookDir(bookId), "source");
  if (!fs.existsSync(sourceDir)) return [];
  return fs
    .readdirSync(sourceDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf") && !f.startsWith("REJECTED_"))
    .map((f) => path.join(sourceDir, f));
}
