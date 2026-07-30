/**
 * Global Skill Graph — skills connect lessons across countries/curricula.
 */
import type {
  GlobalSkillGraphSnapshot,
  SkillGraphEdge,
} from "@/types/universal-curriculum-mapping";
import { listGlobalSkills } from "@/lib/curriculum-import-engine/hierarchy/global-skill-registry";

export function buildGlobalSkillGraph(edges: SkillGraphEdge[]): GlobalSkillGraphSnapshot {
  const skills = listGlobalSkills().filter((s) => s.active);
  const skillDependencies = skills.flatMap((s) =>
    (s.dependsOn || []).map((d) => ({ skillId: s.id, dependsOn: d })),
  );
  const countries = new Set(edges.map((e) => e.countryGlobalId).filter(Boolean));
  const curricula = new Set(edges.map((e) => e.curriculumGlobalId).filter(Boolean));

  return {
    schema: "success-os.global-skill-graph.v1",
    pathPattern: ["Skill", "connects", "Lesson", "across", "Curriculum"],
    skillIds: skills.map((s) => s.id),
    edges: [...edges],
    skillDependencies,
    counts: {
      skills: skills.length,
      lessonLinks: edges.length,
      skillDependencies: skillDependencies.length,
      countries: countries.size,
      curricula: curricula.size,
    },
  };
}

/** Lessons linked to a skill across any country/curriculum. */
export function lessonsForSkill(edges: SkillGraphEdge[], skillId: string): SkillGraphEdge[] {
  return edges.filter((e) => e.skillId === skillId);
}

/** Skills taught by a lesson (by Global Lesson ID). */
export function skillsForLesson(edges: SkillGraphEdge[], lessonGlobalId: string): string[] {
  return [...new Set(edges.filter((e) => e.lessonGlobalId === lessonGlobalId).map((e) => e.skillId))];
}
