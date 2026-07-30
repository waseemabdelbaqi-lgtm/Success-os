/**
 * Student AI Learning Stack orchestrator.
 * Walks Student → … → Assessments. Never generates AI lessons/videos/quizzes.
 */
import { createHash } from "node:crypto";
import type {
  StackLayerId,
  StackLayerInvocation,
  StudentAiLearningStackSnapshot,
  StudentLearningSessionPlan,
  StudentStackContext,
} from "@/types/student-ai-learning-stack";
import {
  STACK_LAYER_CONTRACTS,
  STUDENT_AI_LEARNING_STACK_PATH,
} from "./layers";
import { buildKnowledgeGraph } from "@/lib/curriculum-import-engine/knowledge-graph/build";
import { buildJordanMathDependencyExample } from "@/lib/curriculum-import-engine/hierarchy/lesson-dependency";
import { runJordanReferenceDataset } from "@/lib/curriculum-import-engine/reference/jordan-dataset";
import {
  findEquivalentLessons,
  runUniversalCurriculumMapping,
} from "@/lib/universal-curriculum-mapping";
import { buildS4sIntelligenceTeacherGreeting } from "./s4s-intelligence-teacher";
import {
  buildReExplainSequence,
  isDontUnderstandUtterance,
} from "./re-explain";
import {
  buildJordanDemoStudentSkillProgress,
} from "@/lib/curriculum-import-engine/student/skill-progress";

