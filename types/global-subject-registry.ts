/**
 * Global Subject Registry — country-agnostic subject identity.
 * Hierarchical curriculum IDs (e.g. JO-NATIONAL-G01-MATH) map to these SUB-XXXXX codes.
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

export type GlobalSubjectRegistrySnapshot = {
  schema: GlobalSubjectRegistrySchema;
  subjects: GlobalSubjectRecord[];
  counts: {
    subjects: number;
    active: number;
    stem: number;
  };
};
