/**
 * ai-teacher-runtime.ts
 *
 * Top-level entry point for Sara/Ali. Every student-facing flow goes:
 * requireTeacherId() → create/load session → teaching-orchestrator.advance()
 * → TeacherTurn. The Physics Engine (or any subject engine) is reachable
 * only through the subject tool router — this file never imports a subject
 * engine directly.
 */

import { requireTeacherId, type TeacherId } from "./teacher-identity.ts";
import { advance, type SessionState, type StudentInput } from "./teaching-orchestrator.ts";
import { getOrCreateMemory, type SessionMemory } from "./session-memory.ts";
import type { TeacherTurn } from "./teacher-turn.ts";
import { registerPhysicsSubjectTool } from "./physics-subject-tool.ts";
import { sessionStore } from "./session-store.ts";

// Register every subject tool the runtime knows about. Sara/Ali reach these
// only through the subject tool router (subject-tool-router.ts) — this is
// the one place a subject engine is wired in.
registerPhysicsSubjectTool();

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface CreateSessionInput {
  teacherId: string; // raw, validated here
  subject: string;
  lesson: string;
}

/** Creates a new teacher session. Throws if the teacher id is not "sara"/"ali" (or the "sarah" alias). */
export function createTeacherSession(input: CreateSessionInput): SessionState {
  const teacherId: TeacherId = requireTeacherId(input.teacherId);
  const sessionId = generateSessionId();
  const session: SessionState = { sessionId, teacherId, subject: input.subject, lesson: input.lesson, stage: "INITIALIZE" };
  sessionStore.put(session, "created");
  getOrCreateMemory(sessionId);
  return session;
}

export function getSession(sessionId: string): SessionState {
  const session = sessionStore.get(sessionId);
  if (!session) throw new Error(`AI Teacher runtime error: unknown session "${sessionId}". Create one with createTeacherSession() first.`);
  return session;
}

/** Admin/introspection only: lists all sessions currently held in memory. */
export function listSessions(): SessionState[] {
  return sessionStore.list();
}

export function sessionCount(): number {
  return sessionStore.count();
}

/** Advances the given session by one turn, persisting the resulting stage. */
export function runTurn(sessionId: string, studentInput?: StudentInput): { turn: TeacherTurn; memory: SessionMemory } {
  const session = getSession(sessionId);
  const { turn, memory, nextSession } = advance(session, studentInput);
  sessionStore.put(nextSession, "advanced");
  return { turn, memory };
}

/** Test-only: clears all in-memory sessions between test files. */
export function _clearSessionsForTests(): void {
  sessionStore.clear();
}
