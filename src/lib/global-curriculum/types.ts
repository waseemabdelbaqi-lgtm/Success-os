/**
 * Global curriculum core — country-agnostic types.
 * Core code uses canonical keys; country profiles supply labels.
 */

export type CountryStatus = "inactive" | "onboarding" | "active" | "archived";

export type MatrixStatus =
  | "NOT_DISCOVERED"
  | "DISCOVERED"
  | "SOURCE_VERIFIED"
  | "RIGHTS_REVIEW"
  | "ELIGIBLE_FOR_PRODUCTION"
  | "QUEUED"
  | "STRUCTURING"
  | "CONTENT_PRODUCTION"
  | "SUBJECT_REVIEW"
  | "LANGUAGE_REVIEW"
  | "TECHNICAL_REVIEW"
  | "PUBLISHED"
  | "COMPLETE"
  | "BLOCKED"
  | "REPLACED"
  | "ARCHIVED"
  | "STRUCTURED"
  | "CONTENT_COMPLETE";

export type RightsOutcome =
  | "authorized_full_reuse"
  | "authorized_display"
  | "authorized_adaptation"
  | "link_only"
  | "original_companion_required"
  | "rights_review_required"
  | "restricted"
  | "unavailable";

export type CanonicalTermKey =
  | "grade"
  | "term"
  | "subject"
  | "pathway"
  | "textbook"
  | "national_exam"
  | "kindergarten"
  | "stage"
  | "student_book"
  | "teacher_guide"
  | "activity_book";

export type BookTypeKey =
  | "student"
  | "activity"
  | "workbook"
  | "exercise"
  | "teacher_guide"
  | "support"
  | "sos_companion"
  | "sos_answer_bank"
  | "sos_practice";

export interface CountryProfile {
  id: string;
  isoCode: string;
  nameAr: string;
  nameEn: string;
  nameNative?: string;
  region?: string;
  subregion?: string;
  flagEmoji?: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  currencyCode?: string;
  timezone?: string;
  status: CountryStatus;
  studentVisible: boolean;
}

export interface TerminologyMap {
  [canonicalKey: string]: {
    labelAr?: string;
    labelEn: string;
    labelNative?: string;
    singular?: string;
    plural?: string;
    direction: "rtl" | "ltr";
  };
}

export interface CurriculumProfile {
  id: string;
  countryId: string;
  code: string;
  nameAr?: string;
  nameEn: string;
  ownership: "public" | "private" | "international";
  scope: "national" | "regional" | "state" | "province";
  supportedLanguages: string[];
  status: string;
  officialSourceUrl?: string;
}
