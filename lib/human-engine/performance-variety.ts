/**
 * Anti-repetition helpers — never reuse the same gesture/camera/phrase fingerprint
 * when alternatives exist (Sara & Ali feel alive, not looped).
 */
import { pick } from "./seed";

export function fingerprintSay(text: string): string {
  const norm = text
    .replace(/\s+/g, " ")
    .replace(/[«»"']/g, "")
    .trim()
    .slice(0, 96);
  let h = 2166136261;
  for (let i = 0; i < norm.length; i++) {
    h ^= norm.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** Prefer an unused option; if all used, pick furthest from lastUsed. */
export function pickUnused<T extends string>(
  options: readonly T[],
  used: readonly string[],
  seed: number,
  salt = 0,
  lastUsed?: string | null,
): T {
  if (!options.length) throw new Error("pickUnused: empty options");
  const fresh = options.filter((o) => !used.includes(o));
  if (fresh.length) return pick(fresh, seed, salt);
  const rotated = options.filter((o) => o !== lastUsed);
  if (rotated.length) return pick(rotated, seed, salt + 3);
  return pick(options, seed, salt);
}

export function recordUnique(list: string[], value: string, max = 48): string[] {
  if (list.includes(value)) return list;
  const next = [...list, value];
  return next.length > max ? next.slice(next.length - max) : next;
}
