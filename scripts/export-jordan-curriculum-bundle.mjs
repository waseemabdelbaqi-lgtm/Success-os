#!/usr/bin/env node
/**
 * Export Jordan National Curriculum package for external agents (e.g. Manus).
 * Bundles grades 1–12 subject trees, G1 reference sample, official sources index.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "content/exports/jordan-curriculum");
fs.mkdirSync(outDir, { recursive: true });

const runner = path.join(root, "scripts/_export_jordan_runner.ts");
fs.writeFileSync(
  runner,
  `
import fs from "node:fs";
import path from "node:path";
import { runJordanReferenceDataset } from "../lib/curriculum-import-engine/reference/jordan-dataset.ts";
import { JORDAN_REFERENCE_DATASET } from "../content/demo/jordan-reference-dataset.ts";
import { JORDAN_NATIONAL_G1_OFFICIAL_SOURCE } from "../content/demo/official-sources/jordan-national-g1.ts";
import {
  jordanAuthority,
  jordanGradeRegistry,
  jordanSubjectsForGrade,
} from "../app/data/jordan-curriculum.js";
import { buildSubjectKnowledgeNode } from "../app/data/jordan-national-subject-frameworks.js";
import { buildJordanNationalMatrix } from "../app/lib/ai/jordan-national-knowledge-engine.js";

const outDir = path.resolve("content/exports/jordan-curriculum");
const gradesDir = path.join(outDir, "grades");
fs.mkdirSync(gradesDir, { recursive: true });

const result = runJordanReferenceDataset({ reset: true });

const authorities = (jordanAuthority.sources || []).map((s) => ({
  name: s.name,
  url: s.url,
  type: s.authorityType,
}));

/** Academic cells only (exclude BTEC pathway from default all-grades trees). */
const academicCells = buildJordanNationalMatrix().filter(
  (c) => !/btec|مهني/i.test(c.stage) && /^الصف \\d+$/.test(c.grade),
);

const gradesTrees = {};
const gradeSummaries = [];

