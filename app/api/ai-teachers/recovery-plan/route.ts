/**
 * Automatic Recovery Engine API — Sara & Ali only.
 * Syncs live acceptance metrics into ordered recovery tasks with dependencies.
 */
import { NextResponse } from "next/server";
import { loadSaraMetrics } from "@/src/ai-teacher/teachers/sara";
import { loadAliMetrics } from "@/src/ai-teacher/teachers/ali";
import { buildAcceptanceRuntime } from "@/src/ai-teacher/runtime/acceptance-runtime";
import {
  getActiveRecoveryTask,
  getRecoveryPlanResponse,
  normalizePrimaryTeacherId,
  PRIMARY_TEACHERS,
  startRecoveryTask,
  syncTeacherFromAcceptanceRuntime,
  type QualityCategory,
} from "@/src/lib/ai-teachers/recovery-engine";

export const dynamic = "force-dynamic";

async function syncLive(teacherId: "sara" | "ali") {
  const metrics =
    teacherId === "sara" ? await loadSaraMetrics() : await loadAliMetrics();
  const runtime = buildAcceptanceRuntime(metrics);
  return syncTeacherFromAcceptanceRuntime(teacherId, runtime);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("teacher");
  const both = url.searchParams.get("both") === "1" || !raw;

  try {
    if (both) {
      await syncLive("sara");
      await syncLive("ali");
      const plans = getRecoveryPlanResponse();
      const open = plans.flatMap((p) =>
        p.tasks.filter(
          (t) =>
            t.status === "pending" ||
            t.status === "in_progress" ||
            t.status === "failed",
        ),
      );
      return NextResponse.json({
        success: true,
        engine: "recovery-engine",
        teachers: plans,
        nextPriority:
          open.sort((a, b) => a.order - b.order)[0] ||
          null,
      });
    }

    const teacherId = normalizePrimaryTeacherId(raw);
    await syncLive(teacherId);
    const teacher = PRIMARY_TEACHERS[teacherId];
    const active = getActiveRecoveryTask(teacherId);
    return NextResponse.json({
      success: true,
      engine: "recovery-engine",
      teacherId: teacher.id,
      teacherName: teacher.name,
      acceptanceStatus: teacher.acceptanceStatus,
      version: teacher.version,
      lastTestAt: teacher.lastTestAt,
      activeRecoveryTask: active,
      tasks: teacher.recoveryPlan,
      scores: teacher.recoveryPlan.map((t) => ({
        category: t.category,
        score: t.currentScore,
        requiredScore: t.requiredScore,
        status: t.status,
      })),
      nextPriority: active,
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: "start";
      teacherId?: string;
      category?: QualityCategory;
    };
    const teacherId = normalizePrimaryTeacherId(body.teacherId || "sara");
    await syncLive(teacherId);

    if (body.action === "start") {
      if (!body.category) {
        return NextResponse.json(
          { success: false, error: "category required" },
          { status: 400 },
        );
      }
      const teacher = startRecoveryTask(teacherId, body.category);
      return NextResponse.json({
        success: true,
        teacherId: teacher.id,
        acceptanceStatus: teacher.acceptanceStatus,
        activeRecoveryTask: getActiveRecoveryTask(teacherId),
        tasks: teacher.recoveryPlan,
      });
    }

    return NextResponse.json(
      { success: false, error: "unknown action" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "recovery action failed",
      },
      { status: 400 },
    );
  }
}
