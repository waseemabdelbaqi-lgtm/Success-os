/**
 * Human Teacher Quality + Final Acceptance — ship blockers for Sara & Ali.
 * EXPECTED to FAIL until filmed-professional bar + 15s showcase exist.
 */
import {
  assertTeacherQuality,
  diagnoseTeacherQuality,
  QualityResult,
  HUMAN_TEACHER_QUALITY_MIN,
} from "../src/ai-teacher/runtime/quality-gate";
import { loadSaraMetrics } from "../src/ai-teacher/teachers/sara";
import { loadAliMetrics } from "../src/ai-teacher/teachers/ali";
import { bootstrapTeacher } from "../src/ai-teacher/runtime/bootstrap";
import { HumanEngine } from "../src/ai-teacher/runtime/HumanEngine";
import { buildAcceptanceRuntime } from "../src/ai-teacher/runtime/acceptance-runtime";
import {
  assertFinalAcceptance,
  finalAcceptanceGate,
} from "../src/ai-teacher/runtime/final-acceptance-gate";
import { RecoveryEngine } from "../src/ai-teacher/runtime/RecoveryEngine";
import {
  getActiveRecoveryTask,
  PRIMARY_TEACHERS,
  syncTeacherFromAcceptanceRuntime,
} from "../src/lib/ai-teachers/recovery-engine";
import { inspectCurrentTeacherPhotorealism } from "../src/lib/ai-teachers/photorealism-engine";

async function report(id: "sara" | "ali") {
  const metrics = id === "sara" ? await loadSaraMetrics() : await loadAliMetrics();
  const diagnosis = diagnoseTeacherQuality(metrics);
  const runtime = buildAcceptanceRuntime(metrics);
  const acceptance = await finalAcceptanceGate(id, runtime);
  const sessionRecovery = new RecoveryEngine(id);
  const recovery = sessionRecovery.recoverFromRuntime(runtime);
  const nextTask = sessionRecovery.nextTask();
  // Coarse acceptance sync, then overwrite photorealism with dedicated engine.
  syncTeacherFromAcceptanceRuntime(id, runtime);
  const photo = inspectCurrentTeacherPhotorealism(id);
  const engineTeacher = PRIMARY_TEACHERS[id];
  const active = getActiveRecoveryTask(id);
  console.log(`\n── ${id.toUpperCase()} ──`);
  console.log(JSON.stringify(metrics, null, 2));
  console.log(`quality=${diagnosis.result}`);
  if (diagnosis.failures.length) {
    for (const f of diagnosis.failures) console.log(`  FAIL: ${f}`);
  }
  console.log(
    `photorealism=${photo.passed ? "PASS" : "FAIL"} score=${photo.finalScore}/95 pipeline=${photo.pipeline}`,
  );
  for (const f of photo.failures.slice(0, 6)) {
    console.log(`  PHOTO: ${f}`);
  }
  console.log(
    `acceptance=${acceptance.passed ? "PASSED" : "REJECTED"}` +
      (acceptance.reason ? ` (${acceptance.reason})` : ""),
  );
  console.log(
    `showcase15s=${runtime.has15SecondShowcase ? "YES" : "MISSING"}` +
      (runtime.showcasePath ? ` @ ${runtime.showcasePath}` : ""),
  );
  if (recovery.tasks.length) {
    console.log("recovery plan:");
    for (const t of recovery.tasks) {
      console.log(
        `  P${t.priority}. ${t.title}${t.completed ? " ✔" : ""}`,
      );
    }
  }
  console.log(
    `RecoveryEngine.nextTask=${nextTask ? `P${nextTask.priority} ${nextTask.title}` : "none"}` +
      ` recovered=${sessionRecovery.isRecovered()}`,
  );
  console.log(
    `recovery-engine: status=${engineTeacher.acceptanceStatus} active=${active?.category || "none"} (${active?.status || "-"})`,
  );
  for (const t of engineTeacher.recoveryPlan) {
    console.log(
      `  [${t.status}] ${t.order}. ${t.category} ${t.currentScore}/${t.requiredScore}`,
    );
  }
  return {
    metrics,
    diagnosis,
    runtime,
    acceptance,
    recovery,
    nextTask,
    sessionRecovery,
    engineTeacher,
    photo,
  };
}

async function main() {
  const sara = await report("sara");
  const ali = await report("ali");

  console.log("\nMIN thresholds:", HUMAN_TEACHER_QUALITY_MIN);

  if (sara.diagnosis.result !== QualityResult.FAIL) {
    console.log("Sara unexpectedly PASS quality — verifying bootstrap…");
    await bootstrapTeacher("sara");
  }
  if (ali.diagnosis.result !== QualityResult.FAIL) {
    console.log("Ali unexpectedly PASS quality — verifying bootstrap…");
    await bootstrapTeacher("ali");
  }

  let qualityBlocked = 0;
  let acceptanceBlocked = 0;

  for (const [id, pack] of [
    ["sara", sara],
    ["ali", ali],
  ] as const) {
    try {
      assertTeacherQuality(pack.metrics);
      console.log(`✅ ${id.toUpperCase()} PASSED QUALITY GATE`);
    } catch {
      qualityBlocked += 1;
      console.error(`❌ ${id.toUpperCase()} BLOCKED by quality gate`);
    }

    try {
      assertFinalAcceptance(pack.acceptance, id);
      console.log(`✅ ${id.toUpperCase()} PASSED FINAL ACCEPTANCE`);
    } catch {
      acceptanceBlocked += 1;
      console.error(`❌ ${id.toUpperCase()} BLOCKED by final acceptance`);
    }
  }

  // HumanEngine.initialize must refuse until both gates pass
  for (const id of ["sara", "ali"] as const) {
    const engine = new HumanEngine(id);
    let refused = false;
    try {
      await engine.initialize();
    } catch (e) {
      refused = /QUALITY GATE FAILED|FINAL ACCEPTANCE GATE FAILED/i.test(
        e instanceof Error ? e.message : String(e),
      );
    }
    const shouldRefuse = qualityBlocked > 0 || acceptanceBlocked > 0;
    if (shouldRefuse && !refused) {
      throw new Error(`HumanEngine.initialize must refuse blocked teacher ${id}`);
    }
    console.log(
      refused
        ? `HumanEngine(${id}).initialize correctly REFUSED`
        : `HumanEngine(${id}).initialize READY`,
    );
  }

  if (qualityBlocked > 0 || acceptanceBlocked > 0) {
    console.error(`
====================================================
 HUMAN TEACHER SHIP GATES — BUILD FAILED
 quality blocked: ${qualityBlocked}/2
 acceptance blocked: ${acceptanceBlocked}/2
 Continue improving until Sara & Ali behave like
 professional human teachers — with a 15s showcase.
====================================================
`);
    process.exit(1);
  }

  console.log("human-teacher-quality OK — both teachers READY to ship");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
