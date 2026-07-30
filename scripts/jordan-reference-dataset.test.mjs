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
  "types/global-subject-registry.ts",
  "content/demo/jordan-reference-dataset.ts",
  "content/demo/generated/jordan-reference-tree.example.json",
  "content/demo/generated/jordan-reference-lesson-metadata.example.json",
  "content/demo/generated/jordan-reference-ile-package.example.json",
  "content/demo/generated/jordan-reference-validation-report.example.json",
  "content/demo/generated/global-subject-registry.example.json",
  "content/demo/generated/global-skill-registry.example.json",
  "content/demo/generated/student-skill-progress.example.json",
  "lib/curriculum-import-engine/reference/jordan-dataset.ts",
  "lib/curriculum-import-engine/hierarchy/registry.ts",
  "lib/curriculum-import-engine/hierarchy/global-subject-registry.ts",
  "lib/curriculum-import-engine/hierarchy/global-skill-registry.ts",
  "lib/curriculum-import-engine/student/skill-progress.ts",
  "types/global-skill-registry.ts",
  "types/student-skill-progress.ts",
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
  "Physics",
  "Chemistry",
  "Biology",
  "Arabic",
  "English",
  "Science",
  "Islamic Education",
  "Social Studies",
]) {
  assert.ok(dataset.includes(subject), `missing subject ${subject}`);
}
assert.ok(dataset.includes('JO_IDS.subject("PHYSICS")'));
assert.ok(dataset.includes('JO_IDS.subject("CHEMISTRY")'));
assert.ok(dataset.includes('JO_IDS.subject("BIOLOGY")'));
assert.ok(dataset.includes('JO_IDS.lesson("PHYSICS", 1, 1, 1)'));
assert.ok(dataset.includes('JO_IDS.lesson("CHEMISTRY", 1, 1, 1)'));
assert.ok(dataset.includes('JO_IDS.lesson("BIOLOGY", 1, 1, 1)'));

const globalReg = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/global-subject-registry.example.json"),
    "utf8",
  ),
);
assert.equal(globalReg.schema, "success-os.global-subject-registry.v1");
assert.equal(globalReg.subjects[0].id, "SUB-00001");
assert.equal(globalReg.subjects[0].name.en, "Mathematics");
assert.equal(globalReg.subjects[1].id, "SUB-00002");
assert.equal(globalReg.subjects[2].id, "SUB-00003");
assert.equal(globalReg.subjects[3].id, "SUB-00004");
assert.equal(globalReg.subjects[3].code, "BIOLOGY");
assert.equal(globalReg.counts.subjects, 9);
assert.ok(Array.isArray(globalReg.crossCountryExamples));
assert.equal(globalReg.crossCountryExamples.length, 3);
assert.equal(globalReg.crossCountryExamples[0].globalSubjectId, "SUB-00001");
assert.equal(globalReg.crossCountryExamples[1].globalSubjectId, "SUB-00001");
assert.equal(globalReg.crossCountryExamples[2].globalSubjectId, "SUB-00001");
assert.equal(globalReg.crossCountryExamples[0].localLabel, "رياضيات");
assert.equal(globalReg.crossCountryExamples[1].localLabel, "Mathematics");
assert.equal(globalReg.crossCountryExamples[2].localLabel, "رياضيات");
assert.deepEqual(globalReg.crossCountryExamples[0].path, [
  "Jordan",
  "رياضيات",
  "SUB-00001",
]);
assert.deepEqual(globalReg.crossCountryExamples[1].path, [
  "USA",
  "Mathematics",
  "SUB-00001",
]);
assert.deepEqual(globalReg.crossCountryExamples[2].path, [
  "Egypt",
  "رياضيات",
  "SUB-00001",
]);

const globalMod = fs.readFileSync(
  path.join(root, "lib/curriculum-import-engine/hierarchy/global-subject-registry.ts"),
  "utf8",
);
assert.ok(globalMod.includes("SUB-00001"));
assert.ok(globalMod.includes("GLOBAL_SUBJECT_REGISTRY_SEED"));
assert.ok(globalMod.includes("COUNTRY_SUBJECT_ALIAS_SEED"));
assert.ok(globalMod.includes("resolveCountrySubject"));
assert.ok(globalMod.includes("رياضيات"));

