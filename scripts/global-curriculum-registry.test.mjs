#!/usr/bin/env node
/**
 * Global Curriculum Registry & Dynamic Curriculum Architecture (PR #50.3).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "types/global-ids.ts",
  "types/global-curriculum-registry.ts",
  "types/curriculum-discovery.ts",
  "types/knowledge-graph.ts",
  "types/student-foundation.ts",
  "lib/curriculum-import-engine/hierarchy/global-ids.ts",
  "lib/curriculum-import-engine/hierarchy/global-curriculum-registry.ts",
  "lib/curriculum-import-engine/discovery/discover.ts",
  "lib/curriculum-import-engine/knowledge-graph/build.ts",
  "lib/curriculum-import-engine/student/foundation.ts",
  "lib/curriculum-import-engine/reference/global-curriculum.ts",
  "content/demo/official-sources/jordan-national-g1.ts",
  "content/demo/generated/global-curriculum-registry.example.json",
  "content/demo/generated/curriculum-discovery.example.json",
  "content/demo/generated/knowledge-graph.example.json",
  "content/demo/generated/student-foundation.example.json",
  "docs/cursor/global-curriculum-registry.md",
  "docs/cursor/adr/ADR-0050.3-global-curriculum-registry.md",
  "docs/cursor/reports/pr-50.3-completion-report.md",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const ids = fs.readFileSync(path.join(root, "types/global-ids.ts"), "utf8");
for (const prefix of [
  "WLD",
  "CTR",
  "CUR",
  "AYR",
  "GRD",
  "SEM",
  "SUB",
  "BOK",
  "UNT",
  "LSN",
  "SKL",
  "PKG",
]) {
  assert.ok(ids.includes(`"${prefix}"`) || ids.includes(`'${prefix}'`), `missing prefix ${prefix}`);
}

const discovery = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/curriculum-discovery.example.json"),
    "utf8",
  ),
);
assert.equal(discovery.schema, "success-os.curriculum-discovery.v1");
assert.equal(discovery.countryCode, "JO");
assert.equal(discovery.detected.grades[0].code, "G01");
const g01Codes = discovery.detected.grades[0].subjects.map((s) => s.localCode);
assert.deepEqual(g01Codes, ["AR", "EN", "MATH", "SCI", "ISL", "SOC", "ART", "PE"]);
assert.ok(!g01Codes.includes("PHYSICS"));
assert.ok(!g01Codes.includes("CHEMISTRY"));
assert.ok(!g01Codes.includes("BIOLOGY"));
assert.ok(
  discovery.excludedGlobalSubjects.some((s) => s.includes("Physics")),
  "Physics must be listed as excluded for G01",
);

const registry = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/global-curriculum-registry.example.json"),
    "utf8",
  ),
);
assert.equal(registry.schema, "success-os.global-curriculum-registry.v1");
assert.deepEqual(registry.hierarchy.slice(0, 4), [
  "World",
  "Country",
  "Curriculum",
  "Academic Year",
]);
assert.equal(registry.world.globalId, "WLD-00001");
assert.equal(registry.countries[0].globalId, "CTR-00001");
assert.equal(registry.countries[0].code, "JO");
assert.ok(registry.assertions.physicsAbsentFromG01);
assert.ok(registry.assertions.chemistryAbsentFromG01);
assert.ok(registry.assertions.biologyAbsentFromG01);
assert.ok(registry.assertions.jordanIsFirstImplementation);
assert.ok(registry.counts.subjects >= 8);
assert.ok(registry.counts.lessons >= 8);

const graph = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/knowledge-graph.example.json"),
    "utf8",
  ),
);
assert.equal(graph.schema, "success-os.knowledge-graph.v1");
assert.deepEqual(graph.pathPatterns.lessons, [
  "Lesson",
  "requires",
  "Lesson",
  "requires",
  "Lesson",
]);
assert.deepEqual(graph.pathPatterns.skills, [
  "Skill",
  "depends on",
  "Skill",
  "depends on",
  "Skill",
]);
assert.ok(graph.counts.skillNodes >= 16);
assert.ok(graph.counts.dependsOnEdges >= 1);

const foundation = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/student-foundation.example.json"),
    "utf8",
  ),
);
assert.equal(foundation.schema, "success-os.student-foundation.v1");
assert.equal(foundation.learningPath, null);
for (const key of [
  "completedLessons",
  "completedSkills",
  "missingSkills",
  "weakSkills",
  "recommendedLessons",
  "learningPath",
]) {
  assert.ok(key in foundation, `foundation missing ${key}`);
}

const subjectReg = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/global-subject-registry.example.json"),
    "utf8",
  ),
);
assert.equal(subjectReg.subjects[0].name.en, "Mathematics");
assert.equal(subjectReg.subjects[1].name.en, "Science");
assert.equal(subjectReg.subjects[2].name.en, "Physics");
assert.equal(subjectReg.subjects[5].name.en, "Arabic");
assert.equal(subjectReg.subjects[6].name.en, "English");
assert.equal(subjectReg.counts.subjects, 11);

const official = fs.readFileSync(
  path.join(root, "content/demo/official-sources/jordan-national-g1.ts"),
  "utf8",
);
assert.ok(official.includes("success-os.official-curriculum-source.v1"));
assert.ok(official.includes("JORDAN_G01_EXCLUDED_SUBJECT_CODES"));

const api = fs.readFileSync(
  path.join(root, "app/api/curriculum-import-engine/route.ts"),
  "utf8",
);
for (const action of [
  "global-curriculum-registry",
  "curriculum-discovery",
  "knowledge-graph",
  "student-foundation",
  "run-global-curriculum-registry",
]) {
  assert.ok(api.includes(action), `api missing ${action}`);
}

const index = fs.readFileSync(
  path.join(root, "lib/curriculum-import-engine/index.ts"),
  "utf8",
);
assert.ok(index.includes("runGlobalCurriculumRegistry"));
assert.ok(index.includes("discoverCurriculum"));
assert.ok(index.includes("buildKnowledgeGraph"));
assert.ok(index.includes("ADR-0050.3"));
assert.ok(index.includes("noHardcodedSubjects"));

const roadmap = fs.readFileSync(
  path.join(root, "docs/cursor/learning-platform-roadmap.md"),
  "utf8",
);
assert.ok(roadmap.includes("PR #50.3"));
assert.ok(roadmap.includes("Global Curriculum Registry"));

console.log("global-curriculum-registry.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      schema: registry.schema,
      discovery: discovery.schema,
      g01Subjects: g01Codes,
      physicsAbsent: registry.assertions.physicsAbsentFromG01,
      knowledgeGraph: graph.schema,
      studentFoundation: foundation.schema,
      globalSubjects: subjectReg.counts.subjects,
    },
    null,
    2,
  ),
);
