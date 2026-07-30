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
  "lib/ai-teacher-engine/index.ts",
  "lib/ai-teacher-engine/layers.ts",
  "lib/ai-teacher-engine/capabilities.ts",
  "lib/ai-teacher-engine/conversation.ts",
  "lib/ai-teacher-engine/reasoning.ts",
  "lib/ai-teacher-engine/memory.ts",
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
assert.equal(snap.animations, false);
assert.equal(snap.aiVideos, false);
assert.equal(snap.liveClassrooms, false);
assert.ok(snap.layers.every((l) => l.generatesContent === false));
assert.equal(snap.safety.neverInventCurriculumFacts, true);
assert.equal(snap.voice.implementationStatus, "ready_architecture");
assert.equal(snap.whiteboard.implementationStatus, "ready_architecture");
assert.ok(snap.voice.interruptible);
assert.ok(snap.whiteboard.canDrawDiagrams);
assert.ok(snap.capabilities.length >= 15);
assert.ok(snap.studentControls.includes("dont_understand"));
assert.ok(snap.studentControls.includes("teach_slowly"));
assert.ok(snap.multimodalKinds.includes("text"));
assert.ok(snap.multimodalKinds.includes("handwritten_solution"));
assert.ok(snap.multimodalKinds.includes("video_conversation"));

const byId = Object.fromEntries(snap.layers.map((l) => [l.id, l]));
assert.equal(byId.student.status, "operational");
assert.equal(byId.ai_teacher.status, "operational");
assert.equal(byId.conversation_engine.status, "operational");
assert.equal(byId.reasoning_engine.status, "operational");
assert.equal(byId.student_memory.status, "operational");
assert.equal(byId.knowledge_graph.status, "foundation");
assert.equal(byId.curriculum_registry.status, "foundation");
assert.equal(byId.interactive_lesson_engine.status, "operational");
assert.equal(byId.digital_books.status, "reserved");
assert.equal(byId.videos.status, "reserved");
assert.equal(byId.assessments.status, "reserved");
assert.equal(byId.interactive_lesson_engine.rendersLessons, true);
assert.equal(byId.digital_books.activatesInPr, "#56");
assert.equal(byId.videos.activatesInPr, "#57");
assert.equal(byId.assessments.activatesInPr, "#58");

const turn = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/ate-teaching-turn.example.json"),
    "utf8",
  ),
);
assert.equal(turn.schema, "success-os.ate-teaching-turn.v1");
assert.equal(turn.aiContentGenerated, false);
assert.equal(turn.avatarsBuilt, false);
assert.equal(turn.animationsBuilt, false);
assert.equal(turn.aiVideosBuilt, false);
assert.equal(turn.liveClassroomBuilt, false);
assert.equal(turn.invocations.length, 11);
assert.equal(turn.intent, "dont_understand");
assert.ok(turn.ilePackageId);
assert.ok(turn.ilePackageId.startsWith("ile_"));
assert.equal(turn.teacherReply.inventsCurriculumFacts, false);
assert.ok(turn.teacherReply.citations.length >= 1);
assert.ok(turn.teacherReply.text.en.includes("No problem"));
assert.ok(turn.memory.schema === "success-os.student-memory.v1");
assert.ok(turn.recommendations.some((r) => r.kind === "lesson"));
assert.deepEqual(turn.path, [
  "student",
  "ai_teacher",
  "conversation_engine",
  "reasoning_engine",
  "student_memory",
  "knowledge_graph",
  "curriculum_registry",
  "interactive_lesson_engine",
  "digital_books",
  "videos",
  "assessments",
]);

const memory = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/ate-student-memory.example.json"),
    "utf8",
  ),
);
assert.equal(memory.schema, "success-os.student-memory.v1");
assert.ok(memory.studentName);
assert.ok(Array.isArray(memory.weakSkillIds));
assert.ok(Array.isArray(memory.conversationHistory));
assert.ok(memory.learningPace);
assert.ok(memory.learningStyle);

const orch = fs.readFileSync(
  path.join(root, "lib/ai-teacher-engine/orchestrator.ts"),
  "utf8",
);
assert.ok(orch.includes("runAiTeacherTurn"));
assert.ok(!orch.includes("generateLessonContent"));
assert.ok(!orch.includes("generateVideo"));
assert.ok(!orch.includes("buildAvatar"));

const api = fs.readFileSync(
  path.join(root, "app/api/ai-teacher-engine/route.ts"),
  "utf8",
);
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
]) {
  assert.ok(api.includes(action), `api missing ${action}`);
}

const grounding = fs.readFileSync(
  path.join(root, "lib/ai-teacher-engine/grounding.ts"),
  "utf8",
);
assert.ok(grounding.includes("Never invent curriculum facts"));
assert.ok(grounding.includes("inventsCurriculumFacts: false"));

const roadmap = fs.readFileSync(
  path.join(root, "docs/cursor/learning-platform-roadmap.md"),
  "utf8",
);
assert.ok(roadmap.includes("AI Teacher Engine"));
assert.ok(roadmap.includes("PR #55"));
assert.ok(roadmap.includes("Digital Book Engine"));
assert.ok(roadmap.includes("Learning Intelligence"));

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
assert.equal(
  pkg.scripts["validate:ai-teacher-engine"],
  "node scripts/ai-teacher-engine.test.mjs",
);

console.log("ai-teacher-engine.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      schema: snap.schema,
      path: snap.displayPath,
      ilePackageId: turn.ilePackageId,
      intent: turn.intent,
      aiContentGenerated: turn.aiContentGenerated,
      counts: snap.counts,
    },
    null,
    2,
  ),
);
