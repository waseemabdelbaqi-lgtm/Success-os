import { NextResponse } from "next/server";
import { createTeacherSession, runTurn, getSession, requireTeacherId, requireProductionAcceptance } from "@/lib/ai-teacher";
import type { StudentInput } from "@/lib/ai-teacher";

export const runtime = "nodejs"; // in-memory session store needs a persistent process, not a stateless edge isolate per request

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teacherId, subject, lesson, sessionId, studentInput } = body ?? {};

    let activeSessionId: string;
    if (typeof sessionId === "string" && sessionId) {
      // Validate the session actually exists before trying to advance it.
      getSession(sessionId);
      activeSessionId = sessionId;
    } else {
      if (typeof teacherId !== "string" || typeof subject !== "string" || typeof lesson !== "string") {
        return NextResponse.json({ error: "teacherId, subject, and lesson are required to start a new session." }, { status: 400 });
      }
      const canonicalTeacherId = requireTeacherId(teacherId);
      requireProductionAcceptance(canonicalTeacherId);
      const session = createTeacherSession({ teacherId: canonicalTeacherId, subject, lesson });
      activeSessionId = session.sessionId;
    }

    const { turn, memory } = runTurn(activeSessionId, studentInput as StudentInput | undefined);
    return NextResponse.json({ sessionId: activeSessionId, turn, memory });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI Teacher runtime error.";
    // Teacher-identity rejections and unknown-session errors are client errors (400); anything else is a server error.
    const status = /acceptance gate/i.test(message) ? 503 : /not a recognized teacher|unknown session/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