for (const gradeRecord of jordanGradeRegistry) {
  const grade = gradeRecord.grade;
  const n = Number(String(grade).match(/(\\d+)/)?.[1] || 0);
  const gradeId = \`JO-NATIONAL-G\${String(n).padStart(2, "0")}\`;
  const cells = academicCells.filter((c) => c.grade === grade);
  const subjects = cells.map((cell) => {
    const node = buildSubjectKnowledgeNode({
      stage: cell.stage,
      grade: cell.grade,
      subject: cell.subject,
      officialCatalogUrl: cell.officialCatalogUrl,
      catalogueStatus: cell.catalogueStatus,
      authorities,
    });
    const subjectCode = subjectCodeFromAr(cell.subject);
    const subjectId = \`\${gradeId}-\${subjectCode}\`;
    const units = (node.units || []).map((u, ui) => ({
      unitId: \`\${subjectId}-B01-U\${String(ui + 1).padStart(2, "0")}\`,
      titleAr: u.titleAr,
      lessons: (u.lessons || []).map((l, li) => ({
        lessonId: \`\${subjectId}-B01-U\${String(ui + 1).padStart(2, "0")}-L\${String(li + 1).padStart(2, "0")}\`,
        titleAr: l.titleAr,
        learningOutcomes: l.learningOutcomes || [],
        contentOrigin: l.contentOrigin,
        rights: l.rights,
      })),
    }));
    return {
      subjectId,
      subjectAr: cell.subject,
      subjectFamily: node.subjectFamily,
      gradeBand: node.gradeBand,
      catalogueStatus: cell.catalogueStatus,
      officialCatalogUrl: cell.officialCatalogUrl,
      book: {
        bookId: \`\${subjectId}-B01\`,
        titleAr: \`كتاب SUCCESS OS — \${cell.subject} — \${grade}\`,
        contentOrigin: "success-os-original-curriculum-aligned",
        rights: { copyBookText: false, generateOriginalOnly: true },
      },
      units,
      counts: {
        units: units.length,
        lessons: units.reduce((sum, u) => sum + u.lessons.length, 0),
        outcomes: units.reduce(
          (sum, u) => sum + u.lessons.reduce((s, l) => s + (l.learningOutcomes?.length || 0), 0),
          0,
        ),
      },
    };
  });

  const tree = {
    schema: "success-os.jordan-grade-curriculum-tree.v1",
    countryCode: "JO",
    curriculumId: "JO-NATIONAL",
    gradeId,
    grade,
    gradeNumber: n,
    stageAr: gradeRecord.stage,
    semesters: gradeRecord.semesters,
    officialCatalogUrl: gradeRecord.officialCatalogUrl,
    catalogueStatus: gradeRecord.catalogueStatus,
    verificationStatus: gradeRecord.verificationStatus,
    baselineStatus: gradeRecord.baselineStatus,
    subjects,
    counts: {
      subjects: subjects.length,
      units: subjects.reduce((s, x) => s + x.counts.units, 0),
      lessons: subjects.reduce((s, x) => s + x.counts.lessons, 0),
      outcomes: subjects.reduce((s, x) => s + x.counts.outcomes, 0),
    },
  };

  gradesTrees[grade] = tree;
  const fileName = \`grade-\${String(n).padStart(2, "0")}-tree.json\`;
  fs.writeFileSync(path.join(gradesDir, fileName), JSON.stringify(tree, null, 2) + "\\n");
  gradeSummaries.push({
    gradeNumber: n,
    grade,
    gradeId,
    stageAr: gradeRecord.stage,
    nccdUrl: gradeRecord.officialCatalogUrl,
    catalogueStatus: gradeRecord.catalogueStatus,
    verificationStatus: gradeRecord.verificationStatus,
    subjectCount: subjects.length,
    unitCount: tree.counts.units,
    lessonCount: tree.counts.lessons,
    outcomeCount: tree.counts.outcomes,
    treeFile: \`grades/\${fileName}\`,
    subjects: jordanSubjectsForGrade(grade),
  });
}

function subjectCodeFromAr(subject) {
  const map = [
    [/رياضيات/, "MATH"],
    [/فيزياء/, "PHYS"],
    [/كيمياء/, "CHEM"],
    [/علوم حياتية|أحياء/, "BIO"],
    [/علوم الأرض|بيئة/, "EARTH"],
    [/^العلوم$/, "SCI"],
    [/عربية/, "AR"],
    [/إنجليزية|English/, "EN"],
    [/إسلامية/, "ISLAM"],
    [/اجتماعية/, "SOCIAL"],
    [/وطنية|مدنية/, "CIVICS"],
    [/تاريخ/, "HIST"],
    [/جغرافيا/, "GEO"],
    [/رقمية|حاسوب/, "DIGITAL"],
    [/مهنية/, "VOC"],
    [/مالية/, "FIN"],
    [/رياضية|بدنية/, "PE"],
    [/فنية|موسيقية|مسرح|فنون/, "ARTS"],
    [/فلسفة/, "PHIL"],
    [/نفس|اجتماع/, "PSY"],
  ];
  for (const [re, code] of map) {
    if (re.test(String(subject || ""))) return code;
  }
  return "GEN";
}

const allGradesIndex = {
  schema: "success-os.jordan-all-grades-index.v1",
  countryCode: "JO",
  curriculumId: "JO-NATIONAL",
  grades: gradeSummaries,
  totals: {
    grades: gradeSummaries.length,
    subjects: gradeSummaries.reduce((s, g) => s + g.subjectCount, 0),
    units: gradeSummaries.reduce((s, g) => s + g.unitCount, 0),
    lessons: gradeSummaries.reduce((s, g) => s + g.lessonCount, 0),
    outcomes: gradeSummaries.reduce((s, g) => s + g.outcomeCount, 0),
  },
};

fs.writeFileSync(
  path.join(outDir, "jordan-all-grades-index.json"),
  JSON.stringify(allGradesIndex, null, 2) + "\\n",
);

const bundle = {
  schema: "success-os.jordan-curriculum-export.v2",
  exportedAt: new Date().toISOString(),
  country: {
    code: "JO",
    name: { en: "Jordan", ar: "الأردن" },
    curriculum: { en: "Jordan National Curriculum", ar: "المنهاج الوطني الأردني" },
    authorities: [
      {
        name: "National Center for Curriculum Development (NCCD)",
        nameAr: "المركز الوطني لتطوير المناهج",
        url: "https://www.nccd.gov.jo/",
      },
      {
        name: "Jordan Ministry of Education",
        nameAr: "وزارة التربية والتعليم الأردنية",
        url: "https://moe.gov.jo/",
      },
      {
        name: "Darsak Platform",
        nameAr: "منصة درسك",
        url: "https://darsak.gov.jo/",
      },
    ],
  },
  notes: [
    "Metadata / structure export for Success OS — does not copy textbook prose.",
    "All academic grades 1–12 include subject→unit→lesson trees (framework-aligned scaffolds).",
    "Grade 1 remains the densest verified reference sample (see referenceDataset + jordan-reference-tree.json).",
    "Grades 2–10 use band-aware national-profile subject lists + official NCCD catalogue URLs.",
    "Grade 11 subject list is NCCD-verified; Grade 12 academic core aligns to Grade 11 pending per-page review.",
    "BTEC / vocational pathway is excluded from this academic all-grades export.",
    "Manus / importers should treat rightsStatus and verificationStatus as gates.",
  ],
  idConvention: {
    country: "JO",
    curriculum: "JO-NATIONAL",
    grade: "JO-NATIONAL-G01",
    subject: "JO-NATIONAL-G01-MATH",
    book: "JO-NATIONAL-G01-MATH-B01",
    unit: "JO-NATIONAL-G01-MATH-B01-U01",
    lesson: "JO-NATIONAL-G01-MATH-B01-U01-L01",
  },
  gradesCatalogue: gradeSummaries.map((g) => ({
    grade: g.gradeNumber,
    gradeAr: g.grade,
    stageAr: g.stageAr,
    nccdUrl: g.nccdUrl,
    catalogueStatus: g.catalogueStatus,
    subjectCount: g.subjectCount,
    lessonCount: g.lessonCount,
    treeFile: g.treeFile,
    subjects: g.subjects,
  })),
  allGradesIndex,
  grade1SubjectsVerified: jordanSubjectsForGrade("الصف 1"),
  grade11SubjectsVerified: jordanSubjectsForGrade("الصف 11"),
  referenceDataset: JORDAN_REFERENCE_DATASET,
  officialSourceG1: JORDAN_NATIONAL_G1_OFFICIAL_SOURCE,
  runSummary: {
    ok: result.ok,
    schema: result.schema,
    counts: result.counts || result.snapshot?.counts || null,
    validation: result.validation || null,
  },
  hierarchySnapshot: result.snapshot || result.hierarchy || null,
  gradesTreesEmbedded: false,
  gradesTreesNote:
    "Full trees are written under grades/grade-NN-tree.json to keep the master bundle readable. Index is in jordan-all-grades-index.json.",
  filesIncluded: [
    "jordan-national-curriculum.bundle.json",
    "jordan-all-grades-index.json",
    "grades/grade-01-tree.json",
    "grades/grade-02-tree.json",
    "grades/grade-03-tree.json",
    "grades/grade-04-tree.json",
    "grades/grade-05-tree.json",
    "grades/grade-06-tree.json",
    "grades/grade-07-tree.json",
    "grades/grade-08-tree.json",
    "grades/grade-09-tree.json",
    "grades/grade-10-tree.json",
    "grades/grade-11-tree.json",
    "grades/grade-12-tree.json",
    "jordan-reference-tree.json",
    "jordan-reference-lesson-metadata.json",
    "jordan-reference-ile-package.json",
    "jordan-reference-validation-report.json",
    "MANIFEST.json",
    "README.md",
  ],
};

fs.writeFileSync(
  path.join(outDir, "jordan-national-curriculum.bundle.json"),
  JSON.stringify(bundle, null, 2) + "\\n",
);

console.log("bundle written", {
  ok: result.ok,
  grades: gradeSummaries.length,
  subjects: allGradesIndex.totals.subjects,
  lessons: allGradesIndex.totals.lessons,
  bytes: fs.statSync(path.join(outDir, "jordan-national-curriculum.bundle.json")).size,
});
`,
);

