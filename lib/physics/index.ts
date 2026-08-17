/**
 * lib/physics/index.ts
 *
 * Physics Scientific Core Engine — barrel export.
 * UI components must import from here (or the specific submodule) rather
 * than re-implementing any calculation locally.
 */

export * from "./dimension-engine.ts";
export * from "./unit-engine.ts";
export * from "./constants-registry.ts";
export * from "./significant-figures.ts";
export * from "./vector-engine.ts";
export * from "./quantity-engine.ts";
export * from "./equation-registry.ts";
export * from "./equation-solver.ts";
export * from "./validation-engine.ts";
export * from "./graph-engine.ts";
export * from "./misconception-engine.ts";
export * from "./knowledge-graph.ts";
export * from "./projectile-motion.ts";
export * from "./simulation-engine.ts";
