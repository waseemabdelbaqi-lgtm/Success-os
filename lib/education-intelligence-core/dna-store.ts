/**
 * Durable Learning DNA store — nothing is forgotten.
 * Path: library/education-intelligence-core/dna/
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import type { LearningDna, LevelScore } from "@/types/education-intelligence-core";
import { logger } from "@/lib/logger";

function rootDir() {
  return path.join(process.cwd(), "library", "education-intelligence-core");
}

function dnaPath(studentId: string) {
  const safe = createHash("sha256").update(studentId).digest("hex").slice(0, 24);
  return path.join(rootDir(), "dna", `${safe}.json`);
}

function ensureDirs() {
  fs.mkdirSync(path.join(rootDir(), "dna"), { recursive: true });
  fs.mkdirSync(path.join(rootDir(), "audit"), { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

export function level(score: number): LevelScore {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const band =
    s < 20
      ? "very_low"
      : s < 40
        ? "low"
        : s < 60
          ? "moderate"
          : s < 80
            ? "high"
            : "very_high";
  return { score: s, band };
}

export function emptyLearningDna(
  studentId: string,
  studentName = "",
): LearningDna {
  const at = nowIso();
  return {
    schema: "success-os.learning-dna.v1",
    studentId,
    studentName: studentName.trim(),
    knowledgeLevel: level(40),
    understandingLevel: level(40),
    confidenceLevel: level(45),
    attentionLevel: level(50),
    memoryStrength: level(45),
    criticalThinking: level(40),
    problemSolving: level(40),
    readingSpeed: level(50),
    listeningAbility: level(50),
    speakingAbility: level(45),
    writingAbility: level(45),
    preferredLearningStyle: "mixed",
    preferredTeacherStyle: "step_by_step",
    preferredExamples: [],
    preferredLanguage: "",
    weakSkillIds: [],
    strongSkillIds: [],
    currentGoals: [],
    usedExplanationFingerprints: [],
    confusionLog: [],
    repeatedMistakeCodes: [],
    guessingSignals: 0,
    trueUnderstandingSignals: 0,
    learningVelocity: "normal",
    interactionCount: 0,
    lastInsight: null,
    updatedAt: at,
    createdAt: at,
  };
}

export function loadLearningDna(studentId: string): LearningDna | null {
  ensureDirs();
  try {
    return JSON.parse(fs.readFileSync(dnaPath(studentId), "utf8")) as LearningDna;
  } catch {
    return null;
  }
}

export function saveLearningDna(dna: LearningDna): LearningDna {
  ensureDirs();
  const next: LearningDna = { ...dna, updatedAt: nowIso() };
  fs.writeFileSync(dnaPath(dna.studentId), `${JSON.stringify(next, null, 2)}\n`);
  const day = next.updatedAt.slice(0, 10);
  fs.appendFileSync(
    path.join(rootDir(), "audit", `${day}.jsonl`),
    `${JSON.stringify({
      at: next.updatedAt,
      studentId: next.studentId,
      interactionCount: next.interactionCount,
      understanding: next.understandingLevel.score,
      confidence: next.confidenceLevel.score,
    })}\n`,
  );
  logger.info("EIC Learning DNA saved", {
    studentId: next.studentId,
    interactionCount: next.interactionCount,
    understanding: next.understandingLevel.score,
  });
  return next;
}

export function getOrCreateLearningDna(
  studentId: string,
  studentName?: string,
): LearningDna {
  const existing = loadLearningDna(studentId);
  if (existing) {
    if (studentName && studentName.trim() && studentName !== existing.studentName) {
      existing.studentName = studentName.trim();
      return saveLearningDna(existing);
    }
    return structuredClone(existing);
  }
  return saveLearningDna(emptyLearningDna(studentId, studentName || ""));
}

export function resetEicStoreForTests() {
  const root = rootDir();
  if (fs.existsSync(root)) fs.rmSync(root, { recursive: true, force: true });
  ensureDirs();
}
