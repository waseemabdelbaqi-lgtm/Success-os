/**
 * Durable ATE persistence — JSON collections + append-only audit JSONL.
 * Path: library/ai-teacher-engine/
 * Replaceable with Firestore later without changing repository callers.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import type {
  AteTeachingTurn,
  StudentMemoryRecord,
} from "@/types/ai-teacher-engine";
import { logger } from "@/lib/logger";

function rootDir() {
  return path.join(process.cwd(), "library", "ai-teacher-engine");
}

function ensureDirs() {
  for (const sub of ["memory", "sessions", "audit", "metrics"]) {
    fs.mkdirSync(path.join(rootDir(), sub), { recursive: true });
  }
}

function writeJson(file: string, data: unknown) {
  ensureDirs();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function memoryPath(studentId: string) {
  const safe = createHash("sha256").update(studentId).digest("hex").slice(0, 24);
  return path.join(rootDir(), "memory", `${safe}.json`);
}

function sessionPath(sessionId: string) {
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return path.join(rootDir(), "sessions", `${safe}.json`);
}

export type AteAuditEvent = {
  id: string;
  at: string;
  kind: string;
  studentId?: string;
  sessionId?: string;
  ok: boolean;
  details?: Record<string, unknown>;
};

export type AteMetricsSnapshot = {
  schema: "success-os.ate-metrics.v1";
  updatedAt: string;
  totals: {
    turns: number;
    memoryWrites: number;
    memoryReads: number;
    errors: number;
    uncertainReplies: number;
  };
  lastEventAt: string | null;
};

function metricsPath() {
  return path.join(rootDir(), "metrics", "snapshot.json");
}

export function emptyMetrics(): AteMetricsSnapshot {
  return {
    schema: "success-os.ate-metrics.v1",
    updatedAt: new Date().toISOString(),
    totals: {
      turns: 0,
      memoryWrites: 0,
      memoryReads: 0,
      errors: 0,
      uncertainReplies: 0,
    },
    lastEventAt: null,
  };
}

export function getAteMetrics(): AteMetricsSnapshot {
  return readJson<AteMetricsSnapshot>(metricsPath()) || emptyMetrics();
}

function bumpMetrics(patch: Partial<AteMetricsSnapshot["totals"]>) {
  const current = getAteMetrics();
  const next: AteMetricsSnapshot = {
    ...current,
    updatedAt: new Date().toISOString(),
    lastEventAt: new Date().toISOString(),
    totals: {
      turns: current.totals.turns + (patch.turns || 0),
      memoryWrites: current.totals.memoryWrites + (patch.memoryWrites || 0),
      memoryReads: current.totals.memoryReads + (patch.memoryReads || 0),
      errors: current.totals.errors + (patch.errors || 0),
      uncertainReplies:
        current.totals.uncertainReplies + (patch.uncertainReplies || 0),
    },
  };
  writeJson(metricsPath(), next);
  return next;
}

export function appendAteAudit(
  entry: Omit<AteAuditEvent, "id" | "at"> & { at?: string },
): AteAuditEvent {
  ensureDirs();
  const row: AteAuditEvent = {
    id: randomUUID(),
    at: entry.at || new Date().toISOString(),
    kind: entry.kind,
    studentId: entry.studentId,
    sessionId: entry.sessionId,
    ok: entry.ok,
    details: entry.details,
  };
  const day = row.at.slice(0, 10);
  const file = path.join(rootDir(), "audit", `${day}.jsonl`);
  fs.appendFileSync(file, `${JSON.stringify(row)}\n`, "utf8");
  logger.info("ATE audit", {
    kind: row.kind,
    studentId: row.studentId,
    sessionId: row.sessionId,
    ok: row.ok,
  });
  return row;
}

export function loadStudentMemory(
  studentId: string,
): StudentMemoryRecord | null {
  const record = readJson<StudentMemoryRecord>(memoryPath(studentId));
  if (record) bumpMetrics({ memoryReads: 1 });
  return record;
}

export function saveStudentMemory(record: StudentMemoryRecord): StudentMemoryRecord {
  writeJson(memoryPath(record.studentId), record);
  bumpMetrics({ memoryWrites: 1 });
  appendAteAudit({
    kind: "memory.write",
    studentId: record.studentId,
    ok: true,
    details: {
      historyLength: record.conversationHistory.length,
      curriculumId: record.currentCurriculumId,
    },
  });
  return record;
}

export function deleteStudentMemory(studentId: string): boolean {
  const file = memoryPath(studentId);
  if (!fs.existsSync(file)) return false;
  fs.unlinkSync(file);
  appendAteAudit({
    kind: "memory.delete",
    studentId,
    ok: true,
  });
  return true;
}

export function saveTeachingTurn(turn: AteTeachingTurn): AteTeachingTurn {
  writeJson(sessionPath(turn.sessionId), turn);
  bumpMetrics({
    turns: 1,
    uncertainReplies: turn.teacherReply.uncertain ? 1 : 0,
  });
  appendAteAudit({
    kind: "turn.saved",
    studentId: turn.studentId,
    sessionId: turn.sessionId,
    ok: true,
    details: {
      intent: turn.intent,
      affect: turn.affect,
      ilePackageId: turn.ilePackageId,
      uncertain: turn.teacherReply.uncertain,
      durationLayers: turn.invocations.map((i) => ({
        layerId: i.layerId,
        durationMs: i.durationMs,
        ok: i.ok,
      })),
    },
  });
  return turn;
}

export function loadTeachingTurn(sessionId: string): AteTeachingTurn | null {
  return readJson<AteTeachingTurn>(sessionPath(sessionId));
}

export function listAteMemoryFiles(): string[] {
  ensureDirs();
  return fs.readdirSync(path.join(rootDir(), "memory"));
}

/** Test helper — clears ATE durable store under library/ai-teacher-engine. */
export function resetAteStoreForTests() {
  const root = rootDir();
  if (fs.existsSync(root)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  ensureDirs();
  writeJson(metricsPath(), emptyMetrics());
}
