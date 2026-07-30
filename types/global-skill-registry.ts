/**
 * Global Skill Registry — country-agnostic skill identity (SKL-XXXXX).
 * Lessons reference these ids via metadata.skills.
 *
 * Math pathway example:
 *   Fractions → Decimals → Percentages → Algebra → Functions
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
  /** Prerequisite skill ids — Skill → depends on → Skill */
  dependsOn: string[];
  family: "math" | "physics" | "chemistry" | "biology" | "language" | "thinking" | "other";
  order: number;
  active: boolean;
};

export type SkillDependencyEdge = {
  skillId: string;
  dependsOn: string;
  kind: "pathway" | "prerequisite";
};

export type SkillDependencyChain = {
  id: string;
  /** Unlock order: root → tip */
  path: string[];
  /** Reading order: tip → depends on → … → root */
  displayPath: string[];
  labels: string[];
  edges: SkillDependencyEdge[];
};

export type GlobalSkillRegistrySnapshot = {
  schema: GlobalSkillRegistrySchema;
  skills: GlobalSkillRecord[];
  pathPattern: string[];
  /** Canonical Math pathway: Fractions → Decimals → Percentages → Algebra → Functions */
  mathPathway: SkillDependencyChain;
  /** Canonical pathways (includes mathPathway) */
  pathways: SkillDependencyChain[];
  counts: {
    skills: number;
    active: number;
    byFamily: Record<string, number>;
    pathwayEdges: number;
  };
};
