import { buildFullLesson, buildAnswerBank, buildPageMap, mcq, typeAnswer } from "@/src/lib/jordan-books/content/g1-math-s1/lesson-factory";
import type { BookRecord, UnitRecord } from "@/src/lib/jordan-books/schema/types";

export type CompanionLessonSeed = {
  id: string;
  order: number;
  titleAr: string;
  titleEn: string;
  outcomes: string[];
  hookAr: string;
  explanationAr: string;
  exampleAr: string;
  answer: string;
  options?: string[];
  correctIndex?: number;
};

export type CompanionUnitSeed = {
  id: string;
  order: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  lessons: CompanionLessonSeed[];
};

export type CompanionBookSeed = {
  id: string;
  grade: string;
  gradeAr: string;
  semester: string;
  semesterAr: string;
  subject: string;
  subjectAr: string;
  stage: string;
  officialSourceUrl: string;
  units: CompanionUnitSeed[];
};

function subjectEngineNote(subjectAr: string): string {
  if (/رياض|math|أعمال/i.test(subjectAr) || subjectAr.includes("رياضيات")) {
    return "محرك رياضيات: تمثيل رمزي · خطوات حل · مساحة عمل الطالب (KaTeX عند توفر الصيغ).";
  }
  if (/عرب|English|إنجل|أدب|نحو/i.test(subjectAr) || subjectAr.includes("لغة")) {
    return "محرك لغة: مفردات · فهم · كتابة · دعم RTL/LTR حسب المبحث.";
  }
  if (/علوم|فيزياء|كيمياء|حيات|أرض/i.test(subjectAr)) {
    return "محرك علوم: ملاحظة · سلامة · جداول بيانات · استنتاج.";
  }
  if (/اجتماع|تاريخ|جغراف|وطنية|أردن/i.test(subjectAr)) {
    return "محرك دراسات اجتماعية: خط زمني · خريطة ذهنية · سبب ونتيجة.";
  }
  if (/إسلام/i.test(subjectAr)) {
    return "محرك تربية إسلامية: مراجع نصية موثّقة لاحقاً · قيم · تطبيق.";
  }
  if (/رقمية|حاسوب|مهني/i.test(subjectAr)) {
    return "محرك رقمي/مهني: خطوات · خوارزمية · سلامة رقمية أو ورشة.";
  }
  if (/رياضة|فنية|موسيقى/i.test(subjectAr)) {
    return "محرك عملي: تسلسل مهاري · سلامة · محفظة/تأمل.";
  }
  return "محرك تفاعلي عام: تلميح · إعادة محاولة · تغذية راجعة.";
}

