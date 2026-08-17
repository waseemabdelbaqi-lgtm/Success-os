/**
 * knowledge-graph.ts
 *
 * Every student-facing "related concept / equation / misconception" link
 * must resolve to a real object registered elsewhere in the engine. This
 * file is the lookup table that proves that link is real rather than a
 * decorative href.
 */

import { getEquation } from "./equation-registry.ts";
import { getMisconception } from "./misconception-engine.ts";

export interface ConceptNode {
  id: string;
  name: string;
  prerequisiteConceptIds: string[];
  equationIds: string[];
  misconceptionIds: string[];
  nextConceptIds: string[];
}

export const CONCEPTS: Record<string, ConceptNode> = {
  "vector-components": {
    id: "vector-components",
    name: "Resolving a vector into components",
    prerequisiteConceptIds: [],
    equationIds: ["horizontal-velocity-component", "vertical-velocity-component"],
    misconceptionIds: ["using-total-speed-instead-of-component"],
    nextConceptIds: ["projectile-motion"],
  },
  "projectile-motion": {
    id: "projectile-motion",
    name: "Projectile motion",
    prerequisiteConceptIds: ["vector-components"],
    equationIds: ["horizontal-position", "vertical-position", "vertical-velocity", "time-of-flight-level", "max-height", "range-level"],
    misconceptionIds: [
      "horizontal-velocity-decreases-during-fall",
      "acceleration-zero-at-peak",
      "total-velocity-zero-at-peak",
      "using-different-times-for-each-direction",
      "ignoring-sign-convention",
      "mixing-incompatible-units",
      "confusing-path-length-with-displacement",
    ],
    nextConceptIds: ["forces-and-trajectories"],
  },
  "forces-and-trajectories": {
    id: "forces-and-trajectories",
    name: "Forces and trajectories",
    prerequisiteConceptIds: ["projectile-motion"],
    equationIds: [],
    misconceptionIds: [],
    nextConceptIds: [],
  },
};

export function getConcept(id: string): ConceptNode {
  const c = CONCEPTS[id];
  if (!c) throw new Error(`Knowledge graph error: unknown concept id "${id}".`);
  return c;
}

/** Verifies every relationship on a concept resolves to a real registered object. Throws on the first dangling link. */
export function verifyConceptLinksResolve(id: string): true {
  const concept = getConcept(id);
  concept.equationIds.forEach(getEquation);
  concept.misconceptionIds.forEach(getMisconception);
  concept.prerequisiteConceptIds.forEach(getConcept);
  concept.nextConceptIds.forEach(getConcept);
  return true;
}
