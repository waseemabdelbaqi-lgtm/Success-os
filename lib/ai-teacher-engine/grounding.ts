/**
 * Knowledge grounding & safety — never invent curriculum facts.
 */
import type {
  GroundedResponse,
  GroundingCitation,
  GroundingSourceKind,
} from "@/types/ai-teacher-engine";

function L(en: string, ar: string) {
  return { en, ar };
}

export type GroundingContext = {
  focusLessonId?: string | null;
  curriculumId?: string | null;
  knowledgeGraphNodeIds?: string[];
  uceEquivalentIds?: string[];
  digitalBookIds?: string[];
  videoIds?: string[];
  ilePackageId?: string | null;
  topicEn?: string;
  topicAr?: string;
};

export function buildCitations(ctx: GroundingContext): GroundingCitation[] {
  const citations: GroundingCitation[] = [];
  const push = (
    kind: GroundingSourceKind,
    globalId: string | null,
    label: string,
    confidence: number,
  ) => {
    if (!globalId && kind !== "platform_kb") return;
    citations.push({ kind, globalId, label, confidence });
  };

  if (ctx.curriculumId) {
    push("curriculum_registry", ctx.curriculumId, "Current curriculum", 0.95);
  }
  if (ctx.focusLessonId) {
    push("curriculum_registry", ctx.focusLessonId, "Focus lesson", 0.9);
  }
  for (const id of ctx.knowledgeGraphNodeIds?.slice(0, 5) || []) {
    push("knowledge_graph", id, "Knowledge graph node", 0.8);
  }
  for (const id of ctx.uceEquivalentIds?.slice(0, 3) || []) {
    push("uce_mapping", id, "Cross-curriculum equivalent", 0.75);
  }
  if (ctx.ilePackageId) {
    push("ile_package", ctx.ilePackageId, "ILE package", 0.95);
  }
  for (const id of ctx.digitalBookIds || []) {
    push("digital_book", id, "Digital book section", 0.5);
  }
  for (const id of ctx.videoIds || []) {
    push("video", id, "Verified video", 0.5);
  }

  if (citations.length === 0) {
    citations.push({
      kind: "none",
      globalId: null,
      label: "No approved curriculum citation available",
      confidence: 0,
    });
  }
  return citations;
}

/**
 * Build a grounded teacher reply. If nothing grounds the claim, state uncertainty.
 */
export function groundTeacherReply(
  opts: GroundingContext & {
    textEn: string;
    textAr: string;
    requireCurriculum?: boolean;
  },
): GroundedResponse {
  const citations = buildCitations(opts);
  const hasCurriculum = citations.some(
    (c) =>
      c.kind === "curriculum_registry" ||
      c.kind === "ile_package" ||
      c.kind === "knowledge_graph" ||
      c.kind === "uce_mapping",
  );
  const uncertain = opts.requireCurriculum === false ? false : !hasCurriculum;

  return {
    text: L(opts.textEn, opts.textAr),
    citations,
    uncertain,
    uncertaintyNote: uncertain
      ? L(
          "I am not certain from the approved curriculum and knowledge base. I will not invent a curriculum fact — please open the verified lesson package or ask your teacher.",
          "لست متأكدًا من المنهج المعتمد وقاعدة المعرفة. لن أخترع حقيقة منهجية — افتح حزمة الدرس الموثّقة أو اسأل معلمك.",
        )
      : null,
    inventsCurriculumFacts: false,
  };
}

export const SAFETY_RULES = [
  "Never invent curriculum facts.",
  "Always ground explanations in the approved curriculum, verified digital books, and platform knowledge base.",
  "When uncertain, clearly state uncertainty instead of guessing.",
  "ILE remains the only lesson runtime.",
  "No avatars, animations, AI-generated videos, or live classrooms in ATE PR #55.",
] as const;
