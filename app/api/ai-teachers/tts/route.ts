import { NextResponse } from "next/server";
import {
  ensureLiveTtsMp3,
  pauseAfterStyle,
  publicTtsUrl,
  readLiveTtsMp3,
  styleFromContentAct,
  type LiveTtsTeacher,
  type TtsStyle,
} from "@/lib/ai-teachers/live-tts";
import { resolveTeacherVoice } from "@/src/ai-teacher/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET ?id=<sha1> → cached MP3
 * POST { teacherId, text, style? } | { teacherId, lines: [{text, style?, contentAct?}] }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const buf = readLiveTtsMp3(id);
    if (!buf) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Length": String(buf.length),
      },
    });
  }

  const teacher = (
    url.searchParams.get("teacher") === "ali" ? "ali" : "sara"
  ) as LiveTtsTeacher;
  const text = url.searchParams.get("text") || "";
  const style = (url.searchParams.get("style") || "default") as TtsStyle;
  if (!text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  try {
    const result = ensureLiveTtsMp3(teacher, text, style);
    const buf = readLiveTtsMp3(result.key);
    if (!buf) {
      return NextResponse.json({ error: "synthesize failed" }, { status: 500 });
    }
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
        "X-TTS-Cached": result.cached ? "1" : "0",
        "X-TTS-Key": result.key,
        "X-TTS-Duration-Ms": String(result.durationMs),
        "X-TTS-Style": result.style,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "tts failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    teacherId?: string;
    locale?: string;
    text?: string;
    style?: TtsStyle;
    lines?: Array<{
      text: string;
      id?: string;
      style?: TtsStyle;
      contentAct?: string;
    }>;
  };
  const teacherId = (
    body.teacherId === "ali" ? "ali" : "sara"
  ) as LiveTtsTeacher;
  const locale = body.locale || undefined;

  try {
    if (body.lines?.length) {
      const items = body.lines.map((line) => {
        const style =
          line.style ||
          styleFromContentAct(line.contentAct) ||
          ("default" as TtsStyle);
        const result = ensureLiveTtsMp3(teacherId, line.text, style, locale);
        const pauseAfterMs = pauseAfterStyle(result.style);
        return {
          id: line.id || null,
          text: line.text.slice(0, 160),
          key: result.key,
          url: publicTtsUrl(result.key),
          cached: result.cached,
          bytes: result.bytes,
          durationMs: result.durationMs,
          pauseAfterMs,
          style: result.style,
          voice: result.voice,
        };
      });
      const spokenMs = items.reduce((a, x) => a + x.durationMs, 0);
      const pauseMs = items.reduce((a, x) => a + x.pauseAfterMs, 0);
      return NextResponse.json({
        success: true,
        teacherId,
        voice: resolveTeacherVoice(teacherId, locale).voiceId,
        locale: resolveTeacherVoice(teacherId, locale).locale,
        mode: "live-neural-per-line-v3",
        totalSpokenMs: spokenMs,
        totalWithPausesMs: spokenMs + pauseMs,
        items,
      });
    }

    if (!body.text?.trim()) {
      return NextResponse.json({ error: "text or lines required" }, { status: 400 });
    }
    const style = body.style || "default";
    const result = ensureLiveTtsMp3(teacherId, body.text, style);
    return NextResponse.json({
      success: true,
      teacherId,
      key: result.key,
      url: publicTtsUrl(result.key),
      cached: result.cached,
      bytes: result.bytes,
      durationMs: result.durationMs,
      pauseAfterMs: pauseAfterStyle(result.style),
      style: result.style,
      voice: result.voice,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "tts failed" },
      { status: 500 },
    );
  }
}