function seedToLesson(seed: CompanionLessonSeed, subjectAr: string): ReturnType<typeof buildFullLesson> {
  const options = seed.options || [seed.answer, "—", "—"];
  const correctIndex = typeof seed.correctIndex === "number" ? seed.correctIndex : 0;
  return buildFullLesson({
    id: seed.id,
    order: seed.order,
    titleAr: seed.titleAr,
    titleEn: seed.titleEn,
    outcomes: seed.outcomes,
    prerequisites: [`مفاهيم سابقة في ${subjectAr}`],
    vocabulary: [
      { term: seed.titleAr, definition: `مفهوم أساسي في درس «${seed.titleAr}» لمبحث ${subjectAr}.` },
    ],
    hookAr: seed.hookAr,
    whyAr: `هذا الدرس جزء من منهاج ${subjectAr} للصف المحدد — شرح Success OS أصلي بمحاذاة النواتج. ${subjectEngineNote(subjectAr)}`,
    materialsAr: "دفتر · قلم · مواد صفية بسيطة",
    keyQuestionAr: seed.outcomes[0] || "ماذا سنتعلم؟",
    definitionAr: seed.explanationAr.split(".")[0] + ".",
    explanationAr: seed.explanationAr,
    altExplanationAr: `بكلمات أبسط: ${seed.exampleAr}`,
    exampleProblemAr: seed.exampleAr,
    exampleStepsAr: `1) اقرأ المسألة. 2) فكّر بالتعريف. 3) طبّق الخطوة. 4) تحقق من الإجابة: ${seed.answer}`,
    exampleAnswerAr: seed.answer,
    wrongMethodAr: "الإجابة دون قراءة المعطيات أو حفظ جملة دون فهم.",
    realLifeAr: `تطبيق يومي مرتبط بـ ${subjectAr}.`,
    mistakesAr: "خلط المصطلحات أو نسيان التحقق.",
    guidedPromptAr: seed.exampleAr,
    guidedMcq: mcq(seed.exampleAr, options, correctIndex, `الإجابة الصحيحة: ${seed.answer}`),
    independent: [
      mcq(`راجع: ${seed.titleAr}`, options, correctIndex, `الصحيح: ${seed.answer}`),
      typeAnswer(`اكتب إجابة قصيرة عن: ${seed.titleAr}`, seed.answer, `نموذج: ${seed.answer}`, [seed.answer]),
      mcq("هل راجعت تعريف الدرس؟", ["نعم", "لا", "جزئياً"], 0, "المراجعة تثبّت التعلم."),
      typeAnswer("رتّب خطوات التعلم: اقرأ → فكّر → طبّق → تحقق", "اقرأ → فكّر → طبّق → تحقق", "الترتيب الصحيح يدعم الإتقان.", [
        "اقرأ → فكّر → طبّق → تحقق",
      ]),
    ],
    challenge: typeAnswer(`لخّص فكرة الدرس بكلمة أو جملة قصيرة`, seed.titleAr, "الملخص يرتبط بعنوان الدرس.", [
      seed.titleAr,
    ]),
    closurePoints: seed.outcomes.slice(0, 3),
    exitQuestion: mcq("هل فهمت الدرس؟", ["أحتاج مساعدة", "فهمت", "أستطيع الشرح"], 1, "تابع بالمراجعة إن احتجت."),
    estimatedMinutes: 20,
    difficulty: "core",
  });
}

export function buildCompanionBook(seed: CompanionBookSeed): BookRecord {
  const units: UnitRecord[] = seed.units.map((u) => ({
    id: u.id,
    order: u.order,
    titleAr: u.titleAr,
    titleEn: u.titleEn,
    descriptionAr: u.descriptionAr,
    verificationNote: "Official unit titles/order NEEDS VERIFICATION against current NCCD edition.",
    semesterAssignment: seed.semester,
    lessons: u.lessons.map((l) => seedToLesson(l, seed.subjectAr)),
  }));

  return {
    id: seed.id,
    country: "Jordan",
    curriculum: "national",
    curriculumVersion: "NEEDS VERIFICATION",
    academicYear: "NEEDS VERIFICATION",
    stage: seed.stage,
    grade: seed.grade,
    gradeAr: seed.gradeAr,
    semester: seed.semester,
    semesterAr: seed.semesterAr,
    subject: seed.subject,
    subjectAr: seed.subjectAr,
    officialTitleAr: `${seed.subjectAr} — كتاب تفاعلي Success OS — ${seed.semesterAr}`,
    officialTitleEn: `${seed.subject} — Success OS interactive companion — ${seed.semesterAr}`,
    bookType: "sos_companion",
    edition: "NEEDS VERIFICATION",
    publicationYear: "NEEDS VERIFICATION",
    publisher: "Success OS companion — official textbook linked only",
    officialSourceUrl: seed.officialSourceUrl,
    curriculumAuthority: "المركز الوطني لتطوير المناهج / وزارة التربية والتعليم الأردنية",
    availabilityStatus: "sos_interactive_draft",
    rightsStatus: "sos_original_aligned",
    verificationDate: "2026-07-28",
    verificationNote:
      "Original Success OS companion. Official PDF not republished. Unit/lesson titles pending NCCD confirmation where noted.",
    editorialStatus: "draft",
    completenessClaim: "sem1_core_draft",
    units,
    pageMap: buildPageMap(units),
    answerBank: units.flatMap((u) => buildAnswerBank(u.id, u.lessons)),
    glossary: units.flatMap((u) => u.lessons.flatMap((l) => l.vocabulary)),
  };
}
