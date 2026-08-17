import { NextResponse } from "next/server";
import { requireTeacherId } from "@/lib/ai-teacher";
import { ElevenLabsVoiceProvider } from "@/lib/ai-teacher/providers";

export const runtime = "nodejs";

const provider = new ElevenLabsVoiceProvider();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const teacherId = requireTeacherId(String(body?.teacherId ?? ""));
    const text = String(body?.text ?? "").trim();
    const languageHint = body?.languageHint === "ar" || body?.languageHint === "en" ? body.languageHint : undefined;
    if (!text) return NextResponse.json({ error: "text is required." }, { status: 400 });

    const { audioBase64, mimeType } = await provider.synthesize(teacherId, text, languageHint);
    // Audio bytes only — ELEVENLABS_API_KEY never leaves the server.
    return NextResponse.json({ audioBase64, mimeType, teacherId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ElevenLabs voice error.";
    const status = /not a recognized teacher/i.test(message) ? 400 : /not configured|no voice id mapped/i.test(message) ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
