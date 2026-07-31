#!/usr/bin/env node
/**
 * Install the full Jordan National Curriculum into the project (committed paths).
 *
 * Writes:
 *   content/datasets/jordan-national-curriculum-knowledge/  — JO-01 knowledge DB (all grades)
 *   content/exports/jordan-curriculum/                     — Manus/browse trees (grades 1–12)
 *   public/exports/jordan-curriculum/                      — static mirror
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args) {
  console.log(`\n▶ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8", stdio: "inherit" });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

run("npm", ["run", "jo:knowledge"]);
run("npm", ["run", "export:jordan-curriculum"]);

const knowledgeRoot = path.join(
  root,
  "content/datasets/jordan-national-curriculum-knowledge",
);
const exportRoot = path.join(root, "content/exports/jordan-curriculum");

const statusPath = path.join(knowledgeRoot, "status.json");
const indexPath = path.join(exportRoot, "jordan-all-grades-index.json");
if (!fs.existsSync(statusPath) || !fs.existsSync(indexPath)) {
  console.error("Jordan curriculum install incomplete — missing status or grade index.");
  process.exit(1);
}

const status = JSON.parse(fs.readFileSync(statusPath, "utf8"));
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

const readme = `# Jordan National Curriculum — in-project dataset

Country: **Jordan (JO)**  
Curriculum: **المنهاج الوطني الأردني**

This folder is the **canonical committed** JO-01 knowledge store used by Success OS
(\`knowledgeRoot()\`). Rebuild with:

\`\`\`bash
npm run jo:install-curriculum
\`\`\`

## Contents

| Path | Purpose |
|------|---------|
| \`jordan-national-knowledge-database.json\` | Aggregate DB + verification gate |
| \`status.json\` | Gate / totals snapshot |
| \`subjects/*.json\` | Every grade×subject knowledge node |
| \`grades/*.json\` | Per-grade rollups |
| \`dashboards/latest.json\` | Admin dashboard payload |
| \`reports/\` | Build reports |

Browseable grade trees (subject→unit→lesson) also live at:

\`content/exports/jordan-curriculum/grades/grade-NN-tree.json\`

## Last install snapshot

- Knowledge cells: ${status.totals?.gradeSubjectCells ?? "?"}
- Units: ${status.totals?.units ?? "?"}
- Lessons: ${status.totals?.lessons ?? "?"}
- Outcomes: ${status.totals?.learningOutcomes ?? "?"}
- Verified completion: ${status.verification?.verifiedCompletionPercent ?? "?"}%
- Book generation: ${status.bookGenerationAllowed ? "ALLOWED" : "BLOCKED"}
- Export grades 1–12 subjects: ${index.totals?.subjects ?? "?"}
- Export lessons: ${index.totals?.lessons ?? "?"}

## Rights

Structure / original Success OS scaffolds only — **never** copies textbook prose.
`;

fs.writeFileSync(path.join(knowledgeRoot, "README.md"), readme);

console.log("\n──────── Jordan curriculum installed in project ────────");
console.log("Knowledge:", knowledgeRoot);
console.log("Export trees:", exportRoot);
console.log(
  JSON.stringify(
    {
      knowledgeCells: status.totals?.gradeSubjectCells,
      knowledgeLessons: status.totals?.lessons,
      verifiedPercent: status.verification?.verifiedCompletionPercent,
      bookGenerationAllowed: status.bookGenerationAllowed,
      exportGrades: index.totals?.grades,
      exportSubjects: index.totals?.subjects,
      exportLessons: index.totals?.lessons,
    },
    null,
    2,
  ),
);
