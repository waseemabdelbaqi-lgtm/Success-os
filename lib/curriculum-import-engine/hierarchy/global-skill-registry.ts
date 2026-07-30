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
 */
import type {
  GlobalSkillRecord,
  GlobalSkillRegistrySnapshot,
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
    family: "math",
    order: 1,
    active: true,
  },
  {
    id: sklId(2),
    code: "FRACTIONS",
    name: L("Fractions", "الكسور"),
    subjectIds: ["SUB-00001"],
    family: "math",
    order: 2,
    active: true,
  },
  {
    id: sklId(3),
    code: "VECTORS",
    name: L("Vectors", "المتجهات"),
    subjectIds: ["SUB-00002"],
    family: "physics",
    order: 3,
    active: true,
  },
  {
    id: sklId(4),
    code: "NEWTON_LAWS",
    name: L("Newton Laws", "قوانين نيوتن"),
    subjectIds: ["SUB-00002"],
    family: "physics",
    order: 4,
    active: true,
  },
  {
    id: sklId(5),
    code: "ACIDS",
    name: L("Acids", "الأحماض"),
    subjectIds: ["SUB-00003"],
    family: "chemistry",
    order: 5,
    active: true,
  },
  {
    id: sklId(6),
    code: "READING",
    name: L("Reading", "القراءة"),
    subjectIds: ["SUB-00005", "SUB-00006"],
    family: "language",
    order: 6,
    active: true,
  },
  {
    id: sklId(7),
    code: "WRITING",
    name: L("Writing", "الكتابة"),
    subjectIds: ["SUB-00005", "SUB-00006"],
    family: "language",
    order: 7,
    active: true,
  },
  {
    id: sklId(8),
    code: "CRITICAL_THINKING",
    name: L("Critical Thinking", "التفكير النقدي"),
    subjectIds: [],
    family: "thinking",
    order: 8,
    active: true,
  },
];

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
  rebuildIndexes(seed.map((r) => ({ ...r, subjectIds: [...r.subjectIds] })));
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
  const linked = listGlobalSkills()
    .filter((s) => s.active && s.subjectIds.includes(globalSubjectId))
    .map((s) => s.id);
  const critical = getGlobalSkillByCode("CRITICAL_THINKING");
  if (critical && !linked.includes(critical.id)) linked.push(critical.id);
  return linked;
}

export function getGlobalSkillRegistrySnapshot(): GlobalSkillRegistrySnapshot {
  const skills = listGlobalSkills();
  const byFamily: Record<string, number> = {};
  for (const s of skills) {
    byFamily[s.family] = (byFamily[s.family] || 0) + 1;
  }
  return {
    schema: "success-os.global-skill-registry.v1",
    skills,
    counts: {
      skills: skills.length,
      active: skills.filter((s) => s.active).length,
      byFamily,
    },
  };
}

export function formatGlobalSkillId(n: number): string {
  return sklId(n);
}