function sessionIdFor(ctx: StudentStackContext): string {
  const h = createHash("sha256")
    .update(
      [
        ctx.studentId,
        ctx.focusLessonId || "",
        ctx.utterance || "",
        ctx.subjectGlobalId || "",
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 16);
  return `sals_${h}`;
}

function invoke(
  layerId: StackLayerId,
  status: StackLayerInvocation["status"],
  output: Record<string, unknown>,
  started: number,
): StackLayerInvocation {
  return {
    layerId,
    status,
    ok: true,
    output,
    durationMs: Math.max(0, Date.now() - started),
  };
}

/**
 * Run the full stack path for a student context.
 * Reserved layers return empty placeholders — no content generation.
 */
export function runStudentLearningStack(
  ctx: StudentStackContext,
): StudentLearningSessionPlan {
  const invocations: StackLayerInvocation[] = [];
  let t = Date.now();

  // 1. Student
  invocations.push(
    invoke(
      "student",
      "operational",
      {
        studentId: ctx.studentId,
        countryId: ctx.countryId || null,
        curriculumId: ctx.curriculumId || null,
        language: ctx.language || "en",
        utterance: ctx.utterance || null,
      },
      t,
    ),
  );

  // 2. AI Teacher / S4S Intelligence Teacher greeting (no content generation)
  t = Date.now();
  let progress = null as ReturnType<typeof buildJordanDemoStudentSkillProgress> | null;
  try {
    progress = buildJordanDemoStudentSkillProgress();
  } catch {
    progress = null;
  }
  const greeting = buildS4sIntelligenceTeacherGreeting({
    studentName: "Ahmad",
    progress,
    preferSkillCode: "FRACTIONS",
    locale: ctx.language === "ar" ? "ar" : "en",
  });
  invocations.push(
    invoke(
      "ai_teacher",
      "foundation",
      {
        persona: "S4S Intelligence Teacher",
        teachingGoal: "review_struggle_then_ile_package",
        openLessonFlow: ["student", "open_lesson", "s4s_intelligence_teacher"],
        greeting: {
          displayEn: greeting.displayEn,
          displayAr: greeting.displayAr,
          struggleSkillId: greeting.struggleSkillId,
          struggleSkillName: greeting.struggleSkillName,
          source: greeting.source,
        },
        generatesLessons: false,
        generatesVideos: false,
      },
      t,
    ),
  );

  // 3. Conversation Engine (deterministic intent stub)
  t = Date.now();
  const rawUtterance = ctx.utterance || "";
  const utterance = rawUtterance.toLowerCase();
  const dontUnderstand = isDontUnderstandUtterance(rawUtterance);
  const intent = dontUnderstand
    ? "dont_understand"
    : utterance.includes("quiz") || utterance.includes("اختبار")
      ? "request_quiz"
      : utterance.includes("video") || utterance.includes("فيديو")
        ? "request_video"
        : utterance.includes("help") || utterance.includes("ساعد")
          ? "request_help"
          : "request_lesson";
  invocations.push(
    invoke(
      "conversation_engine",
      dontUnderstand ? "foundation" : "stub",
      {
        intent,
        utterance: rawUtterance || null,
        studentLine: dontUnderstand ? "I don't understand this." : null,
        llm: false,
      },
      t,
    ),
  );

  // 4. Reasoning Engine — re-explain path when student doesn't understand
  t = Date.now();
  const focus =
    ctx.focusLessonId || "JO-NATIONAL-G01-MATH-B01-U01-L01";
  const uceFocus = focus.startsWith("LSN-") ? focus : "LSN-01001";
  let equivalents: { globalId: string; relation: string; confidence: number }[] =
    [];
  try {
    runUniversalCurriculumMapping({ reset: false });
    equivalents = findEquivalentLessons(uceFocus).map((m) => ({
      globalId: m.target.globalId,
      relation: m.relation,
      confidence: m.confidence,
    }));
  } catch {
    equivalents = [];
  }
  const reExplain = dontUnderstand
    ? buildReExplainSequence({
        studentUtterance: rawUtterance || "I don't understand this.",
        topicEn: "Fractions",
        topicAr: "الكسور",
      })
    : null;
  const nextMove = dontUnderstand
    ? "re_explain_differently"
    : intent === "request_quiz"
      ? "defer_quiz_until_assessment_engine"
      : intent === "request_video"
        ? "defer_video_until_media_engine"
        : "route_to_ile_package";
  invocations.push(
    invoke(
      "reasoning_engine",
      dontUnderstand ? "foundation" : "stub",
      {
        nextMove,
        focusLessonId: focus,
        teacherLine: dontUnderstand
          ? "No problem.\nLet's explain it differently."
          : null,
        reExplainPath: reExplain?.displayPath || null,
        reExplainSteps: reExplain?.path || null,
        crossCurriculumEquivalents: equivalents.slice(0, 5),
        generatesContent: false,
      },
      t,
    ),
  );

  // 5. Knowledge Graph (foundation — wired)
  t = Date.now();
  let kgRefs: string[] = [];
  try {
    runJordanReferenceDataset({ reset: true });
    const graph = buildKnowledgeGraph({
      lessonDependency: buildJordanMathDependencyExample(),
    });
    kgRefs = graph.nodes.slice(0, 12).map((n) => n.id);
    invocations.push(
      invoke(
        "knowledge_graph",
        "foundation",
        {
          schema: graph.schema,
          nodeCount: graph.counts.nodes,
          edgeCount: graph.counts.edges,
          sampleNodeIds: kgRefs,
        },
        t,
      ),
    );
  } catch {
    invocations.push(
      invoke(
        "knowledge_graph",
        "foundation",
        { schema: "success-os.knowledge-graph.v1", nodeCount: 0, edgeCount: 0 },
        t,
      ),
    );
  }

  // 6. Digital Books (reserved)
  t = Date.now();
  invocations.push(
    invoke(
      "digital_books",
      "reserved",
      { digitalBookIds: [], activatesInPr: "#55", generated: false },
      t,
    ),
  );

  // 7. Videos (reserved)
  t = Date.now();
  invocations.push(
    invoke(
      "videos",
      "reserved",
      { videoIds: [], activatesInPr: "#56–57", generated: false },
      t,
    ),
  );

  // 8. Interactive Lesson Engine (operational — package reference only)
  t = Date.now();
  const ilePackageId =
    focus.startsWith("ile_")
      ? focus
      : focus.includes("JO-NATIONAL")
        ? `ile_${focus}`
        : "ile_JO-NATIONAL-G01-MATH-B01-U01-L01";
  invocations.push(
    invoke(
      "interactive_lesson_engine",
      "operational",
      {
        runtime: "success-os.interactive-lesson-engine.v1",
        ilePackageId,
        rendersLessons: true,
        soleRuntime: true,
      },
      t,
    ),
  );

  // 9. Quizzes (reserved)
  t = Date.now();
  invocations.push(
    invoke(
      "quizzes",
      "reserved",
      { quizPlanId: null, activatesInPr: "#58", generated: false },
      t,
    ),
  );

  // 10. Assessments (reserved)
  t = Date.now();
  invocations.push(
    invoke(
      "assessments",
      "reserved",
      { assessmentPlanId: null, activatesInPr: "#58", generated: false },
      t,
    ),
  );

  const recommended = [
    focus.startsWith("JO-") || focus.startsWith("LSN-")
      ? focus
      : "JO-NATIONAL-G01-MATH-B01-U01-L01",
    ...equivalents.slice(0, 3).map((e) => e.globalId),
  ];

  return {
    schema: "success-os.student-learning-session-plan.v1",
    sessionId: sessionIdFor(ctx),
    studentId: ctx.studentId,
    path: [...STUDENT_AI_LEARNING_STACK_PATH],
    invocations,
    ilePackageId,
    knowledgeGraphRefs: kgRefs,
    recommendedLessonIds: [...new Set(recommended)],
    quizPlanId: null,
    assessmentPlanId: null,
    digitalBookIds: [],
    videoIds: [],
    aiContentGenerated: false,
    notes: [
      "Orchestration only — no AI lesson/video/quiz/assessment generation.",
      "ILE is the sole lesson runtime (ADR-0049).",
      "Digital Books / Videos / Quizzes / Assessments reserved for later PRs.",
    ],
  };
}

export function getStudentAiLearningStackSnapshot(): StudentAiLearningStackSnapshot {
  const layers = STACK_LAYER_CONTRACTS.map((l) => ({ ...l, notes: [...l.notes] }));
  return {
    schema: "success-os.student-ai-learning-stack.v1",
    path: [...STUDENT_AI_LEARNING_STACK_PATH],
    displayPath: [
      "Student",
      "S4S Intelligence Teacher",
      "Conversation Engine",
      "Reasoning Engine",
      "Knowledge Graph",
      "Digital Books",
      "Videos",
      "Interactive Lesson Engine",
      "Quizzes",
      "Assessments",
    ],
    layers,
    counts: {
      layers: layers.length,
      operational: layers.filter((l) => l.status === "operational").length,
      foundation: layers.filter((l) => l.status === "foundation").length,
      stub: layers.filter((l) => l.status === "stub").length,
      reserved: layers.filter((l) => l.status === "reserved").length,
    },
    rules: [
      "Path order is fixed for the student journey.",
      "No layer may generate lessons/videos/quizzes/assessments in this PR.",
      "Interactive Lesson Engine is the only lesson renderer.",
      "Knowledge Graph + UCE inform reasoning; they do not replace ILE.",
    ],
    notes: [
      "Foundation for Learning Intelligence (roadmap #59).",
      "Full AI Teacher / Conversation / Reasoning activate with #56–57 / #59.",
      "Digital Books #55 · Videos #56–57 · Quizzes/Assessments #58.",
    ],
  };
}

export function runStudentAiLearningStackDemo(opts?: {
  studentId?: string;
  utterance?: string;
  focusLessonId?: string;
}) {
  const snapshot = getStudentAiLearningStackSnapshot();
  const plan = runStudentLearningStack({
    studentId: opts?.studentId || "student_demo_001",
    countryId: "JO",
    curriculumId: "JO-NATIONAL",
    subjectGlobalId: "SUB-00001",
    focusLessonId: opts?.focusLessonId || "JO-NATIONAL-G01-MATH-B01-U01-L01",
    language: "en",
    utterance: opts?.utterance || "I don't understand this.",
  });
  const reasoning = plan.invocations.find((i) => i.layerId === "reasoning_engine");
  return {
    ok:
      snapshot.path.length === 10 &&
      plan.invocations.length === 10 &&
      plan.aiContentGenerated === false &&
      plan.ilePackageId != null &&
      snapshot.layers.every((l) => l.generatesContent === false) &&
      reasoning?.output.nextMove === "re_explain_differently",
    schema: snapshot.schema,
    snapshot,
    plan,
    reExplain: buildReExplainSequence({
      studentUtterance: "I don't understand this.",
      topicEn: "Fractions",
      topicAr: "الكسور",
    }),
    aiGeneration: false,
    copiesCurricula: false,
  };
}
