/**
 * Global Skill Registry — country-agnostic skill identity (SKL-XXXXX).
 * Lessons reference these ids via metadata.skills.
 */
import type { LocaleText } from "./interactive-lesson-engine";

export type GlobalSkillRegistrySchema = "success-os.global-skill-registry.v1";

export type GlobalSkillRecord = {
  /** Stable global id, e.g. SKL-00001 */
  id: string;
  /** Short code, e.g. ARITHMETIC */
  code: string;
  name: LocaleText;
  /** Optional primary subject family link(s), e.g. SUB-00001 */
  subjectIds: string[];
  family: "math" | "physics" | "chemistry" | "biology" | "language" | "thinking" | "other";
  order: number;
  active: boolean;
};

export type GlobalSkillRegistrySnapshot = {
  schema: GlobalSkillRegistrySchema;
  skills: GlobalSkillRecord[];
  counts: {
    skills: number;
    active: number;
    byFamily: Record<string, number>;
  };
};
