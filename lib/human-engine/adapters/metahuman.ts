/**
 * MetaHuman adapter stub — accepts the same HumanPerformancePlan.
 * Live Unreal/MetaHuman binding is a later phase; contracts are stable now.
 */
import type {
  DigitalHumanAdapter,
  HumanFrameSample,
  HumanPerformancePlan,
} from "@/types/human-engine";

export function createMetaHumanAdapter(): DigitalHumanAdapter {
  let loaded: HumanPerformancePlan | null = null;
  let lastFrame: HumanFrameSample | null = null;

  return {
    id: "metahuman",
    status: "stub",
    capabilities: [
      "skeletal_animation",
      "facial_rig",
      "blendshapes",
      "phoneme_lipsync",
      "metahuman_mesh",
    ],
    notes: [
      "Stub only — plan/frame API is MetaHuman-ready",
      "Replace applyFrame body with Unreal Control Rig / Live Link later",
    ],
    load(plan) {
      loaded = plan;
    },
    applyFrame(frame) {
      lastFrame = frame;
      // Intentionally no mesh — adapter swap point for MetaHuman.
      void loaded;
      void lastFrame;
    },
    dispose() {
      loaded = null;
      lastFrame = null;
    },
  };
}