const skillReg = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/global-skill-registry.example.json"),
    "utf8",
  ),
);
assert.equal(skillReg.schema, "success-os.global-skill-registry.v1");
assert.equal(skillReg.skills[0].id, "SKL-00001");
assert.equal(skillReg.skills[0].name.en, "Arithmetic");
assert.equal(skillReg.skills[1].name.en, "Fractions");
assert.equal(skillReg.skills[2].name.en, "Vectors");
assert.equal(skillReg.skills[3].name.en, "Newton Laws");
assert.equal(skillReg.skills[4].name.en, "Acids");
assert.equal(skillReg.skills[5].name.en, "Reading");
assert.equal(skillReg.skills[6].name.en, "Writing");
assert.equal(skillReg.skills[7].name.en, "Critical Thinking");
assert.equal(skillReg.counts.skills, 8);

const skillMod = fs.readFileSync(
  path.join(root, "lib/curriculum-import-engine/hierarchy/global-skill-registry.ts"),
  "utf8",
);
assert.ok(skillMod.includes("SKL-00001"));
assert.ok(skillMod.includes("GLOBAL_SKILL_REGISTRY_SEED"));
assert.ok(skillMod.includes("defaultSkillIdsForSubject"));
for (const id of [
  "JO",
  "JO-NATIONAL",
  "JO-NATIONAL-G01",
  "JO-NATIONAL-G01-MATH",
  "JO-NATIONAL-G01-MATH-B01",
  "JO-NATIONAL-G01-MATH-B01-U01",
  "JO-NATIONAL-G01-MATH-B01-U01-L01",
]) {
  assert.ok(dataset.includes(id), `missing hierarchical id ${id}`);
}
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
assert.ok(runner.includes("JO_CANONICAL_LESSON_ID"));
assert.ok(runner.includes("JO-NATIONAL-G01-MATH-B01-U01-L01"));
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
assert.ok(tree.subjects.length >= 9);
assert.equal(tree.subjects[0].code, "MATH");
assert.equal(tree.subjects[1].code, "PHYSICS");
assert.equal(tree.subjects[2].code, "CHEMISTRY");
assert.equal(tree.subjects[3].code, "BIOLOGY");
assert.equal(tree.idConvention.lesson, "JO-NATIONAL-G01-MATH-B01-U01-L01");
assert.equal(tree.subjects[0].id, "JO-NATIONAL-G01-MATH");
assert.equal(tree.subjects[0].globalSubjectId, "SUB-00001");
assert.equal(tree.subjects[1].globalSubjectId, "SUB-00002");
assert.equal(tree.subjects[2].globalSubjectId, "SUB-00003");
assert.equal(tree.subjects[3].globalSubjectId, "SUB-00004");
assert.equal(tree.subjects[0].books[0].id, "JO-NATIONAL-G01-MATH-B01");
assert.equal(
  tree.subjects[0].books[0].units[0].lessons[0].id,
  "JO-NATIONAL-G01-MATH-B01-U01-L01",
);
assert.equal(
  tree.subjects[1].books[0].units[0].lessons[0].id,
  "JO-NATIONAL-G01-PHYSICS-B01-U01-L01",
);
assert.equal(
  tree.subjects[2].books[0].units[0].lessons[0].id,
  "JO-NATIONAL-G01-CHEMISTRY-B01-U01-L01",
);
assert.equal(
  tree.subjects[3].books[0].units[0].lessons[0].id,
  "JO-NATIONAL-G01-BIOLOGY-B01-U01-L01",
);

const metadata = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/jordan-reference-lesson-metadata.example.json"),
    "utf8",
  ),
);
for (const key of [
  "lessonUuid",
  "globalLessonId",
  "globalSubjectId",
  "curriculumId",
  "countryId",
  "language",
  "version",
  "officialVersion",
  "platformVersion",
  "parentLesson",
  "childLessons",
  "relatedLessons",
  "prerequisites",
  "nextLessons",
  "estimatedDuration",
  "difficulty",
  "bloomLevel",
  "skills",
  "tags",
  "aiReady",
  "published",
  "verified",
  "archived",
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
assert.equal(metadata.globalLessonId, "JO-NATIONAL-G01-MATH-B01-U01-L01");
assert.equal(metadata.globalSubjectId, "SUB-00001");
assert.deepEqual(metadata.skills, ["SKL-00001", "SKL-00008"]);

const studentProgress = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/student-skill-progress.example.json"),
    "utf8",
  ),
);
assert.equal(studentProgress.schema, "success-os.student-skill-progress.v1");
assert.deepEqual(studentProgress.path, [
  "Student",
  "Completed Lessons",
  "Completed Skills",
  "Missing Skills",
  "Weak Skills",
  "Recommended Lessons",
]);
assert.equal(studentProgress.completedLessons[0].lessonId, "JO-NATIONAL-G01-MATH-B01-U01-L01");
assert.ok(studentProgress.completedSkills.some((s) => s.skillId === "SKL-00001"));
assert.ok(studentProgress.missingSkills.some((s) => s.skillId === "SKL-00002"));
assert.ok(studentProgress.weakSkills.some((s) => s.skillId === "SKL-00001"));
assert.ok(
  studentProgress.recommendedLessons.some(
    (l) => l.lessonId === "JO-NATIONAL-G01-MATH-B01-U01-L02",
  ),
);

