/**
 * Gate 4 Curriculum Production Factory — status machine & types.
 * Country-agnostic; policies live in profiles.
 */

export const FACTORY_STATUSES = [
  "NOT_READY",
  "QUEUED",
  "DISCOVERING",
  "VERIFYING_SOURCE",
  "VERIFYING_EDITION",
  "RIGHTS_REVIEW",
  "BLOCKED_BY_SOURCE",
  "BLOCKED_BY_RIGHTS",
  "READY_TO_IMPORT",
  "IMPORTING",
  "OCR_PROCESSING",
  "STRUCTURING",
  "PAGE_MAPPING",
  "CONTENT_DRAFTING",
  "BUILDING_VISUALS",
  "BUILDING_ACTIVITIES",
  "BUILDING_ANSWERS",
  "AUTOMATED_VALIDATION",
  "SUBJECT_REVIEW",
  "LANGUAGE_REVIEW",
  "TECHNICAL_REVIEW",
  "CORRECTIONS_REQUIRED",
  "FINAL_APPROVAL",
  "PUBLISHING",
  "PUBLISHED",
  "COMPLETE",
  "FAILED",
  "RETRYING",
  "ARCHIVED",
  "REPLACED",
] as const;

export type FactoryStatus = (typeof FACTORY_STATUSES)[number];

export const IMPORT_FORMATS = [
  "pdf",
  "docx",
  "html",
  "json",
  "xml",
  "epub",
  "image",
  "scanned",
  "structured",
] as const;

export type ImportFormat = (typeof IMPORT_FORMATS)[number];

/** Grade processing order for Jordan default profile (configurable elsewhere). */
export const DEFAULT_GRADE_ORDER = [
  "kg1",
  "kg2",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "11-academic",
  "12",
  "12-academic",
] as const;

export function gradePriority(gradeCode: string): number {
  const i = DEFAULT_GRADE_ORDER.indexOf(gradeCode as (typeof DEFAULT_GRADE_ORDER)[number]);
  return i >= 0 ? i + 1 : 200;
}
