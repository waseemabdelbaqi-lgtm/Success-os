/** G1 count-to-three — natural classroom lesson for Sara & Ali. */

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
  /** Preferred classroom body pose */
  pose: "stand" | "point" | "write";
  say: string;
  board: {
    title: string;
    subtitle: string;
    cues: BoardCue[];
  };
  check?: {
    prompt: string;
    choices: CheckChoice[];
  };
};

export function buildG1CountLesson(persona: TeacherPersona): LessonBeat[] {
  const { nameAr, gender, style } = persona;
  const proud = gender === "male" ? "فخور" : "فخورة";
  const kids = style === "warm" ? "يا أحلى صف" : "يا جماعة";

  const welcome =
    style === "warm"
      ? `مرحبا ${kids}. أنا ${nameAr}. اليوم مثل أي حصة حقيقية: نركز، نشوف السبورة، ونعدّ مع بعض لحد ثلاثة. جاهزين؟`
      : `أهلاً ${kids}. أنا ${nameAr}. خلينا نتعامل كأننا بصف حقيقي: تركيز، سبورة، وعدّ مضبوط لحد ثلاثة. يلا نبدأ.`;

  return [
    {
      id: "welcome",
      mode: "talk",
      pose: "stand",
      say: welcome,
      board: {
        title: "العدّ حتى ثلاثة",
        subtitle: "حصة صفّية حيّة · الصف ١",
        cues: [
          { at: 0.08, type: "title" },
          { at: 0.35, type: "subtitle" },
          { at: 0.58, type: "stars", n: 3 },
          { at: 0.82, type: "banner", text: "افتحوا عيونكم على السبورة" },
        ],
      },
    },
    {
      id: "one",
      mode: "gesture",
      pose: "write",
      say:
        style === "warm"
          ? "شوفوا السبورة معي. برسم الرقم واحد. واحد يعني شيء واحد فقط. وهون تفاحة واحدة. عدّوا وراي: واحد."
          : "ركزوا على السبورة. بكتب واحد. واحد يساوي كمية واحدة. تفاحة واحدة. عدّوا: واحد.",
      board: {
        title: "العدد واحد",
        subtitle: "1 = واحد",
        cues: [
          { at: 0.06, type: "title" },
          { at: 0.22, type: "big_number", n: 1, word: "واحد" },
          { at: 0.4, type: "pointer", target: "number" },
          { at: 0.55, type: "apples", n: 1 },
          { at: 0.72, type: "pointer", target: "apples" },
          { at: 0.88, type: "equation", text: "1 = واحد" },
        ],
      },
      check: {
        prompt: "كم تفاحة على السبورة؟",
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
      pose: "point",
      say:
        style === "warm"
          ? "حلو. هلأ اثنان. يعني شيئين مع بعض. بصوّر تفاحتين، وبرجع أشير على الرقم. عدّوا وراي: واحد… اثنان."
          : "تمام. الآن اثنان. شيئان معاً. تفاحتان، والرقم اثنان. عدّوا بدقة: واحد، اثنان.",
      board: {
        title: "العدد اثنان",
        subtitle: "2 = اثنان",
        cues: [
          { at: 0.06, type: "title" },
          { at: 0.22, type: "big_number", n: 2, word: "اثنان" },
          { at: 0.4, type: "pointer", target: "number" },
          { at: 0.55, type: "apples", n: 2 },
          { at: 0.74, type: "pointer", target: "apples" },
          { at: 0.9, type: "equation", text: "2 = اثنان" },
        ],
      },
      check: {
        prompt: "إذا شفت شيئين… الرقم كم؟",
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
      pose: "write",
      say:
        style === "warm"
          ? "وآخر عدد لليوم: ثلاثة. بكتب ثلاثة، وبرسم ثلاث تفاحات. بصوت عالي معي: واحد، اثنان، ثلاثة!"
          : "آخر عدد: ثلاثة. بكتب الرقم، وبثبت ثلاث كميات. عدّوا بوضوح: واحد، اثنان، ثلاثة.",
      board: {
        title: "العدد ثلاثة",
        subtitle: "3 = ثلاثة",
        cues: [
          { at: 0.06, type: "title" },
          { at: 0.2, type: "big_number", n: 3, word: "ثلاثة" },
          { at: 0.38, type: "pointer", target: "number" },
          { at: 0.52, type: "apples", n: 3 },
          { at: 0.72, type: "pointer", target: "apples" },
          { at: 0.9, type: "equation", text: "3 = ثلاثة" },
        ],
      },
      check: {
        prompt: "ثلاث نجوم تعني…",
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
      pose: "point",
      say:
        style === "warm"
          ? "هيا نراجع زي صف حقيقي. طابقوا الكمية مع الرقم: واحد، اثنان، ثلاثة. أنا ماشية معكم سطر سطر."
          : "مراجعة صفّية سريعة. طابقوا كل كمية مع رقمها: واحد، اثنان، ثلاثة. الدقة قبل السرعة.",
      board: {
        title: "مراجعة الصف",
        subtitle: "طابق الكمية مع الرقم",
        cues: [
          { at: 0.08, type: "title" },
          { at: 0.28, type: "practice_row", n: 1 },
          { at: 0.5, type: "practice_row", n: 2 },
          { at: 0.72, type: "practice_row", n: 3 },
          { at: 0.9, type: "banner", text: "ممتاز يا صف" },
        ],
      },
      check: {
        prompt: "أي صف يمثّل ثلاثة؟",
        choices: [
          { id: "a", label: "دائرة واحدة", correct: false },
          { id: "b", label: "دائرتان", correct: false },
          { id: "c", label: "ثلاث دوائر", correct: true },
        ],
      },
    },
    {
      id: "bye",
      mode: "celebrate",
      pose: "stand",
      say:
        style === "warm"
          ? `أحسنتم. تعلّمنا واحد، اثنان، ثلاثة مثل حصة كاملة. أنا ${proud} فيكم. خلصنا لليوم، وإلى اللقاء.`
          : `أحسنتم. ثبتنا واحداً واثنين وثلاثة. أنا ${proud} بأدائكم. انتهت الحصة، وإلى اللقاء.`,
      board: {
        title: "انتهت الحصة",
        subtitle: "أتقنت العدّ حتى ثلاثة",
        cues: [
          { at: 0.08, type: "title" },
          { at: 0.32, type: "summary" },
          { at: 0.62, type: "stars", n: 5 },
          { at: 0.86, type: "banner", text: "إلى اللقاء" },
        ],
      },
    },
  ];
}

export const INTERACTIVE_COMMANDS = [
  { id: "start", ar: "ابدأ الحصة", match: ["ابدأ", "ابدئي", "يلا", "الحصة", "start"] },
  { id: "next", ar: "التالي", match: ["التالي", "كمّل", "كمل", "بعدين", "next"] },
  { id: "repeat", ar: "أعد", match: ["أعد", "اعيد", "عيدها", "كرر", "repeat"] },
  { id: "simpler", ar: "أبسط", match: ["أبسط", "ابسط", "بسيط", "ما فهمت", "مش فاهم"] },
  { id: "example", ar: "مثال", match: ["مثال", "مثال ثاني", "example"] },
  { id: "challenge", ar: "تحدٍّ", match: ["تحدي", "تحدٍ", "صعّب", "challenge"] },
  { id: "pause", ar: "توقف", match: ["توقف", "وقف", "اسكت", "pause", "stop"] },
] as const;
