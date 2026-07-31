import type { InteractiveLesson, LessonStageId } from "@/src/lib/sos-lesson-engine/schema/types";
import { appendTutorTurn } from "@/src/lib/sos-lesson-engine/store";

/**
 * Lesson-scoped AI Tutor — rule-based original assistant.
 * Uses ONLY approved lesson context. No uncontrolled internet.
 * Does not reveal graded answers before a meaningful attempt.
 */
export async function askLessonTutor(input: {
  lesson: InteractiveLesson;
  studentKey: string;
  stageId: LessonStageId;
  userMessage: string;
  attemptMade?: boolean;
  lastAnswerCorrect?: boolean | null;
}): Promise<{
  replyAr: string;
  confidence: "high" | "medium" | "low";
  needsTeacherReview: boolean;
}> {
  const msg = input.userMessage.trim().slice(0, 400);
  const lesson = input.lesson;
  const lower = msg.toLowerCase();

  const wantsAnswer =
    /الجواب|ما هو الصحيح|أعطني الإجابة|حل عني|what is the answer|tell me the answer/i.test(msg);
  if (wantsAnswer && !input.attemptMade) {
    const replyAr =
      "أحاول أن أساعدك على التفكير لا أن أحل بدلاً منك. جرّب الإجابة أولاً، ثم اطلب تلميحاً. إذا احتجت، اسأل: «أعطني تلميحاً».";
    await appendTutorTurn({
      lessonId: lesson.id,
      studentKey: input.studentKey,
      stageId: input.stageId,
      userMessage: msg,
      assistantMessage: replyAr,
      confidence: "high",
      needsTeacherReview: false,
    });
    return { replyAr, confidence: "high", needsTeacherReview: false };
  }

  if (/تلميح|hint|ساعدني/i.test(msg)) {
    const replyAr =
      input.stageId === "guided_practice" || input.stageId === "independent_practice"
        ? "تلميح من محتوى الدرس: عدّ الأشياء واحداً واحداً بإصبعك دون تكرار، ثم اختر الرمز الذي يطابق الكمية (1 أو 2 أو 3)."
        : `تلميح مرتبط بمرحلة «${input.stageId}»: راجع هدف الدرس: ${lesson.objectivesLearnerAr[0] || lesson.identity.learningOutcomes[0]}`;
    await appendTutorTurn({
      lessonId: lesson.id,
      studentKey: input.studentKey,
      stageId: input.stageId,
      userMessage: msg,
      assistantMessage: replyAr,
      confidence: "high",
      needsTeacherReview: false,
    });
    return { replyAr, confidence: "high", needsTeacherReview: false };
  }

  if (/بسّط|وضّح|اشرح|simplify|explain/i.test(msg) || lower.includes("explain")) {
    const section = lesson.explanationSections[0];
    const replyAr = section
      ? `شرح مبسّط من الدرس المعتمد: ${section.altExplanationAr || section.bodyAr} مثال: ${section.workedExampleAr}`
      : `أهداف الدرس: ${lesson.objectivesLearnerAr.join(" · ")}`;
    await appendTutorTurn({
      lessonId: lesson.id,
      studentKey: input.studentKey,
      stageId: input.stageId,
      userMessage: msg,
      assistantMessage: replyAr,
      confidence: "high",
      needsTeacherReview: false,
    });
    return { replyAr, confidence: "high", needsTeacherReview: false };
  }

  if (/مثال|example/i.test(msg)) {
    const replyAr = `مثال أصلي من سياق أردني في الدرس: ${lesson.realLife.jordanContextAr}`;
    await appendTutorTurn({
      lessonId: lesson.id,
      studentKey: input.studentKey,
      stageId: input.stageId,
      userMessage: msg,
      assistantMessage: replyAr,
      confidence: "high",
      needsTeacherReview: false,
    });
    return { replyAr, confidence: "high", needsTeacherReview: false };
  }

  if (input.lastAnswerCorrect === false) {
    const replyAr =
      "يبدو أن الإجابة لم تكن صحيحة. تصوّر خطأ شائع: عدّ نفس الشيء مرتين. أعد العدّ ببطء: واحد… اثنان… ثلاثة، ثم حاول مجدداً.";
    await appendTutorTurn({
      lessonId: lesson.id,
      studentKey: input.studentKey,
      stageId: input.stageId,
      userMessage: msg,
      assistantMessage: replyAr,
      confidence: "medium",
      needsTeacherReview: false,
    });
    return { replyAr, confidence: "medium", needsTeacherReview: false };
  }

  // Out-of-scope / low confidence
  const inScope = lesson.aiTutorPolicy.allowedTopics.some((t) => msg.includes(t) || t.includes(msg.slice(0, 20)));
  if (!inScope && msg.length > 8 && !/عدد|1|2|3|عدّ|نجوم|تفاح/i.test(msg)) {
    const replyAr =
      "هذا السؤال خارج سياق الدرس المعتمد الحالي. أستطيع المساعدة فقط ضمن: الأعداد 1 و2 و3 والعدّ والمطابقة. إن احتجت أمراً آخر فاطلب مراجعة المعلم.";
    await appendTutorTurn({
      lessonId: lesson.id,
      studentKey: input.studentKey,
      stageId: input.stageId,
      userMessage: msg,
      assistantMessage: replyAr,
      confidence: "low",
      needsTeacherReview: true,
    });
    return { replyAr, confidence: "low", needsTeacherReview: true };
  }

  const replyAr = `نحن في درس «${lesson.identity.lessonTitleAr}». يمكنك أن تطلب: تلميحاً، شرحاً مبسّطاً، أو مثالاً من الحياة. لا أكشف إجابة التقييم قبل محاولتك.`;
  await appendTutorTurn({
    lessonId: lesson.id,
    studentKey: input.studentKey,
    stageId: input.stageId,
    userMessage: msg,
    assistantMessage: replyAr,
    confidence: "high",
    needsTeacherReview: false,
  });
  return { replyAr, confidence: "high", needsTeacherReview: false };
}
