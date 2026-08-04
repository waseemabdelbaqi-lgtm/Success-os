/**
 * Build Final Acceptance runtime scores from honest quality metrics + showcase asset.
 * Never invent a 15s showcase — file must exist under public media.
 */
import fs from "node:fs";
import path from "node:path";
import type { HumanTeacherMetrics } from "./quality-gate";

export type FinalAcceptanceRuntime = {
  realismScore: number;
  teachingScore: number;
  animationScore: number;
  lipSyncScore: number;
  interactionScore: number;
  has15SecondShowcase: boolean;
  showcasePath: string | null;
};

/** Mandatory filmed showcase — owner Demo evidence. */
export function resolveShowcasePath(teacher: "sara" | "ali"): string | null {
  const candidates = [
    path.join(
      process.cwd(),
      "public/media/ai-teachers",
      teacher,
      "showcase-15s.mp4",
    ),
    path.join(
      process.cwd(),
      "public/media/ai-teachers",
      teacher,
      "showcase",
      "15s.mp4",
    ),
    path.join(
      process.cwd(),
      "content/media/ai-teachers",
      teacher,
      "showcase-15s.mp4",
    ),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).size > 50_000) return p;
    } catch {
      // ignore
    }
  }
  return null;
}

export function hasMandatory15SecondShowcase(teacher: "sara" | "ali"): boolean {
  return resolveShowcasePath(teacher) !== null;
}

export function buildAcceptanceRuntime(
  metrics: HumanTeacherMetrics,
): FinalAcceptanceRuntime {
  const animationScore = Math.round(
    ((metrics.bodyMovementScore +
      metrics.gestureScore +
      metrics.faceExpressionScore +
      metrics.eyeContactScore) /
      4) *
      10,
  ) / 10;

  const showcasePath = resolveShowcasePath(metrics.teacher);

  return {
    realismScore: metrics.realismScore,
    teachingScore: metrics.teachingScore,
    animationScore,
    lipSyncScore: metrics.lipSyncScore,
    interactionScore: metrics.adaptationScore,
    has15SecondShowcase: Boolean(showcasePath),
    showcasePath,
  };
}
