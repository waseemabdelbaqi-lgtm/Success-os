#!/usr/bin/env node
/**
 * Education Intelligence Core contract + runtime tests.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "types/education-intelligence-core.ts",
  "lib/education-intelligence-core/index.ts",
  "lib/education-intelligence-core/engine.ts",
  "lib/education-intelligence-core/dna-store.ts",
  "lib/education-intelligence-core/understanding.ts",
  "lib/education-intelligence-core/adaptation.ts",
  "lib/education-intelligence-core/predictions.ts",
  "lib/education-intelligence-core/insights.ts",
  "app/api/education-intelligence-core/route.ts",
  "app/admin/education-intelligence-core/page.tsx",
  "components/education-intelligence-core/eic-dashboard.tsx",
  "content/demo/generated/education-intelligence-core.example.json",
  "content/demo/generated/eic-interaction-result.example.json",
  "content/demo/generated/learning-dna.example.json",
  "docs/cursor/education-intelligence-core.md",
  "docs/cursor/adr/ADR-0055.2-education-intelligence-core.md",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/education-intelligence-core.example.json"),
    "utf8",
  ),
);
assert.equal(snap.schema, "success-os.education-intelligence-core.v1");
assert.equal(snap.thinksLikeExperiencedTeacher, true);
assert.equal(snap.notAChatbot, true);
assert.equal(snap.learningDnaFields.length, 18);
assert.equal(snap.explanationNovelty, true);
assert.equal(snap.lifelongProfile, true);
assert.equal(snap.safety.neverInventCurriculumFacts, true);

const result = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/eic-interaction-result.example.json"),
    "utf8",
  ),
);
assert.equal(result.schema, "success-os.eic-interaction-result.v1");
assert.equal(result.dnaUpdated, true);
assert.equal(result.nothingForgotten, true);
assert.equal(result.inventsCurriculumFacts, false);
assert.equal(result.strategy.isNovelExplanation, true);
assert.ok(result.insight);
assert.ok(result.insight.text.en.toLowerCase().includes("noticed") || result.insight.text.en.includes("prerequisite") || result.insight.text.en.includes("struggle"));
assert.ok(result.dna.usedExplanationFingerprints.length >= 2);

const dna = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/learning-dna.example.json"),
    "utf8",
  ),
);
assert.equal(dna.schema, "success-os.learning-dna.v1");
assert.ok(dna.interactionCount >= 2);

const orch = fs.readFileSync(
  path.join(root, "lib/ai-teacher-engine/orchestrator.ts"),
  "utf8",
);
assert.ok(orch.includes("processEducationalInteraction"));

const api = fs.readFileSync(
  path.join(root, "app/api/education-intelligence-core/route.ts"),
  "utf8",
);
for (const action of ["status", "snapshot", "demo", "dna", "interact"]) {
  assert.ok(api.includes(action), `api missing ${action}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
assert.ok(pkg.scripts["validate:education-intelligence-core"]);

const runner = path.join(root, "scripts/_eic_runtime_runner.ts");
fs.writeFileSync(
  runner,
  `
import assert from "node:assert/strict";
import {
  processEducationalInteraction,
  resetEicStoreForTests,
  runEducationIntelligenceDemo,
} from "../lib/education-intelligence-core/index.ts";

resetEicStoreForTests();
const demo = runEducationIntelligenceDemo();
assert.equal(demo.ok, true);
assert.ok(demo.result.insight);

// Novelty across three struggling turns
resetEicStoreForTests();
const a = processEducationalInteraction({
  studentId: "stu_novel",
  utterance: "I don't understand this.",
  focusLessonId: "L1",
  focusConceptLabel: { en: "fractions", ar: "كسور" },
  prerequisiteSkillId: "SKL-A",
  weakSkillIds: ["SKL-A"],
});
const b = processEducationalInteraction({
  studentId: "stu_novel",
  utterance: "I still don't understand.",
  focusLessonId: "L1",
  focusConceptLabel: { en: "fractions", ar: "كسور" },
  prerequisiteSkillId: "SKL-A",
  weakSkillIds: ["SKL-A"],
});
const c = processEducationalInteraction({
  studentId: "stu_novel",
  utterance: "Explain differently.",
  focusLessonId: "L1",
  focusConceptLabel: { en: "fractions", ar: "كسور" },
  prerequisiteSkillId: "SKL-A",
  weakSkillIds: ["SKL-A"],
});
assert.notEqual(a.strategy.explanationFingerprint, b.strategy.explanationFingerprint);
assert.notEqual(b.strategy.explanationFingerprint, c.strategy.explanationFingerprint);
assert.equal(c.dna.usedExplanationFingerprints.length, 3);

console.log("EIC runtime OK", {
  insight: demo.result.insight?.kind,
  fingerprints: c.dna.usedExplanationFingerprints.length,
});
`,
);

const runtime = spawnSync("npx", ["--yes", "tsx", runner], {
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
assert.equal(runtime.status, 0, "EIC runtime failed");

console.log("education-intelligence-core.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      schema: snap.schema,
      dnaFields: snap.learningDnaFields.length,
      insightKind: result.insight?.kind,
      mode: result.strategy.mode,
    },
    null,
    2,
  ),
);
