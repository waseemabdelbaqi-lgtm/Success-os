/**
 * Universal Curriculum Mapping Engine — core store + query API.
 * Translation layer only. No lesson/video/book/quiz generation.
 */
import type {
  CurriculumMappingRecord,
  GlobalAssessmentObjectiveRecord,
  GlobalCompetencyRecord,
  GlobalLearningObjectiveRecord,
  GlobalStandardRecord,
  MappedEntityRef,
  MappingRelationType,
  SearchQuery,
  SearchResult,
  UniversalCurriculumMappingSnapshot,
} from "@/types/universal-curriculum-mapping";
import {
  UCE_ASSESSMENT_OBJECTIVE_SEED,
  UCE_COMPETENCY_SEED,
  UCE_ENTITY_CATALOG,
  UCE_EXAMPLE_PATHWAY,
  UCE_MAPPING_SEED,
  UCE_OBJECTIVE_SEED,
  UCE_SKILL_GRAPH_EDGE_SEED,
  UCE_STANDARD_SEED,
} from "./seed/cross-curriculum";
import { buildSearchDocuments, searchIndex } from "./search-index";
import { buildGlobalSkillGraph } from "./skill-graph";
import { listGlobalSkills, resetGlobalSkillRegistry } from "@/lib/curriculum-import-engine/hierarchy/global-skill-registry";

const ENTITY_KINDS = [
  "country",
  "curriculum",
  "academic_year",
  "grade",
  "subject",
  "book",
  "unit",
  "lesson",
  "skill",
  "learning_objective",
  "competency",
  "standard",
  "assessment_objective",
] as const;

const RELATION_TYPES: MappingRelationType[] = [
  "equivalent",
  "partially_equivalent",
  "prerequisite",
  "advanced",
  "related",
  "continuation",
  "replacement",
  "historical_version",
];

let entities: MappedEntityRef[] = [];
let mappings: CurriculumMappingRecord[] = [];
let objectives: GlobalLearningObjectiveRecord[] = [];
let competencies: GlobalCompetencyRecord[] = [];
let standards: GlobalStandardRecord[] = [];
let assessmentObjectives: GlobalAssessmentObjectiveRecord[] = [];
let skillEdges = [...UCE_SKILL_GRAPH_EDGE_SEED];

export function resetUniversalCurriculumMapping() {
  resetGlobalSkillRegistry();
  entities = UCE_ENTITY_CATALOG.map((e) => ({ ...e }));
  mappings = UCE_MAPPING_SEED.map((m) => ({
    ...m,
    source: { ...m.source },
    target: { ...m.target },
    evidence: m.evidence.map((e) => ({ ...e })),
  }));
  objectives = UCE_OBJECTIVE_SEED.map((o) => ({
    ...o,
    skillIds: [...o.skillIds],
    lessonIds: [...o.lessonIds],
    assessmentObjectiveIds: [...o.assessmentObjectiveIds],
    digitalBookIds: [...o.digitalBookIds],
    videoIds: [...o.videoIds],
    subjectGlobalIds: [...o.subjectGlobalIds],
    keywords: [...o.keywords],
  }));
  competencies = UCE_COMPETENCY_SEED.map((c) => ({
    ...c,
    objectiveIds: [...c.objectiveIds],
    skillIds: [...c.skillIds],
  }));
  standards = UCE_STANDARD_SEED.map((s) => ({
    ...s,
    objectiveIds: [...s.objectiveIds],
  }));
  assessmentObjectives = UCE_ASSESSMENT_OBJECTIVE_SEED.map((a) => ({
    ...a,
    objectiveIds: [...a.objectiveIds],
    skillIds: [...a.skillIds],
  }));
  skillEdges = UCE_SKILL_GRAPH_EDGE_SEED.map((e) => ({ ...e }));
}

resetUniversalCurriculumMapping();

export function listMappings(filter?: {
  relation?: MappingRelationType;
  globalId?: string;
  minConfidence?: number;
}): CurriculumMappingRecord[] {
  return mappings.filter((m) => {
    if (!m.active) return false;
    if (filter?.relation && m.relation !== filter.relation) return false;
    if (
      filter?.globalId &&
      m.source.globalId !== filter.globalId &&
      m.target.globalId !== filter.globalId
    )
      return false;
    if (filter?.minConfidence != null && m.confidence < filter.minConfidence) return false;
    return true;
  });
}

