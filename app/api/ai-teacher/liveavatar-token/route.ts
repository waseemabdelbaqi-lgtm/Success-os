import { NextResponse } from "next/server";
import { requireProductionAcceptance, requireTeacherId } from "@/lib/ai-teacher";
import { LiveAvatarProvider } from "@/lib/ai-teacher/providers";
import { checkProviderRateLimit, rateLimitHeaders } from "@/lib/ai-teacher/provider-rate-limit";

export const runtime = "nodejs";

const provider = new LiveAvatarProvider();

export async function POST(request: Request) {
  try {
    const rateLimit = await checkProviderRateLimit(request, "liveavatar-token", 5);
    if (!rateLimit.allowed) return NextResponse.json({ error: "Too many LiveAvatar session requests. Try again after the reset time." }, { status: 429, headers: rateLimitHeaders(rateLimit) });
    const body = await request.json();
    const teacherId = requireTeacherId(String(body?.teacherId ?? ""));
    requireProductionAcceptance(teacherId);
    const languageHint = body?.languageHint === "ar" || body?.languageHint === "en" ? body.languageHint : "ar";
    const { sessionToken } = await provider.createSessionToken(teacherId, languageHint);
    // Only the short-lived session token is returned — LIVEAVATAR_API_KEY never leaves the server.
    return NextResponse.json({ sessionToken, teacherId }, { headers: rateLimitHeaders(rateLimit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LiveAvatar token error.";
    const status = /not a recognized teacher/i.test(message) ? 400 : /acceptance gate|not configured|no .* id mapped/i.test(message) ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
