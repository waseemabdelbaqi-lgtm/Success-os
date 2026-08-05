/**
 * Final Acceptance Gate API — Sara & Ali production ship check.
 */
import { NextResponse } from "next/server";
import { loadSaraMetrics } from "@/src/ai-teacher/teachers/sara";
import { loadAliMetrics } from "@/src/ai-teacher/teachers/ali";
import { buildAcceptanceRuntime } from "@/src/ai-teacher/runtime/acceptance-runtime";
import { finalAcceptanceGate } from "@/src/ai-teacher/runtime/final-acceptance-gate";
import { buildTeacherRecoveryPlan } from "@/src/ai-teacher/runtime/recovery-plan";
import {
  getActiveRecoveryTask,
  syncTeacherFromAcceptanceRuntime,
} from "@/src/lib/ai-teachers/recovery-engine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const both = url.searchParams.get("both") === "1";
  const id = url.searchParams.get("teacher") === "ali" ? "ali" : "sara";

  async function probe(teacher: "sara" | "ali") {
    const metrics =
      teacher === "sara" ? await loadSaraMetrics() : await loadAliMetrics();
    const runtime = buildAcceptanceRuntime(metrics);
    const result = await finalAcceptanceGate(teacher, runtime);
    const recovery = buildTeacherRecoveryPlan(teacher, runtime);
    const engineTeacher = syncTeacherFromAcceptanceRuntime(teacher, runtime);
    return {
      teacher,
      runtime,
      ...result,
      status: result.passed ? ("ACCEPTED" as const) : ("REJECTED" as const),
      failedChecks: recovery.failure.failedChecks,
      recoveryPlan: recovery.tasks,
      recoveryEngine: {
        acceptanceStatus: engineTeacher.acceptanceStatus,
        version: engineTeacher.version,
        activeRecoveryTask: getActiveRecoveryTask(teacher),
        tasks: engineTeacher.recoveryPlan,
      },
    };
  }

  try {
    if (both) {
      const sara = await probe("sara");
      const ali = await probe("ali");
      return NextResponse.json({
        success: true,
        teachers: { sara, ali },
        productionAllowed: sara.passed && ali.passed,
      });
    }

    const one = await probe(id);
    return NextResponse.json({
      success: true,
      ...one,
      productionAllowed: one.passed,
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "final acceptance failed",
      },
      { status: 500 },
    );
  }
}
