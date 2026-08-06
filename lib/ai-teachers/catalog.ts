/**
 * AI Teachers catalog — Sara & Ali only.
 * Pure projection of Configuration Layer (src/ai-teacher/teachers/*).
 */
import type { AiTeacherProfile, AiTeachersCatalog } from "@/types/ai-teachers";
import {
  PLATFORM_TEACHER_IDS,
  PLATFORM_TEACHERS_DOCTRINE,
} from "@/types/platform-teachers";
import {
  getTeacherAppearance,
  getTeacherDisplayName,
  getTeacherPersonalityLock,
  listTeacherConfigs,
  resolveTeacherVoice,
} from "@/src/ai-teacher/config";

function L(en: string, ar: string) {
  return { en, ar };
}

const UPDATED = "2026-08-04T18:00:00.000Z";

const ANY_PLATFORM_SUBJECTS: AiTeacherProfile["subjects"] = [
  "math",
  "science",
  "physics",
  "chemistry",
  "biology",
  "arabic",
  "english",
  "islamic",
  "social",
  "general",
];

const POSE_PACK = {
  talk: "talk.png",
  point: "point.png",
  write: "write.png",
  idle: "idle.png",
} as const;

function buildCatalogEntry(id: "sara" | "ali"): AiTeacherProfile {
  const cfg = listTeacherConfigs().find((t) => t.id === id)!;
  const voice = resolveTeacherVoice(id, cfg.defaultLocale);
  const names = getTeacherDisplayName(id);
  const appearance = getTeacherAppearance(id);
  const lock = getTeacherPersonalityLock(id);
  const root = `content/media/ai-teachers/${id}`;
  const publicRoot = appearance.assetRoot;

  return {
    id,
    schema: "success-os.ai-teacher.v1",
    role: "platform_official_primary",
    displayName: L(names.en, names.ar),
    gender: cfg.gender,
    countryCode: appearance.countryCode,
    localeCodes: [...cfg.localeCodes],
    educationalStages: [
      "early_childhood",
      "elementary",
      "middle_school",
      "high_school",
    ],
    subjects: [...ANY_PLATFORM_SUBJECTS],
    personalityTone: L(lock.summary, lock.traits.join(" · ")),
    appearanceNotes: L(
      `${appearance.outfitKey} · ${cfg.outfit}`,
      `${appearance.outfitKey} · ${cfg.outfit}`,
    ),
    voice: {
      edgeTts: voice.voiceId,
      heygenVoiceIdEnv: id === "ali" ? "HEYGEN_VOICE_ID_ALI" : "HEYGEN_VOICE_ID_SARA",
      heygenAvatarIdEnv:
        id === "ali" ? "HEYGEN_AVATAR_ID_ALI" : "HEYGEN_AVATAR_ID_SARA",
    },
    assets: {
      root,
      publicRoot,
      portrait: `${publicRoot}/portrait.png`,
      poses: Object.fromEntries(
        Object.entries(POSE_PACK).map(([k, v]) => [k, `${publicRoot}/poses/${v}`]),
      ) as AiTeacherProfile["assets"]["poses"],
    },
    digitalHumanPresetKey: appearance.digitalHumanPresetKey,
    enabled: cfg.enabled,
    generatedBy: "cursor-image-gen",
    updatedAt: UPDATED,
  };
}

export function listAiTeachers(): AiTeacherProfile[] {
  return listTeacherConfigs().map((t) => buildCatalogEntry(t.id));
}

export function getAiTeacher(id: string): AiTeacherProfile | undefined {
  return listAiTeachers().find((t) => t.id === id && t.enabled);
}

export function teachersByGender(gender: "female" | "male"): AiTeacherProfile[] {
  return listAiTeachers().filter((t) => t.gender === gender && t.enabled);
}

export function buildAiTeachersCatalog(): AiTeachersCatalog {
  const teachers = listAiTeachers();
  const ids = teachers.map((t) => t.id).slice().sort();
  if (
    teachers.length !== PLATFORM_TEACHER_IDS.length ||
    ids.join(",") !== [...PLATFORM_TEACHER_IDS].sort().join(",")
  ) {
    throw new Error(
      `Catalog must be exactly ${PLATFORM_TEACHER_IDS.join("+")} (${PLATFORM_TEACHERS_DOCTRINE.doctrineDoc})`,
    );
  }
  for (const t of teachers) {
    if (t.role !== "platform_official_primary") {
      throw new Error(`Teacher ${t.id} must be platform_official_primary`);
    }
  }
  return {
    schema: "success-os.ai-teachers.v1",
    version: "4.0.0",
    teachers,
    counts: {
      total: teachers.length,
      female: teachers.filter((t) => t.gender === "female").length,
      male: teachers.filter((t) => t.gender === "male").length,
    },
  };
}
