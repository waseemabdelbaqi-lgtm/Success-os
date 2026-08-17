import type { TeacherId } from "./teacher-identity.ts";

export const QUALITY_DIMENSIONS = ["photorealism", "lipsync", "animation", "teaching", "showcase"] as const;
export type QualityDimension = (typeof QUALITY_DIMENSIONS)[number];

export interface QualityEvidence {
  score: number;
  evidenceUrl?: string;
  verifiedAt?: string;
  durationSeconds?: number;
}

export type TeacherQualityEvidence = Partial<Record<QualityDimension, QualityEvidence>>;

export interface AcceptanceDecision {
  teacherId: TeacherId;
  accepted: boolean;
  status: "ACCEPTED" | "REJECTED";
  failures: string[];
  scores: Partial<Record<QualityDimension, number>>;
}

const MINIMUM_SCORE = 95;
const MINIMUM_SHOWCASE_SECONDS = 15;

export function evaluateFinalAcceptance(teacherId: TeacherId, evidence: TeacherQualityEvidence): AcceptanceDecision {
  const failures: string[] = [];
  const scores: Partial<Record<QualityDimension, number>> = {};

  for (const dimension of QUALITY_DIMENSIONS) {
    const item = evidence[dimension];
    if (!item) {
      failures.push(`${dimension}: missing verified evidence`);
      continue;
    }
    scores[dimension] = item.score;
    if (!Number.isFinite(item.score) || item.score < MINIMUM_SCORE || item.score > 100) {
      failures.push(`${dimension}: score must be between ${MINIMUM_SCORE} and 100`);
    }
    if (!item.evidenceUrl || !item.verifiedAt) {
      failures.push(`${dimension}: evidence URL and verification timestamp are required`);
    }
    if (dimension === "showcase" && (item.durationSeconds ?? 0) < MINIMUM_SHOWCASE_SECONDS) {
      failures.push(`showcase: must be at least ${MINIMUM_SHOWCASE_SECONDS} seconds`);
    }
  }

  return { teacherId, accepted: failures.length === 0, status: failures.length === 0 ? "ACCEPTED" : "REJECTED", failures, scores };
}

function parseEvidence(prefix: "SARA" | "ALI"): TeacherQualityEvidence {
  const evidence: TeacherQualityEvidence = {};
  for (const dimension of QUALITY_DIMENSIONS) {
    const stem = `AI_TEACHER_${prefix}_${dimension.toUpperCase()}`;
    const rawScore = process.env[`${stem}_SCORE`];
    if (!rawScore) continue;
    evidence[dimension] = {
      score: Number(rawScore),
      evidenceUrl: process.env[`${stem}_EVIDENCE_URL`],
      verifiedAt: process.env[`${stem}_VERIFIED_AT`],
      durationSeconds: dimension === "showcase" ? Number(process.env[`${stem}_DURATION_SECONDS`] ?? 0) : undefined,
    };
  }
  return evidence;
}

export function evaluateConfiguredAcceptance(teacherId: TeacherId): AcceptanceDecision {
  return evaluateFinalAcceptance(teacherId, parseEvidence(teacherId === "sara" ? "SARA" : "ALI"));
}

export function requireProductionAcceptance(teacherId: TeacherId): AcceptanceDecision {
  const decision = evaluateConfiguredAcceptance(teacherId);
  if (!decision.accepted) {
    throw new Error(`AI Teacher acceptance gate: ${teacherId} is REJECTED. ${decision.failures.join(" | ")}`);
  }
  return decision;
}