const progressMod = fs.readFileSync(
  path.join(root, "lib/curriculum-import-engine/student/skill-progress.ts"),
  "utf8",
);
assert.ok(progressMod.includes("buildStudentSkillProgress"));
assert.ok(progressMod.includes("Recommended Lessons"));
assert.equal(metadata.countryId, "JO");
assert.equal(metadata.curriculumId, "JO-NATIONAL");
assert.equal(metadata.aiReady, false);
assert.equal(metadata.published, true);
assert.equal(metadata.verified, true);
assert.equal(metadata.archived, false);
assert.equal(metadata.parentLesson, null);
assert.deepEqual(metadata.nextLessons, ["JO-NATIONAL-G01-MATH-B01-U01-L02"]);
assert.equal(metadata.verification.publishingStatus, "published");

const hierarchyTypes = fs.readFileSync(
  path.join(root, "types/curriculum-hierarchy.ts"),
  "utf8",
);
for (const token of [
  "lessonUuid",
  "globalLessonId",
  "globalSubjectId",
  "curriculumId",
  "countryId",
  "officialVersion",
  "platformVersion",
  "parentLesson",
  "childLessons",
  "relatedLessons",
  "prerequisites",
  "nextLessons",
  "estimatedDuration",
  "bloomLevel",
  "aiReady",
  "archived",
]) {
  assert.ok(hierarchyTypes.includes(token), `type missing ${token}`);
}

const ile = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/jordan-reference-ile-package.example.json"),
    "utf8",
  ),
);
assert.equal(ile.schema, "success-os.interactive-lesson-engine.v1");
assert.equal(ile.id, "ile_JO-NATIONAL-G01-MATH-B01-U01-L01");
assert.equal(ile.source.lessonId, "JO-NATIONAL-G01-MATH-B01-U01-L01");
assert.equal(ile.status, "published");
assert.ok(ile.engineMeta.noAiGeneration);
assert.ok(ile.engineMeta.hierarchyPath.includes("JO-NATIONAL-G01-MATH-B01-U01-L01"));
assert.ok(ile.engineMeta.hierarchyPath.includes("Interactive Lesson Engine"));

const report = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/jordan-reference-validation-report.example.json"),
    "utf8",
  ),
);
assert.equal(report.counts.subjects, 9);
assert.equal(report.counts.lessons, 16);
assert.equal(report.counts.published, 1);
assert.equal(report.counts.rejected, 1);
assert.equal(report.counts.globalSubjects, 9);
assert.deepEqual(report.stemSubjects, [
  "JO-NATIONAL-G01-MATH",
  "JO-NATIONAL-G01-PHYSICS",
  "JO-NATIONAL-G01-CHEMISTRY",
  "JO-NATIONAL-G01-BIOLOGY",
]);
assert.ok(report.globalSubjectRegistry[0].includes("SUB-00001"));
assert.ok(report.globalSubjectRegistry[3].includes("SUB-00004"));
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
  "Global Subjects",
  "Global Skills",
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
assert.ok(api.includes("global-subject-registry"));
assert.ok(api.includes("global-skill-registry"));
assert.ok(api.includes("student-skill-progress"));
assert.ok(api.includes("resolveCountrySubject"));
assert.ok(api.includes("localLabel"));

assert.ok(dash.includes("رياضيات"));
assert.ok(dash.includes("SUB-00001"));
assert.ok(dash.includes("Mathematics"));
assert.ok(dash.includes("Completed Lessons"));
assert.ok(dash.includes("Recommended Lessons"));

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
