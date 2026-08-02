/** Deterministic content seed — same lesson text → same performance shape. */
export function contentSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(arr: readonly T[], seed: number, salt = 0): T {
  return arr[(seed + salt * 17) % arr.length]!;
}

export function splitTeachingLines(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?؟…])\s+|\n+|(?<=،)\s+(?=[أ-يA-Za-z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
  return parts.length ? parts : [text.trim()].filter(Boolean);
}
