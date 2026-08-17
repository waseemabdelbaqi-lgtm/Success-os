import { NextResponse } from "next/server";
import { createTeacherSession, runTurn, getSession, requireTeacherId, requireProductionAcceptance, restoreTeacherSession } from "@/lib/ai-teacher";
import { loadTeacherSession, persistTeacherSession, sessionPersistenceMode } from "@/lib/ai-teacher/firebase-session-repository";
import type { StudentInput } from "@/lib/ai-teacher";
import { checkProviderRateLimit, rateLimitHeaders } from "@/lib/ai-teacher/provider-rate-limit";

export const runtime = "nodejs"; // in-memory session store needs a persistent process, not a stateless edge isolate per request

export async function POST(request: Request) {
  try {
    const rateLimit = await checkProviderRateLimit(request, "teacher-turn", 60);
    if (!rateLimit.allowed) return NextResponse.json({ error: "Lesson request limit reached. Try again after the reset time." }, { status: 429, headers: rateLimitHeaders(rateLimit) });
    const body = await request.json();
    const { teacherId, subject, lesson, sessionId, studentInput } = body ?? {};

    let activeSessionId: string;
    if (typeof sessionId === "string" && sessionId) {
      try {
        getSession(sessionId);
      } catch {
        const persisted = await loadTeacherSession(sessionId);
        if (!persisted) throw new Error(`AI Teacher runtime error: unknown session "${sessionId}".`);
        restoreTeacherSession(persisted);
      }
      activeSessionId = sessionId;
    } else {
      if (typeof teacherId !== "string" || typeof subject !== "string" || typeof lesson !== "string") {
        return NextResponse.json({ error: "teacherId, subject, and lesson are required to start a new session." }, { status: 400 });
      }
      const canonicalTeacherId = requireTeacherId(teacherId);
      requireProductionAcceptance(canonicalTeacherId);
      const session = createTeacherSession({ teacherId: canonicalTeacherId, subject, lesson });
      await persistTeacherSession(session, "created");
      activeSessionId = session.sessionId;
    }

    const { turn, memory } = runTurn(activeSessionId, studentInput as StudentInput | undefined);
    await persistTeacherSession(getSession(activeSessionId), "advanced");
    return NextResponse.json({ sessionId: activeSessionId, turn, memory, persistence: sessionPersistenceMode() }, { headers: rateLimitHeaders(rateLimit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI Teacher runtime error.";
    // Teacher-identity rejections and unknown-session errors are client errors (400); anything else is a server error.
    const status = /acceptance gate/i.test(message) ? 503 : /not a recognized teacher|unknown session/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
