# Jordan National Curriculum Export (Success OS) — Grades 1–12

Country: **Jordan (JO)**  
Curriculum: **Jordan National Curriculum / المنهاج الوطني الأردني**  
Export schema: `success-os.jordan-curriculum-export.v2`

## For Manus / importers

1. Start with `jordan-national-curriculum.bundle.json` (package index + G1 reference).
2. Use `jordan-all-grades-index.json` for counts and file pointers for **all 12 grades**.
3. Open `grades/grade-NN-tree.json` for each grade’s subject→book→unit→lesson tree.
4. Keep `jordan-reference-tree.json` as the densest **Grade 1 verified** sample.
5. Follow `gradesCatalogue[].nccdUrl` for official NCCD grade pages.
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
