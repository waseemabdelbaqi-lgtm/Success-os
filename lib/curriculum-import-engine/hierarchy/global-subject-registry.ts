/**
 * Global Subject Registry store — SUB-XXXXX identities shared across countries.
 */
import type {
  GlobalSubjectRecord,
  GlobalSubjectRegistrySnapshot,
} from "@/types/global-subject-registry";
import type { LocaleText } from "@/types/interactive-lesson-engine";

function L(en: string, ar: string): LocaleText {
  return { en, ar };
}

function subId(n: number): string {
  return `SUB-${String(n).padStart(5, "0")}`;
}

/** Official seed — extend only by appending; never reuse retired ids. */
export const GLOBAL_SUBJECT_REGISTRY_SEED: GlobalSubjectRecord[] = [
  {
    id: subId(1),
    code: "MATH",
    name: L("Mathematics", "الرياضيات"),
    family: "stem",
    order: 1,
    active: true,
  },
  {
    id: subId(2),
    code: "PHYSICS",
    name: L("Physics", "الفيزياء"),
    family: "stem",
    order: 2,
    active: true,
  },
  {
    id: subId(3),
    code: "CHEMISTRY",
    name: L("Chemistry", "الكيمياء"),
    family: "stem",
    order: 3,
    active: true,
  },
  {
    id: subId(4),
    code: "BIOLOGY",
    name: L("Biology", "الأحياء"),
    family: "stem",
    order: 4,
    active: true,
  },
  {
    id: subId(5),
    code: "AR",
    name: L("Arabic", "اللغة العربية"),
    family: "language",
    order: 5,
    active: true,
  },
  {
    id: subId(6),
    code: "EN",
    name: L("English", "اللغة الإنجليزية"),
    family: "language",
    order: 6,
    active: true,
  },
  {
    id: subId(7),
    code: "SCI",
    name: L("Science", "العلوم"),
    family: "stem",
    order: 7,
    active: true,
  },
  {
    id: subId(8),
    code: "ISL",
    name: L("Islamic Education", "التربية الإسلامية"),
    family: "religious",
    order: 8,
    active: true,
  },
  {
    id: subId(9),
    code: "SOC",
    name: L("Social Studies", "التربية الاجتماعية"),
    family: "humanities",
    order: 9,
    active: true,
  },
];

const byId = new Map<string, GlobalSubjectRecord>();
const byCode = new Map<string, GlobalSubjectRecord>();

function rebuildIndexes(rows: GlobalSubjectRecord[]) {
  byId.clear();
  byCode.clear();
  for (const row of rows) {
    byId.set(row.id, row);
    byCode.set(row.code.toUpperCase(), row);
  }
}

rebuildIndexes(GLOBAL_SUBJECT_REGISTRY_SEED);

export function resetGlobalSubjectRegistry(
  seed: GlobalSubjectRecord[] = GLOBAL_SUBJECT_REGISTRY_SEED,
) {
  rebuildIndexes(seed.map((r) => ({ ...r })));
}

export function listGlobalSubjects(): GlobalSubjectRecord[] {
  return [...byId.values()].sort((a, b) => a.order - b.order);
}

export function getGlobalSubjectById(id: string): GlobalSubjectRecord | null {
  return byId.get(id) || null;
}

export function getGlobalSubjectByCode(code: string): GlobalSubjectRecord | null {
  return byCode.get(code.toUpperCase()) || null;
}

export function requireGlobalSubjectByCode(code: string): GlobalSubjectRecord {
  const row = getGlobalSubjectByCode(code);
  if (!row) throw new Error(`Unknown global subject code: ${code}`);
  return row;
}

export function getGlobalSubjectRegistrySnapshot(): GlobalSubjectRegistrySnapshot {
  const subjects = listGlobalSubjects();
  return {
    schema: "success-os.global-subject-registry.v1",
    subjects,
    counts: {
      subjects: subjects.length,
      active: subjects.filter((s) => s.active).length,
      stem: subjects.filter((s) => s.family === "stem").length,
    },
  };
}

/** Format helper — SUB-00001 */
export function formatGlobalSubjectId(n: number): string {
  return subId(n);
}
