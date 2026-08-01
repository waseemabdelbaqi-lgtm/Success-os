/**
 * IMPORT_PIPELINE runner — Jordan-first Curriculum Import Engine.
 * Compiler only. Unverified content never enters publishing queue as publishable.
 */
import type {
  CompiledIlePackage,
  ImportJob,
  ImportPipelineStageId,
} from "@/types/curriculum-import-engine";
import { getSourceConnector } from "./connectors";
import { IMPORT_PIPELINE, nextStage } from "./pipeline";
import { evaluateRights } from "./rights/engine";
import { extractMetadata, validateMetadata } from "./metadata/engine";
import { normalizeBook } from "./normalize";
import { extractAssets, countAssets } from "./assets";
import { checksumBook } from "./checksum";
import { buildIlePackagesFromBook } from "./ile-package-builder";
import { allGatesPassed, runVerificationGates } from "./verification/engine";
import {
  getJob,
  listJobs,
  pushEvent,
  saveJob,
  snapshotVersion,
} from "./store";
import { JORDAN_IMPORT_SOURCE } from "@/content/demo/curriculum-import-jordan";

function newJobId() {
  return `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createImportJob(args?: {
  connectorId?: string;
  country?: string;
  curriculum?: string;
}): ImportJob {
  const connectorId = args?.connectorId || "jordan-nccd";
  const at = new Date().toISOString();
  const job: ImportJob = {
    schema: "success-os.curriculum-import-engine.v1",
    id: newJobId(),
    status: "queued",
    country: args?.country || "Jordan",
    curriculum: args?.curriculum || "Jordan National Curriculum",
    connectorId,
    source: { ...JORDAN_IMPORT_SOURCE, connectorId },
    currentStage: null,
    stagesCompleted: [],
    gates: [],
    book: null,
    packages: [],
    packageCount: 0,
    bookCount: 0,
    lessonCount: 0,
    errors: [],
    warnings: [],
    events: [
      {
        at,
        stage: "system",
        level: "info",
        message: `Import job queued via ${connectorId}`,
      },
    ],
    resumable: true,
    checkpoint: null,
    version: 1,
    history: [{ version: 1, at, note: "created" }],
    createdAt: at,
    updatedAt: at,
    completedAt: null,
  };
  return saveJob(job);
}

export async function runImportJob(
  jobId: string,
  opts?: { fromStage?: ImportPipelineStageId },
): Promise<ImportJob> {
  let job = getJob(jobId);
  if (!job) throw new Error(`Unknown job ${jobId}`);

  job = saveJob({
    ...job,
    status: "running",
    updatedAt: new Date().toISOString(),
  });
  job = pushEvent(job, {
    stage: "system",
    level: "info",
    message: opts?.fromStage
      ? `Resuming from ${opts.fromStage}`
      : "Starting import pipeline",
  });

  const connector = getSourceConnector(job.connectorId);
  if (!connector) {
    return failJob(job, `Connector not found: ${job.connectorId}`);
  }

  let packages: CompiledIlePackage[] = job.packages || [];
  let stage: ImportPipelineStageId | null =
    opts?.fromStage || job.checkpoint?.stage || IMPORT_PIPELINE[0]!.id;

  // If resuming mid-pipeline, skip completed stages before checkpoint
  const startIdx = stage ? IMPORT_PIPELINE.findIndex((s) => s.id === stage) : 0;

  for (let i = Math.max(0, startIdx); i < IMPORT_PIPELINE.length; i++) {
    stage = IMPORT_PIPELINE[i]!.id;
    job = saveJob({
      ...job,
      currentStage: stage,
      checkpoint: { stage },
      updatedAt: new Date().toISOString(),
    });
    job = pushEvent(job, { stage, level: "info", message: `Stage: ${stage}` });

    try {
      if (stage === "source_discovery") {
        const sources = await connector.discover();
        if (!sources.length) return failJob(job, "No sources discovered");
        job = saveJob({
          ...job,
          source: sources[0]!,
          stagesCompleted: uniq([...job.stagesCompleted, stage]),
        });
      } else if (stage === "source_verification") {
        if (!job.source.authority) return failJob(job, "Source verification failed");
        job = saveJob({
          ...job,
          stagesCompleted: uniq([...job.stagesCompleted, stage]),
        });
      } else if (stage === "rights_verification") {
        const rights = evaluateRights(job.source);
        if (!rights.allowedToCompile) {
          job = saveJob({
            ...job,
            status: "rejected",
            errors: [...job.errors, rights.notes.en],
            completedAt: new Date().toISOString(),
          });
          return pushEvent(job, {
            stage,
            level: "error",
            message: rights.notes.en,
          });
        }
        if (!rights.allowedToPublish) {
          job = saveJob({
            ...job,
            warnings: [...job.warnings, "Compile-only: publish blocked by rights"],
          });
        }
        job = saveJob({
          ...job,
          stagesCompleted: uniq([...job.stagesCompleted, stage]),
        });
      } else if (stage === "metadata_extraction") {
        // book loaded in book_detection; metadata refined after load
        job = saveJob({
          ...job,
          stagesCompleted: uniq([...job.stagesCompleted, stage]),
        });
      } else if (stage === "book_detection") {
        const book = await connector.loadBook(job.source);
        if (!book) return failJob(job, "Book detection failed");
        job = saveJob({
          ...job,
          book,
          bookCount: 1,
          stagesCompleted: uniq([...job.stagesCompleted, stage]),
        });
      } else if (stage === "unit_detection") {
        if (!job.book?.units?.length) return failJob(job, "Unit detection failed");
        job = saveJob({
          ...job,
          stagesCompleted: uniq([...job.stagesCompleted, stage]),
        });
      } else if (stage === "lesson_detection") {
        const lessonCount =
          job.book?.units.reduce((n, u) => n + u.lessons.length, 0) || 0;
        if (!lessonCount) return failJob(job, "Lesson detection failed");
        job = saveJob({
          ...job,
          lessonCount,
          stagesCompleted: uniq([...job.stagesCompleted, stage]),
        });
      } else if (stage === "content_normalization") {
        if (!job.book) return failJob(job, "No book to normalize");
        const normalized = normalizeBook(job.book);
        const meta = extractMetadata(normalized);
        const metaCheck = validateMetadata(meta);
        if (!metaCheck.ok) {
          return failJob(job, `Metadata invalid: ${metaCheck.missing.join(", ")}`);
        }
        job = saveJob({
          ...job,
          book: { ...normalized, metadata: meta },
          stagesCompleted: uniq([...job.stagesCompleted, stage]),
        });
      } else if (stage === "asset_extraction") {
        if (!job.book) return failJob(job, "No book for assets");
        const withAssets = extractAssets(job.book);
        job = pushEvent(job, {
          stage,
          level: "info",
          message: `Assets cataloged: ${countAssets(withAssets)} (placeholders allowed)`,
        });
        job = saveJob({
          ...job,
          book: withAssets,
          stagesCompleted: uniq([...job.stagesCompleted, stage]),
        });
      } else if (stage === "ile_package_builder") {
        if (!job.book) return failJob(job, "No book for ILE builder");
        const checksum = checksumBook(job.book);
        const book = { ...job.book, checksum };
        const rights = evaluateRights(job.source);
        // Preliminary gates without packages for builder context
        const preGates = runVerificationGates({
          source: job.source,
          book,
          packages: [],
          rightsPassed: rights.allowedToCompile,
        }).filter((g) => g.gate !== "package_validation");

        packages = buildIlePackagesFromBook({
          book,
          jobId: job.id,
          sourceId: job.source.id,
          connectorId: job.connectorId,
          checksum,
          rightsStatus: rights.status,
          verificationStatus: rights.allowedToCompile ? "pending" : "rejected",
          gates: preGates,
        });

        job = saveJob({
          ...job,
          book,
          packages,
          packageCount: packages.length,
          lessonCount: packages.length,
          stagesCompleted: uniq([...job.stagesCompleted, stage]),
        });
        job = snapshotVersion(job, `Built ${packages.length} ILE packages`);
      } else if (stage === "validation") {
        const rights = evaluateRights(job.source);
        const existing = listJobs()
          .filter((j) => j.id !== job!.id && j.book?.checksum)
          .map((j) => j.book!.checksum!) ;
        const gates = runVerificationGates({
          source: job.source,
          book: job.book,
          packages: job.packages,
          existingChecksums: existing,
          rightsPassed: rights.allowedToCompile && rights.status !== "rejected",
        });
        const verified = allGatesPassed(gates);
        const packagesUpdated = job.packages.map((p) => ({
          ...p,
          importMeta: {
            ...p.importMeta,
            gates,
            verificationStatus: verified ? ("verified" as const) : ("rejected" as const),
            rightsStatus: rights.status,
          },
          status: verified && rights.allowedToPublish ? ("preview" as const) : ("draft" as const),
        }));

        if (!verified) {
          job = saveJob({
            ...job,
            gates,
            packages: packagesUpdated,
            status: "rejected",
            errors: [
              ...job.errors,
              ...gates.filter((g) => !g.passed).map((g) => g.message.en),
            ],
            completedAt: new Date().toISOString(),
            stagesCompleted: uniq([...job.stagesCompleted, stage]),
          });
          return pushEvent(job, {
            stage,
            level: "error",
            message: "Validation failed — unverified content cannot be published",
          });
        }

        if (job.book) {
          job = saveJob({
            ...job,
            gates,
            packages: packagesUpdated,
            book: {
              ...job.book,
              metadata: {
                ...job.book.metadata,
                verificationStatus: "verified",
                rightsStatus: rights.status,
              },
            },
            stagesCompleted: uniq([...job.stagesCompleted, stage]),
          });
        }
      } else if (stage === "publishing_queue") {
        const rights = evaluateRights(job.source);
        if (!rights.allowedToPublish || !allGatesPassed(job.gates)) {
          job = saveJob({
            ...job,
            status: "rejected",
            errors: [...job.errors, "Publishing blocked — gates or rights failed"],
            completedAt: new Date().toISOString(),
          });
          return pushEvent(job, {
            stage,
            level: "error",
            message: "Unverified content can never be published",
          });
        }
        // Queue only — does not render; packages remain ILE artifacts
        job = saveJob({
          ...job,
          status: "completed",
          currentStage: stage,
          stagesCompleted: uniq([...job.stagesCompleted, stage]),
          completedAt: new Date().toISOString(),
          packages: job.packages.map((p) => ({
            ...p,
            status: "preview",
            importMeta: { ...p.importMeta, verificationStatus: "verified" },
          })),
        });
        job = pushEvent(job, {
          stage,
          level: "info",
          message: `Queued ${job.packageCount} verified ILE packages (no render)`,
        });
        job = snapshotVersion(job, "Publishing queue accepted");
      }
    } catch (err) {
      return failJob(job, err instanceof Error ? err.message : String(err));
    }
  }

  return getJob(jobId) || job;
}

function failJob(job: ImportJob, message: string): ImportJob {
  const next = saveJob({
    ...job,
    status: "failed",
    errors: [...job.errors, message],
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return pushEvent(next, { stage: "system", level: "error", message });
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export async function runJordanPhase1Import(): Promise<ImportJob> {
  const job = createImportJob({
    connectorId: "jordan-nccd",
    country: "Jordan",
    curriculum: "Jordan National Curriculum",
  });
  return runImportJob(job.id);
}

export { nextStage };
