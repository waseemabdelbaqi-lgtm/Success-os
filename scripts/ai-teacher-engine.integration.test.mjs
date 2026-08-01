#!/usr/bin/env node
/**
 * ATE integration tests — production path constraints + durable memory.
 * Runs via tsx against TypeScript modules (no Next server).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "scripts/_ate_integration_runner.ts");

fs.writeFileSync(
  runner,
  `
import assert from "node:assert/strict";
import {
  clearStudentMemory,
  getOrCreateStudentMemory,
  resetAteStoreForTests,
  runAiTeacherTurn,
  upsertStudentMemory,
  loadTeachingTurn,
  ateTurnRequestSchema,
} from "../lib/ai-teacher-engine/index.ts";

resetAteStoreForTests();

// 1) Production path rejects missing country/curriculum/focus
let threw = false;
try {
  runAiTeacherTurn({
    studentId: "stu_prod_1",
    utterance: "Help me",
  });
} catch {
  threw = true;
}
assert.equal(threw, true, "production turn must require context");

// 2) Production path accepts non-Jordan IDs without JO defaults in memory
const turn = runAiTeacherTurn({
  studentId: "stu_prod_eg",
  studentName: "Nour",
  countryId: "EG",
  curriculumId: "EG-NATIONAL",
  gradeId: "GRD-00999",
  subjectGlobalId: "SUB-00099",
  focusLessonId: "EG-NATIONAL-G05-SCI-B01-U02-L03",
  language: "en",
  utterance: "Explain again",
  demoMode: false,
});
assert.equal(turn.memory.currentCurriculumId, "EG-NATIONAL");
assert.equal(turn.ilePackageId, "ile_EG-NATIONAL-G05-SCI-B01-U02-L03");
assert.equal(turn.intent, "explain_again");
assert.equal(turn.aiContentGenerated, false);
assert.equal(turn.teacherReply.inventsCurriculumFacts, false);
assert.ok(!JSON.stringify(turn.memory).includes("JO-NATIONAL"));
assert.ok(!turn.memory.studentName.includes("Ahmad"));

const loaded = loadTeachingTurn(turn.sessionId);
assert.ok(loaded);
assert.equal(loaded.sessionId, turn.sessionId);

// 3) Durable memory round-trip
upsertStudentMemory({
  studentId: "stu_prod_eg",
  weakSkillIds: ["SKL-CUSTOM-1"],
  learningGoals: ["Finish unit 2"],
});
const mem = getOrCreateStudentMemory("stu_prod_eg");
assert.deepEqual(mem.weakSkillIds, ["SKL-CUSTOM-1"]);
assert.ok(mem.conversationHistory.length >= 2);

// 4) Zod rejects incomplete production payload
const bad = ateTurnRequestSchema.safeParse({ studentId: "x", utterance: "hi" });
assert.equal(bad.success, false);

clearStudentMemory("stu_prod_eg");
console.log("ATE integration OK", {
  sessionId: turn.sessionId,
  curriculumId: turn.memory.currentCurriculumId,
});
`,
);

const result = spawnSync("npx", ["--yes", "tsx", runner], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, ATE_DEV_OPEN: "1" },
  stdio: "inherit",
});

try {
  fs.unlinkSync(runner);
} catch {
  // ignore
}

process.exit(result.status ?? 1);
