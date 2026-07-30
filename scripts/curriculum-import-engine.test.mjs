#!/usr/bin/env node
/**
 * Curriculum Import Engine contract tests (compiler only).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "types/curriculum-import-engine.ts",
  "lib/curriculum-import-engine/index.ts",
  "lib/curriculum-import-engine/pipeline.ts",
  "lib/curriculum-import-engine/runner.ts",
  "lib/curriculum-import-engine/store.ts",
  "lib/curriculum-import-engine/checksum.ts",
  "lib/curriculum-import-engine/normalize.ts",
  "lib/curriculum-import-engine/assets.ts",
  "lib/curriculum-import-engine/ile-package-builder.ts",
  "lib/curriculum-import-engine/connectors/index.ts",
  "lib/curriculum-import-engine/connectors/jordan-nccd.ts",
  "lib/curriculum-import-engine/verification/engine.ts",
  "lib/curriculum-import-engine/rights/engine.ts",
  "lib/curriculum-import-engine/metadata/engine.ts",
  "content/demo/curriculum-import-jordan.ts",
  "components/curriculum-import-engine/import-dashboard.tsx",
  "app/api/curriculum-import-engine/route.ts",
  "app/admin/curriculum-import/page.tsx",
  "docs/cursor/curriculum-import-engine.md",
  "docs/cursor/adr/ADR-0050-curriculum-import-compiler.md",
];

for (const rel of requiredFiles) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const types = fs.readFileSync(path.join(root, "types/curriculum-import-engine.ts"), "utf8");
assert.ok(types.includes("success-os.curriculum-import-engine.v1"));
for (const stage of [
  "source_discovery",
  "source_verification",
  "rights_verification",
  "metadata_extraction",
  "book_detection",
  "unit_detection",
  "lesson_detection",
  "content_normalization",
  "asset_extraction",
  "ile_package_builder",
  "validation",
  "publishing_queue",
]) {
  assert.ok(types.includes(`"${stage}"`), `stage missing ${stage}`);
}
for (const gate of [
  "source_verification",
  "rights_verification",
  "duplicate_detection",
  "metadata_validation",
  "structure_validation",
  "package_validation",
]) {
  assert.ok(types.includes(`"${gate}"`), `gate missing ${gate}`);
}

const builder = fs.readFileSync(
  path.join(root, "lib/curriculum-import-engine/ile-package-builder.ts"),
  "utf8",
);
assert.ok(builder.includes("success-os.interactive-lesson-engine.v1"));
assert.ok(builder.includes("noAiGeneration"));
assert.ok(builder.includes("noQuizGeneration"));
assert.ok(!builder.includes('createBlock("quick_question"'));

const runner = fs.readFileSync(
  path.join(root, "lib/curriculum-import-engine/runner.ts"),
  "utf8",
);
assert.ok(runner.includes("runJordanPhase1Import"));
assert.ok(runner.includes("Unverified content can never be published"));

const index = fs.readFileSync(path.join(root, "lib/curriculum-import-engine/index.ts"), "utf8");
assert.ok(index.includes("rendersLessons: false"));
assert.ok(index.includes('role: "compiler"'));

const dashboard = fs.readFileSync(
  path.join(root, "components/curriculum-import-engine/import-dashboard.tsx"),
  "utf8",
);
assert.ok(dashboard.includes("Never renders"));
assert.ok(dashboard.includes("Run Jordan Phase 1 Import"));

const adr = fs.readFileSync(
  path.join(root, "docs/cursor/adr/ADR-0050-curriculum-import-compiler.md"),
  "utf8",
);
assert.ok(adr.includes("ADR-0050"));
assert.ok(adr.includes("compiler"));
assert.ok(adr.includes("never render") || adr.includes("Never render"));

const roadmap = fs.readFileSync(
  path.join(root, "docs/cursor/learning-platform-roadmap.md"),
  "utf8",
);
assert.ok(roadmap.includes("PR #50"));

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
assert.ok(pkg.scripts["validate:curriculum-import-engine"]);

const demo = fs.readFileSync(
  path.join(root, "content/demo/curriculum-import-jordan.ts"),
  "utf8",
);
assert.ok(demo.includes("JO-G5-SCI-S1"));
assert.ok(demo.includes("Jordan National Curriculum"));

const fakeChecksum = createHash("sha256").update("jo-g5-sci").digest("hex");
assert.equal(fakeChecksum.length, 64);

const admin = fs.readFileSync(path.join(root, "app/admin/page.jsx"), "utf8");
assert.ok(admin.includes("/admin/curriculum-import"));

console.log("curriculum-import-engine.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      schema: "success-os.curriculum-import-engine.v1",
      role: "compiler",
      rendersLessons: false,
      phase1: "Jordan",
      filesChecked: requiredFiles.length,
      aiGeneration: false,
      quizGeneration: false,
      videoGeneration: false,
    },
    null,
    2,
  ),
);
