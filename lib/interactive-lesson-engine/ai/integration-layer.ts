/**
 * AI Integration Layer — placeholders & contracts only.
 * No AI content generation in this PR.
 */
export type IleAiCapabilityId =
  | "ai_teacher"
  | "ai_tutor"
  | "ai_chat"
  | "ai_summary"
  | "ai_translation"
  | "ai_voice"
  | "ai_video"
  | "ai_diagram_generation";

/** Path segment aliases → canonical capability id */
const PATH_ALIASES: Record<string, IleAiCapabilityId> = {
  teacher: "ai_teacher",
  ai_teacher: "ai_teacher",
  tutor: "ai_tutor",
  ai_tutor: "ai_tutor",
  chat: "ai_chat",
  ai_chat: "ai_chat",
  summary: "ai_summary",
  ai_summary: "ai_summary",
  translation: "ai_translation",
  ai_translation: "ai_translation",
  voice: "ai_voice",
  ai_voice: "ai_voice",
  video: "ai_video",
  ai_video: "ai_video",
  diagram: "ai_diagram_generation",
  ai_diagram: "ai_diagram_generation",
  ai_diagram_generation: "ai_diagram_generation",
};

export type AiCapabilityContract = {
  id: IleAiCapabilityId;
  status: "placeholder" | "planned" | "ready";
  apiPath: string;
  accepts: string[];
  returns: string[];
  generationEnabled: false;
  notes: { en: string; ar: string };
};

export type AiInvokePayload = {
  lessonId?: string;
  slideId?: string;
  blockId?: string;
  locale?: string;
  prompt?: string;
};

export const AI_INTEGRATION_LAYER: AiCapabilityContract[] = [
  {
    id: "ai_teacher",
    status: "placeholder",
    apiPath: "/api/interactive-lesson-engine/ai/teacher",
    accepts: ["lessonId", "locale", "sectionId"],
    returns: ["scriptDraft", "objectives"],
    generationEnabled: false,
    notes: {
      en: "Placeholder — no AI teacher generation in this PR.",
      ar: "موضع — لا توليد معلّم ذكي في هذا الـ PR.",
    },
  },
  {
    id: "ai_tutor",
    status: "placeholder",
    apiPath: "/api/interactive-lesson-engine/ai/tutor",
    accepts: ["lessonId", "question"],
    returns: ["explanation"],
    generationEnabled: false,
    notes: {
      en: "Placeholder for adaptive tutoring.",
      ar: "موضع للتدريس التكيّفي.",
    },
  },
  {
    id: "ai_chat",
    status: "placeholder",
    apiPath: "/api/interactive-lesson-engine/ai/chat",
    accepts: ["lessonId", "messages"],
    returns: ["message"],
    generationEnabled: false,
    notes: {
      en: "Lesson-scoped chat contract only.",
      ar: "عقد محادثة ضمن الدرس فقط.",
    },
  },
  {
    id: "ai_summary",
    status: "placeholder",
    apiPath: "/api/interactive-lesson-engine/ai/summary",
    accepts: ["lessonId"],
    returns: ["summary"],
    generationEnabled: false,
    notes: {
      en: "Summary generation deferred.",
      ar: "توليد الملخص مؤجّل.",
    },
  },
  {
    id: "ai_translation",
    status: "placeholder",
    apiPath: "/api/interactive-lesson-engine/ai/translation",
    accepts: ["text", "from", "to"],
    returns: ["text"],
    generationEnabled: false,
    notes: {
      en: "Translation pipeline deferred.",
      ar: "مسار الترجمة مؤجّل.",
    },
  },
  {
    id: "ai_voice",
    status: "placeholder",
    apiPath: "/api/interactive-lesson-engine/ai/voice",
    accepts: ["text", "locale"],
    returns: ["audioUrl"],
    generationEnabled: false,
    notes: {
      en: "Voice / ElevenLabs deferred.",
      ar: "الصوت / ElevenLabs مؤجّل.",
    },
  },
  {
    id: "ai_video",
    status: "placeholder",
    apiPath: "/api/interactive-lesson-engine/ai/video",
    accepts: ["lessonId", "script"],
    returns: ["videoUrl"],
    generationEnabled: false,
    notes: {
      en: "HeyGen / AI video deferred — never auto-generate here.",
      ar: "فيديو HeyGen / الذكاء الاصطناعي مؤجّل — لا توليد تلقائي هنا.",
    },
  },
  {
    id: "ai_diagram_generation",
    status: "placeholder",
    apiPath: "/api/interactive-lesson-engine/ai/diagram",
    accepts: ["prompt"],
    returns: ["svg", "mermaid"],
    generationEnabled: false,
    notes: {
      en: "Diagram generation deferred.",
      ar: "توليد المخططات مؤجّل.",
    },
  },
];

export function resolveAiCapabilityId(raw: string): IleAiCapabilityId | null {
  return PATH_ALIASES[raw] || null;
}

export function listAiCapabilities(): AiCapabilityContract[] {
  return AI_INTEGRATION_LAYER;
}

export function getAiCapability(id: IleAiCapabilityId | string): AiCapabilityContract | null {
  const resolved = resolveAiCapabilityId(String(id)) || (id as IleAiCapabilityId);
  return AI_INTEGRATION_LAYER.find((c) => c.id === resolved) || null;
}

/** Always refuses generation in this PR. */
export async function invokeAiCapability(
  id: IleAiCapabilityId | string,
  _payload: AiInvokePayload = {},
) {
  const meta = getAiCapability(id);
  if (!meta) {
    return {
      ok: false as const,
      error: "UNKNOWN_CAPABILITY",
      message: `Unknown AI capability: ${id}`,
      generationEnabled: false as const,
    };
  }
  return {
    ok: false as const,
    error: "AI_GENERATION_DISABLED",
    message:
      "Interactive Lesson Engine foundation PR: AI content generation is disabled. Placeholders only.",
    generationEnabled: false as const,
    capability: meta,
  };
}
