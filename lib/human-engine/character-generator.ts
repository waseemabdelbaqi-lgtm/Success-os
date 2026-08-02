/**
 * Character Generator — builds provider-portable character specs.
 * MetaHuman mesh ids can replace photorealAssetRoot later without API changes.
 */
import type { CharacterSpec, HumanCharacterId, HumanLessonInput } from "@/types/human-engine";

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
    },
    skeletonPreset: "adult_teaching_a_pose",
    facialRigPreset: "ar_teaching_v1",
    defaultEmotion: "focused",
  },
};

export function listHumanCharacters(): CharacterSpec[] {
  return [CHARACTERS.sara, CHARACTERS.ali];
}

export function getCharacter(id: HumanCharacterId): CharacterSpec {
  if (id === "ali") return CHARACTERS.ali;
  if (id === "sara") return CHARACTERS.sara;
  // Extensible: unknown ids fall back to Sara shell until registered.
  return { ...CHARACTERS.sara, id };
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
