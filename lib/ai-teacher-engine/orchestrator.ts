/**
 * AI Teacher Engine orchestrator.
 *
 * Student → AI Teacher → Conversation → Reasoning → Student Memory →
 * Knowledge Graph → Curriculum Registry → ILE → Digital Books → Videos → Assessments
 *
 * Architecture / APIs / memory / permissions only — no avatars, animations,
 * AI videos, or live classrooms.
 */
import { createHash } from "node:crypto";
import type {
  AiTeacherEngineSnapshot,
  AteLayerId,
  AteLayerInvocation,
  AteSessionContext,
  AteTeachingTurn,
  MultimodalInputKind,
  TeachingStyle,
} from "@/types/ai-teacher-engine";
import {
  ATE_LAYER_CONTRACTS,
  AI_TEACHER_ENGINE_DISPLAY_PATH,
  AI_TEACHER_ENGINE_PATH,
} from "./layers";
import { ATE_CAPABILITIES } from "./capabilities";
import { STUDENT_CONTROL_INTENTS } from "./conversation";
import {
  conversationTurnId,
  detectAffect,
  detectStudentIntent,
  normalizeMultimodalInputs,
} from "./conversation";
import {
  appendConversationTurn,
  getOrCreateStudentMemory,
  updateLearningPreferences,
  upsertStudentMemory,
} from "./memory";
import { reasonTeachingMove } from "./reasoning";
import { SAFETY_RULES } from "./grounding";
import { getVoiceSessionContract } from "./voice";
import { getWhiteboardSessionContract } from "./whiteboard";
import { buildKnowledgeGraph } from "@/lib/curriculum-import-engine/knowledge-graph/build";
import { buildJordanMathDependencyExample } from "@/lib/curriculum-import-engine/hierarchy/lesson-dependency";
import { runJordanReferenceDataset } from "@/lib/curriculum-import-engine/reference/jordan-dataset";
import {
  findEquivalentLessons,
  runUniversalCurriculumMapping,
} from "@/lib/universal-curriculum-mapping";
import { buildS4sIntelligenceTeacherGreeting } from "@/lib/student-ai-learning-stack/s4s-intelligence-teacher";
import { buildJordanDemoStudentSkillProgress } from "@/lib/curriculum-import-engine/student/skill-progress";

const MULTIMODAL_KINDS: MultimodalInputKind[] = [
  "text",
  "voice",
  "image",
  "screenshot",
  "homework_photo",
  "pdf",
  "handwritten_solution",
  "video_conversation",
  "live_whiteboard",
];

