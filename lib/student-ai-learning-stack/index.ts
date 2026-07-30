/**
 * Student AI Learning Stack — public API (roadmap #59 foundation).
 */
export {
  STACK_LAYER_CONTRACTS,
  STUDENT_AI_LEARNING_STACK_PATH,
} from "./layers";
export {
  runStudentLearningStack,
  getStudentAiLearningStackSnapshot,
  runStudentAiLearningStackDemo,
} from "./orchestrator";
export {
  buildS4sIntelligenceTeacherGreeting,
  resolveStruggleSkill,
  type S4sTeacherGreeting,
  type BuildS4sGreetingInput,
} from "./s4s-intelligence-teacher";
export {
  buildReExplainSequence,
  isDontUnderstandUtterance,
  type ReExplainSequence,
  type ReExplainStep,
  type ReExplainStepId,
  type BuildReExplainInput,
} from "./re-explain";

export function studentAiLearningStackStatus() {
  return {
    schema: "success-os.student-ai-learning-stack.v1",
    role: "orchestration",
    path: [
      "Student",
      "AI Teacher",
      "Conversation Engine",
      "Reasoning Engine",
      "Knowledge Graph",
      "Digital Books",
      "Videos",
      "Interactive Lesson Engine",
      "Quizzes",
      "Assessments",
    ],
    openLessonGreeting: true,
    s4sIntelligenceTeacher: true,
    aiGeneration: false,
    videoGeneration: false,
    quizGeneration: false,
    assessmentGeneration: false,
    ileSoleRuntime: true,
    adr: ["ADR-0049", "ADR-0050", "ADR-0054", "ADR-0055", "ADR-0059"],
    parentPr: "#54 Universal Curriculum Mapping Engine",
    atePr: "#55 AI Teacher Engine",
  };
}
