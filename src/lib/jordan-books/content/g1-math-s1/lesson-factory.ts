import type {
  AnswerBankEntry,
  ContentBlock,
  LessonRecord,
  PageMapEntry,
  QuestionPayload,
  SourceRecord,
} from "@/src/lib/jordan-books/schema/types";

export const NCCD_SOURCE: SourceRecord = {
  name: "NCCD Grade 1 textbook catalogue",
  url: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
  authorityType: "official-authority",
  usage: "curriculum-alignment-and-official-link-only",
  license: "official-framework-reference",
  verificationDate: "2026-07-28",
  notes: "Official PDF not republished. Success OS text is original.",
};

export const MINHAJI_SOURCE: SourceRecord = {
  name: "Minhaji structure companion (titles only)",
  url: "https://minhaji.net/lesson/44/%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA",
  authorityType: "structure-index-companion",
  usage: "unit-lesson-title-order-hints-never-copy-prose",
  license: "companion-index-only",
  verificationDate: "2026-07-28",
};

type LessonSpec = {
  id: string;
  order: number;
  titleAr: string;
  titleEn: string;
  outcomes: string[];
  skills?: string[];
  prerequisites: string[];
  vocabulary: Array<{ term: string; definition: string }>;
  hookAr: string;
  whyAr: string;
  materialsAr: string;
  keyQuestionAr: string;
  explanationAr: string;
  altExplanationAr: string;
  definitionTitleAr?: string;
  definitionAr: string;
  diagramAr?: string;
  formulaAr?: string;
  formulaTeX?: string;
  exampleProblemAr: string;
  exampleStepsAr: string;
  exampleAnswerAr: string;
  wrongMethodAr: string;
  realLifeAr: string;
  mistakesAr: string;
  mistakeItems?: string[];
  guidedPromptAr: string;
  guidedMcq: QuestionPayload;
  independent: QuestionPayload[];
  challenge: QuestionPayload;
  closurePoints: string[];
  exitQuestion: QuestionPayload;
  estimatedMinutes?: number;
  difficulty?: LessonRecord["difficulty"];
  officialPageRange?: string;
};

function qBlock(
  id: string,
  titleAr: string,
  kind: NonNullable<ContentBlock["interactiveKind"]>,
  question: QuestionPayload,
): ContentBlock {
  return {
    id,
    type: "question",
    titleAr,
    bodyAr: question.promptAr,
    interactiveKind: kind,
    question,
    language: "ar",
    direction: "rtl",
    aiGenerated: true,
    reviewStatus: "draft",
  };
}

