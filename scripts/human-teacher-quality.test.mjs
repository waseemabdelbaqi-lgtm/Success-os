#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "src/ai-teacher/runtime/quality-gate.ts",
  "src/ai-teacher/runtime/bootstrap.ts",
  "src/ai-teacher/runtime/bootstrap-teacher.ts",
  "src/ai-teacher/runtime/measure-metrics.ts",
  "src/ai-teacher/runtime/final-acceptance-gate.ts",
  "src/ai-teacher/runtime/acceptance-runtime.ts",
  "src/ai-teacher/runtime/recovery-plan.ts",
  "src/lib/ai-teachers/recovery-engine.ts",
  "src/ai-teacher/runtime/HumanEngine.ts",
  "src/ai-teacher/runtime/index.ts",
  "src/ai-teacher/teachers/sara.ts",
  "src/ai-teacher/teachers/ali.ts",
  "app/api/ai-teachers/quality-gate/route.ts",
  "app/api/ai-teachers/final-acceptance/route.ts",
  "app/api/ai-teachers/human-engine/route.ts",
  "scripts/_human_teacher_quality_runner.ts",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const saraSrc = fs.readFileSync(path.join(root, "src/ai-teacher/teachers/sara.ts"), "utf8");
const aliSrc = fs.readFileSync(path.join(root, "src/ai-teacher/teachers/ali.ts"), "utf8");
assert.ok(saraSrc.includes("loadSaraMetrics"), "Sara.ts must export loadSaraMetrics");
assert.ok(aliSrc.includes("loadAliMetrics"), "Ali.ts must export loadAliMetrics");

const bootSrc = fs.readFileSync(
  path.join(root, "src/ai-teacher/runtime/bootstrap.ts"),
  "utf8",
);
assert.ok(bootSrc.includes("assertTeacherQuality"), "bootstrap must assert quality");
assert.ok(bootSrc.includes("startTeacherSession"), "bootstrap must export startTeacherSession");

const runner = path.join(root, "scripts/_human_teacher_quality_runner.ts");

function run(cmd, args) {
  return spawnSync(cmd, args, { cwd: root, encoding: "utf8" });
}

let result = run(process.execPath, ["--import", "tsx", runner]);
let out = `${result.stdout || ""}\n${result.stderr || ""}`;

// Fall back when tsx loader is missing (not when the gate itself exits 1).
if (
  out.includes("ERR_MODULE_NOT_FOUND") ||
  out.includes("Cannot find package 'tsx'") ||
  (result.status !== 0 && result.status !== 1)
) {
  result = run("npx", ["--yes", "tsx", runner]);
  out = `${result.stdout || ""}\n${result.stderr || ""}`;
}

console.log(out.trim());

const gateWorked =
  out.includes("HUMAN TEACHER") ||
  out.includes("BLOCKED by quality gate") ||
  out.includes("human-teacher-quality OK") ||
  out.includes("QUALITY GATE FAILED") ||
  out.includes("recovery plan:");

if (!gateWorked) {
  console.error("Quality gate runner did not produce expected output");
  process.exit(1);
}

// 0 = both teachers PASS (future); 1 = honestly blocked (expected today)
if (result.status !== 0 && result.status !== 1) {
  process.exit(1);
}

console.log("human-teacher-quality gate machinery OK");
