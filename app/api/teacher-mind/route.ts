import { NextResponse } from "next/server";
import {
  createSessionMemory,
  describeTeacherMindTree,
  adaptLiveTeacher,
} from "@/lib/human-engine";
import {
  getTeacherProfile,
  listTeacherProfiles,
  resetTeacherProfile,
  saveTeacherProfile,
} from "@/lib/human-engine/teacher-profile-store";
import type { TeacherMindProfile } from "@/types/teacher-mind";

export const runtime = "nodejs";

/**
 * GET ?action=status|profiles|profile|tree&id=sara
 * POST { action: "save"|"reset"|"adapt"|"session", ... }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";
  const id = url.searchParams.get("id") || "sara";

  if (action === "status") {
    return NextResponse.json({
      schema: "success-os.teacher-mind.v1",
      profiles: listTeacherProfiles().map((p) => ({
        id: p.id,
        displayName: p.displayName,
        pace: p.teaching.pace,
        answerStyle: p.teaching.answerStyle,
        voice: p.voice.edgeTts,
      })),
      adminPath: "/admin/ai-teachers",
      note: "Teacher Mind = Behaviour Tree + editable profiles + session memory",
    });
  }

  if (action === "profiles") {
    return NextResponse.json(listTeacherProfiles());
  }

  if (action === "profile") {
    return NextResponse.json(getTeacherProfile(id));
  }

  if (action === "tree") {
    return NextResponse.json(describeTeacherMindTree());
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    action?: string;
    profile?: TeacherMindProfile;
    id?: string;
    teacherId?: string;
    lessonTitle?: string;
    lessonId?: string;
    currentLine?: string;
    event?: { type: string; text?: string; correct?: boolean };
    memory?: unknown;
    elapsedMs?: number;
  };

  if (body.action === "save" && body.profile) {
    const saved = saveTeacherProfile(body.profile);
    return NextResponse.json({ success: true, data: saved });
  }

  if (body.action === "reset" && body.id) {
    const restored = resetTeacherProfile(body.id);
    return NextResponse.json({ success: true, data: restored });
  }

  if (body.action === "session") {
    const teacherId = body.teacherId === "ali" ? "ali" : "sara";
    const mem = createSessionMemory({
      teacherId,
      lessonId: body.lessonId || "session",
      lessonTitle: body.lessonTitle || "درس",
    });
    return NextResponse.json({ success: true, data: mem });
  }

  if (body.action === "adapt") {
    const teacherId = body.teacherId === "ali" ? "ali" : "sara";
    const eventType = body.event?.type || "ask_text";
    const event =
      eventType === "explain_simpler" || eventType === "explain_again"
        ? ({ type: eventType } as const)
        : eventType === "example"
          ? ({ type: "example" } as const)
          : eventType === "confused"
            ? ({ type: "confused" } as const)
            : eventType === "answer"
              ? ({
                  type: "answer" as const,
                  text: body.event?.text || "",
                  correct: body.event?.correct,
                })
              : ({ type: "ask_text" as const, text: body.event?.text || "" });

    const result = adaptLiveTeacher({
      teacherId,
      lessonTitle: body.lessonTitle || "الدرس",
      lessonId: body.lessonId,
      currentLine: body.currentLine,
      event,
      memory: body.memory as never,
      elapsedMs: body.elapsedMs,
      profile: getTeacherProfile(teacherId),
    });
    return NextResponse.json({ success: true, data: result });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