export function buildFullLesson(spec: LessonSpec): LessonRecord {
  const blocks: ContentBlock[] = [
    { id: `${spec.id}-hook`, type: "hook", titleAr: "هيا نبدأ", bodyAr: spec.hookAr },
    {
      id: `${spec.id}-connect`,
      type: "paragraph",
      titleAr: "ربط بالتعلم السابق",
      bodyAr: `قبل هذا الدرس تحتاج: ${spec.prerequisites.join(" · ")}.`,
    },
    {
      id: `${spec.id}-will-learn`,
      type: "objectives",
      titleAr: "ماذا سنتعلم؟",
      bodyAr: "في نهاية الدرس أستطيع أن:",
      items: spec.outcomes,
    },
    { id: `${spec.id}-why`, type: "callout", titleAr: "لماذا يهمّنا هذا؟", bodyAr: spec.whyAr },
    { id: `${spec.id}-materials`, type: "materials", titleAr: "المواد", bodyAr: spec.materialsAr },
    { id: `${spec.id}-keyq`, type: "callout", titleAr: "سؤال أساسي", bodyAr: spec.keyQuestionAr },
    {
      id: `${spec.id}-vocab`,
      type: "vocabulary",
      titleAr: "المفردات",
      bodyAr: "كلمات مهمة في الدرس",
      items: spec.vocabulary.map((v) => `${v.term}: ${v.definition}`),
    },
    {
      id: `${spec.id}-def`,
      type: "definition",
      titleAr: spec.definitionTitleAr || "تعريف",
      bodyAr: spec.definitionAr,
    },
    {
      id: `${spec.id}-explain`,
      type: "paragraph",
      titleAr: "شرح كامل",
      bodyAr: spec.explanationAr,
    },
    {
      id: `${spec.id}-alt`,
      type: "paragraph",
      titleAr: "شرح بديل",
      bodyAr: spec.altExplanationAr,
    },
  ];

  if (spec.diagramAr) {
    blocks.push({
      id: `${spec.id}-diagram`,
      type: "diagram",
      titleAr: "مخطط",
      bodyAr: spec.diagramAr,
    });
  }
  if (spec.formulaAr) {
    blocks.push({
      id: `${spec.id}-formula`,
      type: "formula",
      titleAr: "قاعدة / صيغة",
      bodyAr: spec.formulaAr,
      formula: spec.formulaTeX,
      language: "math",
      direction: "ltr",
    });
  }

  blocks.push(
    {
      id: `${spec.id}-ex`,
      type: "example",
      titleAr: "مثال محلول",
      bodyAr: `المسألة: ${spec.exampleProblemAr}`,
    },
    {
      id: `${spec.id}-worked`,
      type: "worked_solution",
      titleAr: "حل خطوة بخطوة",
      bodyAr: `${spec.exampleStepsAr}\nالإجابة النهائية: ${spec.exampleAnswerAr}`,
    },
    {
      id: `${spec.id}-wrong`,
      type: "common_mistakes",
      titleAr: "طريقة خاطئة شائعة",
      bodyAr: spec.wrongMethodAr,
      items: spec.mistakeItems,
    },
    {
      id: `${spec.id}-life`,
      type: "real_life",
      titleAr: "من واقع الحياة",
      bodyAr: spec.realLifeAr,
    },
    {
      id: `${spec.id}-mistakes`,
      type: "common_mistakes",
      titleAr: "أخطاء شائعة",
      bodyAr: spec.mistakesAr,
      items: spec.mistakeItems,
    },
    {
      id: `${spec.id}-guided-label`,
      type: "practice",
      titleAr: "تدريب موجّه",
      bodyAr: spec.guidedPromptAr,
    },
    qBlock(`${spec.id}-guided`, "تدريب موجّه — تحقق", "mcq", {
      ...spec.guidedMcq,
      hint1Ar: spec.guidedMcq.hint1Ar || "فكّر بهدوء واقرأ المسألة مرة أخرى.",
      hint2Ar: spec.guidedMcq.hint2Ar || "جرّب الرسم أو العدّ على أصابعك أو خط الأعداد.",
      difficulty: "easy",
    }),
  );

  spec.independent.forEach((q, i) => {
    blocks.push(
      qBlock(`${spec.id}-indep-${i + 1}`, `تدريب مستقل ${i + 1}`, q.options ? "mcq" : "type", {
        ...q,
        hint1Ar: q.hint1Ar || "اقرأ المعطيات جيداً.",
        hint2Ar: q.hint2Ar || "تحقق من عملك خطوة بخطوة.",
        difficulty: q.difficulty || (i === 0 ? "easy" : "medium"),
      }),
    );
  });

  blocks.push(
    qBlock(`${spec.id}-challenge`, "تحدٍّ", spec.challenge.options ? "mcq" : "type", {
      ...spec.challenge,
      difficulty: "challenge",
      hint1Ar: spec.challenge.hint1Ar || "قسّم المسألة إلى خطوات صغيرة.",
      hint2Ar: spec.challenge.hint2Ar || "ارسم أو استخدم خط الأعداد.",
    }),
    {
      id: `${spec.id}-write`,
      type: "writing_space",
      titleAr: "مساحة كتابة / رسم",
      bodyAr: "اكتب أو ارسم ما فهمته من الدرس.",
    },
    {
      id: `${spec.id}-closure`,
      type: "closure",
      titleAr: "خلاصة الدرس",
      bodyAr: "نقاط مهمة:",
      items: spec.closurePoints,
    },
    qBlock(`${spec.id}-exit`, "سؤال خروج", spec.exitQuestion.options ? "mcq" : "type", {
      ...spec.exitQuestion,
      difficulty: "easy",
    }),
    {
      id: `${spec.id}-confidence`,
      type: "callout",
      titleAr: "ثقتي بنفسي",
      bodyAr: "اختر: أحتاج مساعدة · فهمت جيداً · أستطيع تعليم زميلي.",
    },
    {
      id: `${spec.id}-next`,
      type: "paragraph",
      titleAr: "الدرس التالي",
      bodyAr: "في الدرس القادم نبني على ما تعلمناه اليوم. راجع الأخطاء قبل الانتقال.",
    },
    {
      id: `${spec.id}-source`,
      type: "source_citation",
      bodyAr:
        "محتوى Success OS أصلي بمحاذاة نواتج الصف الأول. المرجع الرسمي للتحقق: كتالوج كتب الصف الأول — المركز الوطني لتطوير المناهج. لا يُعاد نشر الكتاب الحكومي.",
    },
  );

  return {
    id: spec.id,
    order: spec.order,
    titleAr: spec.titleAr,
    titleEn: spec.titleEn,
    learningOutcomes: spec.outcomes,
    skills: spec.skills || ["العد", "التفكير الرياضي"],
    prerequisites: spec.prerequisites,
    vocabulary: spec.vocabulary,
    blocks,
    editorialStatus: "draft",
    rightsStatus: "sos_original_aligned",
    sources: [NCCD_SOURCE, MINHAJI_SOURCE],
    preparedBy: "Prepared by Mr Waseem Allabadi — original Success OS explanation",
    estimatedMinutes: spec.estimatedMinutes || 25,
    difficulty: spec.difficulty || "core",
    officialPageRange: spec.officialPageRange || "NEEDS VERIFICATION",
    aiGeneratedFlag: true,
  };
}

