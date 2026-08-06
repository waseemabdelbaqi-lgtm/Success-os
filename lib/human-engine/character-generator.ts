/**
 * Character Generator — builds provider-portable character specs.
 * Sole identity/appearance/voice source: src/ai-teacher/teachers/{sara,ali}.ts
 */
import type { CharacterSpec, HumanCharacterId, HumanLessonInput } from "@/types/human-engine";
import type { EmotionId } from "@/types/human-engine";
import {
  getTeacherAppearance,
  getTeacherDisplayName,
  getTeacherPersonalityLock,
  requireTeacherConfig,
  resolveTeacherVoice,
} from "@/src/ai-teacher/config";

function fromConfig(id: "sara" | "ali"): CharacterSpec {
  const cfg = requireTeacherConfig(id);
  const appearance = getTeacherAppearance(id);
  const voice = resolveTeacherVoice(id, cfg.defaultLocale);
  const lock = getTeacherPersonalityLock(id);
  const emotion: EmotionId =
    lock.defaultEmotion === "focused"
      ? "focused"
      : lock.defaultEmotion === "curious"
        ? "curious"
        : lock.defaultEmotion === "encouraging"
          ? "encouraging"
          : "warm";

  return {
    id,
    displayName: getTeacherDisplayName(id),
    gender: cfg.gender,
    locale: cfg.defaultLocale,
    voiceId: voice.voiceId,
    appearance: {
      skinTone: appearance.skinTone,
      hairStyle: appearance.hairStyle,
      outfit: appearance.outfitKey,
      ageBand: appearance.ageBand,
      photorealAssetRoot: appearance.assetRoot,
      humanoidGlb: appearance.humanoidGlb,
    },
    skeletonPreset: "adult_teaching_a_pose",
    facialRigPreset: "ar_teaching_v1",
    defaultEmotion: emotion,
  };
}

export function listHumanCharacters(): CharacterSpec[] {
  return [fromConfig("sara"), fromConfig("ali")];
}

export function getCharacter(id: HumanCharacterId): CharacterSpec {
  if (id === "ali") return fromConfig("ali");
  if (id === "sara") return fromConfig("sara");
  return { ...fromConfig("sara"), id };
}

export function generateCharacter(input: HumanLessonInput): CharacterSpec {
  if (input.preferredCharacterId === "ali" || input.preferredCharacterId === "sara") {
    return getCharacter(input.preferredCharacterId);
  }
  const subject = (input.subject || "").toLowerCase();
  const grade = (input.grade || "").toLowerCase();
  const early =
    /g1|g2|grade\s*[12]|صف\s*[١٢12]|early|ابتدائي\s*أ/.test(grade) ||
    /early/.test(subject);
  const stem = /math|science|physics|رياضيات|علوم|فيزياء|stem/.test(subject);
  if (early && !stem) return getCharacter("sara");
  if (stem) return getCharacter("ali");
  return getCharacter("sara");
}
