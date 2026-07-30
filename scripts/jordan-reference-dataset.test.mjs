#!/usr/bin/env node
/**
 * Jordan reference dataset & verification contract tests (PR #50.2).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "types/curriculum-hierarchy.ts",
  "content/demo/jordan-reference-dataset.ts",
  "content/demo/generated/jordan-reference-tree.example.json",
  "content/demo/generated/jordan-reference-lesson-metadata.example.json",
  "content/demo/generated/jordan-reference-ile-package.example.json",
  "content/demo/generated/jordan-reference-validation-report.example.json",
  "lib/curriculum-import-engine/reference/jordan-dataset.ts",
  "lib/curriculum-import-engine/hierarchy/registry.ts",
  "docs/cursor/jordan-reference-dataset.md",
  "docs/cursor/adr/ADR-0050.2-jordan-reference-dataset.md",
  "docs/cursor/reports/pr-50.2-completion-report.md",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const dataset = fs.readFileSync(
  path.join(root, "content/demo/jordan-reference-dataset.ts"),
  "utf8",
);
assert.ok(dataset.includes("success-os.jordan-reference-dataset.v1"));
for (const subject of [
  "Mathematics",
  "Arabic",
  "English",
  "Science",
  "Islamic Education",
  "Social Studies",
]) {
  assert.ok(dataset.includes(subject), `missing subject ${subject}`);
}
assert.ok(dataset.includes("jo_g1_math_u1_l1"));
assert.ok(dataset.includes('verificationStatus: "rejected"'));
assert.ok(dataset.includes('rightsStatus: "restricted"'));

const hierarchy = fs.readFileSync(
  path.join(root, "types/curriculum-hierarchy.ts"),
  "utf8",
);
for (const token of [
  "LessonMetadataRecord",
  "LessonVerificationReport",
  "sourceStatus",
  "rightsStatus",
  "structureStatus",
  "metadataStatus",
  "packageStatus",
  "publishingStatus",
  "packageVersion",
  "checksum",
  "verifiedPackages",
  "pendingPackages",
  "rejectedPackages",
  "validationErrors",
  "rightsWarnings",
]) {
  assert.ok(hierarchy.includes(token), `hierarchy missing ${token}`);
}

const runner = fs.readFileSync(
  path.join(root, "lib/curriculum-import-engine/reference/jordan-dataset.ts"),
  "utf8",
);
assert.ok(runner.includes("runJordanReferenceDataset"));
assert.ok(runner.includes("buildVerification"));
assert.ok(runner.includes("approveAndPublishLesson"));
assert.ok(runner.includes("jo_g1_math_u1_l1"));
assert.ok(runner.includes("noAiGeneration"));
assert.ok(runner.includes("Rejected") || runner.includes("rejected"));

const tree = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/jordan-reference-tree.example.json"),
    "utf8",
  ),
);
assert.equal(tree.country, "Jordan");
assert.equal(tree.grade, "Grade 1");
assert.ok(tree.subjects.length >= 6);
assert.equal(tree.subjects[0].code, "MATH");

const metadata = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/jordan-reference-lesson-metadata.example.json"),
    "utf8",
  ),
);
for (const key of [
  "country",
  "curriculum",
  "grade",
  "semester",
  "subject",
  "book",
  "unit",
  "lesson",
  "lessonOrder",
  "officialLessonTitle",
  "language",
  "learningObjectives",
  "keywords",
  "references",
  "rightsStatus",
  "verificationStatus",
  "packageVersion",
  "checksum",
  "verification",
]) {
  assert.ok(key in metadata, `metadata missing ${key}`);
}
assert.equal(metadata.verification.publishingStatus, "published");

const ile = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/jordan-reference-ile-package.example.json"),
    "utf8",
  ),
);
assert.equal(ile.schema, "success-os.interactive-lesson-engine.v1");
assert.equal(ile.id, "ile_jo_g1_math_u1_l1");
assert.equal(ile.status, "published");
assert.ok(ile.engineMeta.noAiGeneration);
assert.ok(ile.engineMeta.hierarchyPath.includes("Interactive Lesson Engine"));

const report = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/jordan-reference-validation-report.example.json"),
    "utf8",
  ),
);
assert.equal(report.counts.lessons, 13);
assert.equal(report.counts.published, 1);
assert.equal(report.counts.rejected, 1);
assert.ok(report.pipeline.rejectedNeverPublish);
assert.ok(report.pipeline.ileOnlyRuntime);

const dash = fs.readFileSync(
  path.join(root, "components/curriculum-import-engine/import-dashboard.tsx"),
  "utf8",
);
for (const label of [
  "Run Jordan Reference Dataset",
  "Countries",
  "Curricula",
  "Grades",
  "Subjects",
  "Books",
  "Units",
  "Lessons",
  "Verified Packages",
  "Pending Packages",
  "Rejected Packages",
  "Import Progress",
  "Validation Errors",
  "Rights Warnings",
  "Import Queue",
]) {
  assert.ok(dash.includes(label), `dashboard missing ${label}`);
}

const api = fs.readFileSync(
  path.join(root, "app/api/curriculum-import-engine/route.ts"),
  "utf8",
);
assert.ok(api.includes("run-jordan-reference-dataset"));
assert.ok(api.includes("jordan-reference-dataset"));

const adr = fs.readFileSync(
  path.join(root, "docs/cursor/adr/ADR-0050.2-jordan-reference-dataset.md"),
  "utf8",
);
assert.ok(adr.includes("ADR-0050.2"));
assert.ok(adr.includes("Rejected lessons never publish") || adr.includes("rejected never publish"));

const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
assert.ok(pkg.includes("validate:jordan-reference-dataset"));

console.log("jordan-reference-dataset.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      dataset: "success-os.jordan-reference-dataset.v1",
      hierarchy: "success-os.curriculum-hierarchy.v1",
      ileSchema: "success-os.interactive-lesson-engine.v1",
      subjects: tree.subjects.map((s) => s.code),
      sampleLesson: metadata.lesson,
      samplePackage: ile.id,
      published: report.counts.published,
      rejectedNeverPublish: true,
      aiGeneration: false,
      filesChecked: required.length,
    },
    null,
    2,
  ),
);
