/** Rights policy for curriculum sources. */
export const RIGHTS = {
  PUBLIC_DOMAIN: "PUBLIC_DOMAIN",
  OPEN_LICENSE: "OPEN_LICENSE",
  OFFICIAL_REFERENCE_ONLY: "OFFICIAL_REFERENCE_ONLY",
  RIGHTS_RESTRICTED: "RIGHTS_RESTRICTED",
  UNKNOWN: "UNKNOWN",
};

export const BOOK_STATUS = {
  DISCOVERED: "DISCOVERED",
  QUEUED: "QUEUED",
  DOWNLOADING: "DOWNLOADING",
  VERIFIED: "VERIFIED",
  EXTRACTING: "EXTRACTING",
  STRUCTURED: "STRUCTURED",
  AI_DRAFT: "AI_DRAFT",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  SOURCE_ACCESS_BLOCKED: "SOURCE_ACCESS_BLOCKED",
  RIGHTS_RESTRICTED: "RIGHTS_RESTRICTED",
  FAILED: "FAILED",
};

export function canStoreFullPdf(rights) {
  return rights === RIGHTS.PUBLIC_DOMAIN || rights === RIGHTS.OPEN_LICENSE;
}

export function canPublishOriginalContent(rights) {
  return (
    rights === RIGHTS.PUBLIC_DOMAIN ||
    rights === RIGHTS.OPEN_LICENSE ||
    rights === RIGHTS.OFFICIAL_REFERENCE_ONLY
  );
}

export function canRepublishSourceTextOrImages(rights) {
  return rights === RIGHTS.PUBLIC_DOMAIN || rights === RIGHTS.OPEN_LICENSE;
}

export function assertPublishGate({ rights, reviewStatus }) {
  if (rights === RIGHTS.UNKNOWN || rights === RIGHTS.RIGHTS_RESTRICTED) {
    throw new Error("RIGHTS_GATE_BLOCKED");
  }
  if (reviewStatus !== "APPROVED") throw new Error("REVIEW_REQUIRED");
}