const gen = spawnSync("npx", ["--yes", "tsx", runner], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
});
try {
  fs.unlinkSync(runner);
} catch {
  // ignore
}
if (gen.status !== 0) {
  console.error("Failed to generate Jordan bundle via dataset runner");
  process.exit(gen.status ?? 1);
}

// Copy generated reference artifacts
const copies = [
  [
    "content/demo/generated/jordan-reference-tree.example.json",
    "jordan-reference-tree.json",
  ],
  [
    "content/demo/generated/jordan-reference-lesson-metadata.example.json",
    "jordan-reference-lesson-metadata.json",
  ],
  [
    "content/demo/generated/jordan-reference-ile-package.example.json",
    "jordan-reference-ile-package.json",
  ],
  [
    "content/demo/generated/jordan-reference-validation-report.example.json",
    "jordan-reference-validation-report.json",
  ],
  [
    "content/demo/generated/jordan-g1-math-ile-package.example.json",
    "jordan-g1-math-ile-package.json",
  ],
];

for (const [src, dest] of copies) {
  const from = path.join(root, src);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(outDir, dest));
  }
}

const readme = `# Jordan National Curriculum Export (Success OS) — Grades 1–12

Country: **Jordan (JO)**  
Curriculum: **Jordan National Curriculum / المنهاج الوطني الأردني**  
Export schema: \`success-os.jordan-curriculum-export.v2\`

## For Manus / importers

1. Start with \`jordan-national-curriculum.bundle.json\` (package index + G1 reference).
2. Use \`jordan-all-grades-index.json\` for counts and file pointers for **all 12 grades**.
3. Open \`grades/grade-NN-tree.json\` for each grade’s subject→book→unit→lesson tree.
4. Keep \`jordan-reference-tree.json\` as the densest **Grade 1 verified** sample.
5. Follow \`gradesCatalogue[].nccdUrl\` for official NCCD grade pages.
6. Do **not** copy textbook prose — structure/metadata/outcomes only unless rights are cleared.

## Coverage

| Grades | Subject source | Tree |
|--------|----------------|------|
| 1 | NCCD-verified subject list + dense reference sample | Yes |
| 2–4 | Lower-basic band (same core as G1) + NCCD URL | Yes |
| 5–7 | Mid-basic national-profile band + NCCD URL | Yes |
| 8–10 | Upper-basic (+ history/geography) + NCCD URL | Yes |
| 11 | NCCD-verified academic subject list | Yes |
| 12 | Academic core aligned to G11 + NCCD URL | Yes |

BTEC / vocational pathway is **not** included in this academic export.

## Official sources

- NCCD: https://www.nccd.gov.jo/
- Textbooks catalogue: https://www.nccd.gov.jo/Ar/Pages/textbooks
- Darsak: https://darsak.gov.jo/
- MoE: https://moe.gov.jo/

## Files

| File | Purpose |
|------|---------|
| jordan-national-curriculum.bundle.json | Master bundle (v2) |
| jordan-all-grades-index.json | Grades 1–12 index + totals |
| grades/grade-NN-tree.json | Per-grade curriculum trees |
| jordan-reference-tree.json | G1 dense verified sample |
| jordan-reference-lesson-metadata.json | Lesson metadata sample |
| jordan-reference-ile-package.json | Sample ILE package |
| jordan-g1-math-ile-package.json | Math G1 ILE sample |
| jordan-reference-validation-report.json | Verification report |
| MANIFEST.json | Checksums + file list |
| README.md | This file |
`;

