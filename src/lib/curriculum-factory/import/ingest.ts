import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import type { ImportFormat } from "@/src/lib/curriculum-factory/types";
import { createHash } from "crypto";

/**
 * Official source ingestion gate.
 * Downloads ONLY when rights_outcome permits. Never publishes raw imports.
 */
export function registerImportArtifact(input: {
  jobId: string;
  countryId: string;
  sourceUrl?: string;
  format: ImportFormat;
  rightsOutcome: string;
  contentHint?: string;
  pageCount?: number;
}): { artifactId: string; allowed: boolean; reason: string } {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();

  const permitted = [
    "authorized_full_reuse",
    "authorized_display",
    "authorized_adaptation",
    "original_companion_required", // structured companion path — no official file download
  ].includes(input.rightsOutcome);

  if (!permitted) {
    return {
      artifactId: "",
      allowed: false,
      reason: `Import blocked by rights outcome: ${input.rightsOutcome}`,
    };
  }

  // Companion path: register structured metadata only (no official PDF download)
  if (input.rightsOutcome === "original_companion_required") {
    const id = uuid();
    const checksum = createHash("sha256")
      .update(`companion:${input.jobId}:${input.sourceUrl || ""}`)
      .digest("hex");
    const dup = db.prepare("SELECT id FROM import_artifacts WHERE checksum_sha256=?").get(checksum) as
      | { id: string }
      | undefined;
    db.prepare(
      `INSERT INTO import_artifacts (
        id, job_id, country_id, source_url, format, checksum_sha256, byte_size, page_count,
        language_detected, direction_detected, rights_outcome, duplicate_of, metadata_json, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      input.jobId,
      input.countryId,
      input.sourceUrl || null,
      "structured",
      checksum,
      0,
      input.pageCount || 0,
      "ar",
      "rtl",
      input.rightsOutcome,
      dup?.id || null,
      JSON.stringify({ mode: "original_companion", hint: input.contentHint || null }),
      t,
      t,
    );
    return { artifactId: id, allowed: true, reason: "Structured companion import registered (no official PDF)" };
  }

  // Authorized download path — stub: record intent; real download requires network + rights clearance
  const id = uuid();
  const checksum = createHash("sha256")
    .update(`source:${input.sourceUrl || input.jobId}`)
    .digest("hex");
  db.prepare(
    `INSERT INTO import_artifacts (
      id, job_id, country_id, source_url, format, checksum_sha256, byte_size, page_count,
      language_detected, direction_detected, rights_outcome, metadata_json, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    input.jobId,
    input.countryId,
    input.sourceUrl || null,
    input.format,
    checksum,
    0,
    input.pageCount || null,
    null,
    null,
    input.rightsOutcome,
    JSON.stringify({ downloadStatus: "pending_authorized_fetch", formatsSupported: true }),
    t,
    t,
  );
  return { artifactId: id, allowed: true, reason: "Authorized import artifact registered" };
}

export function supportedImportFormats(): string[] {
  return ["pdf", "docx", "html", "json", "xml", "epub", "image", "scanned", "structured"];
}
