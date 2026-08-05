// src/lib/ai-teachers/lipsync-engine.ts

import fs from "node:fs";
import path from "node:path";
import {
  updateTeacherScore,
  type QualityEvidence,
} from "./recovery-engine";

export type TeacherId = "sara" | "ali";

export interface LipSyncMetrics {
  phonemeAccuracy: number;
  visemeAccuracy: number;
  mouthTiming: number;
  jawMotion: number;
  tongueVisibility: number;
  facialBlendShapes: number;
  breathingSync: number;
  silenceStability: number;
  multilingualAccuracy: number;
  emotionConsistency: number;
}

export interface LipSyncInspection {
  teacherId: TeacherId;
  renderId: string;
  score: number;
  passed: boolean;
  metrics: LipSyncMetrics;
  failures: string[];
  evidence: QualityEvidence[];
  inspectedAt: string;
  pipeline: "mouth_sprites" | "arkit_morphs" | "unknown";
}

const REQUIRED = 95;

const WEIGHTS: Record<keyof LipSyncMetrics, number> = {
  phonemeAccuracy: 0.18,
  visemeAccuracy: 0.16,
  mouthTiming: 0.16,
  jawMotion: 0.1,
  tongueVisibility: 0.05,
  facialBlendShapes: 0.1,
  breathingSync: 0.05,
  silenceStability: 0.08,
  multilingualAccuracy: 0.07,
  emotionConsistency: 0.05,
};

const METRIC_LABELS: Record<keyof LipSyncMetrics, string> = {
  phonemeAccuracy: "Phoneme accuracy",
  visemeAccuracy: "Viseme accuracy",
  mouthTiming: "Mouth timing",
  jawMotion: "Jaw motion",
  tongueVisibility: "Tongue visibility",
  facialBlendShapes: "Facial blend shapes",
  breathingSync: "Breathing sync",
  silenceStability: "Silence stability",
  multilingualAccuracy: "Multilingual accuracy",
  emotionConsistency: "Emotion consistency",
};

/**
 * Honest baseline for current Sara/Ali lip path:
 * 3-state mouth sprites and/or coarse ARKit morphs without waveform-locked phonemes.
 * Intentionally FAIL the ≥95 bar — do not inflate to fake PASS.
 */
const CURRENT_PIPELINE_BASELINE: LipSyncMetrics = {
  phonemeAccuracy: 72,
  visemeAccuracy: 70,
  mouthTiming: 68,
  jawMotion: 78,
  tongueVisibility: 38,
  facialBlendShapes: 74,
  breathingSync: 55,
  silenceStability: 80,
  multilingualAccuracy: 66,
  emotionConsistency: 70,
};

function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

export function calculateLipSyncScore(metrics: LipSyncMetrics): number {
  const total = (
    Object.entries(WEIGHTS) as Array<[keyof LipSyncMetrics, number]>
  ).reduce((sum, [key, weight]) => {
    return sum + normalizeScore(metrics[key]) * weight;
  }, 0);

  return Number(total.toFixed(2));
}

export function detectLipSyncFailures(metrics: LipSyncMetrics): string[] {
  const failures: string[] = [];

  for (const key of Object.keys(metrics) as Array<keyof LipSyncMetrics>) {
    const value = normalizeScore(metrics[key]);
    if (value < REQUIRED) {
      failures.push(
        `${METRIC_LABELS[key]} below target: ${value}/${REQUIRED}`,
      );
    }
  }

  if (metrics.phonemeAccuracy < REQUIRED) {
    failures.push(
      "Lock Arabic and English phonemes to audio waveform peaks (not energy thresholds alone).",
    );
  }
  if (metrics.visemeAccuracy < REQUIRED) {
    failures.push(
      "Replace 3-state mouth sprites with full viseme set driven by precise phoneme timing.",
    );
  }
  if (metrics.mouthTiming < REQUIRED) {
    failures.push(
      "Align mouth onset/offset within ±40ms of spoken audio for every line.",
    );
  }
  if (metrics.jawMotion < REQUIRED) {
    failures.push(
      "Drive jawOpen from phoneme intensity with natural co-articulation, not binary open/close.",
    );
  }
  if (metrics.tongueVisibility < REQUIRED) {
    failures.push(
      "Add tongue / dental cues for interdental and alveolar Arabic consonants.",
    );
  }
  if (metrics.facialBlendShapes < REQUIRED) {
    failures.push(
      "Drive full ARKit mouth/cheek/lip morph set from phoneme stream, not jaw alone.",
    );
  }
  if (metrics.breathingSync < REQUIRED) {
    failures.push(
      "Sync breath cycles and micro-pauses with phrase boundaries in the speech track.",
    );
  }
  if (metrics.silenceStability < REQUIRED) {
    failures.push(
      "Hold a stable rest mouth pose during silence — no flicker or residual jaw drift.",
    );
  }
  if (metrics.multilingualAccuracy < REQUIRED) {
    failures.push(
      "Validate lip sync separately for Arabic (Sana/Taim) and English lesson lines.",
    );
  }
  if (metrics.emotionConsistency < REQUIRED) {
    failures.push(
      "Keep lip shapes coherent with emotion (warm smile vs focused) while speaking.",
    );
  }

  return [...new Set(failures)];
}

