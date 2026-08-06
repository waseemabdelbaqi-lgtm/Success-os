/**
 * Client-safe: remap a HumanPerformancePlan timeline to real TTS durations.
 * Does not call Human Engine directors — only stretches timing for sync.
 */
import type { HumanPerformancePlan } from "@/types/human-engine";

export type TtsLineTiming = {
  url: string;
  durationMs: number;
  pauseAfterMs: number;
  style?: string;
};

function scaleTrackKeys<T extends { tMs: number; endMs?: number; durationMs?: number }>(
  keys: T[] | undefined,
  scale: number,
): T[] {
  if (!keys?.length) return [];
  return keys.map((k) => {
    const next = { ...k, tMs: Math.round(k.tMs * scale) };
    if (typeof k.endMs === "number") {
      (next as { endMs?: number }).endMs = Math.round(k.endMs * scale);
    }
    if (typeof k.durationMs === "number") {
      (next as { durationMs?: number }).durationMs = Math.max(
        200,
        Math.round(k.durationMs * scale),
      );
    }
    return next;
  });
}

/**
 * Align speech windows + scale all timeline tracks to match TTS wall-clock.
 */
export function alignPlanToTts(
  plan: HumanPerformancePlan,
  timings: TtsLineTiming[],
): HumanPerformancePlan {
  const lines = plan.speech?.lines || [];
  if (!lines.length || !timings.length) return plan;

  const n = Math.min(lines.length, timings.length);
  let cursor = 0;
  const newLines = lines.slice(0, n).map((line, i) => {
    const t = timings[i]!;
    const startMs = cursor;
    const endMs = startMs + Math.max(400, t.durationMs);
    cursor = endMs + Math.max(120, t.pauseAfterMs);
    return {
      ...line,
      startMs,
      endMs,
      audioSrc: t.url,
    };
  });

  // Keep any leftover lines after TTS batch (shouldn't happen)
  for (let i = n; i < lines.length; i++) {
    const line = lines[i]!;
    const dur = Math.max(800, line.endMs - line.startMs);
    newLines.push({
      ...line,
      startMs: cursor,
      endMs: cursor + dur,
    });
    cursor += dur + 280;
  }

  const oldDur = Math.max(1, plan.timeline.durationMs);
  const newDur = Math.max(cursor, newLines[newLines.length - 1]?.endMs || cursor);
  const scale = newDur / oldDur;

  const tl = plan.timeline;
  const timeline = {
    ...tl,
    durationMs: newDur,
    skeleton: scaleTrackKeys(tl.skeleton, scale),
    facial: scaleTrackKeys(tl.facial, scale),
    lipSync: scaleTrackKeys(tl.lipSync, scale),
    eyes: scaleTrackKeys(tl.eyes, scale),
    head: scaleTrackKeys(tl.head, scale),
    emotion: scaleTrackKeys(tl.emotion, scale),
    gesture: scaleTrackKeys(tl.gesture, scale),
    locomotion: scaleTrackKeys(tl.locomotion, scale),
    camera: scaleTrackKeys(tl.camera, scale),
    lighting: scaleTrackKeys(tl.lighting, scale),
    behaviour: scaleTrackKeys(tl.behaviour, scale),
    screen: scaleTrackKeys(tl.screen, scale),
  };

  const sentences = (plan.sentences || []).map((s, i) => {
    if (i < newLines.length) {
      return {
        ...s,
        startMs: newLines[i]!.startMs,
        endMs: newLines[i]!.endMs,
        audioSrc: newLines[i]!.audioSrc,
      };
    }
    return {
      ...s,
      startMs: Math.round(s.startMs * scale),
      endMs: Math.round(s.endMs * scale),
    };
  });

  return {
    ...plan,
    timeline,
    sentences,
    speech: { ...plan.speech, lines: newLines },
  };
}

/** Slice a plan from a global time (for resume after interrupt). */
export function slicePlanFrom(plan: HumanPerformancePlan, fromMs: number): HumanPerformancePlan {
  const lines = (plan.speech.lines || []).filter((l) => l.endMs > fromMs);
  if (!lines.length) return plan;

  const shift = lines[0]!.startMs;
  const remapped = lines.map((l) => ({
    ...l,
    startMs: Math.max(0, l.startMs - shift),
    endMs: Math.max(400, l.endMs - shift),
  }));
  const durationMs = remapped[remapped.length - 1]!.endMs + 200;
  const scale = durationMs / Math.max(1, plan.timeline.durationMs - shift);

  // Lightweight: keep timeline but re-stamp speech; sampling still works via speech windows
  return {
    ...plan,
    planId: `${plan.planId}_resume_${Math.round(fromMs)}`,
    timeline: {
      ...plan.timeline,
      durationMs,
    },
    speech: { lines: remapped },
    sentences: (plan.sentences || [])
      .filter((s) => s.endMs > fromMs)
      .map((s) => ({
        ...s,
        startMs: Math.max(0, s.startMs - shift),
        endMs: Math.max(400, s.endMs - shift),
      })),
  };
  void scale;
}
