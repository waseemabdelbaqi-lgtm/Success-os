/**
 * Automatic Recovery Plan API — next engineering tasks for Sara & Ali.
 */
import { NextResponse } from "next/server";
import { loadSaraMetrics } from "@/src/ai-teacher/teachers/sara";
import { loadAliMetrics } from "@/src/ai-teacher/teachers/ali";
import { buildAcceptanceRuntime } from "@/src/ai-teacher/runtime/acceptance-runtime";
import { buildTeacherRecoveryPlan } from "@/src/ai-teacher/runtime/recovery-plan";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const both = url.searchParams.get("both") === "1";
  const id = url.searchParams.get("teacher") === "ali" ? "ali" : "sara";

  async function planFor(teacher: "sara" | "ali") {
    const metrics =
      teacher === "sara" ? await loadSaraMetrics() : await loadAliMetrics();
    const runtime = buildAcceptanceRuntime(metrics);
    const recovery = buildTeacherRecoveryPlan(teacher, runtime);
    return {
      teacher,
      failedChecks: recovery.failure.failedChecks,
      tasks: recovery.tasks,
      openTasks: recovery.tasks.filter((t) => !t.completed).length,
    };
  }

  try {
    if (both) {
      const sara = await planFor("sara");
      const ali = await planFor("ali");
      return NextResponse.json({
        success: true,
        teachers: { sara, ali },
        nextPriority: [...sara.tasks, ...ali.tasks]
          .filter((t) => !t.completed)
          .sort((a, b) => a.priority - b.priority)[0] || null,
      });
    }

    const one = await planFor(id);
    return NextResponse.json({
      success: true,
      ...one,
      nextPriority: one.tasks.find((t) => !t.completed) || null,
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "recovery plan failed",
      },
      { status: 500 },
    );
  }
}
