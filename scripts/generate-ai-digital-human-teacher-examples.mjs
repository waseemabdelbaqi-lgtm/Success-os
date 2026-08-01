#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "scripts/_adht_generate_runner.ts");

fs.writeFileSync(
  runner,
  `
import fs from "node:fs";
import path from "node:path";
import {
  resetTeacherProfilesForTests,
  runAiDigitalHumanTeacherDemo,
} from "../lib/ai-digital-human-teacher/index.ts";

const outDir = path.resolve("content/demo/generated");
resetTeacherProfilesForTests();
const demo = runAiDigitalHumanTeacherDemo({
  studentId: "student_demo_001",
  studentName: "Ahmad",
  countryCode: "JO",
  educationalStage: "elementary",
});
fs.writeFileSync(
  path.join(outDir, "ai-digital-human-teacher.example.json"),
  JSON.stringify(demo.snapshot, null, 2) + "\\n",
);
fs.writeFileSync(
  path.join(outDir, "adht-session-plan.example.json"),
  JSON.stringify(demo.plan, null, 2) + "\\n",
);
console.log("ADHT examples written", { ok: demo.ok, profile: demo.plan.teacherProfileId });
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
