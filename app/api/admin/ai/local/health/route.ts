import "server-only";

import { NextResponse } from "next/server";
import { verifyLocalCurriculumAi } from "@/lib/ai/local-ollama";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Local-only health probe for the Ollama curriculum engine.
 * Does not proxy arbitrary prompts and does not expose Ollama on the tunnel.
 * Curriculum processing remains disabled.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  const isLocalHost =
    /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(host) ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("localhost");

  // Refuse serving this admin probe through public tunnel hostnames.
  if (!isLocalHost && process.env.ALLOW_PUBLIC_LOCAL_AI_HEALTH !== "true") {
    return NextResponse.json(
      {
        connected: false,
        error: {
          code: "LOCAL_ONLY",
          message: "Local AI health is available only on localhost.",
        },
        curriculumProcessingAllowed: false,
      },
      { status: 403 },
    );
  }

  const result = await verifyLocalCurriculumAi();
  return NextResponse.json(result, {
    status: result.connected ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
