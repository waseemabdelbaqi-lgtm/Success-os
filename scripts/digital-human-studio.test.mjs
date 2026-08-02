#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "types/digital-human-studio.ts",
  "lib/digital-human-studio/index.ts",
  "lib/digital-human-studio/analyze-lesson.ts",
  "lib/digital-human-studio/cast-teacher.ts",
  "lib/digital-human-studio/plan-scenes.ts",
  "lib/digital-human-studio/behavior-director.ts",
  "lib/digital-human-studio/runtime.ts",
  "lib/digital-human-studio/adapt.ts",
  "app/api/digital-human-studio/route.ts",
  "app/ai-teacher/studio/page.tsx",
  "components/ai-teachers/digital-human-studio.tsx",
  "components/ai-teachers/teaching-studio-3d.tsx",
  "components/ai-teachers/studio-lesson-launcher.tsx",
  "lib/digital-human-studio/performance-generator.ts",
  "docs/cursor/digital-human-studio.md",
  "scripts/_dhs_runtime_runner.ts",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const runner = path.join(root, "scripts/_dhs_runtime_runner.ts");
const result = spawnSync(
  process.execPath,
  ["--import", "tsx", runner],
  { cwd: root, encoding: "utf8" },
);

if (result.status !== 0) {
  // fallback npx tsx
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

console.log("digital-human-studio OK");
