/**
 * Immutable Global ID patterns for the Global Curriculum Registry.
 *
 * IDs never change regardless of language or curriculum label updates.
 * Hierarchical path ids (e.g. JO-NATIONAL-G01-MATH-B01-U01-L01) remain
 * curriculum-scoped addresses; Global IDs are the permanent identity layer.
 */
export type GlobalIdKind =
  | "world"
  | "country"
  | "curriculum"
  | "academic_year"
  | "grade"
  | "semester"
  | "subject"
  | "book"
  | "unit"
  | "lesson"
  | "skill"
  | "ile_package"
  | "learning_objective"
  | "competency"
  | "standard"
  | "assessment_objective"
  | "mapping";

export const GLOBAL_ID_PREFIX: Record<GlobalIdKind, string> = {
  world: "WLD",
  country: "CTR",
  curriculum: "CUR",
  academic_year: "AYR",
  grade: "GRD",
  semester: "SEM",
  subject: "SUB",
  book: "BOK",
  unit: "UNT",
  lesson: "LSN",
  skill: "SKL",
  ile_package: "PKG",
  learning_objective: "OBJ",
  competency: "CMP",
  standard: "STD",
  assessment_objective: "ASO",
  mapping: "MAP",
};

/** Format e.g. SUB-00001, CTR-00001 */
export function formatGlobalId(kind: GlobalIdKind, n: number): string {
  const prefix = GLOBAL_ID_PREFIX[kind];
  return `${prefix}-${String(n).padStart(5, "0")}`;
}

export function parseGlobalId(
  id: string,
): { kind: GlobalIdKind; n: number } | null {
  const m = /^([A-Z]{3})-(\d{5})$/.exec(id.trim().toUpperCase());
  if (!m) return null;
  const prefix = m[1]!;
  const n = Number(m[2]);
  const entry = (Object.entries(GLOBAL_ID_PREFIX) as [GlobalIdKind, string][]).find(
    ([, p]) => p === prefix,
  );
  if (!entry) return null;
  return { kind: entry[0], n };
}

export const WORLD_GLOBAL_ID = "WLD-00001";
