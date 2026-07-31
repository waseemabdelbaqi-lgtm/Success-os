/**
 * Conversation Engine — intents, student controls, affect detection.
 */
import { createHash } from "node:crypto";
import type {
  AffectSignal,
  MultimodalInput,
  StudentControlIntent,
} from "@/types/ai-teacher-engine";

export const STUDENT_CONTROL_INTENTS: StudentControlIntent[] = [
  "explain_again",
  "explain_differently",
  "easier_example",
  "harder_question",
  "translate",
  "summarize",
  "test_me",
  "skip",
  "continue",
  "go_back",
  "teach_slowly",
  "teach_faster",
  "dont_understand",
  "ask_question",
  "request_lesson",
  "request_video",
  "request_book",
  "request_help",
  "unknown",
];

type IntentRule = {
  intent: StudentControlIntent;
  patterns: RegExp[];
};

const INTENT_RULES: IntentRule[] = [
  {
    intent: "dont_understand",
    patterns: [
      /don'?t understand/i,
      /do not understand/i,
      /i'?m confused/i,
      /confused/i,
      /لا\s*أفهم/,
      /ما فهمت/,
      /مش فاهم/,
      /غير واضح/,
    ],
  },
  {
    intent: "explain_again",
    patterns: [/explain again/i, /say that again/i, /أعد الشرح/, /شرح مرة أخرى/],
  },
  {
    intent: "explain_differently",
    patterns: [
      /explain differently/i,
      /another way/i,
      /different(ly)?/i,
      /اشرح بطريقة أخرى/,
      /بطريقة مختلفة/,
    ],
  },
  {
    intent: "easier_example",
    patterns: [/easier example/i, /simpler example/i, /مثال أسهل/, /أسهل/],
  },
  {
    intent: "harder_question",
    patterns: [/harder (question|example)/i, /more difficult/i, /أصعب/, /سؤال أصعب/],
  },
  {
    intent: "translate",
    patterns: [/translate/i, /بالعربية/, /in english/i, /ترجم/],
  },
  {
    intent: "summarize",
    patterns: [/summarize/i, /summary/i, /لخّص/, /لخص/, /ملخص/],
  },
  {
    intent: "test_me",
    patterns: [/test me/i, /quiz me/i, /اختبرني/, /اختبار/],
  },
  {
    intent: "skip",
    patterns: [/^skip$/i, /skip this/i, /تخط[ىي]/, /تجاوز/],
  },
  {
    intent: "continue",
    patterns: [/^continue$/i, /keep going/i, /next/i, /تابع/, /استمر/, /التالي/],
  },
  {
    intent: "go_back",
    patterns: [/go back/i, /previous/i, /ارجع/, /رجوع/, /السابق/],
  },
  {
    intent: "teach_slowly",
    patterns: [/teach me slowly/i, /slower/i, /slowly/i, /ببطء/, /أبطئ/],
  },
  {
    intent: "teach_faster",
    patterns: [/teach me faster/i, /faster/i, /quicker/i, /أسرع/, /بسرعة/],
  },
  {
    intent: "request_video",
    patterns: [/video/i, /فيديو/],
  },
  {
    intent: "request_book",
    patterns: [/book section/i, /textbook/i, /كتاب/, /من الكتاب/],
  },
  {
    intent: "request_help",
    patterns: [/help/i, /ساعد/, /مساعدة/],
  },
  {
    intent: "request_lesson",
    patterns: [/lesson/i, /teach me/i, /درس/, /علّمني/, /علمني/],
  },
];

export function detectStudentIntent(utterance: string): StudentControlIntent {
  const t = utterance.trim();
  if (!t) return "unknown";
  for (const rule of INTENT_RULES) {
    if (rule.patterns.some((p) => p.test(t))) return rule.intent;
  }
  if (t.includes("?") || /^(what|why|how|when|where|ماذا|لماذا|كيف|متى|أين)/i.test(t)) {
    return "ask_question";
  }
  return "unknown";
}

export function detectAffect(utterance: string): AffectSignal {
  const t = utterance.toLowerCase();
  if (
    /frustrat|annoyed|hate this|give up|مستاء|محبط|زهقت|تعبت/.test(t)
  ) {
    return "frustrated";
  }
  if (/don'?t understand|confused|lost|لا أفهم|مش فاهم|محتار/.test(t)) {
    return "confused";
  }
  if (/i (got it|understand)|makes sense|easy|confident|فهمت|واضح|سهل/.test(t)) {
    return "confident";
  }
  if (/interesting|cool|love this|رائع|أحب/.test(t)) {
    return "engaged";
  }
  if (/bored|whatever|whatever|ملل|زهقان/.test(t)) {
    return "disengaged";
  }
  return "neutral";
}

export function normalizeMultimodalInputs(
  inputs: MultimodalInput[] | undefined,
): MultimodalInput[] {
  if (!inputs?.length) {
    return [{ kind: "text", ready: true, notes: ["Default text channel"] }];
  }
  return inputs.map((m) => {
    const future = m.kind === "video_conversation" || m.kind === "live_whiteboard";
    return {
      ...m,
      ready: future ? false : m.ready !== false,
      notes: future
        ? [...(m.notes || []), "Future support — architecture reserved"]
        : m.notes || [],
    };
  });
}

export function conversationTurnId(studentId: string, text: string): string {
  return `turn_${createHash("sha256")
    .update(`${studentId}|${text}|${Date.now()}`)
    .digest("hex")
    .slice(0, 12)}`;
}

export type ConversationEngineResult = {
  intent: StudentControlIntent;
  affect: AffectSignal;
  utterance: string;
  multimodal: MultimodalInput[];
  llm: false;
  controlsRecognized: true;
};
