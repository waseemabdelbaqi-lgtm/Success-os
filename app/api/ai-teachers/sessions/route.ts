import { NextResponse } from "next/server";
import { listSessions } from "@/lib/ai-teacher";

export const runtime = "nodejs";

// NOTE: this project has no authentication infrastructure, so this endpoint
// cannot be "properly protected" as requested — that would require building
// an auth system, which is out of scope here. No student-identifying data is
// tracked anywhere in the runtime (there is no studentId field at all), so
// there is nothing sensitive to withhold beyond the session list itself.
export async function GET() {
  const sessions = listSessions().map((s) => ({
    sessionId: s.sessionId,
    teacherId: s.teacherId,
    subject: s.subject,
    lesson: s.lesson,
    stage: s.stage,
  }));
  return NextResponse.json({ sessions, authNote: "No auth infrastructure exists in this project; this endpoint is unprotected." });
}
