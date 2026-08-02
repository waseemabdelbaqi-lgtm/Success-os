/**
 * Independent teacher personas — Sara & Ali are not reskins.
 * Personality / voice / pacing / body language / facial bias / student interaction.
 */
import type {
  EmotionId,
  GestureIntent,
  HumanCharacterId,
} from "@/types/human-engine";

export type TeacherPersonaId = "sara" | "ali";

export type TeacherPersona = {
  id: TeacherPersonaId;
  displayName: { en: string; ar: string };
  voiceId: string;
  style: "warm" | "precise";
  /** Spoken register differences */
  addressStudent: string;
  explainVerb: string;
  checkPhrase: string;
  reexplainOpener: string;
  answerOpener: (q: string) => string;
  celebrate: string;
  /** Motion / affect biases applied by directors */
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
  /** Prefer these gestures when act is generic explain */
  explainGesturePool: GestureIntent[];
  interaction: {
    asksMicroChecks: boolean;
    usesEncouragementOften: boolean;
    reexplainStrategy: "analogy_then_steps" | "definition_then_example";
  };
};

const SARA: TeacherPersona = {
  id: "sara",
  displayName: { en: "Teacher Sara", ar: "المعلمة سارة" },
  voiceId: "ar-JO-SanaNeural",
  style: "warm",
  addressStudent: "يا أحلى صف",
  explainVerb: "خلينا نشوفها بهدوء",
  checkPhrase: "فكروا معي شوي قبل ما تجاوبوا",
  reexplainOpener: "تمام، بشرحها بطريقة أبسط وبمثال قريب منكم",
  answerOpener: (q) =>
    `سؤال حلو عن «${q.slice(0, 60)}». خلينا نرجع للفكرة الأساسية بلطف`,
  celebrate: "أحسنت! أنا فخورة فيك",
  gestureBias: {
    preferOpenHands: true,
    writingTempo: "slow_clear",
    walkEnergy: 0.85,
    pointSharpness: 0.7,
  },
  emotionBias: {
    default: "warm",
    onCheck: "curious",
    onCelebrate: "celebratory",
    intensityBoost: 0.12,
  },
  explainGesturePool: ["open_explain", "turn_to_student", "affirm_nod", "emphasize"],
  interaction: {
    asksMicroChecks: true,
    usesEncouragementOften: true,
    reexplainStrategy: "analogy_then_steps",
  },
};

const ALI: TeacherPersona = {
  id: "ali",
  displayName: { en: "Teacher Ali", ar: "المعلم علي" },
  voiceId: "ar-JO-TaimNeural",
  style: "precise",
  addressStudent: "يا جماعة",
  explainVerb: "نرتّب الفكرة بدقة",
  checkPhrase: "قبل الجواب: عرّف المفهوم ثم طبّقه",
  reexplainOpener: "حسناً. نعيد التعريف أولاً، ثم مثال تطبيقي مباشر",
  answerOpener: (q) =>
    `سؤالك عن «${q.slice(0, 60)}» يُجاب بتعريف مختصر ثم خطوة تطبيق`,
  celebrate: "ممتاز. ضبطت المفهوم",
  gestureBias: {
    preferOpenHands: false,
    writingTempo: "crisp",
    walkEnergy: 1.05,
    pointSharpness: 1.15,
  },
  emotionBias: {
    default: "focused",
    onCheck: "serious",
    onCelebrate: "encouraging",
    intensityBoost: 0.04,
  },
  explainGesturePool: ["emphasize", "point_board", "think_pause", "turn_to_board"],
  interaction: {
    asksMicroChecks: true,
    usesEncouragementOften: false,
    reexplainStrategy: "definition_then_example",
  },
};

export function getTeacherPersona(id: HumanCharacterId): TeacherPersona {
  return id === "ali" ? ALI : SARA;
}

export function listTeacherPersonas(): TeacherPersona[] {
  return [SARA, ALI];
}

/** Apply persona bias onto a base emotion intensity. */
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
  if (kind === "explain") {
    return {
      emotion: persona.emotionBias.default,
      intensity: Math.min(1, baseIntensity + persona.emotionBias.intensityBoost * 0.5),
    };
  }
  return {
    emotion: persona.emotionBias.default,
    intensity: Math.min(1, baseIntensity + persona.emotionBias.intensityBoost),
  };
}
