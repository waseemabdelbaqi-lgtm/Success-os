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
  "mermaid_diagram",
  "interactive_chart",
  "table",
  "code",
  "timeline",
  "callout",
  "warning",
  "definition",
  "example",
  "accordion",
  "tabs",
  "embedded_media",
  "audio",
  "video_placeholder",
  "simulation_placeholder",
  "scene_3d",
  "pdf_document",
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
  "lib/interactive-lesson-engine/core/theme.ts",
  "lib/interactive-lesson-engine/core/i18n.ts",
  "lib/interactive-lesson-engine/core/versioning.ts",
  "lib/interactive-lesson-engine/core/hierarchy.ts",
  "lib/interactive-lesson-engine/core/performance.ts",
  "lib/interactive-lesson-engine/ai/integration-layer.ts",
  "lib/interactive-lesson-engine/adapters/formula-adapter.tsx",
  "lib/interactive-lesson-engine/adapters/diagram-adapter.tsx",
  "lib/interactive-lesson-engine/adapters/rich-text-adapter.tsx",
  "lib/interactive-lesson-engine/adapters/scene-3d-adapter.tsx",
  "lib/interactive-lesson-engine/adapters/pdf-adapter.tsx",
  "lib/interactive-lesson-engine/adapters/index.ts",
  "docs/cursor/ile-technology-selection.md",
  "docs/cursor/interactive-lesson-engine.md",
  "docs/cursor/learning-platform-roadmap.md",
  "docs/cursor/adr/ADR-0049-interactive-lesson-engine-single-runtime.md",
  "docs/cursor/adr/README.md",
  "docs/cursor/GLOBAL_PROGRESS_REVIEW_POLICY.md",
  "docs/cursor/reports/pr-49-completion-report.md",
  "content/demo/interactive-lesson-engine.ts",
  "components/interactive-lesson-engine/block-renderer.tsx",
  "components/interactive-lesson-engine/slide-engine.tsx",
  "components/interactive-lesson-engine/lesson-navigation.tsx",
  "components/interactive-lesson-engine/filters-bar.tsx",
  "components/interactive-lesson-engine/student-workspace-panel.tsx",
  "components/interactive-lesson-engine/interactive-lesson-viewer.tsx",
  "components/interactive-lesson-engine/admin-lesson-editor.tsx",
  "components/interactive-lesson-engine/library/index.tsx",
  "app/api/interactive-lesson-engine/route.js",
  "app/api/interactive-lesson-engine/placeholders/[capability]/route.js",
  "app/api/interactive-lesson-engine/ai/[capability]/route.ts",
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
assert.equal(BLOCK_TYPES.length, 27);
assert.equal(MODES.length, 5);

const techDoc = fs.readFileSync(
  path.join(root, "docs/cursor/ile-technology-selection.md"),
  "utf8",
);
assert.ok(techDoc.includes("KaTeX"));
assert.ok(techDoc.includes("Mermaid"));
assert.ok(techDoc.includes("TipTap"));
assert.ok(techDoc.includes("React Three Fiber"));
assert.ok(techDoc.includes("PDF.js"));

const masterDoc = fs.readFileSync(
  path.join(root, "docs/cursor/interactive-lesson-engine.md"),
  "utf8",
);
assert.ok(masterDoc.includes("Architecture"));
assert.ok(masterDoc.includes("Extension points"));
assert.ok(masterDoc.includes("mermaid"));

const roadmap = fs.readFileSync(
  path.join(root, "docs/cursor/learning-platform-roadmap.md"),
  "utf8",
);
assert.ok(roadmap.includes("PR #49"));
assert.ok(roadmap.includes("PR #50"));
assert.ok(roadmap.includes("Curriculum Import Engine"));
assert.ok(roadmap.includes("Single Lesson Runtime"));
assert.ok(roadmap.includes("ILE package"));
assert.ok(roadmap.includes("PR #60"));
assert.ok(roadmap.includes("Learning Intelligence"));
assert.ok(roadmap.includes("Production Optimization"));
assert.ok(roadmap.includes("ADR-0049"));

const adr = fs.readFileSync(
  path.join(root, "docs/cursor/adr/ADR-0049-interactive-lesson-engine-single-runtime.md"),
  "utf8",
);
assert.ok(adr.includes("ADR-0049"));
assert.ok(adr.includes("only lesson runtime"));
assert.ok(adr.includes("compiler") && adr.includes("not a renderer"));

