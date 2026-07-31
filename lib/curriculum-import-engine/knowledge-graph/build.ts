/**
 * Knowledge graph foundation — Lesson requires Lesson; Skill depends on Skill.
 */
import type {
  KnowledgeEdge,
  KnowledgeGraphSnapshot,
  KnowledgeNode,
} from "@/types/knowledge-graph";
import { listGlobalSkills } from "../hierarchy/global-skill-registry";
import type { LessonDependencyGraph } from "@/types/lesson-dependency";

export function buildKnowledgeGraph(input?: {
  lessonDependency?: LessonDependencyGraph | null;
}): KnowledgeGraphSnapshot {
  const nodes: KnowledgeNode[] = [];
  const edges: KnowledgeEdge[] = [];
  const nodeIds = new Set<string>();

  function addNode(node: KnowledgeNode) {
    if (nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  }

  for (const skill of listGlobalSkills()) {
    addNode({
      id: skill.id,
      kind: "skill",
      label: skill.name.en,
      globalSubjectId: skill.subjectIds[0],
    });
    for (const prereq of skill.dependsOn || []) {
      edges.push({ from: skill.id, to: prereq, kind: "depends_on" });
    }
  }

  const dep = input?.lessonDependency;
  if (dep) {
    for (const n of dep.nodes) {
      addNode({
        id: n.lessonId,
        kind: "lesson",
        label: n.title?.en || n.lessonId,
        globalSubjectId: n.globalSubjectId,
      });
    }
    for (const e of dep.edges) {
      // Lesson A depends on B  ⇒  A requires B
      edges.push({ from: e.lessonId, to: e.dependsOn, kind: "requires" });
    }
  }

  return {
    schema: "success-os.knowledge-graph.v1",
    pathPatterns: {
      lessons: ["Lesson", "requires", "Lesson", "requires", "Lesson"],
      skills: ["Skill", "depends on", "Skill", "depends on", "Skill"],
    },
    nodes,
    edges,
    counts: {
      nodes: nodes.length,
      edges: edges.length,
      lessonNodes: nodes.filter((n) => n.kind === "lesson").length,
      skillNodes: nodes.filter((n) => n.kind === "skill").length,
      requiresEdges: edges.filter((e) => e.kind === "requires").length,
      dependsOnEdges: edges.filter((e) => e.kind === "depends_on").length,
    },
  };
}
