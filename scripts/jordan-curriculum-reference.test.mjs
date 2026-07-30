#!/usr/bin/env node
/**
 * Jordan Grade 1 Math reference implementation contract tests.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "types/curriculum-hierarchy.ts",
  "content/demo/jordan-grade1-math-reference.ts",
  "content/demo/generated/jordan-g1-math-ile-package.example.json",
  "lib/curriculum-import-engine/hierarchy/registry.ts",
  "lib/curriculum-import-engine/reference/jordan-g1-math.ts",
  "lib/curriculum-import-engine/connectors/jordan-g1-math.ts",
  "docs/cursor/jordan-curriculum-reference.md",
  "docs/cursor/adr/ADR-0050.1-jordan-curriculum-reference.md",
  "docs/cursor/reports/pr-50.1-completion-report.md",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const demo = fs.readFileSync(
  path.join(root, "content/demo/jordan-grade1-math-reference.ts"),
  "utf8",
);
assert.ok(demo.includes("JO-G1-MATH-P1"));
assert.ok(demo.includes("jo_g1_math_u1_l1"));
assert.ok(demo.includes("Grade 1"));
assert.ok(demo.includes("Mathematics"));

const example = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/jordan-g1-math-ile-package.example.json"),
    "utf8",
  ),
);
assert.equal(example.schema, "success-os.interactive-lesson-engine.v1");
assert.equal(example.filters.country, "Jordan");
assert.equal(example.filters.grade, "Grade 1");
assert.equal(example.filters.subject, "Mathematics");
assert.ok(example.engineMeta.noAiGeneration);
assert.ok(example.engineMeta.noQuizGeneration);
assert.ok(example.engineMeta.hierarchyPath.includes("ILE Package"));

const ref = fs.readFileSync(
  path.join(root, "lib/curriculum-import-engine/reference/jordan-g1-math.ts"),
  "utf8",
);
assert.ok(ref.includes("runJordanGrade1MathReference"));
assert.ok(ref.includes("approveAndPublishLesson"));
assert.ok(ref.includes("buildIlePackagesFromBook"));

const hierarchy = fs.readFileSync(
  path.join(root, "types/curriculum-hierarchy.ts"),
  "utf8",
);
assert.ok(hierarchy.includes("success-os.curriculum-hierarchy.v1"));
for (const entity of [
  "CountryRecord",
  "CurriculumRecord",
  "GradeRecord",
  "SemesterRecord",
  "SubjectRecord",
  "BookRecord",
  "UnitRecord",
  "LessonRecord",
]) {
  assert.ok(hierarchy.includes(entity), `missing ${entity}`);
}

const gates = fs.readFileSync(
  path.join(root, "types/curriculum-import-engine.ts"),
  "utf8",
);
assert.ok(gates.includes("asset_validation"));

const dash = fs.readFileSync(
  path.join(root, "components/curriculum-import-engine/import-dashboard.tsx"),
  "utf8",
);
assert.ok(dash.includes("Run Jordan G1 Math Reference"));
assert.ok(dash.includes("Countries"));
assert.ok(dash.includes("Curricula"));

const adr = fs.readFileSync(
  path.join(root, "docs/cursor/adr/ADR-0050.1-jordan-curriculum-reference.md"),
  "utf8",
);
assert.ok(adr.includes("ADR-0050.1"));
assert.ok(adr.includes("new connector"));

const api = fs.readFileSync(
  path.join(root, "app/api/curriculum-import-engine/route.ts"),
  "utf8",
);
assert.ok(api.includes("run-jordan-g1-math"));
assert.ok(api.includes("jordan-g1-math-example"));

console.log("jordan-curriculum-reference.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      reference: "jordan-g1-math",
      schema: "success-os.curriculum-hierarchy.v1",
      ileSchema: "success-os.interactive-lesson-engine.v1",
      path: example.engineMeta.hierarchyPath,
      aiGeneration: false,
      filesChecked: required.length,
    },
    null,
    2,
  ),
);
