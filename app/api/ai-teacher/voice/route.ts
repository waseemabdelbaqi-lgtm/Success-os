import { NextResponse } from "next/server";
import { requireTeacherId } from "@/lib/ai-teacher";
import { ElevenLabsVoiceProvider } from "@/lib/ai-teacher/providers";
import { checkProviderRateLimit, rateLimitHeaders } from "@/lib/ai-teacher/provider-rate-limit";

export const runtime = "nodejs";

const provider = new ElevenLabsVoiceProvider();

export async function POST(request: Request) {
  try {
    const rateLimit = await checkProviderRateLimit(request, "elevenlabs-voice", 30);
    if (!rateLimit.allowed) return NextResponse.json({ error: "Voice request limit reached. Try again after the reset time." }, { status: 429, headers: rateLimitHeaders(rateLimit) });
    const body = await request.json();
    const teacherId = requireTeacherId(String(body?.teacherId ?? ""));
    const text = String(body?.text ?? "").trim();
    const languageHint = body?.languageHint === "ar" || body?.languageHint === "en" ? body.languageHint : undefined;
    if (!text) return NextResponse.json({ error: "text is required." }, { status: 400 });

    const { audioBase64, mimeType } = await provider.synthesize(teacherId, text, languageHint);
    // Audio bytes only — ELEVENLABS_API_KEY never leaves the server.
    return NextResponse.json({ audioBase64, mimeType, teacherId }, { headers: rateLimitHeaders(rateLimit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ElevenLabs voice error.";
    const status = /not a recognized teacher/i.test(message) ? 400 : /not configured|no voice id mapped/i.test(message) ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
