/**
 * Human Teacher Engine API — Sara & Ali only.
 * Identity from src/ai-teacher/teachers/{sara,ali}.ts
 */
import { NextResponse } from "next/server";
import { teachHumanLesson, listStudioThemes } from "@/lib/human-teacher-engine";
import {
  getTeacherPerformanceContract,
  listTeacherConfigs,
  resolveTeacherVoice,
} from "@/src/ai-teacher/config";
import type { HumanLessonInput } from "@/types/human-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const teachers = listTeacherConfigs().map((t) => ({
    id: t.id,
    displayName: t.displayName,
    personality: t.personalityLock,
    performance: t.performance,
    defaultLocale: t.defaultLocale,
    locales: t.localeCodes,
    voice: resolveTeacherVoice(t.id).voiceId,
    appearance: {
      assetRoot: t.appearance.assetRoot,
      outfitKey: t.appearance.outfitKey,
    },
  }));

  return NextResponse.json({
    success: true,
    engine: "human-teacher-engine",
    doctrine: "Sara.ts + Ali.ts are the sole identity source",
    goal: "Student cannot tell teachers are AI across a full hour",
    teachers,
    studios: listStudioThemes().map((s) => ({
      id: s.id,
      labelAr: s.labelAr,
      labelEn: s.labelEn,
    })),
    paths: { platform: "/ai-teacher" },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      teacherId?: "sara" | "ali";
      locale?: string;
      targetDurationMs?: number;
      input?: HumanLessonInput;
    };

    if (!body.input?.lessonId || !body.input?.title) {
      return NextResponse.json(
        { success: false, error: "input.lessonId and input.title required" },
        { status: 400 },
      );
    }

    const teacherId = body.teacherId === "ali" ? "ali" : "sara";
    const contract = getTeacherPerformanceContract(teacherId);
    const result = teachHumanLesson({
      input: body.input,
      teacherId,
      locale: body.locale,
      targetDurationMs: body.targetDurationMs,
    });

    return NextResponse.json({
      success: true,
      brief: result.brief,
      qualityGates: result.qualityGates,
      plan: {
        planId: result.plan.planId,
        lessonId: result.plan.lessonId,
        durationMs: result.plan.timeline.durationMs,
        sentenceCount: result.plan.sentences.length,
        lineCount: result.plan.speech.lines.length,
        lipSyncKeys: result.plan.timeline.lipSync.length,
        character: result.plan.character,
        adapterNotes: result.plan.adapter.notes,
      },
      contract: {
        targetContinuousMs: contract.targetContinuousMs,
        indistinguishabilityGoal: contract.indistinguishabilityGoal,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "teach failed" },
      { status: 500 },
    );
  }
}
