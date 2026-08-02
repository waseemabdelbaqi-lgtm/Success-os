import { NextResponse } from "next/server";
import {
  adaptLiveTeacher,
  buildDemoPlans,
  buildPreviewPlan,
  buildProofLessonInput,
  buildShowcasePlan,
  buildShowcasePlans,
  directLesson,
  getTeacherPersona,
  listHumanCharacters,
  listProofLessons,
  listTeacherPersonas,
  resolveAdapterMeta,
} from "@/lib/human-engine";
import type { HumanLessonInput } from "@/types/human-engine";

export const runtime = "nodejs";

/**
 * GET ?action=status|demo|preview|showcase|proof|lessons|personas&teacher=sara|ali&lesson=
 * POST { action: "plan"|"adapt", ... }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";
  const teacher = url.searchParams.get("teacher") === "ali" ? "ali" : "sara";
  const lesson = url.searchParams.get("lesson") || "forces_law_lab";

  if (action === "status") {
    return NextResponse.json({
      schema: "success-os.human-engine.v1",
      version: "1.2.0",
      modules: [
        "character-generator",
        "teacher-persona",
        "skeleton-animation",
        "facial-rig",
        "blend-shapes",
        "lip-sync",
        "eye-tracking",
        "head-tracking",
        "emotion-system",
        "gesture-engine",
        "ai-behaviour-engine",
        "camera-director",
        "lighting-director",
        "animation-timeline",
        "lesson-director",
        "semantic-sentence",
        "content-screen",
        "adapt-live",
        "proof-lessons",
      ],
      characters: listHumanCharacters().map((c) => c.id),
      personas: listTeacherPersonas().map((p) => ({
        id: p.id,
        voiceId: p.voiceId,
        style: p.style,
        reexplainStrategy: p.interaction.reexplainStrategy,
      })),
      adapters: [
        resolveAdapterMeta({ id: "local_photoreal_preview" }),
        resolveAdapterMeta({ id: "metahuman" }),
        resolveAdapterMeta({ id: "heygen" }),
      ],
      paths: {
        demo: "/ai-teacher/demo",
        proof: "/ai-teacher/proof",
        live: "/ai-teacher/live",
        preview10s: "/ai-teacher/human-engine-preview",
        threeStudioPhase1: "/ai-teacher/studio",
      },
      honesty: {
        works: [
          "skinned Sara/Ali GLB (Mixamo skeleton + fingers + eye bones)",
          "ARKit-named face morphs driven by HE phonemes/emotion",
          "Three.js studio driven by Human Engine frames",
          "≥60s proof/demo lessons + ask/re-explain",
          "persona-differentiated voice/style/gestures",
        ],
        structure_only: [
          "Unreal MetaHuman Pixel Streaming (needs UE server)",
          "HeyGen twin video (needs HEYGEN_* credentials)",
        ],
      },
      note: "Product path is WebGL skinned humanoids. MetaHuman Unreal is adapter-ready, not live here.",
    });
  }

  if (action === "lessons") {
    return NextResponse.json(listProofLessons());
  }

  if (action === "personas") {
    return NextResponse.json(listTeacherPersonas());
  }

  if (action === "demo") {
    return NextResponse.json(buildDemoPlans());
  }

  if (action === "preview") {
    return NextResponse.json(buildPreviewPlan(teacher));
  }

  if (action === "showcase") {
    if (url.searchParams.get("both") === "1") {
      return NextResponse.json(buildShowcasePlans());
    }
    return NextResponse.json(buildShowcasePlan(teacher));
  }

  if (action === "proof") {
    const input = buildProofLessonInput(lesson, teacher);
    const plan = directLesson({
      input,
      maxDurationMs: Math.max(65000, input.durationMs || 65000),
    });
    return NextResponse.json({
      persona: getTeacherPersona(teacher),
      lesson: listProofLessons().find((l) => l.id === lesson),
      plan,
    });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    action?: string;
    input?: HumanLessonInput;
    adapterId?: string;
    maxDurationMs?: number;
    teacherId?: string;
    lessonTitle?: string;
    currentLine?: string;
    event?: { type: string; text?: string };
  };

  if (body.action === "adapt") {
    const teacherId = body.teacherId === "ali" ? "ali" : "sara";
    const eventType = body.event?.type || "ask_text";
    const event =
      eventType === "explain_simpler"
        ? ({ type: "explain_simpler" } as const)
        : eventType === "explain_again"
          ? ({ type: "explain_again" } as const)
          : eventType === "example"
            ? ({ type: "example" } as const)
            : ({ type: "ask_text", text: body.event?.text || "" } as const);
    const result = adaptLiveTeacher({
      teacherId,
      lessonTitle: body.lessonTitle || "الدرس",
      currentLine: body.currentLine,
      event,
    });
    return NextResponse.json(result);
  }

  if (body.action !== "plan" || !body.input) {
    return NextResponse.json(
      { error: "POST requires action=plan|adapt" },
      { status: 400 },
    );
  }

  const plan = directLesson({
    input: body.input,
    adapterId: body.adapterId || "local_photoreal_preview",
    maxDurationMs: body.maxDurationMs,
  });
  return NextResponse.json(plan);
}
