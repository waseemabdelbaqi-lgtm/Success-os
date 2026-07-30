/**
 * Global Skill Registry — SKL-XXXXX identities shared across countries/subjects.
 *
 *   SKL-00001 Arithmetic
 *   SKL-00002 Fractions
 *   SKL-00003 Vectors
 *   SKL-00004 Newton Laws
 *   SKL-00005 Acids
 *   SKL-00006 Reading
 *   SKL-00007 Writing
 *   SKL-00008 Critical Thinking
 *   SKL-00009 Decimals
 *   SKL-00010 Percentages
 *   SKL-00011 Algebra
 *   SKL-00012 Functions
 *
 * Math pathway:
 *   Fractions → Decimals → Percentages → Algebra → Functions
 */
import type {
  GlobalSkillRecord,
  GlobalSkillRegistrySnapshot,
  SkillDependencyChain,
  SkillDependencyEdge,
} from "@/types/global-skill-registry";
import type { LocaleText } from "@/types/interactive-lesson-engine";

function L(en: string, ar: string): LocaleText {
  return { en, ar };
}

function sklId(n: number): string {
  return `SKL-${String(n).padStart(5, "0")}`;
}

/** Official seed — append-only; never reuse retired ids. */
export const GLOBAL_SKILL_REGISTRY_SEED: GlobalSkillRecord[] = [
  {
    id: sklId(1),
    code: "ARITHMETIC",
    name: L("Arithmetic", "الحساب"),
    subjectIds: ["SUB-00001"],
    dependsOn: [],
    family: "math",
    order: 1,
    active: true,
  },
  {
    id: sklId(2),
    code: "FRACTIONS",
    name: L("Fractions", "الكسور"),
    subjectIds: ["SUB-00001"],
    dependsOn: [sklId(1)], // Arithmetic
    family: "math",
    order: 2,
    active: true,
  },
  {
    id: sklId(3),
    code: "VECTORS",
    name: L("Vectors", "المتجهات"),
    subjectIds: ["SUB-00002"],
    dependsOn: [],
    family: "physics",
    order: 3,
    active: true,
  },
  {
    id: sklId(4),
    code: "NEWTON_LAWS",
    name: L("Newton Laws", "قوانين نيوتن"),
    subjectIds: ["SUB-00002"],
    dependsOn: [sklId(3)],
    family: "physics",
    order: 4,
    active: true,
  },
  {
    id: sklId(5),
    code: "ACIDS",
    name: L("Acids", "الأحماض"),
    subjectIds: ["SUB-00003"],
    dependsOn: [],
    family: "chemistry",
    order: 5,
    active: true,
  },
  {
    id: sklId(6),
    code: "READING",
    name: L("Reading", "القراءة"),
    subjectIds: ["SUB-00005", "SUB-00006"],
    dependsOn: [],
    family: "language",
    order: 6,
    active: true,
  },
  {
    id: sklId(7),
    code: "WRITING",
    name: L("Writing", "الكتابة"),
    subjectIds: ["SUB-00005", "SUB-00006"],
    dependsOn: [sklId(6)],
    family: "language",
    order: 7,
    active: true,
  },
  {
    id: sklId(8),
    code: "CRITICAL_THINKING",
    name: L("Critical Thinking", "التفكير النقدي"),
    subjectIds: [],
    dependsOn: [],
    family: "thinking",
    order: 8,
    active: true,
  },
  {
    id: sklId(9),
    code: "DECIMALS",
    name: L("Decimals", "الأعداد العشرية"),
    subjectIds: ["SUB-00001"],
    dependsOn: [sklId(2)], // Fractions
    family: "math",
    order: 9,
    active: true,
  },
  {
    id: sklId(10),
    code: "PERCENTAGES",
    name: L("Percentages", "النسب المئوية"),
    subjectIds: ["SUB-00001"],
    dependsOn: [sklId(9)], // Decimals
    family: "math",
    order: 10,
    active: true,
  },
  {
    id: sklId(11),
    code: "ALGEBRA",
    name: L("Algebra", "الجبر"),
    subjectIds: ["SUB-00001"],
    dependsOn: [sklId(10)], // Percentages
    family: "math",
    order: 11,
    active: true,
  },
  {
    id: sklId(12),
    code: "FUNCTIONS",
    name: L("Functions", "الدوال"),
    subjectIds: ["SUB-00001"],
    dependsOn: [sklId(11)], // Algebra
    family: "math",
    order: 12,
    active: true,
  },
];

/** Canonical Math skill pathway ids (user-facing chain). */
export const MATH_SKILL_PATHWAY_IDS = [
  sklId(2), // Fractions
  sklId(9), // Decimals
  sklId(10), // Percentages
  sklId(11), // Algebra
  sklId(12), // Functions
] as const;

