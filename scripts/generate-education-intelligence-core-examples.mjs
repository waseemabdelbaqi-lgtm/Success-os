#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "scripts/_eic_generate_runner.ts");

fs.writeFileSync(
  runner,
  `
import fs from "node:fs";
import path from "node:path";
import {
  resetEicStoreForTests,
  runEducationIntelligenceDemo,
} from "../lib/education-intelligence-core/index.ts";

const outDir = path.resolve("content/demo/generated");
resetEicStoreForTests();
const demo = runEducationIntelligenceDemo({
  studentId: "student_demo_eic_001",
  studentName: "Ahmad",
});
fs.writeFileSync(
  path.join(outDir, "education-intelligence-core.example.json"),
  JSON.stringify(demo.snapshot, null, 2) + "\\n",
);
fs.writeFileSync(
  path.join(outDir, "eic-interaction-result.example.json"),
  JSON.stringify(demo.result, null, 2) + "\\n",
);
fs.writeFileSync(
  path.join(outDir, "learning-dna.example.json"),
  JSON.stringify(demo.result.dna, null, 2) + "\\n",
);
console.log("EIC examples written", {
  ok: demo.ok,
  insight: demo.result.insight?.kind,
  mode: demo.result.strategy.mode,
});
`,
);

const result = spawnSync("npx", ["--yes", "tsx", runner], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
});
try {
  fs.unlinkSync(runner);
} catch {
  // ignore
}
process.exit(result.status ?? 1);
