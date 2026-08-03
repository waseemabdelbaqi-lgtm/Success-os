import { NextResponse } from "next/server";
import {
  ensureLiveTtsMp3,
  publicTtsUrl,
  readLiveTtsMp3,
  type LiveTtsTeacher,
} from "@/lib/ai-teachers/live-tts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET ?id=<sha1> → cached MP3
 * GET ?teacher=sara|ali&text=... → synthesize + redirect/return MP3
 * POST { teacherId, text } | { lines: [{text}], teacherId } → urls
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

  const teacher = (url.searchParams.get("teacher") === "ali" ? "ali" : "sara") as LiveTtsTeacher;
  const text = url.searchParams.get("text") || "";
  if (!text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  try {
    const result = ensureLiveTtsMp3(teacher, text);
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
    text?: string;
    lines?: Array<{ text: string; id?: string }>;
  };
  const teacherId = (body.teacherId === "ali" ? "ali" : "sara") as LiveTtsTeacher;

  try {
    if (body.lines?.length) {
      const items = body.lines.map((line) => {
        const result = ensureLiveTtsMp3(teacherId, line.text);
        return {
          id: line.id || null,
          text: line.text.slice(0, 120),
          key: result.key,
          url: publicTtsUrl(result.key),
          cached: result.cached,
          bytes: result.bytes,
        };
      });
      return NextResponse.json({
        success: true,
        teacherId,
        voice: teacherId === "ali" ? "ar-JO-TaimNeural" : "ar-JO-SanaNeural",
        mode: "live-neural-per-line",
        items,
      });
    }

    if (!body.text?.trim()) {
      return NextResponse.json({ error: "text or lines required" }, { status: 400 });
    }
    const result = ensureLiveTtsMp3(teacherId, body.text);
    return NextResponse.json({
      success: true,
      teacherId,
      key: result.key,
      url: publicTtsUrl(result.key),
      cached: result.cached,
      bytes: result.bytes,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "tts failed" },
      { status: 500 },
    );
  }
}
