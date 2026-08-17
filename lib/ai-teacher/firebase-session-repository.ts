import type { SessionState } from "./teaching-orchestrator.ts";

const SESSION_COLLECTION = "ai_teacher_sessions";
const AUDIT_COLLECTION = "ai_teacher_session_audit";

function configured(): boolean {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

async function firestore() {
  const { getAdminFirestore } = await import("@/lib/firebase/firestore");
  return getAdminFirestore();
}

export function sessionPersistenceMode(): "firestore" | "memory" {
  return configured() ? "firestore" : "memory";
}

export async function persistTeacherSession(session: SessionState, action: "created" | "advanced"): Promise<void> {
  if (!configured()) return;
  const db = await firestore();
  const occurredAt = new Date().toISOString();
  const batch = db.batch();
  batch.set(db.collection(SESSION_COLLECTION).doc(session.sessionId), { ...session, updatedAt: occurredAt }, { merge: true });
  batch.set(db.collection(AUDIT_COLLECTION).doc(), { sessionId: session.sessionId, teacherId: session.teacherId, stage: session.stage, action, occurredAt });
  await batch.commit();
}

export async function loadTeacherSession(sessionId: string): Promise<SessionState | undefined> {
  if (!configured()) return undefined;
  const snapshot = await (await firestore()).collection(SESSION_COLLECTION).doc(sessionId).get();
  if (!snapshot.exists) return undefined;
  const data = snapshot.data();
  if (!data || typeof data.sessionId !== "string" || typeof data.teacherId !== "string" || typeof data.subject !== "string" || typeof data.lesson !== "string" || typeof data.stage !== "string") return undefined;
  return { sessionId: data.sessionId, teacherId: data.teacherId, subject: data.subject, lesson: data.lesson, stage: data.stage } as SessionState;
}

export async function listPersistedTeacherSessions(limit = 100): Promise<SessionState[]> {
  if (!configured()) return [];
  const snapshot = await (await firestore()).collection(SESSION_COLLECTION).orderBy("updatedAt", "desc").limit(Math.max(1, Math.min(limit, 500))).get();
  return snapshot.docs.map((doc) => doc.data()).filter((data) => data.sessionId && data.teacherId && data.subject && data.lesson && data.stage).map((data) => ({ sessionId: data.sessionId, teacherId: data.teacherId, subject: data.subject, lesson: data.lesson, stage: data.stage } as SessionState));
}

