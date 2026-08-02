import { NextResponse } from "next/server";
import {
  buildDemoPlans,
  buildPreviewPlan,
  buildShowcasePlan,
  buildShowcasePlans,
  directLesson,
  listHumanCharacters,
  resolveAdapterMeta,
} from "@/lib/human-engine";
import type { HumanLessonInput } from "@/types/human-engine";

export const runtime = "nodejs";

/**
 * GET ?action=status|demo|preview|showcase&teacher=sara|ali
 * POST { action: "plan", input: HumanLessonInput, adapterId? }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";
  const teacher = url.searchParams.get("teacher") === "ali" ? "ali" : "sara";

  if (action === "status") {
    return NextResponse.json({
      schema: "success-os.human-engine.v1",
      version: "1.1.0",
      modules: [
        "character-generator",
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
      ],
      characters: listHumanCharacters().map((c) => c.id),
      adapters: [
        resolveAdapterMeta({ id: "local_photoreal_preview" }),
        resolveAdapterMeta({ id: "metahuman" }),
        resolveAdapterMeta({ id: "heygen" }),
      ],
      paths: {
        live: "/ai-teacher/live",
        preview10s: "/ai-teacher/human-engine-preview",
        threeStudioPhase1: "/ai-teacher/studio",
      },
      note: "Performance generated from lesson meaning per sentence. MetaHuman adapter stub-ready.",
    });
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

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    action?: string;
    input?: HumanLessonInput;
    adapterId?: string;
    maxDurationMs?: number;
  };

  if (body.action !== "plan" || !body.input) {
    return NextResponse.json(
      { error: "POST requires action=plan and input" },
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
