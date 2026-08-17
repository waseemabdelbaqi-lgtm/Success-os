import { NextResponse } from "next/server";
import { listSessions, sessionStore } from "@/lib/ai-teacher";
import { listPersistedTeacherSessions, sessionPersistenceMode } from "@/lib/ai-teacher/firebase-session-repository";

export const runtime = "nodejs";

export async function GET() {
  const persistent = await listPersistedTeacherSessions(100);
  const source = persistent.length ? persistent : listSessions();
  const sessions = source.map((s) => ({
    sessionId: s.sessionId,
    teacherId: s.teacherId,
    subject: s.subject,
    lesson: s.lesson,
    stage: s.stage,
  }));
  return NextResponse.json({ sessions, audit: sessionStore.audit().slice(-100), persistence: sessionPersistenceMode() });
}