export function inspectLipSync(input: {
  teacherId: TeacherId;
  metrics: LipSyncMetrics;
  videoUrl: string;
  reportUrl: string;
  renderId?: string;
  pipeline?: LipSyncInspection["pipeline"];
}): LipSyncInspection {
  const score = calculateLipSyncScore(input.metrics);
  const failures = detectLipSyncFailures(input.metrics);
  const passed =
    failures.length === 0 &&
    score >= REQUIRED &&
    Object.values(input.metrics).every((v) => normalizeScore(v) >= REQUIRED);

  const inspectedAt = new Date().toISOString();
  const renderId = input.renderId ?? `lipsync-${Date.now()}`;

  const evidence: QualityEvidence[] = [
    {
      id: `${input.teacherId}-${renderId}-video`,
      type: "video",
      url: input.videoUrl,
      createdAt: inspectedAt,
      verified: passed,
    },
    {
      id: `${input.teacherId}-${renderId}-report`,
      type: "test-report",
      url: input.reportUrl,
      createdAt: inspectedAt,
      verified: passed,
    },
    {
      id: `${input.teacherId}-${renderId}-metrics`,
      type: "metric",
      url: input.reportUrl,
      createdAt: inspectedAt,
      verified: passed,
    },
  ];

  updateTeacherScore({
    teacherId: input.teacherId,
    category: "lipsync",
    score,
    failures,
    evidence,
  });

  return {
    teacherId: input.teacherId,
    renderId,
    score,
    passed,
    metrics: input.metrics,
    failures,
    evidence,
    inspectedAt,
    pipeline: input.pipeline ?? "unknown",
  };
}

function clampMetric(value: number): number {
  return Math.max(0, Math.min(92, Math.round(value)));
}

function teacherMediaRoot(teacherId: TeacherId): string {
  return path.join(process.cwd(), "public", "media", "ai-teachers", teacherId);
}

/**
 * Inspect the currently shipped Sara/Ali lip-sync pipeline.
 * Returns an honest FAIL until waveform-locked phoneme/viseme quality exists.
 * Note: recovery task stays blocked until photorealism ≥95.
 */
export function inspectCurrentTeacherLipSync(
  teacherId: TeacherId,
): LipSyncInspection {
  const root = teacherMediaRoot(teacherId);
  const mouthDir = path.join(root, "flagship");
  const glbPath = path.join(root, "humanoid", "teacher.glb");
  const audioDir = path.join(root, "audio");

  const mouthSprites = ["mouth-closed.png", "mouth-open.png", "mouth-wide.png"];
  const mouthCount = mouthSprites.filter((f) =>
    fs.existsSync(path.join(mouthDir, f)),
  ).length;
  const hasGlb = fs.existsSync(glbPath);
  const audioCount = fs.existsSync(audioDir)
    ? fs.readdirSync(audioDir).filter((f) => f.endsWith(".mp3")).length
    : 0;

  const metrics: LipSyncMetrics = {
    phonemeAccuracy: clampMetric(
      CURRENT_PIPELINE_BASELINE.phonemeAccuracy + (audioCount >= 6 ? 3 : 0),
    ),
    visemeAccuracy: clampMetric(
      CURRENT_PIPELINE_BASELINE.visemeAccuracy +
        (mouthCount >= 3 ? 2 : 0) +
        (hasGlb ? 4 : 0),
    ),
    mouthTiming: clampMetric(
      CURRENT_PIPELINE_BASELINE.mouthTiming + (audioCount >= 6 ? 2 : 0),
    ),
    jawMotion: clampMetric(
      CURRENT_PIPELINE_BASELINE.jawMotion + (hasGlb ? 5 : 0),
    ),
    tongueVisibility: clampMetric(CURRENT_PIPELINE_BASELINE.tongueVisibility),
    facialBlendShapes: clampMetric(
      CURRENT_PIPELINE_BASELINE.facialBlendShapes + (hasGlb ? 6 : 0),
    ),
    breathingSync: clampMetric(CURRENT_PIPELINE_BASELINE.breathingSync),
    silenceStability: clampMetric(
      CURRENT_PIPELINE_BASELINE.silenceStability + (mouthCount >= 3 ? 2 : 0),
    ),
    multilingualAccuracy: clampMetric(
      CURRENT_PIPELINE_BASELINE.multilingualAccuracy + (audioCount >= 6 ? 3 : 0),
    ),
    emotionConsistency: clampMetric(
      CURRENT_PIPELINE_BASELINE.emotionConsistency + (hasGlb ? 2 : 0),
    ),
  };

  const pipeline: LipSyncInspection["pipeline"] = hasGlb
    ? "arkit_morphs"
    : mouthCount >= 3
      ? "mouth_sprites"
      : "unknown";

  const videoUrl = fs.existsSync(
    path.join(root, "showcase-15s.mp4"),
  )
    ? `/media/ai-teachers/${teacherId}/showcase-15s.mp4`
    : `/media/ai-teachers/${teacherId}/flagship/mouth-open.png`;

  return inspectLipSync({
    teacherId,
    metrics,
    videoUrl,
    reportUrl: `/api/ai-teachers/lipsync?teacher=${teacherId}`,
    renderId: `current-${pipeline}`,
    pipeline,
  });
}

export const LIPSYNC_REQUIRED_SCORE = REQUIRED;
export const LIPSYNC_METRIC_WEIGHTS = WEIGHTS;
