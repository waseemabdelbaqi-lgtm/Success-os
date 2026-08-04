/**
 * Quality + Final Acceptance gated HumanEngine API — Sara & Ali only.
 */
import { NextResponse } from "next/server";
import { HumanEngine } from "@/src/ai-teacher/runtime/HumanEngine";
import { probeTeacherQuality } from "@/src/ai-teacher/runtime/bootstrap";
import { loadSaraMetrics } from "@/src/ai-teacher/teachers/sara";
import { loadAliMetrics } from "@/src/ai-teacher/teachers/ali";
import { buildAcceptanceRuntime } from "@/src/ai-teacher/runtime/acceptance-runtime";
import { finalAcceptanceGate } from "@/src/ai-teacher/runtime/final-acceptance-gate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const teacherId = url.searchParams.get("teacher") === "ali" ? "ali" : "sara";
  const quality = await probeTeacherQuality(teacherId);
  const metrics =
    teacherId === "sara" ? await loadSaraMetrics() : await loadAliMetrics();
  const runtime = buildAcceptanceRuntime(metrics);
  const acceptance = await finalAcceptanceGate(teacherId, runtime);

  return NextResponse.json({
    success: true,
    engine: "HumanEngine",
    teacherId,
    quality,
    acceptance,
    note:
      quality.status === "READY" && acceptance.passed
        ? "Teacher may initialize"
        : "Teacher blocked — initialize() will throw",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: "initialize" | "startLesson" | "finishLesson";
      teacherId?: "sara" | "ali";
      lessonId?: string;
    };

    const teacherId = body.teacherId === "ali" ? "ali" : "sara";
    const engine = new HumanEngine(teacherId);
    const action = body.action || "initialize";

    if (action === "initialize") {
      const session = await engine.initialize();
      return NextResponse.json({ success: true, action, session });
    }

    if (action === "startLesson") {
      if (!body.lessonId) {
        return NextResponse.json(
          { success: false, error: "lessonId required" },
          { status: 400 },
        );
      }
      await engine.initialize();
      const lesson = await engine.startLesson(body.lessonId);
      return NextResponse.json({ success: true, action, lesson });
    }

    if (action === "finishLesson") {
      await engine.initialize();
      const ok = await engine.finishLesson();
      return NextResponse.json({ success: true, action, finished: ok });
    }

    return NextResponse.json(
      { success: false, error: "unknown action" },
      { status: 400 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "HumanEngine failed";
    const blocked =
      /QUALITY GATE FAILED|FINAL ACCEPTANCE GATE FAILED/i.test(message);
    return NextResponse.json(
      { success: false, blocked, error: message },
      { status: blocked ? 403 : 500 },
    );
  }
}
