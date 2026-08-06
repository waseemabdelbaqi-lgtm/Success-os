// src/lib/ai-teachers/photorealism-engine.ts

import fs from "node:fs";
import path from "node:path";
import {
  updateTeacherScore,
  type QualityEvidence,
} from "./recovery-engine";

export type TeacherId = "sara" | "ali";

export interface PhotorealismMetrics {
  facialAnatomy: number;
  skinRealism: number;
  eyeRealism: number;
  hairRealism: number;
  lightingRealism: number;
  materialRealism: number;
  identityConsistency: number;
  artifactFreedom: number;
}

export interface PhotorealismInspection {
  teacherId: TeacherId;
  renderId: string;
  imageUrl: string;
  inspectedAt: string;
  metrics: PhotorealismMetrics;
  finalScore: number;
  failures: string[];
  passed: boolean;
  evidence: QualityEvidence[];
  pipeline: "png_billboard" | "humanoid_glb" | "unknown";
}

const REQUIRED_SCORE = 95;

const METRIC_WEIGHTS: Record<keyof PhotorealismMetrics, number> = {
  facialAnatomy: 0.18,
  skinRealism: 0.18,
  eyeRealism: 0.15,
  hairRealism: 0.1,
  lightingRealism: 0.12,
  materialRealism: 0.07,
  identityConsistency: 0.12,
  artifactFreedom: 0.08,
};

const METRIC_LABELS: Record<keyof PhotorealismMetrics, string> = {
  facialAnatomy: "Facial anatomy",
  skinRealism: "Skin realism",
  eyeRealism: "Eye realism",
  hairRealism: "Hair realism",
  lightingRealism: "Lighting realism",
  materialRealism: "Material realism",
  identityConsistency: "Identity consistency",
  artifactFreedom: "Artifact freedom",
};

/**
 * Honest baseline for the current local PNG billboard + optional GLB pipeline.
 * These scores intentionally FAIL the ≥95 bar — do not raise them to fake PASS.
 */
const PNG_BILLBOARD_BASELINE: PhotorealismMetrics = {
  facialAnatomy: 68,
  skinRealism: 54,
  eyeRealism: 58,
  hairRealism: 52,
  lightingRealism: 61,
  materialRealism: 48,
  identityConsistency: 72,
  artifactFreedom: 63,
};

function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, score));
}

export function calculatePhotorealismScore(
  metrics: PhotorealismMetrics,
): number {
  const weightedScore = Object.entries(METRIC_WEIGHTS).reduce(
    (total, [metric, weight]) => {
      const key = metric as keyof PhotorealismMetrics;

      return total + normalizeScore(metrics[key]) * weight;
    },
    0,
  );

  return Number(weightedScore.toFixed(2));
}

export function detectPhotorealismFailures(
  metrics: PhotorealismMetrics,
): string[] {
  const failures: string[] = [];

  for (const metric of Object.keys(metrics) as Array<
    keyof PhotorealismMetrics
  >) {
    const score = normalizeScore(metrics[metric]);

    if (score < REQUIRED_SCORE) {
      failures.push(
        `${METRIC_LABELS[metric]} below target: ${score}/${REQUIRED_SCORE}`,
      );
    }
  }

  if (metrics.skinRealism < 95) {
    failures.push(
      "Remove plastic or overly smooth skin and add natural pores, micro-texture and subtle imperfections.",
    );
  }

  if (metrics.eyeRealism < 95) {
    failures.push(
      "Improve corneal reflections, iris depth, tear line, pupil response and natural gaze.",
    );
  }

  if (metrics.hairRealism < 95) {
    failures.push(
      "Improve individual hair strands, hairline transitions, shadowing and motion stability.",
    );
  }

  if (metrics.facialAnatomy < 95) {
    failures.push(
      "Correct facial proportions, jaw structure, eyelids, lips, teeth and facial asymmetry.",
    );
  }

  if (metrics.lightingRealism < 95) {
    failures.push(
      "Use physically plausible key, fill and rim lighting with realistic skin response and shadows.",
    );
  }

  if (metrics.materialRealism < 95) {
    failures.push(
      "Replace flat sprite albedo with layered skin/hair/eye materials and physically based response.",
    );
  }

  if (metrics.identityConsistency < 95) {
    failures.push(
      "Lock facial identity across angles, expressions, lighting conditions and lesson sessions.",
    );
  }

  if (metrics.artifactFreedom < 95) {
    failures.push(
      "Remove temporal artifacts, facial warping, texture flicker, clipping and synthetic avatar defects.",
    );
  }

  return [...new Set(failures)];
}