const policy = fs.readFileSync(
  path.join(root, "docs/cursor/GLOBAL_PROGRESS_REVIEW_POLICY.md"),
  "utf8",
);
assert.ok(policy.includes("Definition of Done"));
assert.ok(policy.includes("Lint passes"));
assert.ok(policy.includes("Typecheck passes"));
assert.ok(policy.includes("Build passes"));
assert.ok(policy.includes("Completion report generated"));

const completion = fs.readFileSync(
  path.join(root, "docs/cursor/reports/pr-49-completion-report.md"),
  "utf8",
);
assert.ok(completion.includes("## 15. Definition of Done"));
assert.ok(completion.includes("ADR-0049"));

const theme = fs.readFileSync(
  path.join(root, "lib/interactive-lesson-engine/core/theme.ts"),
  "utf8",
);
assert.ok(theme.includes("success-light"));
assert.ok(theme.includes("themeToCssVars"));

const aiLayer = fs.readFileSync(
  path.join(root, "lib/interactive-lesson-engine/ai/integration-layer.ts"),
  "utf8",
);
assert.ok(aiLayer.includes("generationEnabled: false"));
assert.ok(aiLayer.includes("ai_teacher"));
assert.ok(aiLayer.includes("ai_video"));
assert.ok(aiLayer.includes("AI_GENERATION_DISABLED"));

const aiRoute = fs.readFileSync(
  path.join(root, "app/api/interactive-lesson-engine/ai/[capability]/route.ts"),
  "utf8",
);
assert.ok(aiRoute.includes("invokeAiCapability"));

const renderer = fs.readFileSync(
  path.join(root, "components/interactive-lesson-engine/block-renderer.tsx"),
  "utf8",
);
for (const t of ["table", "code", "timeline", "callout", "warning", "definition", "example", "accordion", "tabs"]) {
  assert.ok(renderer.includes(`"${t}"`) || renderer.includes(`'${t}'`) || renderer.includes(`=== "${t}"`), `renderer missing ${t}`);
}

const library = fs.readFileSync(
  path.join(root, "components/interactive-lesson-engine/library/index.tsx"),
  "utf8",
);
for (const name of [
  "FormulaViewer",
  "DiagramViewer",
  "ImageViewer",
  "InteractiveTable",
  "Timeline",
  "Accordion",
  "Tabs",
  "Callout",
  "WarningBlock",
  "DefinitionBlock",
  "ExampleBlock",
  "PracticeBlock",
  "MediaBlock",
]) {
  assert.ok(library.includes(`export function ${name}`), `library missing ${name}`);
}

const admin = fs.readFileSync(
  path.join(root, "components/interactive-lesson-engine/admin-lesson-editor.tsx"),
  "utf8",
);
assert.ok(admin.includes("draggable"));
assert.ok(admin.includes("Create book shell"));
assert.ok(admin.includes("listVersionHistory"));

const viewer = fs.readFileSync(
  path.join(root, "components/interactive-lesson-engine/interactive-lesson-viewer.tsx"),
  "utf8",
);
assert.ok(viewer.includes("themeToCssVars"));
assert.ok(viewer.includes("ILE_A11Y"));

const indexSrc = fs.readFileSync(path.join(root, "lib/interactive-lesson-engine/index.ts"), "utf8");
assert.ok(indexSrc.includes("master-foundation"));
assert.ok(indexSrc.includes("countrySpecificLogic: false"));

const pkgJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
for (const dep of ["katex", "mermaid", "@tiptap/react", "three", "@react-three/fiber", "pdfjs-dist"]) {
  assert.ok(pkgJson.dependencies?.[dep], `missing dependency ${dep}`);
}

console.log("interactive-lesson-engine.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      schema: "success-os.interactive-lesson-engine.v1",
      phase: "master-foundation",
      sections: SECTIONS,
      blockTypes: BLOCK_TYPES,
      learningModes: MODES,
      filesChecked: requiredFiles.length,
      curriculumIngestion: false,
      aiVideoGeneration: false,
      countrySpecificLogic: false,
    },
    null,
    2,
  ),
);
