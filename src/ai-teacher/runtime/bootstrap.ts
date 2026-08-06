import { assertTeacherQuality } from "./quality-gate";
import { loadSaraMetrics } from "../teachers/sara";
import { loadAliMetrics } from "../teachers/ali";

export type TeacherId = "sara" | "ali";

export async function bootstrapTeacher(id: TeacherId) {
  const metrics =
    id === "sara" ? await loadSaraMetrics() : await loadAliMetrics();

  // يمنع تشغيل أي معلم لا يحقق المستوى المطلوب
  assertTeacherQuality(metrics);

  return {
    teacher: id,
    metrics,
    status: "READY" as const,
  };
}

export async function startTeacherSession(id: TeacherId) {
  const teacher = await bootstrapTeacher(id);

  console.log(`✅ ${teacher.teacher.toUpperCase()} PASSED QUALITY GATE`);

  return teacher;
}

/** Soft probe — returns diagnostics without throwing (admin / validate). */
export async function probeTeacherQuality(id: TeacherId) {
  const { diagnoseTeacherQuality, validateHumanTeacher } = await import(
    "./quality-gate"
  );
  const metrics =
    id === "sara" ? await loadSaraMetrics() : await loadAliMetrics();
  const diagnosis = diagnoseTeacherQuality(metrics);
  return {
    teacher: id,
    metrics,
    result: validateHumanTeacher(metrics),
    failures: diagnosis.failures,
    status: diagnosis.result === "PASS" ? ("READY" as const) : ("BLOCKED" as const),
  };
}
