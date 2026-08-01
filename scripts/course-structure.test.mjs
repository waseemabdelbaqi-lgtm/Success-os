#!/usr/bin/env node
/**
 * Course → Unit → Lesson hierarchy contract + file presence tests.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const LESSON_BLOCK_ORDER = [
  "interactive_slides",
  "teacher_video",
  "ai_explanation",
  "simulation_3d",
  "notes",
  "attachments",
  "interactive_questions",
  "ai_chat",
  "homework",
  "quiz",
  "progress",
];

const LESSON_BLOCK_LABELS = [
  "Interactive Slides",
  "Teacher Video",
  "AI Explanation",
  "3D Simulation",
  "Notes",
  "Attachments",
  "Interactive Questions",
  "AI Chat",
  "Homework",
  "Quiz",
  "Progress",
];

assert.equal(LESSON_BLOCK_ORDER.length, 11);
assert.equal(LESSON_BLOCK_LABELS.length, 11);

const requiredFiles = [
  "types/course-structure.ts",
  "content/demo/course-structure.ts",
  "services/student/course-structure.service.ts",
  "services/student/course-lesson-progress.service.ts",
  "components/student-portal/courses/lesson-workspace.tsx",
  "app/student/courses/page.tsx",
  "app/student/courses/[courseId]/page.tsx",
  "app/student/courses/[courseId]/units/[unitId]/lessons/[lessonId]/page.tsx",
  "app/api/course-structure/route.js",
];

for (const rel of requiredFiles) {
  const full = path.join(root, rel);
  assert.ok(fs.existsSync(full), `missing ${rel}`);
}

const typesSrc = fs.readFileSync(path.join(root, "types/course-structure.ts"), "utf8");
for (const id of LESSON_BLOCK_ORDER) {
  assert.ok(typesSrc.includes(`"${id}"`) || typesSrc.includes(`'${id}'`), `types missing ${id}`);
}

const demoSrc = fs.readFileSync(path.join(root, "content/demo/course-structure.ts"), "utf8");
assert.ok(demoSrc.includes("success-os.course-structure.v1"));
assert.ok(demoSrc.includes("interactiveSlides"));
assert.ok(demoSrc.includes("teacherVideo"));
assert.ok(demoSrc.includes("aiExplanation"));
assert.ok(demoSrc.includes("simulation3d"));
assert.ok(demoSrc.includes("interactiveQuestions"));
assert.ok(demoSrc.includes("aiChat"));
assert.ok(demoSrc.includes("homework"));
assert.ok(demoSrc.includes("quiz"));
assert.ok(demoSrc.includes("progress"));

const workspaceSrc = fs.readFileSync(
  path.join(root, "components/student-portal/courses/lesson-workspace.tsx"),
  "utf8",
);
for (const id of LESSON_BLOCK_ORDER) {
  assert.ok(workspaceSrc.includes(`"${id}"`) || workspaceSrc.includes(`'${id}'`), `workspace missing ${id}`);
}

console.log("course-structure.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      hierarchy: "Course → Unit → Lesson",
      lessonBlocks: LESSON_BLOCK_LABELS,
      blockIds: LESSON_BLOCK_ORDER,
      filesChecked: requiredFiles.length,
    },
    null,
    2,
  ),
);
