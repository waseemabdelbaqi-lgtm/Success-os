/**
 * Unified curriculum content schema (Country → … → Version).
 * Used as the canonical shape for ingestion + publishing.
 */
export const CONTENT_SCHEMA = {
  Country: ["code", "name_en", "name_ar"],
  Curriculum: ["id", "country_code", "name"],
  Grade: ["code", "name", "stage"],
  Semester: ["name"],
  Subject: ["name", "language"],
  Book: [
    "id",
    "title",
    "book_type",
    "edition",
    "official_url",
    "rights_status",
    "status",
    "sha256",
    "storage_key",
  ],
  Unit: ["id", "book_id", "title", "start_page", "end_page", "sort_order"],
  Lesson: ["id", "unit_id", "title", "objectives", "concepts", "status"],
  Objective: ["id", "text"],
  Concept: ["id", "text"],
  Explanation: ["title", "body"],
  Example: ["prompt", "steps", "answer"],
  Activity: ["id", "type", "title", "payload"],
  Question: ["id", "type", "prompt", "answer", "hints", "feedback"],
  Assessment: ["quiz", "score"],
  Media: ["svg", "webgl", "audio", "images"],
  SourceReference: ["bookId", "pages", "rights", "note"],
  RightsStatus: [
    "PUBLIC_DOMAIN",
    "OPEN_LICENSE",
    "OFFICIAL_REFERENCE_ONLY",
    "RIGHTS_RESTRICTED",
    "UNKNOWN",
  ],
  ReviewStatus: ["REVIEW_REQUIRED", "APPROVED", "REJECTED"],
  Version: ["semver", "created_at"],
};
