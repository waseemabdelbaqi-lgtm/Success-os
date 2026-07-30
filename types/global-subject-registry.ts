/**
 * Global Subject Registry — country-agnostic subject identity.
 *
 * Local labels differ by country/language; the global id stays the same:
 *
 *   Jordan → الرياضيات → SUB-00001
 *   USA    → Mathematics → SUB-00001
 *   Egypt  → الرياضيات → SUB-00001
 *
 * Hierarchical curriculum IDs (e.g. JO-NATIONAL-G01-MATH) also map to SUB-XXXXX.
 */
import type { LocaleText } from "./interactive-lesson-engine";

export type GlobalSubjectRegistrySchema = "success-os.global-subject-registry.v1";

export type GlobalSubjectRecord = {
  /** Stable global id, e.g. SUB-00001 */
  id: string;
  /** Short code used in hierarchical paths, e.g. MATH */
  code: string;
  name: LocaleText;
  /** STEM / language / humanities / … */
  family: "stem" | "language" | "humanities" | "religious" | "arts" | "other";
  order: number;
  active: boolean;
};

/**
 * Country-local subject label → Global Subject Registry id.
 * Same SUB-XXXXX across countries; labels are localization only.
 */
export type CountrySubjectAlias = {
  countryId: string;
  countryName: LocaleText;
  /** Local display label as used in that country (ar/en/etc.) */
  localLabel: string;
  language: "ar" | "en" | "bilingual";
  globalSubjectId: string;
  /** Optional hierarchical curriculum subject id when known */
  hierarchicalSubjectId?: string;
};

export type GlobalSubjectResolveResult = {
  countryId: string;
  localLabel: string;
  globalSubjectId: string;
  subject: GlobalSubjectRecord | null;
  path: string[];
};

export type GlobalSubjectRegistrySnapshot = {
  schema: GlobalSubjectRegistrySchema;
  subjects: GlobalSubjectRecord[];
  countryAliases: CountrySubjectAlias[];
  /** Canonical cross-country examples for docs/UI */
  crossCountryExamples: GlobalSubjectResolveResult[];
  counts: {
    subjects: number;
    active: number;
    stem: number;
    countryAliases: number;
  };
};
