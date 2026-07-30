#!/usr/bin/env node
/**
 * AI Teacher Engine contract tests (PR #55).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "types/ai-teacher-engine.ts",
  "types/permissions.ts",
  "lib/ai-teacher-engine/index.ts",
  "lib/ai-teacher-engine/layers.ts",
  "lib/ai-teacher-engine/capabilities.ts",
  "lib/ai-teacher-engine/conversation.ts",
  "lib/ai-teacher-engine/reasoning.ts",
  "lib/ai-teacher-engine/memory.ts",
  "lib/ai-teacher-engine/store.ts",
  "lib/ai-teacher-engine/validation.ts",
  "lib/ai-teacher-engine/auth-guard.ts",
  "lib/ai-teacher-engine/grounding.ts",
  "lib/ai-teacher-engine/voice.ts",
  "lib/ai-teacher-engine/whiteboard.ts",
  "lib/ai-teacher-engine/permissions.ts",
  "lib/ai-teacher-engine/orchestrator.ts",
  "app/api/ai-teacher-engine/route.ts",
  "app/admin/ai-teacher-engine/page.tsx",
  "components/ai-teacher-engine/ate-dashboard.tsx",
  "content/demo/generated/ai-teacher-engine.example.json",
  "content/demo/generated/ate-teaching-turn.example.json",
  "content/demo/generated/ate-student-memory.example.json",
  "docs/cursor/ai-teacher-engine.md",
  "docs/cursor/adr/ADR-0055-ai-teacher-engine.md",
  "docs/cursor/reports/pr-55-completion-report.md",
  "scripts/ai-teacher-engine.integration.test.mjs",
  "scripts/ai-teacher-engine.e2e.test.mjs",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const expectedPath = [
  "Student",
  "AI Teacher",
  "Conversation Engine",
  "Reasoning Engine",
  "Student Memory",
  "Knowledge Graph",
  "Curriculum Registry",
  "Interactive Lesson Engine",
  "Digital Books",
  "Videos",
  "Assessments",
];

const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/ai-teacher-engine.example.json"),
    "utf8",
  ),
);
assert.equal(snap.schema, "success-os.ai-teacher-engine.v1");
assert.deepEqual(snap.displayPath, expectedPath);
assert.equal(snap.layers.length, 11);
assert.equal(snap.aiGeneration, false);
assert.equal(snap.avatars, false);
assert.ok(snap.layers.every((l) => l.generatesContent === false));
assert.equal(snap.safety.neverInventCurriculumFacts, true);
assert.equal(snap.voice.implementationStatus, "ready_architecture");
assert.equal(snap.whiteboard.implementationStatus, "ready_architecture");
assert.ok(snap.capabilities.length >= 15);

const byId = Object.fromEntries(snap.layers.map((l) => [l.id, l]));
assert.equal(byId.student_memory.status, "operational");
assert.equal(byId.curriculum_registry.status, "foundation");
assert.equal(byId.digital_books.activatesInPr, "#56");

const turn = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/ate-teaching-turn.example.json"),
    "utf8",
  ),
);
assert.equal(turn.schema, "success-os.ate-teaching-turn.v1");
assert.equal(turn.aiContentGenerated, false);
assert.equal(turn.invocations.length, 11);
assert.equal(turn.intent, "dont_understand");
assert.equal(turn.teacherReply.inventsCurriculumFacts, false);

const memorySrc = fs.readFileSync(
  path.join(root, "lib/ai-teacher-engine/memory.ts"),
  "utf8",
);
assert.ok(!memorySrc.includes("JO-NATIONAL"));
assert.ok(!memorySrc.includes("Ahmad"));
assert.ok(!memorySrc.includes("SKL-00002"));
assert.ok(memorySrc.includes("saveStudentMemory") || memorySrc.includes("loadStudentMemory"));

const orch = fs.readFileSync(
  path.join(root, "lib/ai-teacher-engine/orchestrator.ts"),
  "utf8",
);
assert.ok(orch.includes("demoMode"));
assert.ok(orch.includes("requireProductionContext"));
assert.ok(!orch.includes("generateLessonContent"));

const api = fs.readFileSync(
  path.join(root, "app/api/ai-teacher-engine/route.ts"),
  "utf8",
);
assert.ok(api.includes("withApiHandler"));
assert.ok(api.includes("ateTurnRequestSchema"));
assert.ok(api.includes("requireAtePermission"));
for (const action of [
  "status",
  "snapshot",
  "demo",
  "chat",
  "memory",
  "recommend",
  "permissions",
  "voice",
  "whiteboard",
  "metrics",
]) {
  assert.ok(api.includes(action), `api missing ${action}`);
}

const perms = fs.readFileSync(path.join(root, "types/permissions.ts"), "utf8");
assert.ok(perms.includes('ATE_SESSION_CHAT: "ate:session:chat"'));
assert.ok(perms.includes("ATE_MEMORY_WRITE"));

const roadmap = fs.readFileSync(
  path.join(root, "docs/cursor/learning-platform-roadmap.md"),
  "utf8",
);
assert.ok(roadmap.includes("AI Teacher Engine"));
assert.ok(roadmap.includes("PR #55"));

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
assert.ok(pkg.scripts["validate:ai-teacher-engine"].includes("ai-teacher-engine.test.mjs"));
assert.ok(
  pkg.scripts["validate:ai-teacher-engine"].includes(
    "ai-teacher-engine.integration.test.mjs",
  ),
);
assert.ok(
  pkg.scripts["validate:ai-teacher-engine"].includes("ai-teacher-engine.e2e.test.mjs"),
);

console.log("ai-teacher-engine.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      schema: snap.schema,
      path: snap.displayPath,
      intent: turn.intent,
      aiContentGenerated: turn.aiContentGenerated,
      counts: snap.counts,
    },
    null,
    2,
  ),
);
