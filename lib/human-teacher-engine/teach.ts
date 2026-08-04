/**
 * Human Teacher Engine — primary teach entry.
 * Orchestrates identity (Sara/Ali only) + Human Engine + studio + endurance + lip.
 * Elevates Human Engine — does not replace it.
 */
import type { EmotionId, HumanLessonInput, HumanPerformancePlan } from "@/types/human-engine";
import {
  assertPlatformTeacherId,
  getTeacherAppearance,
  getTeacherDisplayName,
  getTeacherPerformanceContract,
  getTeacherPersonalityLock,
  requireTeacherConfig,
  resolveTeacherVoice,
} from "@/src/ai-teacher/config";
import { directLesson } from "@/lib/human-engine/lesson-director";
import { resolveStudioTheme } from "./studio-director";
import {
  enduranceQualityFloor,
  expandBlocksForEndurance,
  resolveTargetDurationMs,
  segmentCountForDuration,
} from "./endurance";
import { rebuildLipPerformance } from "./lip-performance";
import type {
  HumanTeacherSessionBrief,
  HumanTeacherTeachResult,
  TeachHumanLessonOptions,
} from "./types";

function pickTeacherId(input: HumanLessonInput, preferred?: string) {
  if (preferred === "sara" || preferred === "ali") return preferred;
  if (input.preferredCharacterId === "sara" || input.preferredCharacterId === "ali") {
    return input.preferredCharacterId;
  }
  const subject = (input.subject || "").toLowerCase();
  const grade = (input.grade || "").toLowerCase();
  const early = /g1|g2|grade\s*[12]|صف\s*[١٢12]|early|ابتدائي/.test(grade);
  const stem = /math|science|physics|رياضيات|علوم|فيزياء|chem|كيم|prog|برمج/.test(subject);
  if (early && !stem) return "sara" as const;
  if (stem) return "ali" as const;
  return "sara" as const;
}

function languageFromLocale(locale: string): HumanLessonInput["language"] {
  if (locale.toLowerCase().startsWith("en")) return "en";
  if (locale.toLowerCase().startsWith("ar")) return "ar";
  return "bilingual";
}

function emotionFromPersonality(
  emotion: string,
): EmotionId {
  if (emotion === "focused") return "focused";
  if (emotion === "curious") return "curious";
  if (emotion === "encouraging") return "encouraging";
  return "warm";
}

function evaluateQualityGates(
  plan: HumanPerformancePlan,
  targetMs: number,
  personalityLocked: boolean,
): HumanTeacherTeachResult["qualityGates"] {
  const acts = plan.sentences.map((s) => s.contentAct);
  const boardActsPresent = acts.some((a) => /write_|draw_|count_/.test(String(a)));
  const modelOrExperimentPresent = acts.some((a) =>
    /show_model|run_experiment/.test(String(a)),
  );
  const gestures = new Set(plan.sentences.map((s) => s.gesture));
  const floor = enduranceQualityFloor(targetMs);
  const locomotionVariety =
    gestures.size >= Math.min(floor.minGestureVariety, 3) ||
    plan.timeline.skeleton.length > 8;
  const durationHonored =
    plan.timeline.durationMs >= Math.min(targetMs * 0.85, Math.max(0, targetMs - 500));
  const lipSyncAligned =
    plan.timeline.lipSync.length >= Math.max(8, plan.speech.lines.length * 4);

  return {
    lipSyncAligned,
    boardActsPresent: boardActsPresent || targetMs < 90_000,
    modelOrExperimentPresent: modelOrExperimentPresent || targetMs < 90_000,
    locomotionVariety,
    personalityLocked,
    durationHonored,
  };
}

export function buildSessionBrief(opts: TeachHumanLessonOptions): HumanTeacherSessionBrief {
  const teacherId = assertPlatformTeacherId(pickTeacherId(opts.input, opts.teacherId));
  const cfg = requireTeacherConfig(teacherId);
  const locale = opts.locale || cfg.defaultLocale;
  const voice = resolveTeacherVoice(teacherId, locale);
  const contract = getTeacherPerformanceContract(teacherId);
  const targetDurationMs = resolveTargetDurationMs(
    contract,
    opts.targetDurationMs ?? opts.input.durationMs,
  );
  const studio = resolveStudioTheme({
    subject: opts.input.subject,
    grade: opts.input.grade,
    title: opts.input.titleAr || opts.input.title,
  });

  return {
    teacherId,
    displayName: getTeacherDisplayName(teacherId),
    personality: getTeacherPersonalityLock(teacherId),
    appearance: getTeacherAppearance(teacherId),
    performance: contract,
    locale: voice.locale,
    voiceId: voice.voiceId,
    studio,
    subject: opts.input.subject || "general",
    grade: opts.input.grade || "",
    targetDurationMs,
    segments: segmentCountForDuration(targetDurationMs),
  };
}

/**
 * Teach a lesson as Sara or Ali — identity locked, studio adapted,
 * endurance expanded, lip performance densified.
 */
export function teachHumanLesson(opts: TeachHumanLessonOptions): HumanTeacherTeachResult {
  const brief = buildSessionBrief(opts);
  const cfg = requireTeacherConfig(brief.teacherId);
  const expandedBlocks = expandBlocksForEndurance(opts.input, brief.targetDurationMs);

  const input: HumanLessonInput = {
    ...opts.input,
    preferredCharacterId: brief.teacherId,
    language: languageFromLocale(brief.locale),
    durationMs: brief.targetDurationMs,
    blocks: expandedBlocks,
  };

  let plan = directLesson({
    input,
    adapterId:
      (opts.adapterId as "local_photoreal_preview" | undefined) ||
      "local_photoreal_preview",
    maxDurationMs: brief.targetDurationMs,
  });

  plan = {
    ...plan,
    character: {
      ...plan.character,
      id: brief.teacherId,
      displayName: brief.displayName,
      gender: cfg.gender,
      locale: brief.locale,
      voiceId: brief.voiceId,
      appearance: {
        skinTone: brief.appearance.skinTone,
        hairStyle: brief.appearance.hairStyle,
        outfit: brief.appearance.outfitKey,
        ageBand: brief.appearance.ageBand,
        photorealAssetRoot: brief.appearance.assetRoot,
        humanoidGlb: brief.appearance.humanoidGlb,
      },
      defaultEmotion: emotionFromPersonality(brief.personality.defaultEmotion),
    },
    adapter: {
      ...plan.adapter,
      notes: [
        ...plan.adapter.notes,
        `hte.studio=${brief.studio.id}`,
        `hte.lighting=${brief.studio.lighting}`,
        `hte.personality=${brief.personality.traits.join("+")}`,
        `hte.locale=${brief.locale}`,
        `hte.voice=${brief.voiceId}`,
      ],
    },
  };

  plan = rebuildLipPerformance(plan);

  const qualityGates = evaluateQualityGates(
    plan,
    brief.targetDurationMs,
    brief.personality.traits.length >= 4,
  );

  return { brief, plan, qualityGates };
}
