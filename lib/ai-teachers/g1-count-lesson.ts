/** G1 count-to-three — master-teacher lesson beats for Sara & Ali. */

import type { TeacherPersona } from "@/lib/ai-teachers/master-coach";

export type BoardCue =
  | { at: number; type: "title" }
  | { at: number; type: "subtitle" }
  | { at: number; type: "stars"; n: number }
  | { at: number; type: "banner"; text: string }
  | { at: number; type: "big_number"; n: number; word: string }
  | { at: number; type: "apples"; n: number }
  | { at: number; type: "equation"; text: string }
  | { at: number; type: "practice_row"; n: number }
  | { at: number; type: "summary" }
  | { at: number; type: "pointer"; target: "number" | "apples" | "equation" | "practice" };

export type CheckChoice = {
  id: string;
  label: string;
  correct: boolean;
};

export type LessonBeat = {
  id: string;
  mode: "talk" | "gesture" | "celebrate";
  say: string;
  board: {
    title: string;
    subtitle: string;
    cues: BoardCue[];
  };
  /** Optional micro-check after the beat speech ends */
  check?: {
    prompt: string;
    choices: CheckChoice[];
  };
};

export function buildG1CountLesson(persona: TeacherPersona): LessonBeat[] {
  const { nameAr, gender, style } = persona;
  const proud = gender === "male" ? "فخور" : "فخورة";
  const welcome =
    style === "warm"
      ? `مرحبا يا أبطال! أنا ${nameAr}. اليوم نتعلّم العدّ حتى ثلاثة بطريقة ممتعة وواضحة. راقب السبورة، واضغط الأزرار أو كلّمني متى ما احتجت.`
      : `أهلاً. أنا ${nameAr}. هدفنا اليوم: إتقان العدّ حتى ثلاثة بدقة وسرعة. تابع السبورة، واستخدم الأوامر أو الميكروفون.`;

  return [
    {
      id: "welcome",
      mode: "talk",
      say: welcome,
      board: {
        title: "العدّ حتى ثلاثة",
        subtitle: "معلم ذكاء اصطناعي حي · الصف ١",
        cues: [
          { at: 0.05, type: "title" },
          { at: 0.3, type: "subtitle" },
          { at: 0.5, type: "stars", n: 3 },
          { at: 0.72, type: "pointer", target: "number" },
          { at: 0.85, type: "banner", text: "هيا نبدأ!" },
        ],
      },
    },
    {
      id: "one",
      mode: "gesture",
      say:
        style === "warm"
          ? "انظر معي. هذا واحد. الرقم واحد يعني شيئاً واحداً فقط. أرسم تفاحة واحدة… واحد!"
          : "ركز: واحد يساوي شيئاً واحداً. الرقم ١. الكمية واحدة. طابق بينهما الآن.",
      board: {
        title: "العدد واحد",
        subtitle: "1 = واحد",
        cues: [
          { at: 0.05, type: "title" },
          { at: 0.2, type: "big_number", n: 1, word: "واحد" },
          { at: 0.35, type: "pointer", target: "number" },
          { at: 0.5, type: "apples", n: 1 },
          { at: 0.65, type: "pointer", target: "apples" },
          { at: 0.8, type: "equation", text: "1 = واحد" },
          { at: 0.9, type: "pointer", target: "equation" },
        ],
      },
      check: {
        prompt: "كم تفاحة رسمنا؟",
        choices: [
          { id: "a", label: "١ · واحد", correct: true },
          { id: "b", label: "٢ · اثنان", correct: false },
          { id: "c", label: "٣ · ثلاثة", correct: false },
        ],
      },
    },
    {
      id: "two",
      mode: "talk",
      say:
        style === "warm"
          ? "والآن اثنان. اثنان يعني شيئين معاً. نعدّ ببطء: واحد… اثنان. وأرسم تفاحتين جميلتين."
          : "اثنان = شيئان. نعدّ: واحد، اثنان. الكمية تطابق الرقم ٢.",
      board: {
        title: "العدد اثنان",
        subtitle: "2 = اثنان",
        cues: [
          { at: 0.05, type: "title" },
          { at: 0.2, type: "big_number", n: 2, word: "اثنان" },
          { at: 0.4, type: "pointer", target: "number" },
          { at: 0.52, type: "apples", n: 2 },
          { at: 0.7, type: "pointer", target: "apples" },
          { at: 0.85, type: "equation", text: "2 = اثنان" },
        ],
      },
      check: {
        prompt: "إذا رأيت شيئين، أي رقم؟",
        choices: [
          { id: "a", label: "١", correct: false },
          { id: "b", label: "٢", correct: true },
          { id: "c", label: "٣", correct: false },
        ],
      },
    },
    {
      id: "three",
      mode: "gesture",
      say:
        style === "warm"
          ? "وأخيراً ثلاثة! ثلاثة أشياء معاً. عدّوا بصوت عالٍ معي: واحد، اثنان، ثلاثة!"
          : "ثلاثة = ثلاث كميات. عدّ بدقة: واحد، اثنان، ثلاثة. ثبّت الإجابة في ذهنك.",
      board: {
        title: "العدد ثلاثة",
        subtitle: "3 = ثلاثة",
        cues: [
          { at: 0.05, type: "title" },
          { at: 0.18, type: "big_number", n: 3, word: "ثلاثة" },
          { at: 0.35, type: "pointer", target: "number" },
          { at: 0.48, type: "apples", n: 3 },
          { at: 0.68, type: "pointer", target: "apples" },
          { at: 0.85, type: "equation", text: "3 = ثلاثة" },
        ],
      },
      check: {
        prompt: "ثلاث نجوم تساوي…",
        choices: [
          { id: "a", label: "واحد", correct: false },
          { id: "b", label: "اثنان", correct: false },
          { id: "c", label: "ثلاثة", correct: true },
        ],
      },
    },
    {
      id: "practice",
      mode: "talk",
      say:
        style === "warm"
          ? "هيا نتمرّن كالأبطال! طابق الكمية مع الرقم: واحد، اثنان، ثلاثة. أنا معك خطوة بخطوة."
          : "تمرين سريع: طابق كل كمية مع رقمها. الدقة أولاً، ثم السرعة.",
      board: {
        title: "تمرين الأبطال",
        subtitle: "طابق الكمية مع الرقم",
        cues: [
          { at: 0.06, type: "title" },
          { at: 0.25, type: "practice_row", n: 1 },
          { at: 0.45, type: "practice_row", n: 2 },
          { at: 0.65, type: "practice_row", n: 3 },
          { at: 0.78, type: "pointer", target: "practice" },
          { at: 0.9, type: "banner", text: "ممتاز!" },
        ],
      },
      check: {
        prompt: "أي صف يساوي ثلاثة؟",
        choices: [
          { id: "a", label: "صف الدائرة الواحدة", correct: false },
          { id: "b", label: "صف الدائرتين", correct: false },
          { id: "c", label: "صف الثلاث دوائر", correct: true },
        ],
      },
    },
    {
      id: "bye",
      mode: "celebrate",
      say:
        style === "warm"
          ? `أحسنت يا بطل! تعلّمنا واحد، اثنان، ثلاثة. أنا ${proud} فيك جداً. إلى اللقاء — وعدني أن تعدّ كل يوم!`
          : `أحسنت. أتقنت واحداً واثنين وثلاثة. أنا ${proud} بأدائك. كرّر التمرين غداً لتثبيت الإتقان.`,
      board: {
        title: "أحسنت!",
        subtitle: "أنهيت درس العدّ بإتقان",
        cues: [
          { at: 0.05, type: "title" },
          { at: 0.28, type: "summary" },
          { at: 0.55, type: "stars", n: 5 },
          { at: 0.82, type: "banner", text: "إلى اللقاء" },
        ],
      },
    },
  ];
}

export const INTERACTIVE_COMMANDS = [
  { id: "start", ar: "ابدأ الدرس", match: ["ابدأ", "ابدئي", "يلا", "start"] },
  { id: "next", ar: "التالي", match: ["التالي", "كمّل", "كمل", "بعدين", "next"] },
  { id: "repeat", ar: "أعد", match: ["أعد", "اعيد", "عيدها", "كرر", "repeat"] },
  { id: "simpler", ar: "أبسط", match: ["أبسط", "ابسط", "بسيط", "ما فهمت", "مش فاهم"] },
  { id: "example", ar: "مثال", match: ["مثال", "مثال ثاني", "example"] },
  { id: "challenge", ar: "تحدٍّ", match: ["تحدي", "تحدٍ", "صعّب", "challenge"] },
  { id: "pause", ar: "توقف", match: ["توقف", "وقف", "اسكت", "pause", "stop"] },
] as const;
