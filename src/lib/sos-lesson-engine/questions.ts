import type { InteractiveLesson, InteractiveQuestion } from "@/src/lib/sos-lesson-engine/schema/types";

export function allLessonQuestions(lesson: InteractiveLesson): InteractiveQuestion[] {
  return [
    ...lesson.prerequisiteCheck.questions,
    lesson.prerequisiteCheck.recoveryActivity,
    ...lesson.explanationSections.map((s) => s.check),
    ...lesson.guidedPractice,
    ...lesson.interactiveActivity.questions,
    ...lesson.independentPractice,
    ...lesson.assessment.questions,
  ];
}

export function getQuestionById(lesson: InteractiveLesson, id: string): InteractiveQuestion | undefined {
  return allLessonQuestions(lesson).find((x) => x.id === id);
}