function sessionIdFor(ctx: AteSessionContext): string {
  if (ctx.sessionId) return ctx.sessionId;
  const h = createHash("sha256")
    .update(
      [
        ctx.studentId,
        ctx.focusLessonId || "",
        ctx.utterance || "",
        String(Date.now()).slice(0, 8),
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 16);
  return `ate_${h}`;
}

function invoke(
  layerId: AteLayerId,
  status: AteLayerInvocation["status"],
  output: Record<string, unknown>,
  started: number,
): AteLayerInvocation {
  return {
    layerId,
    status,
    ok: true,
    output,
    durationMs: Math.max(0, Date.now() - started),
  };
}

function resolveIlePackageId(focus: string): string {
  if (focus.startsWith("ile_")) return focus;
  if (focus.includes("JO-NATIONAL")) return `ile_${focus}`;
  return "ile_JO-NATIONAL-G01-MATH-B01-U01-L01";
}

/**
 * Run one AI Teacher teaching turn through the full ATE path.
 */
export function runAiTeacherTurn(ctx: AteSessionContext): AteTeachingTurn {
  const invocations: AteLayerInvocation[] = [];
  const sessionId = sessionIdFor(ctx);
  const language = ctx.language === "ar" ? "ar" : ctx.language === "bilingual" ? "en" : "en";
  const utterance = ctx.utterance || "Help me with this lesson";
  const focus =
    ctx.focusLessonId || "JO-NATIONAL-G01-MATH-B01-U01-L01";
  const studentName = ctx.studentName || "Ahmad";

  // 1. Student
  let t = Date.now();
  invocations.push(
    invoke(
      "student",
      "operational",
      {
        studentId: ctx.studentId,
        studentName,
        countryId: ctx.countryId || null,
        curriculumId: ctx.curriculumId || null,
        gradeId: ctx.gradeId || null,
        language,
        utterance,
      },
      t,
    ),
  );

  // 2. AI Teacher persona (S4S Intelligence Teacher greeting context)
  t = Date.now();
  let progress = null as ReturnType<typeof buildJordanDemoStudentSkillProgress> | null;
  try {
    progress = buildJordanDemoStudentSkillProgress();
  } catch {
    progress = null;
  }
  const greeting = buildS4sIntelligenceTeacherGreeting({
    studentName,
    progress,
    preferSkillCode: "FRACTIONS",
    locale: language === "ar" ? "ar" : "en",
  });
  invocations.push(
    invoke(
      "ai_teacher",
      "operational",
      {
        persona: "AI Teacher / S4S Intelligence Teacher",
        notAChatbot: true,
        greeting: {
          displayEn: greeting.displayEn,
          displayAr: greeting.displayAr,
          struggleSkillId: greeting.struggleSkillId,
          struggleSkillName: greeting.struggleSkillName,
        },
        avatars: false,
        animations: false,
        aiVideos: false,
        liveClassroom: false,
      },
      t,
    ),
  );

  // 3. Conversation Engine
  t = Date.now();
  const intent = detectStudentIntent(utterance);
  const affect = detectAffect(utterance);
  const multimodal = normalizeMultimodalInputs(ctx.multimodal);
  invocations.push(
    invoke(
      "conversation_engine",
      "operational",
      {
        intent,
        affect,
        utterance,
        multimodal,
        llm: false,
        controlsRecognized: true,
      },
      t,
    ),
  );

  // 4 + 5 prep: memory (read before reasoning; write after)
  let memory = getOrCreateStudentMemory(ctx.studentId, { studentName });
  if (ctx.curriculumId || ctx.gradeId) {
    memory = upsertStudentMemory({
      studentId: ctx.studentId,
      studentName,
      currentCurriculumId: ctx.curriculumId || memory.currentCurriculumId,
      gradeId: ctx.gradeId || memory.gradeId,
      preferredLanguage: language,
    });
  }

  // Knowledge graph + UCE for grounding
  let kgRefs: string[] = [];
  let kgCounts = { nodes: 0, edges: 0 };
  try {
    runJordanReferenceDataset({ reset: true });
    const graph = buildKnowledgeGraph({
      lessonDependency: buildJordanMathDependencyExample(),
    });
    kgRefs = graph.nodes.slice(0, 12).map((n) => n.id);
    kgCounts = { nodes: graph.counts.nodes, edges: graph.counts.edges };
  } catch {
    kgRefs = [];
  }

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

  const ilePackageId = resolveIlePackageId(focus);
  const teachingStyle: TeachingStyle =
    ctx.teachingStyle || memory.preferredTeachingStyle || "step_by_step";

  // 4. Reasoning Engine
  t = Date.now();
  const reasoned = reasonTeachingMove({
    intent,
    teachingStyle,
    learningPace: memory.learningPace,
    topicEn: greeting.struggleSkillName?.en || "Fractions",
    topicAr: greeting.struggleSkillName?.ar || "الكسور",
    focusLessonId: focus,
    weakSkillIds: memory.weakSkillIds,
    equivalents,
    grounding: {
      focusLessonId: focus,
      curriculumId: ctx.curriculumId || memory.currentCurriculumId,
      knowledgeGraphNodeIds: kgRefs,
      uceEquivalentIds: equivalents.map((e) => e.globalId),
      ilePackageId,
      digitalBookIds: [],
      videoIds: [],
    },
  });
  invocations.push(
    invoke(
      "reasoning_engine",
      "operational",
      {
        nextMove: reasoned.nextMove,
        teachingStyle: reasoned.teachingStyle,
        learningPace: reasoned.learningPace,
        reExplainPath: reasoned.reExplain?.displayPath || null,
        recommendationCount: reasoned.recommendations.length,
        generatesContent: false,
      },
      t,
    ),
  );

  // 5. Student Memory (write turn)
  t = Date.now();
  const studentTurnId = conversationTurnId(ctx.studentId, utterance);
  appendConversationTurn(ctx.studentId, {
    id: studentTurnId,
    role: "student",
    text: utterance,
    language,
    intent,
    affect,
    multimodal,
    grounded: true,
    uncertaintyStated: false,
    createdAt: new Date().toISOString(),
  });
  memory = updateLearningPreferences(ctx.studentId, {
    learningPace: reasoned.learningPace,
    preferredTeachingStyle: reasoned.teachingStyle,
    affectLast: affect,
    preferredLanguage: language,
  });
  appendConversationTurn(ctx.studentId, {
    id: conversationTurnId(ctx.studentId, reasoned.teacherReply.text.en),
    role: "teacher",
    text: reasoned.teacherReply.text.en,
    language,
    intent,
    affect: "engaged",
    grounded: !reasoned.teacherReply.uncertain,
    uncertaintyStated: reasoned.teacherReply.uncertain,
    createdAt: new Date().toISOString(),
  });
  memory = getOrCreateStudentMemory(ctx.studentId);
  invocations.push(
    invoke(
      "student_memory",
      "operational",
      {
        schema: memory.schema,
        studentName: memory.studentName,
        preferredLanguage: memory.preferredLanguage,
        currentCurriculumId: memory.currentCurriculumId,
        gradeId: memory.gradeId,
        weakSkillIds: memory.weakSkillIds,
        strongSkillIds: memory.strongSkillIds,
        learningPace: memory.learningPace,
        learningStyle: memory.learningStyle,
        historyLength: memory.conversationHistory.length,
        affectLast: memory.affectLast,
      },
      t,
    ),
  );

  // 6. Knowledge Graph
  t = Date.now();
  invocations.push(
    invoke(
      "knowledge_graph",
      "foundation",
      {
        schema: "success-os.knowledge-graph.v1",
        nodeCount: kgCounts.nodes,
        edgeCount: kgCounts.edges,
        sampleNodeIds: kgRefs,
      },
      t,
    ),
  );

  // 7. Curriculum Registry (+ UCE)
  t = Date.now();
  invocations.push(
    invoke(
      "curriculum_registry",
      "foundation",
      {
        curriculumId: ctx.curriculumId || memory.currentCurriculumId,
        focusLessonId: focus,
        uceEquivalents: equivalents.slice(0, 5),
        inventsFacts: false,
      },
      t,
    ),
  );

  // 8. Interactive Lesson Engine
  t = Date.now();
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

  // 9. Digital Books (reserved)
  t = Date.now();
  invocations.push(
    invoke(
      "digital_books",
      "reserved",
      { digitalBookIds: [], activatesInPr: "#56", generated: false },
      t,
    ),
  );

  // 10. Videos (reserved)
  t = Date.now();
  invocations.push(
    invoke(
      "videos",
      "reserved",
      { videoIds: [], activatesInPr: "#57", generated: false },
      t,
    ),
  );

  // 11. Assessments (reserved)
  t = Date.now();
  invocations.push(
    invoke(
      "assessments",
      "reserved",
      {
        assessmentPlanId: null,
        miniQuizReady: false,
        activatesInPr: "#58",
        generated: false,
      },
      t,
    ),
  );

  return {
    schema: "success-os.ate-teaching-turn.v1",
    sessionId,
    studentId: ctx.studentId,
    intent,
    affect,
    teachingStyle: reasoned.teachingStyle,
    teacherReply: reasoned.teacherReply,
    followUpQuestion: reasoned.followUpQuestion,
    recommendations: reasoned.recommendations,
    memory,
    voice: getVoiceSessionContract(true),
    whiteboard: getWhiteboardSessionContract(true),
    ilePackageId,
    path: [...AI_TEACHER_ENGINE_PATH],
    invocations,
    avatarsBuilt: false,
    animationsBuilt: false,
    aiVideosBuilt: false,
    liveClassroomBuilt: false,
    aiContentGenerated: false,
    notes: [
      "AI Teacher Engine orchestration — not a chatbot.",
      "Grounded in curriculum registry, knowledge graph, and ILE packages.",
      "No avatars, animations, AI videos, or live classrooms.",
      ...SAFETY_RULES.slice(0, 3),
    ],
  };
}

export function getAiTeacherEngineSnapshot(): AiTeacherEngineSnapshot {
  const layers = ATE_LAYER_CONTRACTS.map((l) => ({ ...l, notes: [...l.notes] }));
  const capabilities = ATE_CAPABILITIES.map((c) => ({ ...c, notes: [...c.notes] }));
  return {
    schema: "success-os.ai-teacher-engine.v1",
    path: [...AI_TEACHER_ENGINE_PATH],
    displayPath: [...AI_TEACHER_ENGINE_DISPLAY_PATH],
    layers,
    capabilities,
    studentControls: [...STUDENT_CONTROL_INTENTS],
    multimodalKinds: [...MULTIMODAL_KINDS],
    voice: getVoiceSessionContract(true),
    whiteboard: getWhiteboardSessionContract(true),
    counts: {
      layers: layers.length,
      operational: layers.filter((l) => l.status === "operational").length,
      foundation: layers.filter((l) => l.status === "foundation").length,
      stub: layers.filter((l) => l.status === "stub").length,
      reserved: layers.filter((l) => l.status === "reserved").length,
      capabilities: capabilities.length,
    },
    safety: {
      neverInventCurriculumFacts: true,
      groundInApprovedCurriculum: true,
      stateUncertaintyWhenUnsure: true,
    },
    outOfScope: [
      "Avatars",
      "Animations",
      "AI-generated videos",
      "Live classrooms",
    ],
    rules: [
      "Path order is immutable for the AI Teacher Engine.",
      "ATE is a virtual teacher, not a chatbot.",
      "Never invent curriculum facts; state uncertainty when ungrounded.",
      "Interactive Lesson Engine is the only lesson renderer.",
      "Voice and whiteboard are architecture-ready only in this PR.",
    ],
    notes: [
      "PR #55 — AI Teacher Engine (ATE).",
      "Parent: #54 Universal Curriculum Mapping Engine.",
      "Digital Books #56 · Media #57 · Assessments #58 · Learning Intelligence #59.",
    ],
  };
}

export function runAiTeacherEngineDemo(opts?: {
  studentId?: string;
  studentName?: string;
  utterance?: string;
  focusLessonId?: string;
}) {
  const snapshot = getAiTeacherEngineSnapshot();
  const turn = runAiTeacherTurn({
    studentId: opts?.studentId || "student_demo_001",
    studentName: opts?.studentName || "Ahmad",
    countryId: "JO",
    curriculumId: "JO-NATIONAL",
    gradeId: "GRD-00001",
    subjectGlobalId: "SUB-00001",
    focusLessonId:
      opts?.focusLessonId || "JO-NATIONAL-G01-MATH-B01-U01-L01",
    language: "en",
    utterance: opts?.utterance || "I don't understand this.",
  });

  const ok =
    snapshot.path.length === 11 &&
    turn.invocations.length === 11 &&
    turn.aiContentGenerated === false &&
    turn.avatarsBuilt === false &&
    turn.animationsBuilt === false &&
    turn.aiVideosBuilt === false &&
    turn.liveClassroomBuilt === false &&
    turn.ilePackageId != null &&
    turn.teacherReply.inventsCurriculumFacts === false &&
    turn.memory.schema === "success-os.student-memory.v1" &&
    turn.intent === "dont_understand" &&
    snapshot.layers.every((l) => l.generatesContent === false) &&
    snapshot.voice.implementationStatus === "ready_architecture" &&
    snapshot.whiteboard.implementationStatus === "ready_architecture";

  return {
    ok,
    schema: snapshot.schema,
    snapshot,
    turn,
    aiGeneration: false,
    copiesCurricula: false,
  };
}