export function mcq(
  promptAr: string,
  options: string[],
  correctIndex: number,
  explanationAr: string,
  extra: Partial<QuestionPayload> = {},
): QuestionPayload {
  return { promptAr, options, correctIndex, explanationAr, ...extra };
}

export function typeAnswer(
  promptAr: string,
  correctAnswer: string,
  explanationAr: string,
  acceptedAnswers: string[] = [],
  extra: Partial<QuestionPayload> = {},
): QuestionPayload {
  return {
    promptAr,
    correctAnswer,
    acceptedAnswers: Array.from(new Set([correctAnswer, ...acceptedAnswers])),
    explanationAr,
    ...extra,
  };
}

export function buildAnswerBank(
  unitId: string,
  lessons: LessonRecord[],
): AnswerBankEntry[] {
  const entries: AnswerBankEntry[] = [];
  for (const lesson of lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== "question" || !block.question) continue;
      const q = block.question;
      const correct =
        q.correctAnswer ??
        (typeof q.correctIndex === "number" && q.options ? q.options[q.correctIndex] : "") ??
        "";
      entries.push({
        id: `ans-${block.id}`,
        lessonId: lesson.id,
        unitId,
        questionBlockId: block.id,
        promptAr: q.promptAr,
        correctAnswer: String(correct),
        explanationAr: q.explanationAr,
        verificationStatus: "needs_academic_review",
      });
    }
  }
  return entries;
}

export function buildPageMap(
  units: Array<{ id: string; lessons: LessonRecord[] }>,
): PageMapEntry[] {
  const pages: PageMapEntry[] = [];
  let digital = 1;
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      pages.push({
        digitalPage: digital++,
        officialPageRef: lesson.officialPageRange,
        unitId: unit.id,
        lessonId: lesson.id,
        sectionLabelAr: `افتتاح: ${lesson.titleAr}`,
      });
      // One digital page per major section chunk
      pages.push({
        digitalPage: digital++,
        officialPageRef: lesson.officialPageRange,
        unitId: unit.id,
        lessonId: lesson.id,
        sectionLabelAr: `شرح وتمارين: ${lesson.titleAr}`,
      });
    }
  }
  return pages;
}
