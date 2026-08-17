/**
 * teacher-identity.ts
 *
 * Exactly two permanent AI teachers exist: sara and ali. Nothing else is a
 * valid teacher id. This is the single place that decision is made — the
 * runtime, the orchestrator, and any API route must all go through
 * normalizeTeacherId()/isValidTeacherId() rather than re-implementing the
 * check themselves.
 */

export const TEACHER_IDS = ["sara", "ali"] as const;
export type TeacherId = (typeof TEACHER_IDS)[number];

/** Known misspellings/variants that should resolve to a real teacher id. */
const ALIASES: Record<string, TeacherId> = {
  sarah: "sara",
};

/**
 * Normalizes a raw teacher id string. Returns the canonical id ("sara" |
 * "ali") if valid or aliased, otherwise null. Case-insensitive, trims
 * whitespace. Does not throw — callers decide how to handle rejection.
 */
export function normalizeTeacherId(raw: string): TeacherId | null {
  const cleaned = raw.trim().toLowerCase();
  if ((TEACHER_IDS as readonly string[]).includes(cleaned)) return cleaned as TeacherId;
  const aliased = ALIASES[cleaned];
  return aliased ?? null;
}

export function isValidTeacherId(raw: string): raw is TeacherId {
  return normalizeTeacherId(raw) !== null;
}

/** Throws a descriptive error for an invalid teacher id; returns the canonical id otherwise. */
export function requireTeacherId(raw: string): TeacherId {
  const normalized = normalizeTeacherId(raw);
  if (!normalized) {
    throw new Error(`AI Teacher error: "${raw}" is not a recognized teacher. Only "sara" and "ali" (and the "sarah" → "sara" alias) are accepted.`);
  }
  return normalized;
}
