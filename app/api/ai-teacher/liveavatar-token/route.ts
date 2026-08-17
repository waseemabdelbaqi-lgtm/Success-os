import { NextResponse } from "next/server";
import { requireTeacherId } from "@/lib/ai-teacher";
import { LiveAvatarProvider } from "@/lib/ai-teacher/providers";

export const runtime = "nodejs";

const provider = new LiveAvatarProvider();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const teacherId = requireTeacherId(String(body?.teacherId ?? ""));
    const languageHint = body?.languageHint === "ar" || body?.languageHint === "en" ? body.languageHint : "ar";
    const { sessionToken } = await provider.createSessionToken(teacherId, languageHint);
    // Only the short-lived session token is returned — LIVEAVATAR_API_KEY never leaves the server.
    return NextResponse.json({ sessionToken, teacherId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LiveAvatar token error.";
    const status = /not a recognized teacher/i.test(message) ? 400 : /not configured|no .* id mapped/i.test(message) ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
