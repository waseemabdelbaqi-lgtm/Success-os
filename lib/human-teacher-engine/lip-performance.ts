/**
 * Lip Performance — denser, TTS-aligned mouth drive.
 * Requirement #3: precise sync between voice, lips, and face.
 *
 * Builds on Human Engine phoneme tracks; re-samples to audio line windows
 * so jaw/viseme energy follows spoken timing, not estimate-only duration.
 */
import type {
  EmotionId,
  HumanPerformancePlan,
  PhonemeKeyframe,
  BlendShapeKeyframe,
} from "@/types/human-engine";
import {
  phonemeToMouth,
  textToPhonemeTrack,
  jawFromPhoneme,
} from "@/lib/human-engine/lip-sync";
import { composeBlendShapes } from "@/lib/human-engine/blend-shapes";

export type AlignedSpeechWindow = {
  text: string;
  startMs: number;
  endMs: number;
};

/**
 * Rebuild lipSync + blendShapes tracks from speech windows (TTS-aligned).
 * Call after alignPlanToTts so start/end match real audio.
 */
export function rebuildLipPerformance(
  plan: HumanPerformancePlan,
  windows?: AlignedSpeechWindow[],
): HumanPerformancePlan {
  const lines =
    windows && windows.length
      ? windows
      : (plan.speech?.lines || []).map((l) => ({
          text: l.text,
          startMs: l.startMs,
          endMs: l.endMs,
        }));

  const phonemes: PhonemeKeyframe[] = [];
  const blends: BlendShapeKeyframe[] = [];
  const emotion: EmotionId = plan.character.defaultEmotion || "warm";

  for (const line of lines) {
    const dur = Math.max(280, line.endMs - line.startMs);
    const track = textToPhonemeTrack(line.text, line.startMs, line.endMs);
    const step = 40;
    for (let t = line.startMs; t <= line.endMs; t += step) {
      const nearest =
        track.reduce(
          (best, k) =>
            Math.abs(k.tMs - t) < Math.abs(best.tMs - t) ? k : best,
          track[0] || { tMs: t, phoneme: "sil" as const, weight: 0 },
        ) || { tMs: t, phoneme: "sil" as const, weight: 0 };
      const local = (t - line.startMs) / dur;
      const envelope =
        Math.sin(Math.min(1, Math.max(0, local)) * Math.PI) * 0.85 + 0.15;
      const weight = (nearest.weight || 0.7) * envelope;
      phonemes.push({
        tMs: t,
        phoneme: nearest.phoneme,
        weight,
      });
      const base = composeBlendShapes({
        phoneme: nearest.phoneme,
        emotion,
        intensity: 0.55 * weight,
      });
      const mouth = phonemeToMouth(nearest.phoneme);
      const jaw = jawFromPhoneme(nearest.phoneme) * weight;
      blends.push({
        tMs: t,
        shapes: {
          ...base,
          ...mouth,
          jawOpen: jaw,
        },
      });
    }
    phonemes.push({ tMs: line.endMs + 30, phoneme: "sil", weight: 1 });
    blends.push({
      tMs: line.endMs + 30,
      shapes: composeBlendShapes({
        phoneme: "sil",
        emotion,
        intensity: 0.35,
      }),
    });
  }

  return {
    ...plan,
    timeline: {
      ...plan.timeline,
      lipSync: phonemes.length ? phonemes : plan.timeline.lipSync,
      blendShapes: blends.length ? blends : plan.timeline.blendShapes,
    },
  };
}
