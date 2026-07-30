/**
 * Lesson dependency graph builder.
 * Lesson → depends on → Lesson → depends on → Lesson
 */
import { getLesson, listLessons } from "./registry";
import type {
  LessonDependencyChain,
  LessonDependencyEdge,
  LessonDependencyGraph,
  LessonDependencyNode,
} from "@/types/lesson-dependency";

function unique(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

/**
 * Build dependsOn list for a lesson from metadata + sequential parent.
 */
export function resolveLessonDependsOn(lessonId: string): string[] {
  const lesson = getLesson(lessonId);
  if (!lesson) return [];
  const meta = lesson.metadata;
  const fromMeta = [
    ...(meta?.dependsOn || []),
    ...(meta?.prerequisites || []),
    ...(meta?.parentLesson ? [meta.parentLesson] : []),
  ];
  return unique(fromMeta);
}

export function buildLessonDependencyGraph(opts?: {
  subjectId?: string;
  rootLessonId?: string;
}): LessonDependencyGraph {
  const lessons = listLessons().filter((l) => {
    if (!opts?.subjectId) return true;
    return l.metadata?.globalSubjectId === opts.subjectId;
  });

  const edges: LessonDependencyEdge[] = [];
  const dependentsMap = new Map<string, string[]>();

  for (const lesson of lessons) {
    const dependsOn = resolveLessonDependsOn(lesson.id);
    for (const prereq of dependsOn) {
      edges.push({
        lessonId: lesson.id,
        dependsOn: prereq,
        kind: "sequence",
      });
      const deps = dependentsMap.get(prereq) || [];
      deps.push(lesson.id);
      dependentsMap.set(prereq, unique(deps));
    }
  }

  const nodes: LessonDependencyNode[] = lessons.map((l) => ({
    lessonId: l.id,
    title: l.title,
    globalSubjectId: l.metadata?.globalSubjectId,
    dependsOn: resolveLessonDependsOn(l.id),
    dependents: dependentsMap.get(l.id) || [],
  }));

  const chains = buildChains(nodes, edges, opts?.rootLessonId);

  return {
    schema: "success-os.lesson-dependency.v1",
    pathPattern: ["Lesson", "depends on", "Lesson", "depends on", "Lesson"],
    nodes: nodes.sort((a, b) => a.lessonId.localeCompare(b.lessonId)),
    edges: edges.sort((a, b) => a.lessonId.localeCompare(b.lessonId)),
    chains,
    counts: {
      nodes: nodes.length,
      edges: edges.length,
      chains: chains.length,
    },
  };
}

function buildChains(
  nodes: LessonDependencyNode[],
  edges: LessonDependencyEdge[],
  preferredRoot?: string,
): LessonDependencyChain[] {
  const byId = new Map(nodes.map((n) => [n.lessonId, n]));
  const roots = nodes.filter((n) => n.dependsOn.length === 0);

  const startIds = preferredRoot
    ? [preferredRoot, ...roots.map((r) => r.lessonId).filter((id) => id !== preferredRoot)]
    : roots.map((r) => r.lessonId);

  const chains: LessonDependencyChain[] = [];
  const seenChainKeys = new Set<string>();

  for (const start of startIds) {
    if (!byId.has(start)) continue;
    // Walk longest path following a single dependent at a time (prefer lexical next)
    const path: string[] = [start];
    let cursor = start;
    const visited = new Set([start]);
    while (true) {
      const nexts = (byId.get(cursor)?.dependents || [])
        .filter((id) => !visited.has(id))
        .sort((a, b) => a.localeCompare(b));
      if (!nexts.length) break;
      const next = nexts[0]!;
      path.push(next);
      visited.add(next);
      cursor = next;
    }
    if (path.length < 2) continue;
    const key = path.join(">");
    if (seenChainKeys.has(key)) continue;
    seenChainKeys.add(key);

    const displayPath: string[] = [];
    for (let i = path.length - 1; i >= 0; i--) {
      displayPath.push(path[i]!);
      if (i > 0) displayPath.push("depends on");
    }

    const chainEdges = edges.filter(
      (e) => path.includes(e.lessonId) && path.includes(e.dependsOn),
    );
    chains.push({
      id: `chain_${path[0]}_to_${path[path.length - 1]}`,
      path,
      displayPath,
      nodes: path.map((id) => byId.get(id)!).filter(Boolean),
      edges: chainEdges,
    });
  }

  // Prefer longest chains first
  return chains.sort((a, b) => b.path.length - a.path.length || a.id.localeCompare(b.id));
}

/** Canonical Math Unit 1 chain: L03 → depends on → L02 → depends on → L01 */
export function buildJordanMathDependencyExample(): LessonDependencyGraph {
  return buildLessonDependencyGraph({
    subjectId: "SUB-00001",
    rootLessonId: "JO-NATIONAL-G01-MATH-B01-U01-L01",
  });
}
