import { NextResponse } from "next/server";
import { listSessions } from "@/lib/ai-teacher";

export const runtime = "nodejs";

export async function GET() {
  const sessions = listSessions().map((s) => ({
    sessionId: s.sessionId,
    teacherId: s.teacherId,
    subject: s.subject,
    lesson: s.lesson,
    stage: s.stage,
  }));
  return NextResponse.json({ sessions });
}
