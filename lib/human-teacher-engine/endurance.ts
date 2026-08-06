/**
 * Endurance Director — keep teaching quality stable across hour-long sessions.
 * Requirement #8: continuous hours at the same quality, not a short demo.
 */
import type { HumanLessonBlock, HumanLessonInput } from "@/types/human-engine";
import type { TeacherPerformanceContract } from "@/src/ai-teacher/core/TeacherProfile";

/** One teaching cycle ≈ 5 minutes of professional classroom pacing. */
export const CYCLE_MS = 5 * 60_000;
/** Soft max per directed plan chunk (keeps timeline sampling dense). */
export const CHUNK_MS = 12 * 60_000;

export function resolveTargetDurationMs(
  contract: TeacherPerformanceContract,
  requested?: number,
): number {
  const floor = Math.max(65_000, requested || 0);
  // Honor explicit request; contract.targetContinuousMs is the supported ceiling.
  return Math.min(contract.targetContinuousMs, Math.max(floor, requested || floor));
}

export function segmentCountForDuration(targetMs: number): number {
  return Math.max(1, Math.ceil(targetMs / CHUNK_MS));
}

/**
 * Expand sparse lesson blocks into endurance cycles so long sessions
 * still contain board / draw / model / check acts at stable density.
 * Uses valid LessonBlockKind + semantic text cues Human Engine already detects.
 */
export function expandBlocksForEndurance(
  input: HumanLessonInput,
  targetMs: number,
): HumanLessonBlock[] {
  const base: HumanLessonBlock[] =
    input.blocks.length > 0
      ? input.blocks
      : [
          {
            id: "core",
            kind: "explain",
            text: input.titleAr || input.title,
            textAr: input.titleAr || input.title,
          },
        ];

  const cycles = Math.max(1, Math.ceil(targetMs / CYCLE_MS));
  if (cycles <= 1 && targetMs <= CHUNK_MS) return base;

  const out: HumanLessonBlock[] = [];
  for (let c = 0; c < cycles; c++) {
    const suffix = `c${c + 1}`;
    for (const b of base) {
      out.push({
        ...b,
        id: `${b.id}_${suffix}`,
      });
    }
    out.push(
      {
        id: `board_${suffix}`,
        kind: "explain",
        text: `اكتبوا معي على السبورة الفكرة الأساسية — دورة ${c + 1}`,
        textAr: `اكتبوا معي على السبورة الفكرة الأساسية — دورة ${c + 1}`,
        focusTarget: "board",
      },
      {
        id: `draw_${suffix}`,
        kind: "example",
        text: `الآن أرسم مخططاً على السبورة يوضح الفكرة — دورة ${c + 1}`,
        textAr: `الآن أرسم مخططاً على السبورة يوضح الفكرة — دورة ${c + 1}`,
        focusTarget: "board",
      },
      {
        id: `model_${suffix}`,
        kind: "example",
        text: `هذا نموذج ثلاثي الأبعاد. أمسكه، أديره، ثم أكبّره لنشوف التفاصيل — دورة ${c + 1}`,
        textAr: `هذا نموذج ثلاثي الأبعاد. أمسكه، أديره، ثم أكبّره لنشوف التفاصيل — دورة ${c + 1}`,
        focusTarget: "prop",
      },
      {
        id: `check_${suffix}`,
        kind: "check",
        text: `سؤال سريع: هل الفكرة واضحة؟ فكر بهدوء قبل ما تجاوب — دورة ${c + 1}`,
        textAr: `سؤال سريع: هل الفكرة واضحة؟ فكر بهدوء قبل ما تجاوب — دورة ${c + 1}`,
        focusTarget: "student",
      },
    );
  }
  return out;
}

export function enduranceQualityFloor(durationMs: number): {
  minBoardActs: number;
  minModelActs: number;
  minCheckActs: number;
  minGestureVariety: number;
} {
  const minutes = Math.max(1, durationMs / 60_000);
  return {
    minBoardActs: Math.max(2, Math.floor(minutes / 3)),
    minModelActs: Math.max(1, Math.floor(minutes / 5)),
    minCheckActs: Math.max(2, Math.floor(minutes / 4)),
    minGestureVariety: Math.max(4, Math.floor(minutes / 2)),
  };
}
