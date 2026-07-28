/**
 * Gate 5 — Final Jordan completion audit types & gap codes.
 */

export const GAP_CODES = [
  "OFFICIAL_SOURCE_NOT_FOUND",
  "SOURCE_UNAVAILABLE",
  "EDITION_UNCERTAIN",
  "RIGHTS_REVIEW_REQUIRED",
  "RIGHTS_RESTRICTED",
  "IMPORT_FAILED",
  "OCR_CORRECTION_REQUIRED",
  "STRUCTURE_INCOMPLETE",
  "CONTENT_INCOMPLETE",
  "VISUALS_INCOMPLETE",
  "ACTIVITIES_INCOMPLETE",
  "ANSWERS_INCOMPLETE",
  "SUBJECT_REVIEW_PENDING",
  "LANGUAGE_REVIEW_PENDING",
  "TECHNICAL_REVIEW_PENDING",
  "ACCESSIBILITY_FAILURE",
  "SECURITY_FAILURE",
  "PERFORMANCE_FAILURE",
  "PUBLICATION_FAILURE",
  "ROUTE_FAILURE",
  "NOT_APPLICABLE",
  "REPLACED_BY_NEW_EDITION",
] as const;

export type GapCode = (typeof GAP_CODES)[number];

export type GapRecord = {
  country: string;
  curriculum: string;
  stage: string;
  grade: string;
  semester: string;
  pathway: string;
  subject: string;
  bookType: string;
  edition: string;
  gapCode: GapCode;
  issue: string;
  evidence: string;
  requiredAction: string;
  responsibleRole: string;
  priority: "P0" | "P1" | "P2" | "P3";
  otherWorkMayContinue: boolean;
  inventoryCellId?: string;
  factoryJobId?: string;
  bookId?: string;
};

export type Gate5Readiness = {
  jordanContentComplete: boolean;
  jordanAuditedWithBlockers: boolean;
  jordanOperationallyComplete: boolean;
  globalEngineReady: boolean;
  readyForNextCountry: boolean;
  verdict: "READY_FOR_NEXT_COUNTRY" | "NOT_READY_FOR_THE_NEXT_COUNTRY";
};
