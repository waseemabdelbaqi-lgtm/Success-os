import { promises as fs } from "fs";
import path from "path";
import type { EditorialOverride } from "@/src/lib/jordan-books/registry";

const STORE_PATH = path.join(process.cwd(), "data/jordan-books/editorial-state.json");

type EditorialStateFile = {
  updatedAt: string;
  overrides: EditorialOverride[];
};

async function ensureStore(): Promise<EditorialStateFile> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as EditorialStateFile;
    return {
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      overrides: Array.isArray(parsed.overrides) ? parsed.overrides : [],
    };
  } catch {
    const empty: EditorialStateFile = { updatedAt: new Date().toISOString(), overrides: [] };
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
}

export async function readEditorialOverrides(): Promise<EditorialOverride[]> {
  const state = await ensureStore();
  return state.overrides;
}

export async function upsertEditorialOverride(
  override: Omit<EditorialOverride, "updatedAt"> & { updatedAt?: string },
): Promise<EditorialOverride[]> {
  const state = await ensureStore();
  const next: EditorialOverride = {
    ...override,
    updatedAt: override.updatedAt || new Date().toISOString(),
  };
  const filtered = state.overrides.filter((o) => {
    if (o.bookId !== next.bookId) return true;
    if (!next.lessonId) return Boolean(o.lessonId);
    return o.lessonId !== next.lessonId;
  });
  filtered.push(next);
  const payload: EditorialStateFile = {
    updatedAt: new Date().toISOString(),
    overrides: filtered,
  };
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(payload, null, 2), "utf8");
  return filtered;
}