const byId = new Map<string, GlobalSkillRecord>();
const byCode = new Map<string, GlobalSkillRecord>();

function rebuildIndexes(rows: GlobalSkillRecord[]) {
  byId.clear();
  byCode.clear();
  for (const row of rows) {
    byId.set(row.id, row);
    byCode.set(row.code.toUpperCase(), row);
  }
}

rebuildIndexes(GLOBAL_SKILL_REGISTRY_SEED);

export function resetGlobalSkillRegistry(
  seed: GlobalSkillRecord[] = GLOBAL_SKILL_REGISTRY_SEED,
) {
  rebuildIndexes(
    seed.map((r) => ({
      ...r,
      subjectIds: [...r.subjectIds],
      dependsOn: [...(r.dependsOn || [])],
    })),
  );
}

export function listGlobalSkills(): GlobalSkillRecord[] {
  return [...byId.values()].sort((a, b) => a.order - b.order);
}

export function getGlobalSkillById(id: string): GlobalSkillRecord | null {
  return byId.get(id) || null;
}

export function getGlobalSkillByCode(code: string): GlobalSkillRecord | null {
  return byCode.get(code.toUpperCase()) || null;
}

export function requireGlobalSkillByCode(code: string): GlobalSkillRecord {
  const row = getGlobalSkillByCode(code);
  if (!row) throw new Error(`Unknown global skill code: ${code}`);
  return row;
}

/** Default skill ids for a global subject (plus Critical Thinking). */
export function defaultSkillIdsForSubject(globalSubjectId: string): string[] {
  // Math has a long pathway (Fractions→…→Functions) — do not attach the whole chain to every lesson.
  if (globalSubjectId === "SUB-00001") {
    return ["SKL-00001", "SKL-00008"];
  }
  const linked = listGlobalSkills()
    .filter((s) => s.active && s.subjectIds.includes(globalSubjectId))
    .map((s) => s.id);
  const critical = getGlobalSkillByCode("CRITICAL_THINKING");
  if (critical && !linked.includes(critical.id)) linked.push(critical.id);
  return linked;
}

function buildPathwayChain(pathIds: string[], id: string): SkillDependencyChain | null {
  const skills = pathIds.map((sid) => getGlobalSkillById(sid)).filter(Boolean);
  if (skills.length < 2) return null;
  const edges: SkillDependencyEdge[] = [];
  for (let i = 1; i < pathIds.length; i++) {
    edges.push({
      skillId: pathIds[i]!,
      dependsOn: pathIds[i - 1]!,
      kind: "pathway",
    });
  }
  const labels = pathIds.map((sid) => getGlobalSkillById(sid)?.name.en || sid);
  const displayPath: string[] = [];
  for (let i = pathIds.length - 1; i >= 0; i--) {
    displayPath.push(labels[i]!);
    if (i > 0) displayPath.push("depends on");
  }
  return {
    id,
    path: [...pathIds],
    displayPath,
    labels,
    edges,
  };
}

/** Fractions → Decimals → Percentages → Algebra → Functions */
export function getMathSkillPathway(): SkillDependencyChain {
  const chain = buildPathwayChain([...MATH_SKILL_PATHWAY_IDS], "pathway_math_fractions_to_functions");
  if (!chain) {
    throw new Error("Math skill pathway incomplete");
  }
  return chain;
}

export function listSkillDependencyEdges(): SkillDependencyEdge[] {
  const edges: SkillDependencyEdge[] = [];
  for (const skill of listGlobalSkills()) {
    for (const prereq of skill.dependsOn || []) {
      edges.push({
        skillId: skill.id,
        dependsOn: prereq,
        kind: "prerequisite",
      });
    }
  }
  return edges;
}

export function getGlobalSkillRegistrySnapshot(): GlobalSkillRegistrySnapshot {
  const skills = listGlobalSkills();
  const byFamily: Record<string, number> = {};
  for (const s of skills) {
    byFamily[s.family] = (byFamily[s.family] || 0) + 1;
  }
  const mathPathway = getMathSkillPathway();
  const edges = listSkillDependencyEdges();
  return {
    schema: "success-os.global-skill-registry.v1",
    skills,
    pathPattern: ["Skill", "depends on", "Skill", "depends on", "Skill"],
    mathPathway,
    pathways: [mathPathway],
    counts: {
      skills: skills.length,
      active: skills.filter((s) => s.active).length,
      byFamily,
      pathwayEdges: edges.length,
    },
  };
}

export function formatGlobalSkillId(n: number): string {
  return sklId(n);
}
