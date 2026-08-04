/**
 * Human Teacher Quality Gate — ship blocker for Sara & Ali.
 * This runner is EXPECTED to FAIL until teachers meet filmed-professional bar.
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

async function report(id: "sara" | "ali") {
  const metrics = id === "sara" ? await loadSaraMetrics() : await loadAliMetrics();
  const diagnosis = diagnoseTeacherQuality(metrics);
  console.log(`\n── ${id.toUpperCase()} ──`);
  console.log(JSON.stringify(metrics, null, 2));
  console.log(`result=${diagnosis.result}`);
  if (diagnosis.failures.length) {
    for (const f of diagnosis.failures) console.log(`  FAIL: ${f}`);
  }
  return { metrics, diagnosis };
}

async function main() {
  const sara = await report("sara");
  const ali = await report("ali");

  console.log("\nMIN thresholds:", HUMAN_TEACHER_QUALITY_MIN);

  if (sara.diagnosis.result !== QualityResult.FAIL) {
    console.log("Sara unexpectedly PASS — verifying bootstrap…");
    await bootstrapTeacher("sara");
  }
  if (ali.diagnosis.result !== QualityResult.FAIL) {
    console.log("Ali unexpectedly PASS — verifying bootstrap…");
    await bootstrapTeacher("ali");
  }

  let blocked = 0;
  for (const [id, pack] of [
    ["sara", sara],
    ["ali", ali],
  ] as const) {
    try {
      assertTeacherQuality(pack.metrics);
      console.log(`✅ ${id.toUpperCase()} PASSED QUALITY GATE`);
    } catch {
      blocked += 1;
      console.error(`❌ ${id.toUpperCase()} BLOCKED by quality gate`);
    }
  }

  if (blocked > 0) {
    console.error(`
====================================================
 HUMAN TEACHER QUALITY GATE — BUILD FAILED
 ${blocked}/2 teachers blocked (Sara & Ali).
 Continue improving until they behave like
 professional human teachers.
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
