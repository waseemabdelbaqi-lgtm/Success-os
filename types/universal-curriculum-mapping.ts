/**
 * Universal Curriculum Mapping Engine (UCE) — PR #54.
 *
 * Translation layer between curricula. Does NOT copy curricula.
 * Understands educational relationships via Global IDs.
 *
 * Schema: success-os.universal-curriculum-mapping.v1
 */
import type { LocaleText } from "./interactive-lesson-engine";

export type UniversalCurriculumMappingSchema =
  "success-os.universal-curriculum-mapping.v1";

/** Entities that participate in cross-curriculum mappings. */
export type MappableEntityKind =
  | "country"
  | "curriculum"
  | "academic_year"
  | "grade"
  | "subject"
  | "book"
  | "unit"
  | "lesson"
  | "skill"
  | "learning_objective"
  | "competency"
  | "standard"
  | "assessment_objective";

export type MappingRelationType =
  | "equivalent"
  | "partially_equivalent"
  | "prerequisite"
  | "advanced"
  | "related"
  | "continuation"
  | "replacement"
  | "historical_version";

export type MappingEvidenceSource = {
  id: string;
  kind:
    | "official_curriculum"
    | "exam_board_spec"
    | "standards_framework"
    | "publisher"
    | "expert_review"
    | "internal_analysis";
  label: LocaleText;
  href?: string;
  retrievedAt?: string;
};

/** Independent entity reference — always by Global ID, never by localized name alone. */
export type MappedEntityRef = {
  globalId: string;
  kind: MappableEntityKind;
  /** Optional display labels (not used as identity) */
  label?: LocaleText;
  /** Optional curriculum-scoped hierarchical path */
  hierarchicalId?: string;
  countryGlobalId?: string;
  curriculumGlobalId?: string;
  subjectGlobalId?: string;
  language?: "ar" | "en" | "bilingual" | string;
};

export type CurriculumMappingRecord = {
  globalId: string; // MAP-XXXXX
  relation: MappingRelationType;
  source: MappedEntityRef;
  target: MappedEntityRef;
  /** 0..1 */
  confidence: number;
  evidence: MappingEvidenceSource[];
  notes?: LocaleText;
  active: boolean;
  createdAt: string;
};

export type GlobalLearningObjectiveRecord = {
  globalId: string; // OBJ-XXXXX
  code: string;
  statement: LocaleText;
  skillIds: string[]; // SKL-XXXXX
  lessonIds: string[]; // LSN / hierarchical
  assessmentObjectiveIds: string[]; // ASO-XXXXX
  digitalBookIds: string[]; // reserved
  videoIds: string[]; // reserved — no AI generation
  aiTutorReady: boolean; // always false until AI PRs
  subjectGlobalIds: string[];
  keywords: string[];
  bloomLevel?: string;
  active: boolean;
};

export type GlobalCompetencyRecord = {
  globalId: string; // CMP-XXXXX
  code: string;
  name: LocaleText;
  objectiveIds: string[];
  skillIds: string[];
  active: boolean;
};

export type GlobalStandardRecord = {
  globalId: string; // STD-XXXXX
  code: string;
  framework: string; // e.g. NGSS, IGCSE, IB-MYP
  name: LocaleText;
  objectiveIds: string[];
  active: boolean;
};

export type GlobalAssessmentObjectiveRecord = {
  globalId: string; // ASO-XXXXX
  code: string;
  statement: LocaleText;
  objectiveIds: string[];
  skillIds: string[];
  active: boolean;
};

/** Skill ↔ Lesson edges across countries (Global Skill Graph view). */
export type SkillGraphEdge = {
  skillId: string;
  lessonGlobalId: string;
  lessonHierarchicalId?: string;
  countryGlobalId?: string;
  curriculumGlobalId?: string;
  subjectGlobalId?: string;
  weight: number;
};

export type GlobalSkillGraphSnapshot = {
  schema: "success-os.global-skill-graph.v1";
  pathPattern: string[];
  skillIds: string[];
  edges: SkillGraphEdge[];
  skillDependencies: { skillId: string; dependsOn: string }[];
  counts: {
    skills: number;
    lessonLinks: number;
    skillDependencies: number;
    countries: number;
    curricula: number;
  };
};

export type SearchIndexField =
  | "country"
  | "curriculum"
  | "grade"
  | "subject"
  | "book"
  | "lesson"
  | "skill"
  | "objective"
  | "keyword"
  | "standard"
  | "language";

export type SearchIndexDocument = {
  id: string;
  kind: MappableEntityKind | "mapping";
  globalId: string;
  title: LocaleText;
  countryGlobalId?: string;
  curriculumGlobalId?: string;
  gradeGlobalId?: string;
  subjectGlobalId?: string;
  bookGlobalId?: string;
  lessonGlobalId?: string;
  skillIds: string[];
  objectiveIds: string[];
  standardIds: string[];
  keywords: string[];
  language?: string;
  /** Flattened searchable text (en + ar) */
  searchText: string;
};

export type SearchQuery = {
  q?: string;
  country?: string;
  curriculum?: string;
  grade?: string;
  subject?: string;
  book?: string;
  lesson?: string;
  skill?: string;
  objective?: string;
  keyword?: string;
  standard?: string;
  language?: string;
  limit?: number;
};

export type SearchResult = {
  schema: "success-os.uce-search.v1";
  query: SearchQuery;
  hits: SearchIndexDocument[];
  counts: { total: number; returned: number };
};

export type UniversalCurriculumMappingSnapshot = {
  schema: UniversalCurriculumMappingSchema;
  mission: string;
  entityKinds: MappableEntityKind[];
  relationTypes: MappingRelationType[];
  mappings: CurriculumMappingRecord[];
  objectives: GlobalLearningObjectiveRecord[];
  competencies: GlobalCompetencyRecord[];
  standards: GlobalStandardRecord[];
  assessmentObjectives: GlobalAssessmentObjectiveRecord[];
  skillGraph: GlobalSkillGraphSnapshot;
  searchIndexSize: number;
  examplePathway: {
    title: string;
    steps: { label: string; globalId: string; kind: string }[];
  };
  counts: {
    mappings: number;
    objectives: number;
    competencies: number;
    standards: number;
    assessmentObjectives: number;
    searchDocuments: number;
    byRelation: Record<string, number>;
  };
  notes: string[];
};
