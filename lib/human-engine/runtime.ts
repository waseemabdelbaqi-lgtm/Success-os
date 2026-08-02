/**
 * Human Engine runtime helpers — preview plans + playback clock.
 */
import type {
  HumanCharacterId,
  HumanLessonInput,
  HumanPerformancePlan,
} from "@/types/human-engine";
import { directLesson } from "./lesson-director";
import { sampleFrame } from "./sampler";
import type { DigitalHumanAdapter } from "@/types/human-engine";

export function previewLessonInput(characterId: HumanCharacterId): HumanLessonInput {
  const isAli = characterId === "ali";
  return {
    lessonId: `he_preview_10s_${characterId}`,
    title: "Count to Three",
    titleAr: "العد حتى ثلاثة",
    subject: "math",
    grade: "g1",
    language: "ar",
    preferredCharacterId: characterId,
    durationMs: 10000,
    blocks: isAli
      ? [
          {
            id: "h1",
            kind: "hook",
            text: "أهلاً، أنا المعلم علي. اليوم نعدّ بوضوح حتى ثلاثة.",
          },
          {
            id: "e1",
            kind: "explain",
            text: "شوف السبورة: واحد، ثم اثنان، ثم ثلاثة. كل رقم له مكانه.",
          },
          {
            id: "x1",
            kind: "example",
            text: "مثال: تفاحة، تفاحتان، ثلاث تفاحات. ركّز على الترتيب.",
          },
          {
            id: "c1",
            kind: "check",
            text: "فكر معي: ما الرقم بعد الاثنين؟",
          },
          {
            id: "z1",
            kind: "close",
            text: "أحسنت المتابعة. إلى اللقاء.",
          },
        ]
      : [
          {
            id: "h1",
            kind: "hook",
            text: "مرحبا، أنا المعلمة سارة. هيا نعدّ معاً حتى ثلاثة.",
          },
          {
            id: "e1",
            kind: "explain",
            text: "نبدأ من واحد، ثم اثنين، ثم ثلاثة. انظر إلى السبورة معي.",
          },
          {
            id: "x1",
            kind: "example",
            text: "مثلاً: نجمة، نجمتان، ثلاث نجمات. اكتبها ببطء.",
          },
          {
            id: "c1",
            kind: "check",
            text: "سؤالي: كم يصبح واحد زائد اثنين؟",
          },
          {
            id: "z1",
            kind: "encourage",
            text: "أحسنت! أنت تتعلم بسرعة.",
          },
        ],
  };
}

export function buildPreviewPlan(characterId: HumanCharacterId): HumanPerformancePlan {
  return directLesson({
    input: previewLessonInput(characterId),
    adapterId: "local_photoreal_preview",
    maxDurationMs: 10000,
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
