#!/usr/bin/env node
/**
 * Student AI Learning Stack contract tests (PR #59 foundation).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "types/student-ai-learning-stack.ts",
  "lib/student-ai-learning-stack/index.ts",
  "lib/student-ai-learning-stack/layers.ts",
  "lib/student-ai-learning-stack/orchestrator.ts",
  "app/api/student-ai-learning-stack/route.ts",
  "app/admin/student-ai-learning-stack/page.tsx",
  "components/student-ai-learning-stack/stack-dashboard.tsx",
  "content/demo/generated/student-ai-learning-stack.example.json",
  "content/demo/generated/student-learning-session-plan.example.json",
  "content/demo/generated/s4s-intelligence-teacher-greeting.example.json",
  "lib/student-ai-learning-stack/s4s-intelligence-teacher.ts",
  "components/student-ai-learning-stack/s4s-intelligence-teacher.tsx",
  "docs/cursor/student-ai-learning-stack.md",
  "docs/cursor/adr/ADR-0059-student-ai-learning-stack.md",
  "docs/cursor/reports/pr-59-completion-report.md",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const expectedPath = [
  "Student",
  "S4S Intelligence Teacher",
  "Conversation Engine",
  "Reasoning Engine",
  "Knowledge Graph",
  "Digital Books",
  "Videos",
  "Interactive Lesson Engine",
  "Quizzes",
  "Assessments",
];

const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/student-ai-learning-stack.example.json"),
    "utf8",
  ),
);
assert.equal(snap.schema, "success-os.student-ai-learning-stack.v1");
assert.deepEqual(snap.displayPath, expectedPath);
assert.equal(snap.layers.length, 10);
assert.equal(snap.aiGeneration, false);
assert.ok(snap.layers.every((l) => l.generatesContent === false));

const byId = Object.fromEntries(snap.layers.map((l) => [l.id, l]));
assert.equal(byId.student.status, "operational");
assert.equal(byId.interactive_lesson_engine.status, "operational");
assert.equal(byId.knowledge_graph.status, "foundation");
assert.equal(byId.ai_teacher.status, "foundation");
assert.ok(byId.ai_teacher.name.en.includes("S4S Intelligence Teacher"));
assert.equal(byId.conversation_engine.status, "stub");
assert.equal(byId.reasoning_engine.status, "stub");
assert.equal(byId.digital_books.status, "reserved");
assert.equal(byId.videos.status, "reserved");
assert.equal(byId.quizzes.status, "reserved");
assert.equal(byId.assessments.status, "reserved");
assert.equal(byId.interactive_lesson_engine.rendersLessons, true);

const plan = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/student-learning-session-plan.example.json"),
    "utf8",
  ),
);
assert.equal(plan.schema, "success-os.student-learning-session-plan.v1");
assert.equal(plan.aiContentGenerated, false);
assert.equal(plan.invocations.length, 10);
assert.ok(plan.ilePackageId);
assert.ok(plan.ilePackageId.startsWith("ile_"));
assert.deepEqual(plan.path, [
  "student",
  "ai_teacher",
  "conversation_engine",
  "reasoning_engine",
  "knowledge_graph",
  "digital_books",
  "videos",
  "interactive_lesson_engine",
  "quizzes",
  "assessments",
]);
assert.equal(plan.quizPlanId, null);
assert.equal(plan.assessmentPlanId, null);
assert.deepEqual(plan.videoIds, []);
assert.deepEqual(plan.digitalBookIds, []);

const orch = fs.readFileSync(
  path.join(root, "lib/student-ai-learning-stack/orchestrator.ts"),
  "utf8",
);
assert.ok(orch.includes("runStudentLearningStack"));
assert.ok(!orch.includes("generateLessonContent"));
assert.ok(!orch.includes("generateQuiz"));
assert.ok(!orch.includes("generateVideo"));

const api = fs.readFileSync(
  path.join(root, "app/api/student-ai-learning-stack/route.ts"),
  "utf8",
);
for (const action of ["status", "snapshot", "plan", "demo", "greeting", "run-stack"]) {
  assert.ok(api.includes(action), `api missing ${action}`);
}

const greeting = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/s4s-intelligence-teacher-greeting.example.json"),
    "utf8",
  ),
);
assert.deepEqual(greeting.flow, [
  "Student",
  "Open Lesson",
  "S4S Intelligence Teacher appears",
]);
assert.equal(
  greeting.greeting.displayEn,
  [
    "Hello Ahmad,",
    "Last time you struggled with Fractions.",
    "Would you like me to review them first?",
  ].join("\n"),
);
assert.ok(greeting.greeting.displayAr.includes("الكسور"));
assert.equal(greeting.greeting.struggleSkillId, "SKL-00002");

const lessonPage = fs.readFileSync(
  path.join(
    root,
    "app/student/books/[bookId]/units/[unitId]/lessons/[lessonId]/page.tsx",
  ),
  "utf8",
);
assert.ok(lessonPage.includes("S4sIntelligenceTeacher"));
assert.ok(lessonPage.includes('studentName="Ahmad"'));

const aiTeacherOut = plan.invocations.find((i) => i.layerId === "ai_teacher");
assert.ok(aiTeacherOut);
assert.ok(aiTeacherOut.output.greeting.displayEn.includes("Fractions"));

const roadmap = fs.readFileSync(
  path.join(root, "docs/cursor/learning-platform-roadmap.md"),
  "utf8",
);
assert.ok(roadmap.includes("Student AI Learning Stack") || roadmap.includes("PR #59"));

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
assert.equal(
  pkg.scripts["validate:student-ai-learning-stack"],
  "node scripts/student-ai-learning-stack.test.mjs",
);

console.log("student-ai-learning-stack.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      schema: snap.schema,
      path: snap.displayPath,
      ilePackageId: plan.ilePackageId,
      aiContentGenerated: plan.aiContentGenerated,
      counts: snap.counts,
    },
    null,
    2,
  ),
);
