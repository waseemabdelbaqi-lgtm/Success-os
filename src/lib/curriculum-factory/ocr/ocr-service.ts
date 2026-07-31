import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";

export type OcrFlag =
  | "garbled_arabic"
  | "reversed_word_order"
  | "missing_diacritics"
  | "incorrect_punctuation"
  | "broken_formula"
  | "broken_fraction"
  | "broken_superscript"
  | "reversed_numbers"
  | "missing_table"
  | "corrupted_table"
  | "missing_image"
  | "low_confidence"
  | "repeated_page"
  | "missing_page"
  | "unrecognized_characters"
  | "mixed_edition";

/**
 * OCR interface — Arabic/English aware.
 * Method: heuristic confidence model + flagging (pluggable provider later).
 * Low confidence → manual review. Never auto-publishes OCR text.
 */
export function runOcrOnArtifact(
  artifactId: string,
  pages: Array<{ pageNumber: number; sampleText?: string; confidence?: number }>,
): { pagesProcessed: number; needsManualReview: number; method: string } {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();
  let needsManualReview = 0;

  for (const p of pages) {
    const confidence = typeof p.confidence === "number" ? p.confidence : estimateConfidence(p.sampleText || "");
    const flags: OcrFlag[] = [];
    if (confidence < 0.75) flags.push("low_confidence");
    if (p.sampleText && /[^\u0600-\u06FFa-zA-Z0-9\s\.,;:!?؟،\-()%/]/.test(p.sampleText) && confidence < 0.85) {
      flags.push("unrecognized_characters");
    }
    if (p.sampleText && /\d\s+\d\s+\d/.test(p.sampleText) && /[٠-٩]/.test(p.sampleText)) {
      // mixed numeral systems — not always error, but flag for review in formulas context
    }
    if (confidence < 0.8) needsManualReview += 1;

    db.prepare(
      `INSERT INTO ocr_page_results (id, import_artifact_id, page_number, text_extract, confidence, flags_json, needs_manual_review, created_at)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(import_artifact_id, page_number) DO UPDATE SET
         text_extract=excluded.text_extract,
         confidence=excluded.confidence,
         flags_json=excluded.flags_json,
         needs_manual_review=excluded.needs_manual_review`,
    ).run(
      uuid(),
      artifactId,
      p.pageNumber,
      p.sampleText || null,
      confidence,
      JSON.stringify(flags),
      confidence < 0.8 ? 1 : 0,
      t,
    );
  }

  return {
    pagesProcessed: pages.length,
    needsManualReview,
    method: "heuristic-arabic-english-v1 (pluggable; no auto-publish)",
  };
}

function estimateConfidence(text: string): number {
  if (!text.trim()) return 0.2;
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  const weird = (text.match(/[�□◊¤]/g) || []).length;
  if (weird > 0) return 0.35;
  if (arabic + latin < 10) return 0.55;
  return Math.min(0.95, 0.7 + Math.min(arabic, latin, 20) / 100);
}

export function getOcrMethodDescription(): string {
  return "OCR interface: heuristic Arabic/English confidence + review flags; provider-pluggable; low-confidence pages require manual review; raw OCR never published.";
}
