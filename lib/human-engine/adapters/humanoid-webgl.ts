/**
 * Live WebGL humanoid adapter — binds HumanPerformancePlan to skinned teachers.
 * MetaHuman Unreal streaming can replace this adapter later without Lesson Director changes.
 */
import type {
  DigitalHumanAdapter,
  HumanFrameSample,
  HumanPerformancePlan,
} from "@/types/human-engine";

export type HumanoidWebGLHooks = {
  onLoad?: (plan: HumanPerformancePlan) => void;
  onFrame?: (frame: HumanFrameSample) => void;
  onDispose?: () => void;
};

export function createHumanoidWebGLAdapter(
  hooks: HumanoidWebGLHooks = {},
): DigitalHumanAdapter {
  let plan: HumanPerformancePlan | null = null;
  return {
    id: "local_photoreal_preview",
    status: "live",
    capabilities: [
      "skinned_skeleton",
      "finger_bones",
      "eye_bones",
      "arkit_morph_targets",
      "phoneme_lipsync",
      "gesture_from_lesson",
      "locomotion_walk",
      "camera_framing",
      "lighting_grade",
    ],
    notes: [
      "Skinned Mixamo humanoid + ARKit-named face morphs in Three.js",
      "Driven by Human Engine timeline — not billboard PNGs",
      "Swap to MetaHuman Pixel Streaming via metahuman adapter when UE server is available",
    ],
    load(next) {
      plan = next;
      hooks.onLoad?.(next);
    },
    applyFrame(frame) {
      if (!plan) return;
      hooks.onFrame?.(frame);
    },
    dispose() {
      plan = null;
      hooks.onDispose?.();
    },
  };
}
