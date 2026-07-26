import type { TeacherExplanation } from "@/src/lib/digital-library/types";

/** Fictional warm teacher persona for G1 science (35 min). */
export const JORDAN_G1_SCIENCE_ALIKE_TEACHER_35M: TeacherExplanation = {
  totalMinutes: 35,
  teacherId: "teacher-jo-raneem-saleh",
  teacherName: "أ. رنيم صالح",
  teacherHref: "/teachers/teacher-jo-raneem-saleh",
  offerId: "offer-jo-g1-science-alike-35m",
  offerHref: "/teachers/offers/offer-jo-g1-science-alike-35m",
  titleAr: "فيديو الشرح · 35 دقيقة",
  subtitleAr: "أ. رنيم صالح · حصة AI حنونة للصف الأول",
  materials: ["صور متنوعة محترمة", "بطاقات متشابه/مختلف", "دفتر وألوان"],
  segments: [
    {
      id: "warmup",
      minutes: 5,
      titleAr: "ترحيب",
      goalAr: "أمان قبل الملاحظة.",
      teacherScript: `يا حبيبي… أنا معلّمتك رنيم.
اليوم نتشابه ونختلف باحترام. كل واحد زهرة في حديقة الصف.`,
      studentMoves: ["يضع يده على قلبه", "يبتسم لزميل"],
      boardCue: "حديقة الصف",
    },
    {
      id: "alike",
      minutes: 8,
      titleAr: "نتشابه",
      goalAr: "حاجات مشتركة.",
      teacherScript: `كلنا عيون ومي وأكل وهوا ونلعب.
ارفع إيدك إذا بتتنفس وتحب تلعب — شوفوا كم شيء مشترك!`,
      studentMoves: ["يرفع يده", "يرسم وجهًا"],
      boardCue: "حواس وحاجات",
    },
    {
      id: "different",
      minutes: 9,
      titleAr: "نختلف بحب",
      goalAr: "اختلاف محترم.",
      teacherScript: `نختلف بالطول والشعر والهوايات.
الاختلاف مش عيب — حلو. ما بنضحك على حدّا.`,
      studentMoves: ["يقول صفة مختلفة", "يضع بطاقة قلب"],
      boardCue: "مختلف = جميل",
    },
    {
      id: "practice",
      minutes: 8,
      titleAr: "تصنيف",
      goalAr: "يطبق التصنيف.",
      teacherScript: `صنّف: نتنفس · طول مختلف · نحتاج مي · هوايات مختلفة.
كل محاولة نجمة على الخد!`,
      studentMoves: ["يكمل 4 جمل", "يشارك مثالًا"],
      boardCue: "جدول تصنيف",
    },
    {
      id: "exit",
      minutes: 5,
      titleAr: "وعد",
      goalAr: "التزام احترام.",
      teacherScript: `وعد الصف: نحتفل ببعض. أحضنكم بالكلام!`,
      studentMoves: ["يقول الوعد"],
      boardCue: "وعد الحضن",
    },
  ],
};
