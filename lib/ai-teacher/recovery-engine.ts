import type { TeacherId } from "./teacher-identity.ts";
import { QUALITY_DIMENSIONS, type AcceptanceDecision, type QualityDimension } from "./quality-gate.ts";

export interface RecoveryTask {
  order: number;
  dimension: QualityDimension;
  status: "pending" | "blocked";
  reason: string;
}

export function buildRecoveryPlan(teacherId: TeacherId, decision: AcceptanceDecision): { teacherId: TeacherId; status: "complete" | "recovery_required"; tasks: RecoveryTask[] } {
  if (decision.accepted) return { teacherId, status: "complete", tasks: [] };
  const failed = QUALITY_DIMENSIONS.filter((dimension) => decision.failures.some((failure) => failure.startsWith(`${dimension}:`)));
  return {
    teacherId,
    status: "recovery_required",
    tasks: failed.map((dimension, index) => ({
      order: index + 1,
      dimension,
      status: index === 0 ? "pending" : "blocked",
      reason: decision.failures.filter((failure) => failure.startsWith(`${dimension}:`)).join("; "),
    })),
  };
}

