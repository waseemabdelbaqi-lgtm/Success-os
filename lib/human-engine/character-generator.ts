/**
 * Character Generator — builds provider-portable character specs.
 * Identity / voice / outfit overlay from Configuration Layer (src/ai-teacher).
 * MetaHuman mesh ids can replace photorealAssetRoot later without API changes.
 */
import type { CharacterSpec, HumanCharacterId, HumanLessonInput } from "@/types/human-engine";
import {
  getTeacherConfig,
  isWarmTeachingStyle,
  resolveTeacherVoice,
} from "@/src/ai-teacher/config";

const CHARACTERS: Record<"sara" | "ali", CharacterSpec> = {
  sara: {
    id: "sara",
    displayName: { en: "Teacher Sara", ar: "المعلمة سارة" },
    gender: "female",
    locale: "ar-JO",
    voiceId: "ar-JO-SanaNeural",
    appearance: {
      skinTone: "olive_warm",
      hairStyle: "dark_shoulder_length",
      outfit: "olive_blazer_classroom",
      ageBand: "adult_young",
      photorealAssetRoot: "/media/ai-teachers/sara",
      humanoidGlb: "/media/ai-teachers/sara/humanoid/teacher.glb",
    },
    skeletonPreset: "adult_teaching_a_pose",
    facialRigPreset: "ar_teaching_v1",
    defaultEmotion: "warm",
  },
  ali: {
    id: "ali",
    displayName: { en: "Teacher Ali", ar: "المعلم علي" },
    gender: "male",
    locale: "ar-JO",
    voiceId: "ar-JO-TaimNeural",
    appearance: {
      skinTone: "olive_medium",
      hairStyle: "short_dark",
      outfit: "navy_blazer_classroom",
      ageBand: "adult",
      photorealAssetRoot: "/media/ai-teachers/ali",
      humanoidGlb: "/media/ai-teachers/ali/humanoid/teacher.glb",
    },
    skeletonPreset: "adult_teaching_a_pose",
    facialRigPreset: "ar_teaching_v1",
    defaultEmotion: "focused",
  },
};

function withConfig(id: "sara" | "ali"): CharacterSpec {
  const base = CHARACTERS[id];
  const cfg = getTeacherConfig(id);
  const voice = resolveTeacherVoice(id);
  if (!cfg) return base;
  return {
    ...base,
    displayName: {
      en: cfg.fullName,
      ar: base.displayName.ar,
    },
    gender: cfg.gender,
    voiceId: voice.voiceId,
    appearance: {
      ...base.appearance,
      outfit: cfg.outfit || base.appearance.outfit,
    },
    defaultEmotion: isWarmTeachingStyle(cfg) ? "warm" : "focused",
  };
}

export function listHumanCharacters(): CharacterSpec[] {
  return [withConfig("sara"), withConfig("ali")];
}

export function getCharacter(id: HumanCharacterId): CharacterSpec {
  if (id === "ali") return withConfig("ali");
  if (id === "sara") return withConfig("sara");
  // Extensible: unknown ids fall back to Sara shell until registered.
  return { ...withConfig("sara"), id };
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