export function inspectPhotorealism(input: {
  teacherId: TeacherId;
  renderId: string;
  imageUrl: string;
  metrics: PhotorealismMetrics;
  reportUrl: string;
  pipeline?: PhotorealismInspection["pipeline"];
}): PhotorealismInspection {
  const finalScore = calculatePhotorealismScore(input.metrics);
  const failures = detectPhotorealismFailures(input.metrics);
  const passed =
    finalScore >= REQUIRED_SCORE &&
    Object.values(input.metrics).every(
      (score) => normalizeScore(score) >= REQUIRED_SCORE,
    );

  const inspectedAt = new Date().toISOString();

  const evidence: QualityEvidence[] = [
    {
      id: `${input.teacherId}-${input.renderId}-image`,
      type: "image",
      url: input.imageUrl,
      createdAt: inspectedAt,
      verified: passed,
    },
    {
      id: `${input.teacherId}-${input.renderId}-report`,
      type: "test-report",
      url: input.reportUrl,
      createdAt: inspectedAt,
      verified: passed,
    },
    {
      id: `${input.teacherId}-${input.renderId}-metrics`,
      type: "metric",
      url: input.reportUrl,
      createdAt: inspectedAt,
      verified: passed,
    },
  ];

  updateTeacherScore({
    teacherId: input.teacherId,
    category: "photorealism",
    score: finalScore,
    failures,
    evidence,
  });

  return {
    teacherId: input.teacherId,
    renderId: input.renderId,
    imageUrl: input.imageUrl,
    inspectedAt,
    metrics: input.metrics,
    finalScore,
    failures,
    passed,
    evidence,
    pipeline: input.pipeline ?? "unknown",
  };
}

function teacherMediaRoot(teacherId: TeacherId): string {
  return path.join(process.cwd(), "public", "media", "ai-teachers", teacherId);
}

function clampMetric(value: number): number {
  return Math.max(0, Math.min(92, Math.round(value)));
}

/**
 * Inspect the currently shipped Sara/Ali media (PNG portraits + poses + optional GLB).
 * Returns an honest FAIL until filmed-professional photoreal assets exist.
 */
export function inspectCurrentTeacherPhotorealism(
  teacherId: TeacherId,
): PhotorealismInspection {
  const root = teacherMediaRoot(teacherId);
  const portraitPath = path.join(root, "portrait.png");
  const glbPath = path.join(root, "humanoid", "teacher.glb");
  const poseDir = path.join(root, "poses");

  const hasPortrait = fs.existsSync(portraitPath);
  const hasGlb = fs.existsSync(glbPath);
  const poseCount = fs.existsSync(poseDir)
    ? fs.readdirSync(poseDir).filter((f) => f.endsWith(".png")).length
    : 0;

  const portraitBytes = hasPortrait ? fs.statSync(portraitPath).size : 0;
  const largePortrait = portraitBytes > 1_500_000;

  // Small honest deltas only — never enough to clear 95 on a PNG billboard stack.
  const metrics: PhotorealismMetrics = {
    facialAnatomy: clampMetric(
      PNG_BILLBOARD_BASELINE.facialAnatomy + (largePortrait ? 2 : 0) + (hasGlb ? 3 : 0),
    ),
    skinRealism: clampMetric(
      PNG_BILLBOARD_BASELINE.skinRealism + (largePortrait ? 1 : 0),
    ),
    eyeRealism: clampMetric(PNG_BILLBOARD_BASELINE.eyeRealism + (hasGlb ? 2 : 0)),
    hairRealism: clampMetric(PNG_BILLBOARD_BASELINE.hairRealism),
    lightingRealism: clampMetric(
      PNG_BILLBOARD_BASELINE.lightingRealism + (poseCount >= 4 ? 2 : 0),
    ),
    materialRealism: clampMetric(
      PNG_BILLBOARD_BASELINE.materialRealism + (hasGlb ? 4 : 0),
    ),
    identityConsistency: clampMetric(
      PNG_BILLBOARD_BASELINE.identityConsistency + (poseCount >= 4 ? 3 : 0),
    ),
    artifactFreedom: clampMetric(
      PNG_BILLBOARD_BASELINE.artifactFreedom - (hasGlb ? 2 : 0),
    ),
  };

  if (!hasPortrait) {
    metrics.facialAnatomy = 20;
    metrics.identityConsistency = 15;
    metrics.artifactFreedom = 10;
  }

  const pipeline: PhotorealismInspection["pipeline"] = hasGlb
    ? "humanoid_glb"
    : hasPortrait
      ? "png_billboard"
      : "unknown";

  const renderId = `current-${pipeline}-${Date.now()}`;
  const imageUrl = hasPortrait
    ? `/media/ai-teachers/${teacherId}/portrait.png`
    : `/media/ai-teachers/${teacherId}/missing-portrait`;

  return inspectPhotorealism({
    teacherId,
    renderId,
    imageUrl,
    metrics,
    reportUrl: `/api/ai-teachers/photorealism?teacher=${teacherId}`,
    pipeline,
  });
}

export const PHOTOREALISM_REQUIRED_SCORE = REQUIRED_SCORE;
export const PHOTOREALISM_METRIC_WEIGHTS = METRIC_WEIGHTS;
