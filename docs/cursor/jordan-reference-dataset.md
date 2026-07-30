# Jordan Reference Dataset & Verification (PR #50.2)

Jordan is the **official reference curriculum implementation**. This is not “just an import” — it defines the metadata + verification standard every future country must follow.

**Hard rules:** ILE is the only educational runtime (ADR-0049). Import is a compiler (ADR-0050). No AI lessons / summaries / videos / quizzes. No curriculum-specific renderer.

## Hierarchical ID convention (official)

Every future country must use the same nested ID shape:

| Level | ID |
|-------|----|
| Country | `JO` |
| Curriculum | `JO-NATIONAL` |
| Grade | `JO-NATIONAL-G01` |
| Subject | `JO-NATIONAL-G01-MATH` |
| Book | `JO-NATIONAL-G01-MATH-B01` |
| Unit | `JO-NATIONAL-G01-MATH-B01-U01` |
| Lesson | `JO-NATIONAL-G01-MATH-B01-U01-L01` |

Pattern: `{COUNTRY}` → `{COUNTRY}-{CURRICULUM}` → `…-G{nn}` → `…-{SUBJECT}` → `…-B{nn}` → `…-U{nn}` → `…-L{nn}`

Helpers: `JO_IDS` / `JO_CANONICAL_LESSON_ID` in `content/demo/jordan-reference-dataset.ts`

## Reference tree

```
JO
└── JO-NATIONAL
    └── JO-NATIONAL-G01
        ├── JO-NATIONAL-G01-MATH
        │   ├── JO-NATIONAL-G01-MATH-B01
        │   │   ├── …-U01 → L01–L03
        │   │   └── …-U02 → L01–L02
        │   └── JO-NATIONAL-G01-MATH-B02
        │       └── …-U01-L01 (rights restricted)
        ├── JO-NATIONAL-G01-AR
        ├── JO-NATIONAL-G01-EN (includes one rejected lesson)
        ├── JO-NATIONAL-G01-SCI
        ├── JO-NATIONAL-G01-ISL
        └── JO-NATIONAL-G01-SOC
```

Fixture: `content/demo/jordan-reference-dataset.ts`  
Sample tree JSON: [`content/demo/generated/jordan-reference-tree.example.json`](../../content/demo/generated/jordan-reference-tree.example.json)

## Lesson metadata (required fields)

Every lesson stores metadata only:

| Field | Description |
|-------|-------------|
| Country | e.g. Jordan |
| Curriculum | e.g. Jordan National Curriculum |
| Grade / Semester / Subject / Book / Unit / Lesson | Hierarchy projection |
| Lesson Order | Integer order within unit |
| Official Lesson Title | LocaleText |
| Language | ar / en / bilingual |
| Learning Objectives | LocaleText[] |
| Keywords | string[] |
| References | label + optional href |
| Rights Status | unknown / verified / restricted / rejected |
| Verification Status | pending / verified / rejected / unverified |
| Package Version | string |
| Checksum | sha256 over hierarchy identity |
| Verification report | source / rights / structure / metadata / package / publishing |

Sample: [`jordan-reference-lesson-metadata.example.json`](../../content/demo/generated/jordan-reference-lesson-metadata.example.json)

## Verification dimensions

| Dimension | Meaning |
|-----------|---------|
| Source Status | Official authority / connector present |
| Rights Status | Compile/publish rights gate |
| Structure Status | Book → Unit → Lesson hierarchy intact |
| Metadata Status | Title + objectives present |
| Package Status | Verified ILE package compiled |
| Publishing Status | published / pending / blocked / rejected |

**Rejected lessons never publish.**

## ILE package path

```
Official Source → Verification → Metadata → Book → Unit → Lesson
  → ILE Package → Interactive Lesson Engine
```

Canonical published example:

`JO → JO-NATIONAL → JO-NATIONAL-G01 → JO-NATIONAL-G01-MATH → JO-NATIONAL-G01-MATH-B01 → JO-NATIONAL-G01-MATH-B01-U01 → JO-NATIONAL-G01-MATH-B01-U01-L01 → Verified ILE Package → ILE`

Package id: `ile_JO-NATIONAL-G01-MATH-B01-U01-L01`

Sample package: [`jordan-reference-ile-package.example.json`](../../content/demo/generated/jordan-reference-ile-package.example.json)

## Database schema

Schema id: `success-os.curriculum-hierarchy.v1`

| Entity | Key fields |
|--------|------------|
| Country | id, code, name |
| Curriculum | id, countryId, academicYear, kind |
| Grade | id, curriculumId, code, order |
| Semester | id, gradeId, code, order |
| Subject | id, gradeId, semesterId?, code |
| Book | id, subjectId, part, version, rights, verification, checksum |
| Unit | id, bookId, order, title |
| Lesson | id, unitId, objectives, keywords, references, rights, verification, checksum, metadata, published, ilePackageId |
| LessonMetadataRecord | flattened metadata projection (see above) |
| LessonVerificationReport | six-dimension verification |
| ILE Package | `success-os.interactive-lesson-engine.v1` |

Types: `types/curriculum-hierarchy.ts`

## Import dashboard KPIs

`/admin/curriculum-import` displays:

Countries · Curricula · Grades · Subjects · Books · Units · Lessons · Verified / Pending / Rejected Packages · Import Queue · Import Progress · Validation Errors · Rights Warnings

Primary action: **Run Jordan Reference Dataset**

## API

| Method | Action | Purpose |
|--------|--------|---------|
| GET | `?action=jordan-reference-dataset` | Seed + return tree / metadata / package / validation |
| POST | `{ "action": "run-jordan-reference-dataset" }` | Same as above for dashboard |

## Validation report

Sample: [`jordan-reference-validation-report.example.json`](../../content/demo/generated/jordan-reference-validation-report.example.json)

Validator: `npm run validate:jordan-reference-dataset`

## Out of scope

- AI lesson / summary / video generation  
- Quizzes  
- Digital books  
- ILE runtime changes  

## Related

- [ADR-0050.2](./adr/ADR-0050.2-jordan-reference-dataset.md)  
- [Jordan G1 Math reference (#50.1)](./jordan-curriculum-reference.md)  
- [Curriculum Import Engine (#50)](./curriculum-import-engine.md)  
