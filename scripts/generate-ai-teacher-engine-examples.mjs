#!/usr/bin/env node
/**
 * Generate ATE example JSON fixtures via tsx (dev helper).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "content/demo/generated");
const runner = path.join(root, "scripts/_ate_generate_runner.ts");

fs.writeFileSync(
  runner,
  `
import fs from "node:fs";
import path from "node:path";
import {
  getAiTeacherEngineSnapshot,
  getOrCreateStudentMemory,
  resetStudentMemoryStore,
  runAiTeacherEngineDemo,
} from "../lib/ai-teacher-engine/index.ts";

const outDir = path.resolve("content/demo/generated");
resetStudentMemoryStore();
const demo = runAiTeacherEngineDemo({
  studentId: "student_demo_001",
  studentName: "Ahmad",
  utterance: "I don't understand this.",
});
const snapshot = {
  ...demo.snapshot,
  aiGeneration: false,
  avatars: false,
  animations: false,
  aiVideos: false,
  liveClassrooms: false,
};
const turn = demo.turn;
const memory = getOrCreateStudentMemory("student_demo_001");

fs.writeFileSync(
  path.join(outDir, "ai-teacher-engine.example.json"),
  JSON.stringify(snapshot, null, 2) + "\\n",
);
fs.writeFileSync(
  path.join(outDir, "ate-teaching-turn.example.json"),
  JSON.stringify(turn, null, 2) + "\\n",
);
fs.writeFileSync(
  path.join(outDir, "ate-student-memory.example.json"),
  JSON.stringify(memory, null, 2) + "\\n",
);
console.log("ATE examples written", {
  ok: demo.ok,
  layers: snapshot.layers.length,
  intent: turn.intent,
});
`,
);

const result = spawnSync(
  "npx",
  ["--yes", "tsx", runner],
  { cwd: root, encoding: "utf8", stdio: "inherit" },
);

try {
  fs.unlinkSync(runner);
} catch {
  // ignore
}

process.exit(result.status ?? 1);
