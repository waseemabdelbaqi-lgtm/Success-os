/**
 * Emotion System — educational affect from block purpose + wording.
 */
import type { EmotionId, EmotionKeyframe, LessonBlockKind } from "@/types/human-engine";

export function emotionForBlock(
  kind: LessonBlockKind,
  text: string,
  seed: number,
): { emotion: EmotionId; intensity: number } {
  if (/أحسن|ممتاز|بطل|رائع|مبروك/.test(text) || kind === "encourage") {
    return { emotion: "celebratory", intensity: 0.85 };
  }
  if (/فكر|لماذا|سؤال|؟/.test(text) || kind === "check") {
    return { emotion: "curious", intensity: 0.7 };
  }
  if (/ركز|دقة|قانون|معادل|خطوة/.test(text) || kind === "demonstrate") {
    return { emotion: "focused", intensity: 0.75 };
  }
  if (kind === "hook" || kind === "close") {
    return { emotion: "warm", intensity: 0.8 };
  }
  if (kind === "practice") {
    return { emotion: "patient", intensity: 0.65 };
  }
  if (kind === "explain" || kind === "example") {
    return { emotion: seed % 2 === 0 ? "focused" : "warm", intensity: 0.6 };
  }
  return { emotion: "neutral", intensity: 0.5 };
}

export function buildEmotionTrack(
  segments: Array<{ startMs: number; endMs: number; kind: LessonBlockKind; text: string; seed: number }>,
): EmotionKeyframe[] {
  const keys: EmotionKeyframe[] = [];
  for (const seg of segments) {
    const { emotion, intensity } = emotionForBlock(seg.kind, seg.text, seg.seed);
    keys.push({ tMs: seg.startMs, emotion, intensity });
    keys.push({
      tMs: seg.startMs + Math.floor((seg.endMs - seg.startMs) * 0.6),
      emotion,
      intensity: Math.min(1, intensity + 0.08),
    });
    keys.push({ tMs: seg.endMs, emotion, intensity: intensity * 0.85 });
  }
  return keys;
}

export function sampleEmotion(
  keys: EmotionKeyframe[],
  tMs: number,
): { emotion: EmotionId; intensity: number } {
  let cur = keys[0] || { emotion: "neutral" as EmotionId, intensity: 0.5, tMs: 0 };
  for (const k of keys) {
    if (k.tMs <= tMs) cur = k;
    else break;
  }
  return { emotion: cur.emotion, intensity: cur.intensity };
}
