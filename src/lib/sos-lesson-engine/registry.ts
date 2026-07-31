import { G1_MATH_U0_L1_REFERENCE } from "@/src/lib/sos-lesson-engine/content/g1-math-u0-l1-reference";
import type { InteractiveLesson } from "@/src/lib/sos-lesson-engine/schema/types";
import type { LessonRecord, BookRecord } from "@/src/lib/jordan-books/schema/types";
import { REQUIRED_STAGE_ORDER } from "@/src/lib/sos-lesson-engine/schema/types";

const REGISTRY: InteractiveLesson[] = [G1_MATH_U0_L1_REFERENCE];

export function listInteractiveLessons(): InteractiveLesson[] {
  return REGISTRY;
}

export function getInteractiveLesson(id: string): InteractiveLesson | null {
  return REGISTRY.find((l) => l.id === id || l.identity.lessonId === id) || null;
}

export function getInteractiveLessonForBookLesson(
  bookId: string,
  lessonId: string,
): InteractiveLesson | null {
  return (
    REGISTRY.find((l) => l.identity.bookId === bookId && l.identity.lessonId === lessonId) ||
    REGISTRY.find((l) => l.identity.lessonId === lessonId) ||
    null
  );
}

/** Lightweight scaffold from a book LessonRecord — marks incomplete stages for queue expansion. */
export function scaffoldFromBookLesson(
  book: BookRecord,
  unitId: string,
  unitTitleAr: string,
  lesson: LessonRecord,
): InteractiveLesson {
  const mcqBlocks = lesson.blocks.filter((b) => b.question?.options?.length);
  const firstQ = mcqBlocks[0]?.question;
  const questions = mcqBlocks.slice(0, 6).map((b, i) => ({
    id: `${lesson.id}-q${i}`,
    promptAr: b.question!.promptAr,
    kind: "mcq" as const,
    options: b.question!.options,
    correctIndex: b.question!.correctIndex,
    explanationAr: b.question!.explanationAr,
    hint1Ar: b.question!.hint1Ar || "أعد قراءة السؤال.",
    hint2Ar: b.question!.hint2Ar || "راجع شرح الدرس.",
    difficulty: (b.question!.difficulty === "challenge"
      ? "challenge"
      : b.question!.difficulty === "medium"
        ? "developing"
        : "basic") as "basic" | "developing" | "proficient" | "challenge",
    masteryWeight: 1,
    points: b.question!.points || 10,
    skill: b.question!.skill || lesson.skills?.[0] || "عام",
  }));

  return {
    id: `sos-il-scaffold-${book.id}-${lesson.id}`,
    schemaVersion: "sos.interactive-lesson.v1",
    identity: {
      country: "Jordan",
      curriculum: "national",
      curriculumVersion: book.curriculumVersion,
      academicYear: book.academicYear,
      grade: book.grade,
      gradeAr: book.gradeAr,
      semester: book.semester,
      semesterAr: book.semesterAr,
      pathway: "general",
      pathwayAr: "عام",
      subject: book.subject,
      subjectAr: book.subjectAr,
      bookId: book.id,
      bookTitleAr: book.officialTitleAr,
      unitId,
      unitTitleAr,
      lessonId: lesson.id,
      lessonTitleAr: lesson.titleAr,
      lessonTitleEn: lesson.titleEn,
      officialPageRange: lesson.officialPageRange || "NEEDS VERIFICATION",
      learningOutcomes: lesson.learningOutcomes,
      skills: lesson.skills || [],
      prerequisites: lesson.prerequisites,
      estimatedMinutes: lesson.estimatedMinutes,
      materialsAr: "حسب دليل الدرس",
      sources: lesson.sources.map((s) => ({ name: s.name, url: s.url, usage: s.usage })),
      rightsStatus: lesson.rightsStatus,
      editorialStatus: lesson.editorialStatus,
      preparedBy: lesson.preparedBy || "Success OS",
    },
    modes: ["student_paced", "assignment"],
    hook: {
      openingAr: lesson.blocks.find((b) => b.type === "hook")?.bodyAr || lesson.titleAr,
      questionAr: firstQ?.promptAr || "ماذا سنتعلم؟",
      situationAr: "موقف صفّي مرتبط بالدرس.",
      visualAr: "—",
      predictionPromptAr: "ما توقّعك؟",
      priorConnectionAr: lesson.prerequisites.join(" · ") || "مفاهيم سابقة",
    },
    prerequisiteCheck: {
      minCorrect: 1,
      recoveryExplanationAr: "راجع المتطلب السابق ثم أعد المحاولة.",
      questions: questions.slice(0, 2).length
        ? questions.slice(0, 2)
        : [
            {
              id: `${lesson.id}-prereq`,
              promptAr: "هل أنت مستعد للدرس؟",
              kind: "mcq",
              options: ["نعم", "لا", "جزئياً"],
              correctIndex: 0,
              explanationAr: "الاستعداد يساعد على التعلم.",
              hint1Ar: "اختر نعم إن كنت جاهزاً.",
              hint2Ar: "راجع المتطلبات.",
              difficulty: "basic",
              masteryWeight: 0.5,
              points: 5,
            },
          ],
      recoveryActivity: questions[0] || {
        id: `${lesson.id}-recovery`,
        promptAr: "أعد قراءة عنوان الدرس.",
        kind: "mcq",
        options: ["فهمت", "أعيد", "أسأل المعلم"],
        correctIndex: 0,
        explanationAr: "المراجعة تثبّت الأساس.",
        hint1Ar: "اختر فهمت بعد القراءة.",
        hint2Ar: "اطلب مساعدة عند الحاجة.",
        difficulty: "basic",
        masteryWeight: 0.5,
        points: 5,
      },
    },
    objectivesLearnerAr: lesson.learningOutcomes.map((o) => `بنهاية الدرس أستطيع: ${o}`),
    vocabulary: lesson.vocabulary.map((v) => ({
      term: v.term,
      definition: v.definition,
      example: v.term,
      nonExample: "—",
    })),
    explanationSections: [
      {
        id: `${lesson.id}-exp1`,
        titleAr: lesson.titleAr,
        bodyAr: lesson.blocks.find((b) => b.type === "paragraph" || b.type === "definition")?.bodyAr || "",
        visualAr: lesson.blocks.find((b) => b.type === "diagram")?.bodyAr || "—",
        workedExampleAr: lesson.blocks.find((b) => b.type === "example" || b.type === "worked_solution")?.bodyAr || "",
        altExplanationAr: undefined,
        check: questions[0] || {
          id: `${lesson.id}-check`,
          promptAr: "هل راجعت الشرح؟",
          kind: "mcq",
          options: ["نعم", "لا"],
          correctIndex: 0,
          explanationAr: "المراجعة مهمة.",
          hint1Ar: "أعد القراءة.",
          hint2Ar: "اطلب تلميحاً من المعلّم.",
          difficulty: "basic",
          masteryWeight: 1,
          points: 5,
        },
      },
    ],
    guidedPractice: questions.slice(0, 2),
    interactiveActivity: {
      titleAr: "نشاط تفاعلي",
      kind: "mcq",
      instructionsAr: "أجب عن الأسئلة التالية.",
      questions: questions.slice(0, 1),
    },
    realLife: {
      jordanContextAr: lesson.blocks.find((b) => b.type === "real_life")?.bodyAr || "تطبيق في الحياة اليومية.",
      homeAr: "طبّق المفهوم في البيت.",
      schoolAr: "طبّق المفهوم في الصف.",
      communityAr: "لاحظ المفهوم في مجتمعك.",
    },
    collaboration: {
      boardType: "exit_ticket",
      promptAr: "اكتب جملة واحدة عن ما تعلمته.",
      anonymousAllowed: true,
      moderationRequired: true,
    },
    independentPractice: questions.slice(0, 4),
    assessment: {
      titleAr: `تقييم — ${lesson.titleAr}`,
      passScorePercent: 70,
      questions: questions.slice(0, 4),
    },
    reflectionPromptsAr: ["ماذا فهمت؟", "ما الصعب؟", "كم ثقتك؟"],
    nextStep: {
      revisionGameEnabled: questions.length > 0,
      aiTutorEnabled: true,
    },
    reviewGameQuestionIds: questions.slice(0, 5).map((q) => q.id),
    aiTutorPolicy: {
      allowedTopics: [lesson.titleAr, ...lesson.skills || []],
      forbidAnswerRevealBeforeAttempt: true,
      requireTeacherReviewOnLowConfidence: true,
      noUncontrolledInternet: true,
    },
  };
}

export function validateInteractiveLesson(lesson: InteractiveLesson): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const stage of REQUIRED_STAGE_ORDER) {
    if (stage === "identity" && !lesson.identity.lessonId) errors.push("missing identity");
    if (stage === "hook" && !lesson.hook.openingAr) errors.push("missing hook");
    if (stage === "prerequisite" && lesson.prerequisiteCheck.questions.length < 2)
      errors.push("prerequisite needs 2+ questions");
    if (stage === "explanation" && lesson.explanationSections.length < 1) errors.push("missing explanation");
    if (stage === "assessment" && lesson.assessment.questions.length < 1) errors.push("missing assessment");
  }
  if (!lesson.modes.includes("student_paced")) errors.push("student_paced required");
  return { ok: errors.length === 0, errors };
}