/** Find equivalent / related lessons for a source Global Lesson ID. */
export function findEquivalentLessons(
  lessonGlobalId: string,
  opts?: { minConfidence?: number; relations?: MappingRelationType[] },
): CurriculumMappingRecord[] {
  const relations = opts?.relations || [
    "equivalent",
    "partially_equivalent",
    "related",
    "advanced",
    "continuation",
  ];
  const min = opts?.minConfidence ?? 0.5;
  return listMappings({ globalId: lessonGlobalId, minConfidence: min }).filter((m) =>
    relations.includes(m.relation),
  );
}

export function listLearningObjectives(): GlobalLearningObjectiveRecord[] {
  return objectives.filter((o) => o.active);
}

export function getLearningObjective(globalId: string): GlobalLearningObjectiveRecord | null {
  return objectives.find((o) => o.globalId === globalId) || null;
}

export function listStandards(): GlobalStandardRecord[] {
  return standards.filter((s) => s.active);
}

export function listCompetencies(): GlobalCompetencyRecord[] {
  return competencies.filter((c) => c.active);
}

export function listAssessmentObjectives(): GlobalAssessmentObjectiveRecord[] {
  return assessmentObjectives.filter((a) => a.active);
}

export function listMappedEntities(): MappedEntityRef[] {
  return [...entities];
}

export function searchUniversalCurriculum(query: SearchQuery): SearchResult {
  const docs = buildSearchDocuments({
    entities,
    objectives,
    standards,
    assessmentObjectives,
    mappings,
  });
  return searchIndex(docs, query);
}

export function getUniversalCurriculumMappingSnapshot(): UniversalCurriculumMappingSnapshot {
  const skillGraph = buildGlobalSkillGraph(skillEdges);
  const docs = buildSearchDocuments({
    entities,
    objectives,
    standards,
    assessmentObjectives,
    mappings,
  });
  const byRelation: Record<string, number> = {};
  for (const r of RELATION_TYPES) byRelation[r] = 0;
  for (const m of mappings) {
    byRelation[m.relation] = (byRelation[m.relation] || 0) + 1;
  }

  return {
    schema: "success-os.universal-curriculum-mapping.v1",
    mission:
      "Understand relationships between curricula — never copy curricula. Mappings reference Global IDs only.",
    entityKinds: [...ENTITY_KINDS],
    relationTypes: [...RELATION_TYPES],
    mappings: listMappings(),
    objectives: listLearningObjectives(),
    competencies: listCompetencies(),
    standards: listStandards(),
    assessmentObjectives: listAssessmentObjectives(),
    skillGraph,
    searchIndexSize: docs.length,
    examplePathway: UCE_EXAMPLE_PATHWAY,
    counts: {
      mappings: mappings.length,
      objectives: objectives.length,
      competencies: competencies.length,
      standards: standards.length,
      assessmentObjectives: assessmentObjectives.length,
      searchDocuments: docs.length,
      byRelation,
    },
    notes: [
      "No AI lesson/video/book/quiz generation in this engine.",
      "Compatible with ILE packages via lesson Global IDs / hierarchical ids.",
      "Jordan appears only as one mapped curriculum among many.",
      `Global Skill Registry skills available: ${listGlobalSkills().length}`,
    ],
  };
}

export function runUniversalCurriculumMapping(opts?: { reset?: boolean }) {
  if (opts?.reset !== false) resetUniversalCurriculumMapping();
  const snapshot = getUniversalCurriculumMappingSnapshot();
  const pathwayHits = findEquivalentLessons("LSN-01001");
  const searchDemo = searchUniversalCurriculum({ q: "cell", language: "en", limit: 10 });
  return {
    ok:
      snapshot.counts.mappings >= 10 &&
      snapshot.counts.objectives >= 2 &&
      snapshot.skillGraph.counts.lessonLinks >= 1 &&
      searchDemo.counts.total >= 1 &&
      RELATION_TYPES.every((r) => snapshot.relationTypes.includes(r)) &&
      RELATION_TYPES.every((r) => (snapshot.counts.byRelation[r] || 0) >= 1),
    schema: snapshot.schema as const,
    snapshot,
    pathwayFromJordanG8: pathwayHits,
    searchDemo,
    examplePathway: UCE_EXAMPLE_PATHWAY,
    aiGeneration: false,
    copiesCurricula: false,
  };
}
