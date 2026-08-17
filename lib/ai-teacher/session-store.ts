import type { SessionState } from "./teaching-orchestrator.ts";

export interface SessionAuditEvent {
  sessionId: string;
  action: "created" | "advanced" | "deleted";
  stage: SessionState["stage"];
  occurredAt: string;
}

export interface SessionStore {
  put(session: SessionState, action: SessionAuditEvent["action"]): void;
  get(sessionId: string): SessionState | undefined;
  list(): SessionState[];
  count(): number;
  audit(sessionId?: string): SessionAuditEvent[];
  clear(): void;
}

export class BoundedMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, SessionState>();
  private readonly events: SessionAuditEvent[] = [];
  private readonly maxSessions: number;
  private readonly maxAuditEvents: number;

  constructor(maxSessions = 500, maxAuditEvents = 5000) {
    if (maxSessions < 1 || maxAuditEvents < 1) throw new Error("Session store limits must be positive.");
    this.maxSessions = maxSessions;
    this.maxAuditEvents = maxAuditEvents;
  }

  put(session: SessionState, action: SessionAuditEvent["action"]): void {
    if (!this.sessions.has(session.sessionId) && this.sessions.size >= this.maxSessions) {
      const oldestId = this.sessions.keys().next().value as string | undefined;
      if (oldestId) this.sessions.delete(oldestId);
    }
    this.sessions.set(session.sessionId, { ...session });
    this.events.push({ sessionId: session.sessionId, action, stage: session.stage, occurredAt: new Date().toISOString() });
    if (this.events.length > this.maxAuditEvents) this.events.splice(0, this.events.length - this.maxAuditEvents);
  }

  get(sessionId: string): SessionState | undefined {
    const session = this.sessions.get(sessionId);
    return session ? { ...session } : undefined;
  }

  list(): SessionState[] { return [...this.sessions.values()].map((session) => ({ ...session })); }
  count(): number { return this.sessions.size; }
  audit(sessionId?: string): SessionAuditEvent[] { return this.events.filter((event) => !sessionId || event.sessionId === sessionId).map((event) => ({ ...event })); }
  clear(): void { this.sessions.clear(); this.events.length = 0; }
}

const globalKey = "__successOsAiTeacherSessionStore";
type StoreGlobal = typeof globalThis & { [globalKey]?: SessionStore };
const storeGlobal = globalThis as StoreGlobal;

export const sessionStore: SessionStore = storeGlobal[globalKey] ?? new BoundedMemorySessionStore();
storeGlobal[globalKey] = sessionStore;
