#!/usr/bin/env node
/**
 * Interactive Lesson Engine foundation contract tests.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SECTIONS = [
  "Overview",
  "Learning Objectives",
  "Interactive Slides",
  "Concepts",
  "Images & Diagrams",
  "Animations",
  "3D / Simulation Placeholder",
  "Teacher Video Placeholder",
  "AI Explanation Panel",
  "Student Notes",
  "Attachments",
  "Practice Questions",
  "AI Chat",
  "Homework",
  "Lesson Summary",
  "Progress",
  "Next Lesson",
];

const BLOCK_TYPES = [
  "rich_text",
  "formula",
  "image",
  "svg_diagram",
  "interactive_chart",
  "embedded_media",
  "audio",
  "video_placeholder",
  "simulation_placeholder",
  "downloadable_resource",
  "notes",
  "ai_explanation",
  "quick_question",
  "internal_nav",
  "external_reference",
];

const MODES = ["reading", "presentation", "teacher", "student", "ai_tutor"];

const requiredFiles = [
  "types/interactive-lesson-engine.ts",
  "lib/interactive-lesson-engine/block-library.ts",
  "lib/interactive-lesson-engine/adapt-book-lesson.ts",
  "lib/interactive-lesson-engine/future-placeholders.ts",
  "lib/interactive-lesson-engine/workspace-store.ts",
  "lib/interactive-lesson-engine/index.ts",
  "content/demo/interactive-lesson-engine.ts",
  "components/interactive-lesson-engine/block-renderer.tsx",
  "components/interactive-lesson-engine/slide-engine.tsx",
  "components/interactive-lesson-engine/lesson-navigation.tsx",
  "components/interactive-lesson-engine/filters-bar.tsx",
  "components/interactive-lesson-engine/student-workspace-panel.tsx",
  "components/interactive-lesson-engine/interactive-lesson-viewer.tsx",
  "components/interactive-lesson-engine/admin-lesson-editor.tsx",
  "app/api/interactive-lesson-engine/route.js",
  "app/api/interactive-lesson-engine/placeholders/[capability]/route.js",
  "app/student/interactive-lessons/page.tsx",
  "app/admin/interactive-lessons/page.tsx",
  "app/student/books/[bookId]/units/[unitId]/lessons/[lessonId]/page.tsx",
];

for (const rel of requiredFiles) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const types = fs.readFileSync(path.join(root, "types/interactive-lesson-engine.ts"), "utf8");
assert.ok(types.includes("success-os.interactive-lesson-engine.v1"));
for (const id of [
  "overview",
  "learning_objectives",
  "interactive_slides",
  "concepts",
  "images_diagrams",
  "animations",
  "simulation_3d",
  "teacher_video",
  "ai_explanation",
  "student_notes",
  "attachments",
  "practice_questions",
  "ai_chat",
  "homework",
  "lesson_summary",
  "progress",
  "next_lesson",
]) {
  assert.ok(types.includes(`"${id}"`), `section missing ${id}`);
}
for (const t of BLOCK_TYPES) {
  assert.ok(types.includes(`"${t}"`), `block type missing ${t}`);
}
for (const m of MODES) {
  assert.ok(types.includes(`"${m}"`), `mode missing ${m}`);
}

const api = fs.readFileSync(path.join(root, "app/api/interactive-lesson-engine/route.js"), "utf8");
assert.ok(api.includes("PHASE_LOCKED") || api.includes("generate-ai-video"));
assert.ok(api.includes("import-curriculum"));

const bookPage = fs.readFileSync(
  path.join(root, "app/student/books/[bookId]/units/[unitId]/lessons/[lessonId]/page.tsx"),
  "utf8",
);
assert.ok(bookPage.includes("InteractiveLessonViewer"));
assert.ok(bookPage.includes("classic"));

const placeholders = fs.readFileSync(
  path.join(root, "lib/interactive-lesson-engine/future-placeholders.ts"),
  "utf8",
);
assert.ok(placeholders.includes("ai_teacher_video"));
assert.ok(placeholders.includes("virtual_labs"));
assert.ok(placeholders.includes("final_exams"));

assert.equal(SECTIONS.length, 17);
assert.equal(BLOCK_TYPES.length, 15);
assert.equal(MODES.length, 5);

console.log("interactive-lesson-engine.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      schema: "success-os.interactive-lesson-engine.v1",
      sections: SECTIONS,
      blockTypes: BLOCK_TYPES,
      learningModes: MODES,
      filesChecked: requiredFiles.length,
      curriculumIngestion: false,
      aiVideoGeneration: false,
    },
    null,
    2,
  ),
);
