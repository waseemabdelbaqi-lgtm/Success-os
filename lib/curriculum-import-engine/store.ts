/**
 * In-memory import job store with version history / rollback support.
 * Resumable checkpoints; replaceable later with durable storage.
 */
import type {
  ImportDashboardSnapshot,
  ImportJob,
  ImportJobEvent,
  ImportJobStatus,
} from "@/types/curriculum-import-engine";
import { getHierarchySnapshot } from "./hierarchy/registry";

const jobs = new Map<string, ImportJob>();
const jobHistorySnapshots = new Map<string, ImportJob[]>();

export function resetImportStore() {
  jobs.clear();
  jobHistorySnapshots.clear();
}

export function listJobs(): ImportJob[] {
  return [...jobs.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getJob(id: string): ImportJob | null {
  return jobs.get(id) || null;
}

export function saveJob(job: ImportJob): ImportJob {
  jobs.set(job.id, job);
  return job;
}

export function pushEvent(
  job: ImportJob,
  event: Omit<ImportJobEvent, "at"> & { at?: string },
): ImportJob {
  const next = {
    ...job,
    events: [
      ...job.events,
      { ...event, at: event.at || new Date().toISOString() },
    ],
    updatedAt: new Date().toISOString(),
  };
  return saveJob(next);
}

export function snapshotVersion(job: ImportJob, note: string): ImportJob {
  const versions = jobHistorySnapshots.get(job.id) || [];
  versions.push(structuredClone(job));
  jobHistorySnapshots.set(job.id, versions);
  const at = new Date().toISOString();
  const next: ImportJob = {
    ...job,
    version: job.version + 1,
    history: [...job.history, { version: job.version + 1, at, note }],
    updatedAt: at,
  };
  return saveJob(next);
}

export function rollbackJob(jobId: string): ImportJob | null {
  const versions = jobHistorySnapshots.get(jobId) || [];
  const prev = versions.pop();
  jobHistorySnapshots.set(jobId, versions);
  if (!prev) return null;
  const rolled: ImportJob = {
    ...prev,
    status: "rolled_back",
    updatedAt: new Date().toISOString(),
    events: [
      ...prev.events,
      {
        at: new Date().toISOString(),
        stage: "system",
        level: "warning",
        message: "Rolled back to previous checkpoint",
      },
    ],
  };
  return saveJob(rolled);
}

export function buildDashboardSnapshot(): ImportDashboardSnapshot {
  const all = listJobs();
  const by = (s: ImportJobStatus) => all.filter((j) => j.status === s);
  const packages = all.reduce((n, j) => n + j.packageCount, 0);
  const books = all.reduce((n, j) => n + j.bookCount, 0);
  const lessons = all.reduce((n, j) => n + j.lessonCount, 0);
  const errors = all.reduce((n, j) => n + j.errors.length, 0);
  const warnings = all.reduce((n, j) => n + j.warnings.length, 0);

  const verificationSummary = {
    unverified: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  } as Record<"unverified" | "pending" | "verified" | "rejected", number>;
  const rightsSummary = {
    unknown: 0,
    verified: 0,
    restricted: 0,
    rejected: 0,
  } as Record<"unknown" | "verified" | "restricted" | "rejected", number>;

  for (const j of all) {
    const v = j.book?.metadata.verificationStatus || "pending";
    verificationSummary[v] = (verificationSummary[v] || 0) + 1;
    const r = j.book?.metadata.rightsStatus || "unknown";
    rightsSummary[r] = (rightsSummary[r] || 0) + 1;
  }

  const hierarchy = getHierarchySnapshot();

  return {
    schema: "success-os.curriculum-import-engine.v1",
    queue: by("queued"),
    running: by("running"),
    completed: by("completed"),
    rejected: [...by("rejected"), ...by("failed")],
    counts: {
      jobs: all.length,
      running: by("running").length,
      completed: by("completed").length,
      rejected: by("rejected").length + by("failed").length,
      packages: Math.max(packages, hierarchy.counts.packages),
      books: Math.max(books, hierarchy.counts.books),
      lessons: Math.max(lessons, hierarchy.counts.lessons),
      errors: errors + hierarchy.counts.errors,
      warnings: warnings + hierarchy.counts.warnings,
      countries: hierarchy.counts.countries,
      curricula: hierarchy.counts.curricula,
      grades: hierarchy.counts.grades,
      subjects: hierarchy.counts.subjects,
      units: hierarchy.counts.units,
      imported: hierarchy.counts.imported,
      verified: hierarchy.counts.verified,
      pending: hierarchy.counts.pending,
      published: hierarchy.counts.published,
      verifiedPackages: hierarchy.counts.verifiedPackages,
      pendingPackages: hierarchy.counts.pendingPackages,
      rejectedPackages: hierarchy.counts.rejectedPackages,
      rightsWarnings: hierarchy.counts.rightsWarnings,
    },
    verificationSummary,
    rightsSummary,
    history: all
      .flatMap((j) => j.events.map((e) => ({ ...e, message: `[${j.id}] ${e.message}` })))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 50),
    hierarchyPathExample: [
      "JO",
      "JO-NATIONAL",
      "JO-NATIONAL-G01",
      "JO-NATIONAL-G01-MATH",
      "JO-NATIONAL-G01-MATH-B01",
      "JO-NATIONAL-G01-MATH-B01-U01",
      "JO-NATIONAL-G01-MATH-B01-U01-L01",
      "Verified ILE Package",
      "Interactive Lesson Engine",
    ],
    validationErrors: hierarchy.validationErrors,
    rightsWarningsList: hierarchy.rightsWarnings,
    importProgress: {
      totalLessons: hierarchy.counts.lessons,
      verified: hierarchy.counts.verified,
      pending: hierarchy.counts.pending,
      rejected: hierarchy.counts.rejected,
      published: hierarchy.counts.published,
      percentVerified:
        hierarchy.counts.lessons > 0
          ? Math.round((hierarchy.counts.verified / hierarchy.counts.lessons) * 100)
          : 0,
    },
  };
}
