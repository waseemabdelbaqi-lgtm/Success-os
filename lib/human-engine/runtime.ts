/**
 * Human Engine runtime helpers — preview + showcase plans + playback clock.
 */
import type {
  HumanCharacterId,
  HumanLessonInput,
  HumanPerformancePlan,
} from "@/types/human-engine";
import { directLesson } from "./lesson-director";
import { sampleFrame } from "./sampler";
import type { DigitalHumanAdapter } from "@/types/human-engine";
import { preview10sLessonInput, showcaseLessonInput } from "./showcase-lesson";

export function previewLessonInput(characterId: HumanCharacterId): HumanLessonInput {
  return preview10sLessonInput(characterId);
}

export function buildPreviewPlan(characterId: HumanCharacterId): HumanPerformancePlan {
  return directLesson({
    input: preview10sLessonInput(characterId),
    adapterId: "local_photoreal_preview",
    maxDurationMs: 10000,
  });
}

export function buildShowcasePlan(characterId: HumanCharacterId): HumanPerformancePlan {
  return directLesson({
    input: showcaseLessonInput(characterId),
    adapterId: "local_photoreal_preview",
    maxDurationMs: 48000,
  });
}

export function buildDemoPlans(): {
  sara: HumanPerformancePlan;
  ali: HumanPerformancePlan;
} {
  return {
    sara: buildPreviewPlan("sara"),
    ali: buildPreviewPlan("ali"),
  };
}

export function buildShowcasePlans(): {
  sara: HumanPerformancePlan;
  ali: HumanPerformancePlan;
} {
  return {
    sara: buildShowcasePlan("sara"),
    ali: buildShowcasePlan("ali"),
  };
}

export type PlaybackHandle = {
  stop: () => void;
};

/** Drive an adapter from a plan for durationMs (default full timeline). */
export function playPlan(
  plan: HumanPerformancePlan,
  adapter: DigitalHumanAdapter,
  opts?: { onTick?: (tMs: number) => void; durationMs?: number },
): PlaybackHandle {
  void adapter.load(plan);
  const duration = opts?.durationMs ?? plan.timeline.durationMs;
  const started = performance.now();
  let raf = 0;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    const tMs = Math.min(duration, performance.now() - started);
    adapter.applyFrame(sampleFrame(plan, tMs));
    opts?.onTick?.(tMs);
    if (tMs < duration) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      adapter.dispose?.();
    },
  };
}
