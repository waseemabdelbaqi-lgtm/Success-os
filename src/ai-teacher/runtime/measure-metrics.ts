/**
 * Honest Human Teacher metrics from a live teach plan.
 * Never inflate scores to pass the gate — FAIL until world-class.
 */
import type { HumanPerformancePlan } from "@/types/human-engine";
import type { HumanTeacherTeachResult } from "@/lib/human-teacher-engine/types";
import type { HumanTeacherMetrics } from "./quality-gate";
import { requireTeacherConfig } from "../config";

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

function fingerprint(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 120).toLowerCase();
}

function trackLen(track: { keys?: unknown[] } | unknown[] | undefined): number {
  if (!track) return 0;
  if (Array.isArray(track)) return track.length;
  return track.keys?.length || 0;
}

function trackKeys<T extends { tMs: number }>(
  track: { keys?: T[] } | T[] | undefined,
): T[] {
  if (!track) return [];
  if (Array.isArray(track)) return track;
  return track.keys || [];
}

function countRepeatedGestures(plan: HumanPerformancePlan): number {
  const gestures = plan.sentences.map((s) => s.gesture);
  let repeats = 0;
  for (let i = 1; i < gestures.length; i++) {
    if (gestures[i] && gestures[i] === gestures[i - 1]) repeats += 1;
  }
  const freq = new Map<string, number>();
  for (const g of gestures) {
    if (!g) continue;
    freq.set(g, (freq.get(g) || 0) + 1);
  }
  for (const [, n] of freq) {
    if (gestures.length >= 4 && n / gestures.length > 0.35) {
      repeats += n - 1;
    }
  }
  return repeats;
}

function countRepeatedSentences(plan: HumanPerformancePlan): number {
  const seen = new Map<string, number>();
  let repeats = 0;
  for (const line of plan.speech.lines) {
    const fp = fingerprint(line.text);
    if (!fp || fp.length < 8) continue;
    const n = (seen.get(fp) || 0) + 1;
    seen.set(fp, n);
    if (n > 1) repeats += 1;
  }
  return repeats;
}

function countRoboticMovements(plan: HumanPerformancePlan): number {
  let robotic = 0;
  const skeleton = trackKeys(plan.timeline.skeleton);
  if (skeleton.length >= 6) {
    const deltas: number[] = [];
    for (let i = 1; i < Math.min(skeleton.length, 40); i++) {
      deltas.push(skeleton[i]!.tMs - skeleton[i - 1]!.tMs);
    }
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const variance =
      deltas.reduce((a, d) => a + (d - avg) * (d - avg), 0) / deltas.length;
    if (avg > 0 && variance < avg * avg * 0.002) robotic += 1;
  }
  if (trackLen(plan.timeline.head) < 4) robotic += 1;
  if (trackLen(plan.timeline.eyes) < 4) robotic += 1;
  return robotic;
}

/**
 * Measure current teacher quality against filmed-professional bar.
 * Scores reflect reality of local photoreal + HE pipeline — not MetaHuman yet.
 */
export function measureHumanTeacherMetrics(
  teacher: "sara" | "ali",
  taught: HumanTeacherTeachResult,
): HumanTeacherMetrics {
  const cfg = requireTeacherConfig(teacher);
  const plan = taught.plan;
  const gates = taught.qualityGates;
  const lipKeys = trackLen(plan.timeline.lipSync);
  const blendKeys = trackLen(plan.timeline.facial);
  const lines = plan.speech.lines.length || 1;
  const lipDensity = lipKeys / Math.max(1, lines);
  const skeletonKeys = trackLen(plan.timeline.skeleton);
  const gestureVariety = new Set(plan.sentences.map((s) => s.gesture)).size;
  const acts = new Set(plan.sentences.map((s) => s.contentAct));
  const hasBoard = [...acts].some((a) => /write_|draw_/.test(String(a)));
  const hasModel = [...acts].some((a) =>
    /show_model|run_experiment/.test(String(a)),
  );
  const hasCheck = [...acts].some((a) => /ask_check/.test(String(a)));

  const realismBase = plan.adapter.id === "metahuman" ? 88 : 62;
  const realismScore = clampScore(
    realismBase +
      (cfg.appearance.humanoidGlb ? 6 : 0) +
      (cfg.facialExpressions ? 4 : 0) -
      (plan.adapter.id === "local_photoreal_preview" ? 8 : 0),
  );

  const lipSyncScore = clampScore(
    Math.min(
      92,
      40 +
        Math.min(35, lipDensity * 2.2) +
        (blendKeys > lipKeys * 0.5 ? 8 : 0) +
        (gates.lipSyncAligned ? 6 : 0),
    ),
  );

  const eyeKeys = trackLen(plan.timeline.eyes);
  const eyeContactScore = clampScore(
    Math.min(93, 38 + Math.min(40, eyeKeys / 2) + (cfg.eyeContact ? 8 : 0)),
  );

  const faceKeys = trackLen(plan.timeline.facial);
  const faceExpressionScore = clampScore(
    Math.min(
      93,
      36 + Math.min(40, faceKeys / 3) + (cfg.facialExpressions ? 8 : 0),
    ),
  );

  const bodyMovementScore = clampScore(
    Math.min(
      92,
      34 +
        Math.min(38, skeletonKeys / 4) +
        (cfg.bodyMovement ? 8 : 0) +
        (gates.locomotionVariety ? 6 : 0),
    ),
  );

  const gestureScore = clampScore(
    Math.min(93, 40 + gestureVariety * 7 + (cfg.naturalGestures ? 6 : 0)),
  );

  const voiceNaturalnessScore = clampScore(
    Math.min(94, 70 + (cfg.localeVoices ? 8 : 0) + (lines >= 4 ? 4 : 0)),
  );

  const teachingScore = clampScore(
    Math.min(
      95,
      55 +
        (hasBoard ? 10 : 0) +
        (hasModel ? 8 : 0) +
        (hasCheck ? 10 : 0) +
        (gates.personalityLocked ? 6 : 0),
    ),
  );

  const adaptationScore = clampScore(
    Math.min(94, 50 + (cfg.personalityLock ? 12 : 0) + (hasCheck ? 10 : 0)),
  );

  const studioScore = clampScore(
    Math.min(
      94,
      58 +
        (taught.brief.studio?.id ? 12 : 0) +
        (taught.brief.studio?.propKit?.length || 0) * 3,
    ),
  );

  return {
    teacher,
    realismScore,
    lipSyncScore,
    eyeContactScore,
    faceExpressionScore,
    bodyMovementScore,
    gestureScore,
    voiceNaturalnessScore,
    teachingScore,
    adaptationScore,
    studioScore,
    repeatedAnimations: countRepeatedGestures(plan),
    repeatedSentences: countRepeatedSentences(plan),
    roboticMovements: countRoboticMovements(plan),
  };
}
