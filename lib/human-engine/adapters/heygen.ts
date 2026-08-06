/**
 * HeyGen adapter stub — cloud digital-twin port for the same plan.
 */
import type { DigitalHumanAdapter, HumanPerformancePlan } from "@/types/human-engine";

export function createHeyGenAdapter(): DigitalHumanAdapter {
  let loaded: HumanPerformancePlan | null = null;
  return {
    id: "heygen",
    status: "needs_credentials",
    capabilities: ["digital_twin_video", "cloud_lipsync"],
    notes: ["Requires HEYGEN_* credentials for live twin video"],
    load(plan) {
      loaded = plan;
    },
    applyFrame() {
      void loaded;
    },
    dispose() {
      loaded = null;
    },
  };
}
