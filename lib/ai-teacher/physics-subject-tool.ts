/**
 * physics-subject-tool.ts
 *
 * Registers "physics" with the Subject Tool Router. This file is the only
 * place the AI Teacher runtime touches the Physics Scientific Core Engine
 * — it calls the engine's existing, already-tested functions and returns
 * their verified output as-is. It performs NO physics calculation of its
 * own and does not duplicate anything from lib/physics.
 */

import { summarize, type ProjectileParams, detectProjectileMisconception, type MisconceptionDetectionInput } from "../physics/index.ts";
import { registerSubjectTool, type SubjectTool, type SubjectToolResult } from "./subject-tool-router.ts";

function solveProjectile(params: Record<string, unknown>): SubjectToolResult {
  const projectileParams: ProjectileParams = {
    speed: Number(params.speed),
    angleDegrees: Number(params.angleDegrees),
    initialHeight: params.initialHeight !== undefined ? Number(params.initialHeight) : undefined,
    gravity: params.gravity !== undefined ? Number(params.gravity) : undefined,
  };
  const summary = summarize(projectileParams); // delegates entirely to the Physics Engine
  return {
    action: "solveProjectile",
    data: { params: projectileParams, summary },
    evidence: ["horizontal-velocity-component", "vertical-velocity-component", "time-of-flight-level", "max-height", "range-level"],
  };
}

function checkMisconception(params: Record<string, unknown>): SubjectToolResult {
  const input = params as MisconceptionDetectionInput;
  const misconception = detectProjectileMisconception(input); // delegates entirely to the Physics Engine
  return {
    action: "checkMisconception",
    data: misconception,
    evidence: misconception ? [misconception.id] : [],
  };
}

const physicsTool: SubjectTool = {
  subject: "physics",
  actions: ["solveProjectile", "checkMisconception"],
  call(action, params) {
    switch (action) {
      case "solveProjectile":
        return solveProjectile(params);
      case "checkMisconception":
        return checkMisconception(params);
      default:
        throw new Error(`Physics subject tool error: unknown action "${action}".`);
    }
  },
};

export function registerPhysicsSubjectTool(): void {
  registerSubjectTool(physicsTool);
}

export { physicsTool };
