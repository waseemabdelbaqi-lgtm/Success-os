#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "src/ai-teacher/teachers/sara.ts",
  "src/ai-teacher/teachers/ali.ts",
  "src/ai-teacher/config.ts",
  "src/ai-teacher/core/TeacherProfile.ts",
  "lib/human-teacher-engine/index.ts",
  "lib/human-teacher-engine/teach.ts",
  "lib/human-teacher-engine/studio-director.ts",
  "lib/human-teacher-engine/endurance.ts",
  "lib/human-teacher-engine/lip-performance.ts",
  "lib/human-teacher-engine/types.ts",
  "app/api/human-teacher-engine/route.ts",
  "scripts/_human_teacher_engine_runner.ts",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const runner = path.join(root, "scripts/_human_teacher_engine_runner.ts");
const result = spawnSync(process.execPath, ["--import", "tsx", runner], {
  cwd: root,
  encoding: "utf8",
});

if (result.status !== 0) {
  const npx = spawnSync("npx", ["--yes", "tsx", runner], {
    cwd: root,
    encoding: "utf8",
  });
  if (npx.status !== 0) {
    console.error(result.stderr || result.stdout);
    console.error(npx.stderr || npx.stdout);
    process.exit(1);
  }
  console.log(npx.stdout.trim());
} else {
  console.log(result.stdout.trim());
}

console.log("human-teacher-engine OK");
