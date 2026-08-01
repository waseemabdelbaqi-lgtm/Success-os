#!/usr/bin/env node
/**
 * Universal Curriculum Mapping Engine contract tests (PR #54).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "types/universal-curriculum-mapping.ts",
  "types/global-ids.ts",
  "lib/universal-curriculum-mapping/index.ts",
  "lib/universal-curriculum-mapping/engine.ts",
  "lib/universal-curriculum-mapping/search-index.ts",
  "lib/universal-curriculum-mapping/skill-graph.ts",
  "lib/universal-curriculum-mapping/seed/cross-curriculum.ts",
  "app/api/universal-curriculum-mapping/route.ts",
  "app/admin/universal-curriculum-mapping/page.tsx",
  "components/universal-curriculum-mapping/uce-dashboard.tsx",
  "content/demo/generated/universal-curriculum-mapping.example.json",
  "content/demo/generated/uce-learning-objectives.example.json",
  "content/demo/generated/uce-skill-graph.example.json",
  "content/demo/generated/uce-search.example.json",
  "content/demo/generated/uce-cross-curriculum-pathway.example.json",
  "docs/cursor/universal-curriculum-mapping.md",
  "docs/cursor/adr/ADR-0054-universal-curriculum-mapping.md",
  "docs/cursor/reports/pr-54-completion-report.md",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const ids = fs.readFileSync(path.join(root, "types/global-ids.ts"), "utf8");
for (const prefix of ["OBJ", "CMP", "STD", "ASO", "MAP"]) {
  assert.ok(ids.includes(`"${prefix}"`), `missing Global ID prefix ${prefix}`);
}

const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/universal-curriculum-mapping.example.json"),
    "utf8",
  ),
);
assert.equal(snap.schema, "success-os.universal-curriculum-mapping.v1");
assert.equal(snap.aiGeneration, false);
assert.equal(snap.copiesCurricula, false);
assert.ok(snap.counts.mappings >= 10);
for (const rel of snap.relationTypes) {
  assert.ok((snap.counts.byRelation[rel] || 0) >= 1, `missing seeded mapping for ${rel}`);
}
assert.ok(snap.counts.objectives >= 2);
assert.ok(snap.relationTypes.includes("equivalent"));
assert.ok(snap.relationTypes.includes("partially_equivalent"));
assert.ok(snap.relationTypes.includes("prerequisite"));
assert.ok(snap.relationTypes.includes("advanced"));
assert.ok(snap.relationTypes.includes("related"));
assert.ok(snap.relationTypes.includes("continuation"));
assert.ok(snap.relationTypes.includes("replacement"));
assert.ok(snap.relationTypes.includes("historical_version"));

for (const kind of [
  "country",
  "curriculum",
  "grade",
  "subject",
  "lesson",
  "skill",
  "learning_objective",
  "competency",
  "standard",
  "assessment_objective",
]) {
  assert.ok(snap.entityKinds.includes(kind), `missing entity kind ${kind}`);
}

const pathway = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/uce-cross-curriculum-pathway.example.json"),
    "utf8",
  ),
);
const labels = pathway.steps.map((s) => s.label);
assert.ok(labels[0].includes("Jordan"));
assert.ok(labels.some((l) => l.includes("IGCSE")));
assert.ok(labels.some((l) => l.includes("AP Biology")));
assert.ok(labels.some((l) => l.includes("NGSS")));
assert.ok(labels.some((l) => l.includes("IB MYP")));
assert.ok(labels.some((l) => l.includes("Cambridge")));
assert.ok(labels.some((l) => l.includes("AI Recommendations")));

for (const m of snap.mappings) {
  assert.ok(m.globalId.startsWith("MAP-"));
  assert.ok(m.source.globalId);
  assert.ok(m.target.globalId);
  assert.ok(m.confidence >= 0 && m.confidence <= 1);
  assert.ok(Array.isArray(m.evidence) && m.evidence.length >= 1);
}

const objectives = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/uce-learning-objectives.example.json"),
    "utf8",
  ),
);
assert.equal(objectives.schema, "success-os.global-learning-objective-registry.v1");
assert.ok(objectives.objectives.every((o) => o.aiTutorReady === false));
assert.ok(objectives.objectives.every((o) => o.globalId.startsWith("OBJ-")));
assert.ok(objectives.objectives[0].skillIds.length >= 1);
assert.ok(objectives.objectives[0].lessonIds.length >= 1);

const skillGraph = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/uce-skill-graph.example.json"),
    "utf8",
  ),
);
assert.equal(skillGraph.schema, "success-os.global-skill-graph.v1");
assert.ok(skillGraph.counts.lessonLinks >= 1);
assert.ok(skillGraph.counts.curricula >= 2);

const search = JSON.parse(
  fs.readFileSync(path.join(root, "content/demo/generated/uce-search.example.json"), "utf8"),
);
assert.equal(search.schema, "success-os.uce-search.v1");
assert.ok(search.counts.total >= 1);

const engine = fs.readFileSync(
  path.join(root, "lib/universal-curriculum-mapping/engine.ts"),
  "utf8",
);
assert.ok(engine.includes("findEquivalentLessons"));
assert.ok(engine.includes("searchUniversalCurriculum"));
assert.ok(!engine.includes("generateLesson"));
assert.ok(!engine.includes("generateQuiz"));

const api = fs.readFileSync(
  path.join(root, "app/api/universal-curriculum-mapping/route.ts"),
  "utf8",
);
for (const action of [
  "status",
  "snapshot",
  "mappings",
  "equivalents",
  "objectives",
  "skill-graph",
  "search",
  "run-uce",
]) {
  assert.ok(api.includes(action), `api missing ${action}`);
}

const seed = fs.readFileSync(
  path.join(root, "lib/universal-curriculum-mapping/seed/cross-curriculum.ts"),
  "utf8",
);
assert.ok(seed.includes("does not copy curricula") || seed.includes("does not copy"));
assert.ok(seed.includes("IGCSE"));
assert.ok(seed.includes("NGSS"));

const roadmap = fs.readFileSync(
  path.join(root, "docs/cursor/learning-platform-roadmap.md"),
  "utf8",
);
assert.ok(roadmap.includes("PR #54"));
assert.ok(roadmap.includes("Universal Curriculum Mapping"));

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
assert.equal(
  pkg.scripts["validate:universal-curriculum-mapping"],
  "node scripts/universal-curriculum-mapping.test.mjs",
);

console.log("universal-curriculum-mapping.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      schema: snap.schema,
      mappings: snap.counts.mappings,
      objectives: snap.counts.objectives,
      pathwaySteps: pathway.steps.length,
      searchHits: search.counts.total,
      aiGeneration: false,
    },
    null,
    2,
  ),
);
