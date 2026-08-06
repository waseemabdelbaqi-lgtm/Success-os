/**
 * Global learning knowledge graph foundation.
 *
 *   Lesson → requires → Lesson → requires → Lesson
 *   Skill  → depends on → Skill
 *
 * Works across countries and curricula via Global IDs / hierarchical lesson ids.
 * Schema: success-os.knowledge-graph.v1
 */
export type KnowledgeGraphSchema = "success-os.knowledge-graph.v1";

export type KnowledgeNodeKind = "lesson" | "skill";

export type KnowledgeNode = {
  id: string;
  kind: KnowledgeNodeKind;
  /** Optional display label */
  label?: string;
  globalSubjectId?: string;
  countryId?: string;
  curriculumId?: string;
};

export type KnowledgeEdgeKind = "requires" | "depends_on";

export type KnowledgeEdge = {
  from: string;
  to: string;
  kind: KnowledgeEdgeKind;
};

export type KnowledgeGraphSnapshot = {
  schema: KnowledgeGraphSchema;
  pathPatterns: {
    lessons: string[];
    skills: string[];
  };
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  counts: {
    nodes: number;
    edges: number;
    lessonNodes: number;
    skillNodes: number;
    requiresEdges: number;
    dependsOnEdges: number;
  };
};
