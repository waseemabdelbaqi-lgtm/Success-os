/**
 * Universal Curriculum Mapping Engine — public API (PR #54).
 */
export {
  resetUniversalCurriculumMapping,
  listMappings,
  findEquivalentLessons,
  listLearningObjectives,
  getLearningObjective,
  listStandards,
  listCompetencies,
  listAssessmentObjectives,
  listMappedEntities,
  searchUniversalCurriculum,
  getUniversalCurriculumMappingSnapshot,
  runUniversalCurriculumMapping,
} from "./engine";

export { buildSearchDocuments, searchIndex } from "./search-index";
export { buildGlobalSkillGraph, lessonsForSkill, skillsForLesson } from "./skill-graph";
export {
  UCE_ENTITY_IDS,
  UCE_ENTITY_CATALOG,
  UCE_MAPPING_SEED,
  UCE_OBJECTIVE_SEED,
  UCE_EXAMPLE_PATHWAY,
} from "./seed/cross-curriculum";

export function uceEngineStatus() {
  return {
    schema: "success-os.universal-curriculum-mapping.v1",
    role: "translation_layer",
    copiesCurricula: false,
    aiGeneration: false,
    videoGeneration: false,
    quizGeneration: false,
    bookGeneration: false,
    ileCompatible: true,
    adr: ["ADR-0049", "ADR-0050", "ADR-0050.3", "ADR-0054"],
    parent: "success-os.global-curriculum-registry.v1",
    mappingTypes: [
      "equivalent",
      "partially_equivalent",
      "prerequisite",
      "advanced",
      "related",
      "continuation",
      "replacement",
      "historical_version",
    ],
  };
}