fs.writeFileSync(path.join(outDir, "README.md"), readme);

const files = [];
function walk(dir, prefix = "") {
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (name === "MANIFEST.json") continue;
    if (fs.statSync(full).isDirectory()) walk(full, rel);
    else files.push(rel);
  }
}
walk(outDir);

const manifest = {
  schema: "success-os.jordan-curriculum-export-manifest.v2",
  country: "JO",
  grades: "1-12",
  exportedAt: new Date().toISOString(),
  branchHint: "cursor/jordan-all-grades-export-bca1",
  files: files.map((name) => {
    const full = path.join(outDir, name);
    const buf = fs.readFileSync(full);
    return {
      name,
      bytes: buf.length,
      sha256: createHash("sha256").update(buf).digest("hex"),
    };
  }),
};

fs.writeFileSync(
  path.join(outDir, "MANIFEST.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

// Create zip for one-click Manus pull
const zipPath = path.join(root, "content/exports/jordan-national-curriculum.zip");
const zip = spawnSync(
  "zip",
  ["-r", zipPath, "jordan-curriculum"],
  { cwd: path.join(root, "content/exports"), encoding: "utf8" },
);
if (zip.status !== 0) {
  console.warn("zip command failed; JSON bundle still available", zip.stderr);
} else {
  console.log("ZIP written", zipPath, fs.statSync(zipPath).size, "bytes");
}

// Mirror under public/exports for raw GitHub / static serving if configured
const publicDir = path.join(root, "public/exports");
fs.mkdirSync(publicDir, { recursive: true });
const publicBundleDir = path.join(publicDir, "jordan-curriculum");
fs.rmSync(publicBundleDir, { recursive: true, force: true });
fs.cpSync(outDir, publicBundleDir, { recursive: true });
fs.copyFileSync(zipPath, path.join(publicDir, "jordan-national-curriculum.zip"));

console.log("Jordan curriculum export ready at", outDir);
console.log(
  JSON.stringify(
    {
      grades: manifest.files.filter((f) => f.name.startsWith("grades/")).length,
      totalFiles: manifest.files.length,
      zipBytes: fs.existsSync(zipPath) ? fs.statSync(zipPath).size : 0,
    },
    null,
    2,
  ),
);
