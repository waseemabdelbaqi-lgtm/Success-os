import { withAiAssistantTitle } from "@/src/lib/digital-library/ai-assistant-teacher";
import type { TeacherExplanation } from "@/src/lib/digital-library/types";

/** Fictional warm AI assistant teacher persona for G1 math (35 min). */
export const JORDAN_G1_MATH_NUMBER_LINE_TEACHER_35M: TeacherExplanation = {
  totalMinutes: 35,
  teacherId: "teacher-jo-lama-nouri",
  teacherName: withAiAssistantTitle("أ. لاما النوري"),
  teacherHref: "/teachers/teacher-jo-lama-nouri",
  offerId: "offer-jo-g1-math-numberline-35m",
  offerHref: "/teachers/offers/offer-jo-g1-math-numberline-35m",
  titleAr: "فيديو الشرح · 35 دقيقة",
  subtitleAr: `${withAiAssistantTitle("أ. لاما النوري")} · حصة AI دافئة للصف الأول`,
  materials: [
    "خط أعداد ملون 0–20",
    "مكعبات أو أصابع",
    "دفتر وقلم تلوين",
    "مجسّم 3D في الدرس",
  ],
  segments: [
    {
      id: "warmup",
      minutes: 5,
      titleAr: "تهيئة حنونة",
      goalAr: "نطَمئن الطفل ونفتح باب اللعب.",
      teacherScript: `يا قمري… أنا معلّمتك لاما.
اليوم نجمع بالحلوى والقفز على خط الأعداد.
صفّق مرتين وابتسم — جاهزين؟
إذا كان معي 3 حلوات وصاحبي أعطاني 2… كم صار؟ الغلط عندي بوسة تشجيع!`,
      studentMoves: ["يبتسم ويصفّق", "يخمن قصة الجمع"],
      boardCue: "جمع = نحط مع بعض · نقفز لليمين",
    },
    {
      id: "model",
      minutes: 8,
      titleAr: "شرح بالقفز",
      goalAr: "يشاهد 3 + 4 كاملًا.",
      teacherScript: `ارسم خط أعداد من 0 إلى 20.
المسألة: 3 + 4.
نبدأ على 3… قفزة قفزة قفزة قفزة… نصل 7.
افتح المجسّم الثلاثي الأبعاد وشوف الكرة كيف تقفز. أنت بطل!`,
      studentMoves: ["يقفز بإصبعه", "يفتح 3D"],
      boardCue: "3 → hop×4 → 7",
    },
    {
      id: "guided",
      minutes: 10,
      titleAr: "تدريب موجّه",
      goalAr: "يحل 4 مسائل مع المعلّمة.",
      teacherScript: `نحل سوا:
2 + 3 = 5
5 + 2 = 7
قصة: 6 تفاحات + 3 = 9
8 + 7 = 15
كل خطوة بصوت شجاع لطيف. الغلط عادي ونصحح بحب.`,
      studentMoves: ["يجيب بصوت عالٍ", "يتحقق بمكعبات"],
      boardCue: "جدول مسائل",
    },
    {
      id: "independent",
      minutes: 7,
      titleAr: "تدريب مستقل",
      goalAr: "يطبق وحده.",
      teacherScript: `سبع دقايق لوحدك:
4+4 · 1+9 · 7+3 · قصة ملصقات 5+6.
ابدأ → اقفز → اقرأ → تحقق. أنا فخورة فيك أصلًا.`,
      studentMoves: ["يحل 4 مسائل", "يستخدم مساحة العمل"],
      boardCue: "مؤقت 7:00",
    },
    {
      id: "exit",
      minutes: 5,
      titleAr: "ختام",
      goalAr: "يخرج فاهمًا فخورًا.",
      teacherScript: `الجمع لليمين؟ ابدأ 6 واقفز 2 → 8.
علّم أخاك بجملة حنونة. أحبكم يا قمري!`,
      studentMoves: ["يجيب سؤالين", "يقول جملة شرح"],
      boardCue: "بطاقات خروج",
    },
  ],
};
