/**
 * Curriculum Import Engine — public API.
 * Compiler only (ADR-0050). Never renders lessons.
 */
import { IMPORT_PIPELINE } from "./pipeline";
import { listSourceConnectors } from "./connectors";
import { VERIFICATION_GATES } from "./verification/engine";
import {
  buildDashboardSnapshot,
  getJob,
  listJobs,
  resetImportStore,
  rollbackJob,
} from "./store";
import { createImportJob, runImportJob, runJordanPhase1Import } from "./runner";

export {
  IMPORT_PIPELINE,
  listSourceConnectors,
  VERIFICATION_GATES,
  buildDashboardSnapshot,
  getJob,
  listJobs,
  resetImportStore,
  rollbackJob,
  createImportJob,
  runImportJob,
  runJordanPhase1Import,
};

export { evaluateRights } from "./rights/engine";
export { extractMetadata, validateMetadata } from "./metadata/engine";
export { buildIlePackagesFromBook } from "./ile-package-builder";
export { runVerificationGates, allGatesPassed } from "./verification/engine";
export { normalizeBook } from "./normalize";
export { checksumBook } from "./checksum";

export function engineStatus() {
  return {
    schema: "success-os.curriculum-import-engine.v1",
    role: "compiler",
    rendersLessons: false,
    runtime: "success-os.interactive-lesson-engine.v1",
    adr: ["ADR-0049", "ADR-0050"],
    phase1: {
      country: "Jordan",
      curriculum: "Jordan National Curriculum",
      aiGeneration: false,
      lessonRewrite: false,
      videoGeneration: false,
      quizGeneration: false,
    },
    pipeline: IMPORT_PIPELINE.map((s) => s.id),
    connectors: listSourceConnectors().map((c) => ({
      id: c.id,
      type: c.type,
      label: c.label,
      modular: c.modular,
      countries: c.countries,
    })),
    verificationGates: VERIFICATION_GATES,
    quality: {
      resumable: true,
      incrementalUpdates: true,
      retries: true,
      versionHistory: true,
      rollback: true,
    },
  };
}
