/** Shared G1 count-to-three lesson beats for interactive classroom + renderers. */

export type BoardCue =
  | { at: number; type: "title" }
  | { at: number; type: "subtitle" }
  | { at: number; type: "stars"; n: number }
  | { at: number; type: "banner"; text: string }
  | { at: number; type: "big_number"; n: number; word: string }
  | { at: number; type: "apples"; n: number }
  | { at: number; type: "equation"; text: string }
  | { at: number; type: "practice_row"; n: number }
  | { at: number; type: "summary" };

export type LessonBeat = {
  id: string;
  mode: "talk" | "gesture";
  say: string;
  board: {
    title: string;
    subtitle: string;
    cues: BoardCue[];
  };
};

export function buildG1CountLesson(teacherNameAr: string, gender: "female" | "male"): LessonBeat[] {
  const proud = gender === "male" ? "فخور" : "فخورة";
  return [
    {
      id: "welcome",
      mode: "talk",
      say: `مرحبا أصدقائي. أنا ${teacherNameAr}، معلمكم بالذكاء الاصطناعي. اليوم سنتعلم العد حتى ثلاثة معاً. اضغط الأزرار أو كلّمني!`,
      board: {
        title: "العدّ حتى ثلاثة",
        subtitle: "معلم ذكاء اصطناعي حي · الصف 1",
        cues: [
          { at: 0.05, type: "title" },
          { at: 0.35, type: "subtitle" },
          { at: 0.55, type: "stars", n: 3 },
          { at: 0.8, type: "banner", text: "هيا نبدأ!" },
        ],
      },
    },
    {
      id: "one",
      mode: "gesture",
      say: "انظر معي على السبورة. هذا واحد. الرقم واحد يعني شيئاً واحداً فقط. أرسم تفاحة واحدة.",
      board: {
        title: "العدد واحد",
        subtitle: "1 = واحد",
        cues: [
          { at: 0.05, type: "title" },
          { at: 0.25, type: "big_number", n: 1, word: "واحد" },
          { at: 0.5, type: "apples", n: 1 },
          { at: 0.78, type: "equation", text: "1 = واحد" },
        ],
      },
    },
    {
      id: "two",
      mode: "talk",
      say: "والآن اثنان. اثنان يعني شيئين معاً. نعدّ: واحد، اثنان. وأرسم تفاحتين.",
      board: {
        title: "العدد اثنان",
        subtitle: "2 = اثنان",
        cues: [
          { at: 0.05, type: "title" },
          { at: 0.22, type: "big_number", n: 2, word: "اثنان" },
          { at: 0.48, type: "apples", n: 2 },
          { at: 0.78, type: "equation", text: "2 = اثنان" },
        ],
      },
    },
    {
      id: "three",
      mode: "gesture",
      say: "وأخيراً ثلاثة. ثلاثة أشياء معاً. عدّوا بصوت عالٍ: واحد، اثنان، ثلاثة!",
      board: {
        title: "العدد ثلاثة",
        subtitle: "3 = ثلاثة",
        cues: [
          { at: 0.05, type: "title" },
          { at: 0.2, type: "big_number", n: 3, word: "ثلاثة" },
          { at: 0.45, type: "apples", n: 3 },
          { at: 0.78, type: "equation", text: "3 = ثلاثة" },
        ],
      },
    },
    {
      id: "practice",
      mode: "talk",
      say: "هيا نتمرن معاً. طابق الكمية مع الرقم: واحد، اثنان، ثلاثة. ممتاز! أنتم أبطال.",
      board: {
        title: "تمرين الأبطال",
        subtitle: "طابق الكمية مع الرقم",
        cues: [
          { at: 0.08, type: "title" },
          { at: 0.28, type: "practice_row", n: 1 },
          { at: 0.5, type: "practice_row", n: 2 },
          { at: 0.72, type: "practice_row", n: 3 },
          { at: 0.9, type: "banner", text: "ممتاز!" },
        ],
      },
    },
    {
      id: "bye",
      mode: "talk",
      say: `أحسنت يا بطل. تعلّمنا واحد، اثنان، ثلاثة. أنا ${proud} فيك. إلى اللقاء!`,
      board: {
        title: "أحسنت!",
        subtitle: "أنهيت درس العدّ",
        cues: [
          { at: 0.05, type: "title" },
          { at: 0.3, type: "summary" },
          { at: 0.6, type: "stars", n: 3 },
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
  { id: "pause", ar: "توقف", match: ["توقف", "وقف", "اسكت", "pause", "stop"] },
] as const;
