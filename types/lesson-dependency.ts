/**
 * Lesson dependency contract:
 *
 *   Lesson
 *   ↓ depends on
 *   Lesson
 *   ↓ depends on
 *   Lesson
 *
 * Edges are directed: lessonId dependsOn prerequisiteLessonId.
 * Used for sequencing / unlock rules — not a second runtime (ADR-0049).
 */
import type { LocaleText } from "./interactive-lesson-engine";

export type LessonDependencySchema = "success-os.lesson-dependency.v1";

export type LessonDependencyEdge = {
  lessonId: string;
  dependsOn: string;
  /** Why the edge exists */
  kind: "sequence" | "prerequisite" | "skill_bridge";
};

export type LessonDependencyNode = {
  lessonId: string;
  title: LocaleText;
  globalSubjectId?: string;
  dependsOn: string[];
  dependents: string[];
};

/** Linear chain: root → … → tip (each step depends on the previous). */
export type LessonDependencyChain = {
  id: string;
  path: string[];
  /** Human path with "depends on" separators */
  displayPath: string[];
  nodes: LessonDependencyNode[];
  edges: LessonDependencyEdge[];
};

export type LessonDependencyGraph = {
  schema: LessonDependencySchema;
  pathPattern: string[];
  nodes: LessonDependencyNode[];
  edges: LessonDependencyEdge[];
  /** Canonical example chains (longest / reference) */
  chains: LessonDependencyChain[];
  counts: {
    nodes: number;
    edges: number;
    chains: number;
  };
};
