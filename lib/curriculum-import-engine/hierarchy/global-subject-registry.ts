/**
 * Global Subject Registry store — SUB-XXXXX identities shared across countries.
 *
 * Local labels are country-specific; global ids are universal:
 *   Jordan → الرياضيات → SUB-00001
 *   USA    → Mathematics → SUB-00001
 *   Egypt  → الرياضيات → SUB-00001
 */
import type {
  CountrySubjectAlias,
  GlobalSubjectRecord,
  GlobalSubjectRegistrySnapshot,
  GlobalSubjectResolveResult,
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

/**
 * Country-local labels for Mathematics all resolve to SUB-00001.
 * Future countries append aliases only — never create a second global Math id.
 */
export const COUNTRY_SUBJECT_ALIAS_SEED: CountrySubjectAlias[] = [
  {
    countryId: "JO",
    countryName: L("Jordan", "الأردن"),
    localLabel: "رياضيات",
    language: "ar",
    globalSubjectId: "SUB-00001",
    hierarchicalSubjectId: "JO-NATIONAL-G01-MATH",
  },
  {
    countryId: "US",
    countryName: L("USA", "الولايات المتحدة"),
    localLabel: "Mathematics",
    language: "en",
    globalSubjectId: "SUB-00001",
  },
  {
    countryId: "EG",
    countryName: L("Egypt", "مصر"),
    localLabel: "رياضيات",
    language: "ar",
    globalSubjectId: "SUB-00001",
  },
  // Additional JO STEM aliases for completeness
  {
    countryId: "JO",
    countryName: L("Jordan", "الأردن"),
    localLabel: "فيزياء",
    language: "ar",
    globalSubjectId: "SUB-00002",
    hierarchicalSubjectId: "JO-NATIONAL-G01-PHYSICS",
  },
  {
    countryId: "JO",
    countryName: L("Jordan", "الأردن"),
    localLabel: "كيمياء",
    language: "ar",
    globalSubjectId: "SUB-00003",
    hierarchicalSubjectId: "JO-NATIONAL-G01-CHEMISTRY",
  },
  {
    countryId: "JO",
    countryName: L("Jordan", "الأردن"),
    localLabel: "أحياء",
    language: "ar",
    globalSubjectId: "SUB-00004",
    hierarchicalSubjectId: "JO-NATIONAL-G01-BIOLOGY",
  },
];

const byId = new Map<string, GlobalSubjectRecord>();
const byCode = new Map<string, GlobalSubjectRecord>();
let aliases: CountrySubjectAlias[] = [];

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function rebuildIndexes(
  rows: GlobalSubjectRecord[],
  aliasRows: CountrySubjectAlias[] = COUNTRY_SUBJECT_ALIAS_SEED,
) {
  byId.clear();
  byCode.clear();
  for (const row of rows) {
    byId.set(row.id, row);
    byCode.set(row.code.toUpperCase(), row);
  }
  aliases = aliasRows.map((a) => ({ ...a }));
}

rebuildIndexes(GLOBAL_SUBJECT_REGISTRY_SEED, COUNTRY_SUBJECT_ALIAS_SEED);

export function resetGlobalSubjectRegistry(
  seed: GlobalSubjectRecord[] = GLOBAL_SUBJECT_REGISTRY_SEED,
  aliasSeed: CountrySubjectAlias[] = COUNTRY_SUBJECT_ALIAS_SEED,
) {
  rebuildIndexes(
    seed.map((r) => ({ ...r })),
    aliasSeed.map((a) => ({ ...a })),
  );
}

export function listGlobalSubjects(): GlobalSubjectRecord[] {
  return [...byId.values()].sort((a, b) => a.order - b.order);
}

export function listCountrySubjectAliases(): CountrySubjectAlias[] {
  return [...aliases];
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

/**
 * Resolve Country → local label → Global Subject (SUB-XXXXX).
 * Labels are localized; the SUB id is shared across countries.
 */
export function resolveCountrySubject(
  countryId: string,
  localLabel: string,
): GlobalSubjectResolveResult {
  const country = countryId.trim().toUpperCase();
  const label = normalizeLabel(localLabel);
  const alias =
    aliases.find(
      (a) => a.countryId.toUpperCase() === country && normalizeLabel(a.localLabel) === label,
    ) || null;
  const globalSubjectId = alias?.globalSubjectId || "";
  const subject = globalSubjectId ? getGlobalSubjectById(globalSubjectId) : null;
  const countryName =
    alias?.countryName.en ||
    (country === "JO" ? "Jordan" : country === "US" ? "USA" : country === "EG" ? "Egypt" : country);

  return {
    countryId: country,
    localLabel: alias?.localLabel || localLabel,
    globalSubjectId,
    subject,
    path: [countryName, alias?.localLabel || localLabel, globalSubjectId || "(unresolved)"],
  };
}

/** Canonical cross-country Mathematics examples from the product standard. */
export function getCrossCountryMathExamples(): GlobalSubjectResolveResult[] {
  return [
    resolveCountrySubject("JO", "رياضيات"),
    resolveCountrySubject("US", "Mathematics"),
    resolveCountrySubject("EG", "رياضيات"),
  ];
}

export function getGlobalSubjectRegistrySnapshot(): GlobalSubjectRegistrySnapshot {
  const subjects = listGlobalSubjects();
  const countryAliases = listCountrySubjectAliases();
  return {
    schema: "success-os.global-subject-registry.v1",
    subjects,
    countryAliases,
    crossCountryExamples: getCrossCountryMathExamples(),
    counts: {
      subjects: subjects.length,
      active: subjects.filter((s) => s.active).length,
      stem: subjects.filter((s) => s.family === "stem").length,
      countryAliases: countryAliases.length,
    },
  };
}

/** Format helper — SUB-00001 */
export function formatGlobalSubjectId(n: number): string {
  return subId(n);
}
