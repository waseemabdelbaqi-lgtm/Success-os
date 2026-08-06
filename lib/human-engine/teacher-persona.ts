/**
 * Compatibility bridge: TeacherPersona view over Teacher Mind JSON,
 * after Configuration Layer overlay (src/ai-teacher → teacher-profiles-defaults).
 * Keeps semantic-sentence / Lesson Director working without duplication.
 */
import type {
  EmotionId,
  GestureIntent,
  HumanCharacterId,
} from "@/types/human-engine";
import type { TeacherMindProfile } from "@/types/teacher-mind";
import {
  getDefaultTeacherProfile,
  listDefaultTeacherProfiles,
} from "./teacher-profiles-defaults";

export type TeacherPersonaId = string;

export type TeacherPersona = {
  id: TeacherPersonaId;
  displayName: { en: string; ar: string };
  voiceId: string;
  style: "warm" | "precise";
  addressStudent: string;
  explainVerb: string;
  checkPhrase: string;
  reexplainOpener: string;
  answerOpener: (q: string) => string;
  celebrate: string;
  gestureBias: {
    preferOpenHands: boolean;
    writingTempo: "slow_clear" | "crisp";
    walkEnergy: number;
    pointSharpness: number;
  };
  emotionBias: {
    default: EmotionId;
    onCheck: EmotionId;
    onCelebrate: EmotionId;
    intensityBoost: number;
  };
  explainGesturePool: GestureIntent[];
  interaction: {
    asksMicroChecks: boolean;
    usesEncouragementOften: boolean;
    reexplainStrategy: "analogy_then_steps" | "definition_then_example";
  };
  /** Full mind profile reference */
  profile: TeacherMindProfile;
};

function profileToPersona(p: TeacherMindProfile): TeacherPersona {
  const warm =
    p.teaching.formality === "warm_casual" ||
    p.teaching.motivation === "encourage_often";
  const writingTempo =
    p.teaching.boardWriting === "crisp_bullets" ? "crisp" : "slow_clear";
  const reexplainStrategy =
    p.teaching.answerStyle === "definition_then_example"
      ? "definition_then_example"
      : "analogy_then_steps";

  return {
    id: p.id,
    displayName: p.displayName,
    voiceId: p.voice.edgeTts,
    style: warm ? "warm" : "precise",
    addressStudent: p.phrases.addressStudent,
    explainVerb: p.phrases.explainVerb,
    checkPhrase: p.phrases.checkPhrase,
    reexplainOpener: p.phrases.reexplainOpener,
    answerOpener: (q: string) =>
      warm
        ? `سؤال حلو عن «${q.slice(0, 60)}». خلينا نرجع للفكرة الأساسية بلطف`
        : `سؤالك عن «${q.slice(0, 60)}» يُجاب بتعريف مختصر ثم خطوة تطبيق`,
    celebrate: p.phrases.celebrate,
    gestureBias: {
      preferOpenHands: p.gestureBias.preferOpenHands,
      writingTempo,
      walkEnergy: p.gestureBias.walkEnergy,
      pointSharpness: p.gestureBias.pointSharpness,
    },
    emotionBias: {
      default: (p.teaching.defaultEmotion as EmotionId) || "warm",
      onCheck: warm ? "curious" : "serious",
      onCelebrate: warm ? "celebratory" : "encouraging",
      intensityBoost: warm ? 0.12 : 0.04,
    },
    explainGesturePool: warm
      ? ["open_explain", "turn_to_student", "affirm_nod", "emphasize"]
      : ["emphasize", "point_board", "think_pause", "turn_to_board"],
    interaction: {
      asksMicroChecks: p.teaching.interaction !== "low",
      usesEncouragementOften: p.teaching.motivation === "encourage_often",
      reexplainStrategy,
    },
    profile: p,
  };
}

export function getTeacherPersona(id: HumanCharacterId): TeacherPersona {
  const pid = id === "ali" ? "ali" : id === "sara" ? "sara" : String(id);
  try {
    return profileToPersona(getDefaultTeacherProfile(pid));
  } catch {
    return profileToPersona(getDefaultTeacherProfile("sara"));
  }
}

export function listTeacherPersonas(): TeacherPersona[] {
  return listDefaultTeacherProfiles().map(profileToPersona);
}

export function personaEmotion(
  persona: TeacherPersona,
  kind: "default" | "check" | "celebrate" | "explain",
  baseIntensity: number,
): { emotion: EmotionId; intensity: number } {
  if (kind === "check") {
    return {
      emotion: persona.emotionBias.onCheck,
      intensity: Math.min(1, baseIntensity + persona.emotionBias.intensityBoost),
    };
  }
  if (kind === "celebrate") {
    return {
      emotion: persona.emotionBias.onCelebrate,
      intensity: Math.min(1, baseIntensity + 0.15 + persona.emotionBias.intensityBoost),
    };
  }
  return {
    emotion: persona.emotionBias.default,
    intensity: Math.min(1, baseIntensity + persona.emotionBias.intensityBoost * 0.5),
  };
}
