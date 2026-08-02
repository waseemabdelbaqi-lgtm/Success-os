/**
 * Frame sampler — evaluates the full timeline at tMs for any adapter.
 */
import type {
  HumanFrameSample,
  HumanPerformancePlan,
  PhonemeId,
} from "@/types/human-engine";
import { sampleBones } from "./skeleton-animation";
import { sampleBlendShapes } from "./blend-shapes";
import { jawFromPhoneme, samplePhoneme } from "./lip-sync";
import { sampleEyes } from "./eye-tracking";
import { sampleHead } from "./head-tracking";
import { sampleEmotion } from "./emotion-system";
import { sampleGesture } from "./gesture-engine";
import { sampleCamera } from "./camera-director";
import { sampleLight } from "./lighting-director";
import { sampleBehaviour } from "./ai-behaviour-engine";

export function sampleFrame(plan: HumanPerformancePlan, tMs: number): HumanFrameSample {
  const tl = plan.timeline;
  const t = Math.max(0, Math.min(tl.durationMs, tMs));
  const phoneme: PhonemeId = samplePhoneme(tl.lipSync.keys, t);
  const mouthShapes = sampleBlendShapes(tl.facial.keys, t);
  const emotion = sampleEmotion(tl.emotion.keys, t);
  const eyes = sampleEyes(tl.eyes.keys, t);
  const head = sampleHead(tl.head.keys, t);
  const light = sampleLight(tl.lighting.keys, t);
  const line = plan.speech.lines.find((l) => t >= l.startMs && t < l.endMs) || null;

  return {
    tMs: t,
    characterId: plan.character.id,
    phoneme,
    jawOpen: mouthShapes.jawOpen ?? jawFromPhoneme(phoneme),
    mouthShapes,
    emotion: emotion.emotion,
    emotionIntensity: emotion.intensity,
    gesture: sampleGesture(tl.gesture.keys, t),
    gaze: eyes.target,
    head,
    bones: sampleBones(tl.skeleton.keys, t),
    camera: sampleCamera(tl.camera.keys, t),
    lighting: light.preset,
    lightIntensity: light.intensity,
    behaviourGoal: sampleBehaviour(tl.behaviour.keys, t),
    speaking: Boolean(line) && phoneme !== "sil",
    lineText: line?.text ?? null,
  };
}
