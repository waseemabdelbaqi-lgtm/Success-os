/**
 * Student workspace persistence for Interactive Lesson Engine (localStorage).
 * Offline-ready architecture — swap for server later without UI rewrite.
 */
import type {
  LessonSectionId,
  StudentWorkspaceState,
} from "@/types/interactive-lesson-engine";

const KEY = "success-os.ile-workspace.v1";

function loadAll(): Record<string, StudentWorkspaceState> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, StudentWorkspaceState>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Quota / private mode — keep in-memory only
  }
}

export function emptyWorkspace(): StudentWorkspaceState {
  return {
    notes: "",
    highlights: [],
    bookmarks: [],
    drawingDataUrl: null,
    progressPercent: 0,
    sectionsCompleted: [],
    continueAt: undefined,
    lastVisitedAt: new Date().toISOString(),
  };
}

export function getWorkspace(packageId: string): StudentWorkspaceState {
  return loadAll()[packageId] || emptyWorkspace();
}

export function saveWorkspace(
  packageId: string,
  patch: Partial<StudentWorkspaceState>,
): StudentWorkspaceState {
  const all = loadAll();
  const current = all[packageId] || emptyWorkspace();
  const next: StudentWorkspaceState = {
    ...current,
    ...patch,
    lastVisitedAt: new Date().toISOString(),
  };
  all[packageId] = next;
  saveAll(all);
  return next;
}

export function markSectionComplete(
  packageId: string,
  sectionId: LessonSectionId,
  totalSections: number,
): StudentWorkspaceState {
  const current = getWorkspace(packageId);
  const sectionsCompleted = Array.from(
    new Set([...current.sectionsCompleted, sectionId]),
  ) as LessonSectionId[];
  const progressPercent = totalSections
    ? Math.round((sectionsCompleted.length / totalSections) * 100)
    : 0;
  return saveWorkspace(packageId, {
    sectionsCompleted,
    progressPercent,
    continueAt: { sectionId },
  });
}
