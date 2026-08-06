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
        ├── JO-NATIONAL-G01-MATH          (SUB-00001)
        │   ├── JO-NATIONAL-G01-MATH-B01
        │   │   ├── …-U01 → L01–L03
        │   │   └── …-U02 → L01–L02
        │   └── JO-NATIONAL-G01-MATH-B02
        │       └── …-U01-L01 (rights restricted)
        ├── JO-NATIONAL-G01-AR            (SUB-00006)
        ├── JO-NATIONAL-G01-EN            (SUB-00007; includes one rejected lesson)
        ├── JO-NATIONAL-G01-SCI           (SUB-00002)
        ├── JO-NATIONAL-G01-ISL           (SUB-00008)
        ├── JO-NATIONAL-G01-SOC           (SUB-00009)
        ├── JO-NATIONAL-G01-ART           (SUB-00010)
        └── JO-NATIONAL-G01-PE            (SUB-00011)
```

Official Grade 1 subjects (discovered; see PR #50.3):  
`AR · EN · MATH · SCI · ISL · SOC · ART · PE`  
Physics / Chemistry / Biology are **not** present at Grade 1.

## Global Subject Registry

Country-agnostic subject identity. Local labels differ; the **global id is shared**.

```
Jordan  → رياضيات     → SUB-00001
USA     → Mathematics → SUB-00001
Egypt   → رياضيات     → SUB-00001
```

Hierarchical curriculum ids (e.g. `JO-NATIONAL-G01-MATH`) also map to these codes — they do not replace them.

| Global ID | Code | Name |
|-----------|------|------|
| `SUB-00001` | MATH | Mathematics |
| `SUB-00002` | SCI | Science |
| `SUB-00003` | PHYSICS | Physics |
| `SUB-00004` | CHEMISTRY | Chemistry |
| `SUB-00005` | BIOLOGY | Biology |
| `SUB-00006` | AR | Arabic |
| `SUB-00007` | EN | English |
| `SUB-00008` | ISL | Islamic Education |
| `SUB-00009` | SOC | Social Studies |
| `SUB-00010` | ART | Art |
| `SUB-00011` | PE | Physical Education |

See also [`global-curriculum-registry.md`](./global-curriculum-registry.md) (PR #50.3).

Schema: `success-os.global-subject-registry.v1`  
Module: `lib/curriculum-import-engine/hierarchy/global-subject-registry.ts`  
Sample: [`global-subject-registry.example.json`](../../content/demo/generated/global-subject-registry.example.json)  
API:
- `GET /api/curriculum-import-engine?action=global-subject-registry`
- `GET …&action=global-subject-registry&country=JO&localLabel=رياضيات` → `SUB-00001`

Rules:
- **append-only** — never reuse a retired `SUB-XXXXX` id  
- **one global Math** — new countries add a *country alias*, never a second Math SUB id

## Global Skill Registry

Country-agnostic skills. Lessons store `skills: ["SKL-00001", …]`.

| Global ID | Skill | Primary subjects |
|-----------|-------|------------------|
| `SKL-00001` | Arithmetic | SUB-00001 Mathematics |
| `SKL-00002` | Fractions | SUB-00001 Mathematics |
| `SKL-00003` | Vectors | SUB-00003 Physics |
| `SKL-00004` | Newton Laws | SUB-00003 Physics |
| `SKL-00005` | Acids | SUB-00004 Chemistry |
| `SKL-00006` | Reading | SUB-00006 / SUB-00007 |
| `SKL-00007` | Writing | SUB-00006 / SUB-00007 |
| `SKL-00008` | Critical Thinking | cross-cutting |
| `SKL-00009` | Decimals | SUB-00001 Mathematics |
| `SKL-00010` | Percentages | SUB-00001 Mathematics |
| `SKL-00011` | Algebra | SUB-00001 Mathematics |
| `SKL-00012` | Functions | SUB-00001 Mathematics |
| `SKL-00013` | Counting | SUB-00001 Mathematics |
| `SKL-00014` | Addition | SUB-00001 Mathematics |
| `SKL-00015` | Observation | SUB-00002 Science |
| `SKL-00016` | Scientific Thinking | SUB-00002 Science |

### Math skill pathway

```
Fractions
↓
Decimals
↓
Percentages
↓
Algebra
↓
Functions
```

Ids: `SKL-00002` → `SKL-00009` → `SKL-00010` → `SKL-00011` → `SKL-00012`  
(Each skill `dependsOn` the previous; Fractions also depends on Arithmetic.)

Schema: `success-os.global-skill-registry.v1`  
Module: `lib/curriculum-import-engine/hierarchy/global-skill-registry.ts`  
Samples: [`global-skill-registry.example.json`](../../content/demo/generated/global-skill-registry.example.json), [`skill-pathway.example.json`](../../content/demo/generated/skill-pathway.example.json)  
API:
- `GET /api/curriculum-import-engine?action=global-skill-registry`
- `GET /api/curriculum-import-engine?action=skill-pathway`

Rule: **append-only** — never reuse a retired `SKL-XXXXX` id.

## Student skill progress

```
Student
↓ Completed Lessons
↓ Completed Skills
↓ Missing Skills
↓ Weak Skills
↓ Recommended Lessons
```

| Stage | Meaning |
|-------|---------|
| Completed Lessons | Hierarchical lesson ids the student finished |
| Completed Skills | Union of `SKL-XXXXX` from those lessons |
| Missing Skills | Target skills not yet in completed set |
| Weak Skills | Skills started but not covered by all teaching lessons |
| Recommended Lessons | Next ILE lessons that address missing/weak skills |

Schema: `success-os.student-skill-progress.v1`  
Module: `lib/curriculum-import-engine/student/skill-progress.ts`  
Sample: [`student-skill-progress.example.json`](../../content/demo/generated/student-skill-progress.example.json)  
API: `GET /api/curriculum-import-engine?action=student-skill-progress`  
Demo: after completing `JO-NATIONAL-G01-MATH-B01-U01-L01` → recommends L02/L03 for Fractions / weak Arithmetic.

No AI tutoring in this contract — recommendations are rule-based over verified lesson metadata.

## Lesson dependency

```
Lesson
↓ depends on
Lesson
↓ depends on
Lesson
```

| Field | Role |
|-------|------|
| `dependsOn` | Explicit prerequisite lesson ids |
| `prerequisites` / `parentLesson` | Compatibility aliases used when building the graph |
| `nextLessons` / `childLessons` | Forward links (dependents) |

Example (Math Unit 1):

`JO-NATIONAL-G01-MATH-B01-U01-L03` → depends on → `…-L02` → depends on → `…-L01`

Schema: `success-os.lesson-dependency.v1`  
Module: `lib/curriculum-import-engine/hierarchy/lesson-dependency.ts`  
Sample: [`lesson-dependency.example.json`](../../content/demo/generated/lesson-dependency.example.json)  
API: `GET /api/curriculum-import-engine?action=lesson-dependency`

Unlock order is the reverse of the display chain (complete L01 before L02 before L03).

Fixture: `content/demo/jordan-reference-dataset.ts`  
Sample tree JSON: [`content/demo/generated/jordan-reference-tree.example.json`](../../content/demo/generated/jordan-reference-tree.example.json)

## Lesson metadata (required fields)

Every lesson stores metadata only — **global lesson contract** + hierarchy projection.

### Global lesson fields

| Field | Example / notes |
|-------|-----------------|
| Lesson UUID | Deterministic UUID from global id |
| Global Lesson ID | `JO-NATIONAL-G01-MATH-B01-U01-L01` |
| Global Subject ID | `SUB-00001` (Mathematics) |
| Curriculum ID | `JO-NATIONAL` |
| Country ID | `JO` |
| Language | `ar` / `en` / `bilingual` |
| Version | Platform content version (`1.0.0`) |
| Official Version | Official curriculum edition (`JO-NCCD-2025/2026`) |
| Platform Version | `success-os.curriculum-hierarchy.v1` |
| Parent Lesson | Previous lesson global id or `null` |
| Child Lessons | Child lesson global ids |
| Related Lessons | Sibling / related global ids |
| Prerequisites | Prerequisite global ids |
| Depends On | Explicit lesson dependency ids (`Lesson → depends on → Lesson`) |
| Next Lessons | Next lesson global ids |
| Estimated Duration | Minutes (e.g. `25`) |
| Difficulty | `core` / `support` / `extension` / `advanced` |
| Bloom Level | `remember`…`create` |
| Skills | Global Skill Registry ids (`SKL-XXXXX`) |
| Tags | Hierarchy + topic tags |
| AI Ready | `false` until AI PRs (#52–53) |
| Published | Boolean publish flag |
| Verified | Boolean verification flag |
| Archived | Boolean archive flag |

### Hierarchy / packaging fields

| Field | Description |
|-------|-------------|
| Country / Curriculum / Grade / Semester / Subject / Book / Unit / Lesson | Human-readable projection |
| Lesson Order | Integer order within unit |
| Official Lesson Title | LocaleText |
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
| Subject | id (hierarchical), globalSubjectId (`SUB-XXXXX`), gradeId, code |
| Global Subject | id (`SUB-XXXXX`), code, name, family, order, active |
| Book | id, subjectId, part, version, rights, verification, checksum |
| Unit | id, bookId, order, title |
| Lesson | id, unitId, objectives, keywords, references, rights, verification, checksum, metadata, published, ilePackageId |
| LessonMetadataRecord | global lesson contract (UUID, globalLessonId, graph, Bloom, flags) + hierarchy projection |
| LessonVerificationReport | six-dimension verification |
| ILE Package | `success-os.interactive-lesson-engine.v1` |

Types: `types/curriculum-hierarchy.ts`

## Import dashboard KPIs

`/admin/curriculum-import` displays:

Countries · Curricula · Grades · Global Subjects · Global Skills · Subjects · Books · Units · Lessons · Verified / Pending / Rejected Packages · Import Queue · Import Progress · Validation Errors · Rights Warnings

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
