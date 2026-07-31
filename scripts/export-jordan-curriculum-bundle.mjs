#!/usr/bin/env node
/**
 * Export Jordan National Curriculum package for external agents (e.g. Manus).
 * Bundles reference tree, metadata, grade registry, official sources index.
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

const outDir = path.resolve("content/exports/jordan-curriculum");
const result = runJordanReferenceDataset({ reset: true });

const bundle = {
  schema: "success-os.jordan-curriculum-export.v1",
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
    "Grade 1 reference tree is the densest verified sample in this bundle.",
    "Grade catalogue URLs point to official NCCD textbook pages for further pull.",
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
  gradesCatalogue: [
    { grade: 1, stageAr: "التعليم الأساسي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68" },
    { grade: 2, stageAr: "التعليم الأساسي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/69" },
    { grade: 3, stageAr: "التعليم الأساسي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/70" },
    { grade: 4, stageAr: "التعليم الأساسي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/71" },
    { grade: 5, stageAr: "التعليم الأساسي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/72" },
    { grade: 6, stageAr: "التعليم الأساسي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/73" },
    { grade: 7, stageAr: "التعليم الأساسي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/74" },
    { grade: 8, stageAr: "التعليم الأساسي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/75" },
    { grade: 9, stageAr: "التعليم الأساسي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/76" },
    { grade: 10, stageAr: "التعليم الأساسي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/77" },
    { grade: 11, stageAr: "التعليم الثانوي — المسار الأكاديمي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/117" },
    { grade: 12, stageAr: "التعليم الثانوي — المسار الأكاديمي", nccdUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/83" },
  ],
  grade1SubjectsVerified: [
    "اللغة العربية",
    "اللغة الإنجليزية",
    "الرياضيات",
    "العلوم",
    "التربية الإسلامية",
    "الدراسات الاجتماعية",
    "المهارات الرقمية",
    "التربية الرياضية",
    "التربية الفنية والموسيقية والمسرحية",
  ],
  referenceDataset: JORDAN_REFERENCE_DATASET,
  officialSourceG1: JORDAN_NATIONAL_G1_OFFICIAL_SOURCE,
  runSummary: {
    ok: result.ok,
    schema: result.schema,
    counts: result.counts || result.snapshot?.counts || null,
    validation: result.validation || null,
  },
  hierarchySnapshot: result.snapshot || result.hierarchy || null,
  filesIncluded: [
    "jordan-national-curriculum.bundle.json",
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

const readme = `# Jordan National Curriculum Export (Success OS)

Country: **Jordan (JO)**  
Curriculum: **Jordan National Curriculum / المنهاج الوطني الأردني**  
Export schema: \`success-os.jordan-curriculum-export.v1\`

## For Manus / importers

1. Start with \`jordan-national-curriculum.bundle.json\` (single file, full package index).
2. Use \`jordan-reference-tree.json\` for Grade 1 hierarchical lessons.
3. Follow \`gradesCatalogue[].nccdUrl\` to pull additional official grade catalogues from NCCD.
4. Do **not** copy textbook prose — structure/metadata/outcomes only unless rights are cleared.

## Official sources

- NCCD: https://www.nccd.gov.jo/
- Textbooks catalogue: https://www.nccd.gov.jo/Ar/Pages/textbooks
- Darsak: https://darsak.gov.jo/
- MoE: https://moe.gov.jo/

## Files

| File | Purpose |
|------|---------|
| jordan-national-curriculum.bundle.json | Master bundle |
| jordan-reference-tree.json | G1 subject→book→unit→lesson tree |
| jordan-reference-lesson-metadata.json | Lesson metadata sample |
| jordan-reference-ile-package.json | Sample ILE package |
| jordan-g1-math-ile-package.json | Math G1 ILE sample |
| jordan-reference-validation-report.json | Verification report |
| MANIFEST.json | Checksums + file list |
| README.md | This file |
`;

fs.writeFileSync(path.join(outDir, "README.md"), readme);

const files = fs
  .readdirSync(outDir)
  .filter((f) => f !== "MANIFEST.json")
  .sort();

const manifest = {
  schema: "success-os.jordan-curriculum-export-manifest.v1",
  country: "JO",
  exportedAt: new Date().toISOString(),
  branchHint: "cursor/student-ai-learning-stack-bca1",
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

console.log("Jordan curriculum export ready at", outDir);
console.log(JSON.stringify(manifest.files, null, 2));
