#!/usr/bin/env node
/**
 * Install the full Jordan National Curriculum into the project (committed paths).
 *
 * Pipeline:
 *   1) JO-01 knowledge database
 *   2) JO-05 educational reference library
 *   3) JO-02 book production (all grade×subject cells)
 *   4) JO-10 national education registry
 *   5) Export browse trees + ZIP (grades 1–12)
 *
 * Writes under content/datasets/ and content/exports/ (git-tracked).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const skipBooks = args.has("--skip-books");
const academicOnly = args.has("--academic-only");

function run(cmd, cmdArgs, opts = {}) {
  console.log(`\n▶ ${cmd} ${cmdArgs.join(" ")}`);
  const r = spawnSync(cmd, cmdArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
    env: process.env,
    ...opts,
  });
  if (r.status !== 0 && !opts.allowFail) {
    process.exit(r.status ?? 1);
  }
  return r.status ?? 0;
}

run("npm", ["run", "jo:knowledge"]);
run("npm", ["run", "jo:references"]);

if (!skipBooks) {
  console.log("\n▶ Producing all Jordan national books from JO-01 knowledge…");
  const producer = path.join(root, "scripts/_produce_all_jordan_books.mjs");
  fs.writeFileSync(
    producer,
    `
import {
  produceNextJordanBook,
  buildJordanProductionDashboard,
  productionRoot,
} from "../app/lib/ai/jordan-book-production-engine.js";
import { listLibraryBooks, libraryRoot } from "../app/lib/ai/library-store.js";

const academicOnly = ${academicOnly ? "true" : "false"};
let guard = 0;
let produced = 0;
let last = null;

while (guard++ < 400) {
  const result = produceNextJordanBook({});
  last = result;
  if (!result.ok) {
    if (result.error === "EMPTY_QUEUE") break;
    console.error("produce failed", result);
    process.exit(2);
  }
  if (result.bookId) {
    produced += 1;
    console.log(
      \`  ✓ [\${produced}] \${result.subject} · \${result.bookId.split("__").slice(-2).join(" / ")} · QA \${result.qualityScore} · \${result.publishStatus}\`,
    );
  }
  if (result.subjectComplete && !result.nextSubject) break;
  if (academicOnly && result.nextSubject && /btec|أعمال|هندسة|ضيافة|زراعة|بناء/i.test(String(result.nextSubject))) {
    // keep producing; filter is applied at queue level only if we add it later
  }
}

const dash = buildJordanProductionDashboard();
const books = listLibraryBooks().filter((b) => String(b.id || "").startsWith("jordan__"));
console.log(JSON.stringify({
  producedThisRun: produced,
  jordanBooksOnDisk: books.length,
  libraryRoot: libraryRoot(),
  productionRoot: productionRoot(),
  completedBooks: dash.state?.completedBooks,
  queueBooks: dash.totals?.queueBooks,
  last,
}, null, 2));
`,
  );
  const code = run("node", [producer], { allowFail: true });
  try {
    fs.unlinkSync(producer);
  } catch {
    // ignore
  }
  if (code !== 0) process.exit(code);
}

run("npm", ["run", "jo:registry"], { allowFail: false });
run("npm", ["run", "export:jordan-curriculum"]);

const knowledgeRoot = path.join(
  root,
  "content/datasets/jordan-national-curriculum-knowledge",
);
const refsRoot = path.join(
  root,
  "content/datasets/jordan-educational-reference-library",
);
const booksRoot = path.join(root, "content/datasets/global-knowledge/books");
const registryRoot = path.join(
  root,
  "content/datasets/national-education-registry",
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
const bookCount = fs.existsSync(booksRoot)
  ? fs.readdirSync(booksRoot).filter((f) => f.endsWith(".json")).length
  : 0;
const refStatus = path.join(refsRoot, "status.json");
const refs = fs.existsSync(refStatus)
  ? JSON.parse(fs.readFileSync(refStatus, "utf8"))
  : null;
const registryDash = path.join(registryRoot, "dashboards", "latest.json");
const reg = fs.existsSync(registryDash)
  ? JSON.parse(fs.readFileSync(registryDash, "utf8"))
  : null;

const readme = `# Jordan National Curriculum — in-project datasets

Country: **Jordan (JO)** · Curriculum: **المنهاج الوطني الأردني**

Rebuild everything with:

\`\`\`bash
npm run jo:install-curriculum
\`\`\`

## Dataset layout

| Path | Phase | Purpose |
|------|-------|---------|
| \`jordan-national-curriculum-knowledge/\` | JO-01 | Grade×subject knowledge nodes |
| \`jordan-educational-reference-library/\` | JO-05 | Verified official references |
| \`jordan-book-production/\` | JO-02 | Production queue / reviews |
| \`global-knowledge/books/\` | JO-02 | Produced Success OS books |
| \`national-education-registry/\` | JO-10 | Searchable entity registry |

Browse trees: \`content/exports/jordan-curriculum/grades/\`

## Last install snapshot

- Knowledge cells: ${status.totals?.gradeSubjectCells ?? "?"}
- Knowledge lessons: ${status.totals?.lessons ?? "?"}
- Verified completion: ${status.verification?.verifiedCompletionPercent ?? "?"}%
- Book generation: ${status.bookGenerationAllowed ? "ALLOWED" : "BLOCKED"}
- Verified references: ${refs?.totals?.verifiedReferences ?? refs?.verifiedReferences ?? "?"}
- Produced books on disk: ${bookCount}
- Registry lessons: ${reg?.totalLessons ?? "?"}
- Export grades 1–12 subjects: ${index.totals?.subjects ?? "?"}
- Export lessons: ${index.totals?.lessons ?? "?"}

## Rights

Original Success OS scaffolds aligned to MoE / NCCD structure — **never** copies textbook prose.
`;

fs.writeFileSync(path.join(knowledgeRoot, "README.md"), readme);
fs.writeFileSync(
  path.join(root, "content/datasets/README.md"),
  `# Success OS — committed datasets

Jordan National Curriculum packages live here so they ship with the repo
(not under gitignored \`/library/\`).

See \`jordan-national-curriculum-knowledge/README.md\`.
`,
);

console.log("\n──────── Jordan curriculum installed in project ────────");
console.log(
  JSON.stringify(
    {
      knowledgeCells: status.totals?.gradeSubjectCells,
      knowledgeLessons: status.totals?.lessons,
      verifiedPercent: status.verification?.verifiedCompletionPercent,
      bookGenerationAllowed: status.bookGenerationAllowed,
      verifiedReferences: refs?.totals?.verifiedReferences ?? refs?.verifiedReferences,
      producedBooks: bookCount,
      registryLessons: reg?.totalLessons,
      exportGrades: index.totals?.grades,
      exportSubjects: index.totals?.subjects,
      exportLessons: index.totals?.lessons,
    },
    null,
    2,
  ),
);
