/**
 * AI Teachers catalog — Sara & Ali only (official platform faces).
 * Identity / voice / personality from Configuration Layer (src/ai-teacher).
 * Doctrine: docs/cursor/platform-teachers-doctrine.md
 */
import type { AiTeacherProfile, AiTeachersCatalog } from "@/types/ai-teachers";
import {
  PLATFORM_TEACHER_IDS,
  PLATFORM_TEACHERS_DOCTRINE,
} from "@/types/platform-teachers";
import {
  getTeacherConfig,
  resolveTeacherVoice,
} from "@/src/ai-teacher/config";

function L(en: string, ar: string) {
  return { en, ar };
}

function assets(id: string, poses: AiTeacherProfile["assets"]["poses"]) {
  const root = `content/media/ai-teachers/${id}`;
  const publicRoot = `/media/ai-teachers/${id}`;
  return {
    root,
    publicRoot,
    portrait: `${publicRoot}/portrait.png`,
    poses: Object.fromEntries(
      Object.entries(poses).map(([k, v]) => [k, `${publicRoot}/poses/${v}`]),
    ) as AiTeacherProfile["assets"]["poses"],
  };
}

const UPDATED = "2026-08-03T20:00:00.000Z";

/** Illustrative tags only — any future subject still casts Sara/Ali. */
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

function buildCatalogEntry(
  id: "sara" | "ali",
  arName: string,
  appearanceAr: string,
  appearanceEn: string,
): AiTeacherProfile {
  const cfg = getTeacherConfig(id)!;
  const voice = resolveTeacherVoice(id);
  return {
    id,
    schema: "success-os.ai-teacher.v1",
    role: "platform_official_primary",
    displayName: L(cfg.fullName, arName),
    gender: cfg.gender,
    countryCode: "JO",
    localeCodes: ["ar-JO", "en"],
    educationalStages: [
      "early_childhood",
      "elementary",
      "middle_school",
      "high_school",
    ],
    subjects: [...ANY_PLATFORM_SUBJECTS],
    personalityTone: L(cfg.personality, cfg.personality),
    appearanceNotes: L(
      `${appearanceEn} · ${cfg.outfit}`,
      `${appearanceAr} · ${cfg.outfit}`,
    ),
    voice: {
      edgeTts: voice.voiceId,
      heygenVoiceIdEnv: id === "ali" ? "HEYGEN_VOICE_ID_ALI" : "HEYGEN_VOICE_ID_SARA",
      heygenAvatarIdEnv:
        id === "ali" ? "HEYGEN_AVATAR_ID_ALI" : "HEYGEN_AVATAR_ID_SARA",
    },
    assets: assets(id, { ...POSE_PACK }),
    digitalHumanPresetKey: id === "ali" ? "dh.jo.ali" : "dh.jo.sara",
    enabled: cfg.enabled,
    generatedBy: "cursor-image-gen",
    updatedAt: UPDATED,
  };
}

export function listAiTeachers(): AiTeacherProfile[] {
  return [
    buildCatalogEntry(
      "sara",
      "المعلمة سارة",
      "أردنية، بليزر زيتوني — معلمة مولَّدة بالذكاء الاصطناعي",
      "Jordanian woman, olive blazer — photoreal AI teacher",
    ),
    buildCatalogEntry(
      "ali",
      "المعلم علي",
      "أردني، بليزر كحلي — معلم مولَّد بالذكاء الاصطناعي",
      "Jordanian man, navy blazer — photoreal AI teacher",
    ),
  ];
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
    version: "3.0.0",
    teachers,
    counts: {
      total: teachers.length,
      female: teachers.filter((t) => t.gender === "female").length,
      male: teachers.filter((t) => t.gender === "male").length,
    },
  };
}
