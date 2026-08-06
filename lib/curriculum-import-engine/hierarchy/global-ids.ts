/**
 * Append-only Global ID allocators for the Global Curriculum Registry.
 * Never reuse a retired id.
 */
import {
  formatGlobalId,
  type GlobalIdKind,
  WORLD_GLOBAL_ID,
} from "@/types/global-ids";

const counters: Record<GlobalIdKind, number> = {
  world: 1,
  country: 0,
  curriculum: 0,
  academic_year: 0,
  grade: 0,
  semester: 0,
  subject: 0,
  book: 0,
  unit: 0,
  lesson: 0,
  skill: 0,
  ile_package: 0,
  learning_objective: 0,
  competency: 0,
  standard: 0,
  assessment_objective: 0,
  mapping: 0,
};

const reserved = new Map<string, string>(); // stableKey → globalId

export function resetGlobalIdAllocators() {
  for (const key of Object.keys(counters) as GlobalIdKind[]) {
    counters[key] = key === "world" ? 1 : 0;
  }
  reserved.clear();
  reserved.set("world", WORLD_GLOBAL_ID);
}

export function allocateGlobalId(kind: GlobalIdKind, stableKey: string): string {
  const key = `${kind}:${stableKey}`;
  const existing = reserved.get(key);
  if (existing) return existing;
  if (kind === "world") {
    reserved.set(key, WORLD_GLOBAL_ID);
    return WORLD_GLOBAL_ID;
  }
  counters[kind] += 1;
  const id = formatGlobalId(kind, counters[kind]);
  reserved.set(key, id);
  return id;
}

export function peekGlobalId(kind: GlobalIdKind, stableKey: string): string | null {
  return reserved.get(`${kind}:${stableKey}`) || null;
}

export function listAllocatedGlobalIds(): { key: string; id: string }[] {
  return [...reserved.entries()].map(([key, id]) => ({ key, id }));
}

resetGlobalIdAllocators();
