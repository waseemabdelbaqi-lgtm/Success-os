/**
 * Adaptive re-explain sequence when a student does not understand.
 *
 *   Student: "I don't understand this."
 *   ↓
 *   Teacher: "No problem. Let's explain it differently."
 *   ↓ Animation → Drawing → Example → Question → Checks understanding
 *
 * Scripted pedagogy only — no AI lesson/video/quiz generation.
 */
import type { LocaleText } from "@/types/interactive-lesson-engine";

export type ReExplainStepId =
  | "student_utterance"
  | "teacher_response"
  | "animation"
  | "drawing"
  | "example"
  | "question"
  | "check_understanding";

export type ReExplainStep = {
  id: ReExplainStepId;
  order: number;
  title: LocaleText;
  body: LocaleText;
  kind: "dialogue" | "media" | "interactive" | "check";
  /** Optional ILE section hint to jump to */
  ileSectionHint?: string;
};

export type ReExplainSequence = {
  schema: "success-os.s4s-re-explain.v1";
  trigger: string;
  studentLine: LocaleText;
  teacherLine: LocaleText;
  path: ReExplainStepId[];
  displayPath: string[];
  steps: ReExplainStep[];
  topic: LocaleText;
  generatesContent: false;
  checksUnderstanding: true;
};

export type BuildReExplainInput = {
  topicEn?: string;
  topicAr?: string;
  studentUtterance?: string;
};

function L(en: string, ar: string): LocaleText {
  return { en, ar };
}

const DONT_UNDERSTAND_PATTERNS = [
  /don'?t understand/i,
  /do not understand/i,
  /i'?m confused/i,
  /confused/i,
  /لا\s*أفهم/,
  /ما فهمت/,
  /مش فاهم/,
  /غير واضح/,
];

/** True when the student utterance means they need a different explanation. */
export function isDontUnderstandUtterance(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return DONT_UNDERSTAND_PATTERNS.some((p) => p.test(t));
}

/**
 * Build the canonical re-explain path for S4S Intelligence Teacher.
 */
export function buildReExplainSequence(
  input: BuildReExplainInput = {},
): ReExplainSequence {
  const topicEn = input.topicEn || "Fractions";
  const topicAr = input.topicAr || "الكسور";
  const topic = L(topicEn, topicAr);

  const steps: ReExplainStep[] = [
    {
      id: "student_utterance",
      order: 1,
      title: L("Student", "الطالب"),
      body: L("I don't understand this.", "لا أفهم هذا."),
      kind: "dialogue",
    },
    {
      id: "teacher_response",
      order: 2,
      title: L("Teacher", "المعلم"),
      body: L(
        "No problem.\nLet's explain it differently.",
        "لا بأس.\nدعنا نشرحها بطريقة مختلفة.",
      ),
      kind: "dialogue",
    },
    {
      id: "animation",
      order: 3,
      title: L("Animation", "رسوم متحركة"),
      body: L(
        `Watch a short motion explanation of ${topicEn} — same idea, different view.`,
        `شاهد شرحًا متحركًا قصيرًا لـ ${topicAr} — نفس الفكرة بمنظور مختلف.`,
      ),
      kind: "media",
      ileSectionHint: "animations",
    },
    {
      id: "drawing",
      order: 4,
      title: L("Drawing", "رسم"),
      body: L(
        `Sketch the idea yourself — draw ${topicEn} in the workspace canvas.`,
        `ارسم الفكرة بنفسك — ارسم ${topicAr} في مساحة العمل.`,
      ),
      kind: "interactive",
    },
    {
      id: "example",
      order: 5,
      title: L("Example", "مثال"),
      body: L(
        `Worked example: take a simple ${topicEn} case and label each part.`,
        `مثال محلول: خذ حالة بسيطة من ${topicAr} وسمِّ كل جزء.`,
      ),
      kind: "media",
      ileSectionHint: "examples",
    },
    {
      id: "question",
      order: 6,
      title: L("Question", "سؤال"),
      body: L(
        `Quick check: which statement about ${topicEn} is true?`,
        `تحقق سريع: أي عبارة عن ${topicAr} صحيحة؟`,
      ),
      kind: "interactive",
      ileSectionHint: "interactive_slides",
    },
    {
      id: "check_understanding",
      order: 7,
      title: L("Checks understanding", "التحقق من الفهم"),
      body: L(
        "Do you understand it now, or should we try another path?",
        "هل فهمت الآن، أم نجرب مسارًا آخر؟",
      ),
      kind: "check",
    },
  ];

  return {
    schema: "success-os.s4s-re-explain.v1",
    trigger: input.studentUtterance || "I don't understand this.",
    studentLine: L("I don't understand this.", "لا أفهم هذا."),
    teacherLine: L(
      "No problem.\nLet's explain it differently.",
      "لا بأس.\nدعنا نشرحها بطريقة مختلفة.",
    ),
    path: steps.map((s) => s.id),
    displayPath: [
      "Student: I don't understand this.",
      "Teacher: No problem. Let's explain it differently.",
      "Animation",
      "Drawing",
      "Example",
      "Question",
      "Checks understanding",
    ],
    steps,
    topic,
    generatesContent: false,
    checksUnderstanding: true,
  };
}
