# Jordan National Curriculum Export (Success OS)

Country: **Jordan (JO)**  
Curriculum: **Jordan National Curriculum / المنهاج الوطني الأردني**  
Export schema: `success-os.jordan-curriculum-export.v1`

## For Manus / importers

1. Start with `jordan-national-curriculum.bundle.json` (single file, full package index).
2. Use `jordan-reference-tree.json` for Grade 1 hierarchical lessons.
3. Follow `gradesCatalogue[].nccdUrl` to pull additional official grade catalogues from NCCD.
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
