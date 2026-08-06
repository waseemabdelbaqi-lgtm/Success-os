import { NextResponse } from "next/server";
import {
  getAiCapability,
  invokeAiCapability,
  listAiCapabilities,
  resolveAiCapabilityId,
} from "@/lib/interactive-lesson-engine/ai/integration-layer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AI Integration Layer — Phase 5 (placeholders only).
 * POST /api/interactive-lesson-engine/ai/[capability]
 * Always returns generationEnabled: false — no content generation in this PR.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ capability: string }> },
) {
  const { capability } = await context.params;
  if (capability === "catalog" || capability === "list") {
    return NextResponse.json({
      ok: true,
      generationEnabled: false,
      capabilities: listAiCapabilities(),
    });
  }
  const meta = getAiCapability(capability);
  if (!meta) {
    return NextResponse.json({ ok: false, error: "Unknown capability" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, capability: meta });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ capability: string }> },
) {
  const { capability } = await context.params;
  if (!resolveAiCapabilityId(capability) && !getAiCapability(capability)) {
    return NextResponse.json({ ok: false, error: "Unknown capability" }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const result = await invokeAiCapability(capability, {
    lessonId: typeof body.lessonId === "string" ? body.lessonId : undefined,
    slideId: typeof body.slideId === "string" ? body.slideId : undefined,
    blockId: typeof body.blockId === "string" ? body.blockId : undefined,
    locale: typeof body.locale === "string" ? body.locale : undefined,
    prompt: typeof body.prompt === "string" ? body.prompt : undefined,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 501 });
}
