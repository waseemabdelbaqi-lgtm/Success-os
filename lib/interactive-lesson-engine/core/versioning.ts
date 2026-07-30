/**
 * ILE versioning — immutable history entries for lesson packages.
 */
import type { InteractiveLessonPackage } from "@/types/interactive-lesson-engine";

export type IleVersionEntry = {
  version: number;
  at: string;
  note: string;
  by?: string;
  status?: InteractiveLessonPackage["status"];
  snapshotSummary?: {
    slideCount: number;
    sectionCount: number;
    blockCount: number;
  };
};

export function summarizePackage(pkg: InteractiveLessonPackage) {
  const sectionCount = Object.values(pkg.sections || {}).filter((b) => (b || []).length).length;
  const blockCount = Object.values(pkg.sections || {}).reduce(
    (n, blocks) => n + (blocks?.length || 0),
    0,
  );
  return {
    slideCount: pkg.slides?.length || 0,
    sectionCount,
    blockCount: blockCount + (pkg.slides || []).reduce((n, s) => n + s.blocks.length, 0),
  };
}

export function bumpPackageVersion(
  pkg: InteractiveLessonPackage,
  note: string,
  by = "system",
): InteractiveLessonPackage {
  const at = new Date().toISOString();
  const version = Number(pkg.version || 1) + 1;
  const entry: IleVersionEntry = {
    version,
    at,
    note,
    by,
    status: pkg.status,
    snapshotSummary: summarizePackage(pkg),
  };
  return {
    ...pkg,
    version,
    updatedAt: at,
    changelog: [...(pkg.changelog || []), { at, note, by }],
    engineMeta: {
      ...(pkg.engineMeta || {}),
      lastVersionEntry: entry,
    },
  };
}

export function listVersionHistory(pkg: InteractiveLessonPackage): IleVersionEntry[] {
  return (pkg.changelog || []).map((c, i) => ({
    version: i + 1,
    at: c.at,
    note: c.note,
    by: c.by,
  }));
}

export function setPublishState(
  pkg: InteractiveLessonPackage,
  status: InteractiveLessonPackage["status"],
  by = "admin",
): InteractiveLessonPackage {
  return bumpPackageVersion({ ...pkg, status }, `Status → ${status}`, by);
}
