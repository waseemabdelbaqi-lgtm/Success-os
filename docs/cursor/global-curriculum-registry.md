# Global Curriculum Registry & Dynamic Curriculum Architecture (PR #50.3)

Permanent foundation for every current and future educational system.  
**Jordan is the first reference implementation — not a hardcoded platform model.**

## Hierarchy

```
World
↓
Country
↓
Curriculum
↓
Academic Year
↓
Grade
↓
Semester (if applicable)
↓
Subject
↓
Book
↓
Unit
↓
Lesson
↓
ILE Package
```

Schema: `success-os.global-curriculum-registry.v1`  
Module: `lib/curriculum-import-engine/hierarchy/global-curriculum-registry.ts`

## Immutable Global IDs

| Kind | Prefix | Example |
|------|--------|---------|
| World | `WLD` | `WLD-00001` |
| Country | `CTR` | `CTR-00001` |
| Curriculum | `CUR` | `CUR-00001` |
| Academic Year | `AYR` | `AYR-00001` |
| Grade | `GRD` | `GRD-00001` |
| Semester | `SEM` | `SEM-00001` |
| Subject | `SUB` | `SUB-00001` |
| Book | `BOK` | `BOK-00001` |
| Unit | `UNT` | `UNT-00001` |
| Lesson | `LSN` | `LSN-00001` |
| Skill | `SKL` | `SKL-00001` |
| ILE Package | `PKG` | `PKG-00001` |

IDs never change when labels or languages update. Hierarchical path ids (e.g. `JO-NATIONAL-G01-MATH-…`) remain curriculum-scoped addresses.

## Dynamic curriculum discovery

The Curriculum Import Engine discovers from **official curriculum sources**:

- Grades, Subjects, Semesters (when present)
- Books, Units, Lessons
- Learning Objectives, References, Assets

Never inject a subject that is absent from the official grade document.

Example — Jordan Grade 1 official set:

`Arabic · English · Mathematics · Science · Islamic Education · Social Studies · Art · Physical Education`

Physics / Chemistry / Biology are **excluded** until an official grade source includes them.

Official source: [`content/demo/official-sources/jordan-national-g1.ts`](../../content/demo/official-sources/jordan-national-g1.ts)  
Discovery: `lib/curriculum-import-engine/discovery/discover.ts`  
API: `GET /api/curriculum-import-engine?action=curriculum-discovery`

## Global Subject Registry

| Global ID | Subject |
|-----------|---------|
| `SUB-00001` | Mathematics |
| `SUB-00002` | Science |
| `SUB-00003` | Physics |
| `SUB-00004` | Chemistry |
| `SUB-00005` | Biology |
| `SUB-00006` | Arabic |
| `SUB-00007` | English |
| `SUB-00008` | Islamic Education |
| `SUB-00009` | Social Studies |
| `SUB-00010` | Art |
| `SUB-00011` | Physical Education |

Cross-country aliases:

- Jordan → رياضيات → `SUB-00001`
- USA → Mathematics → `SUB-00001`
- Egypt → رياضيات → `SUB-00001`

## Global Skill Registry

Examples: Counting, Addition, Fractions, Observation, Scientific Thinking, Critical Thinking, Reading, Writing (`SKL-00001`…`SKL-00016`).

Math pathway: Fractions → Decimals → Percentages → Algebra → Functions.

## Knowledge graph

```
Lesson → requires → Lesson → requires → Lesson
Skill  → depends on → Skill
```

API: `GET /api/curriculum-import-engine?action=knowledge-graph`  
Schema: `success-os.knowledge-graph.v1`

## Student foundation (data model only)

```
Completed Lessons → Completed Skills → Missing Skills → Weak Skills
→ Recommended Lessons → Learning Path
```

No AI in this PR. Schema: `success-os.student-foundation.v1`  
API: `GET /api/curriculum-import-engine?action=student-foundation`

## APIs

| Action | Purpose |
|--------|---------|
| `global-curriculum-registry` | Snapshot + discovery + assertions |
| `curriculum-discovery` | Detected grades/subjects/books |
| `knowledge-graph` | Lesson/skill graph |
| `student-foundation` | Learner data model |
| `run-global-curriculum-registry` (POST) | Ingest official sources |

## Validation

```bash
npm run validate:global-curriculum-registry
npm run validate:jordan-reference-dataset
```

## Out of scope

- ILE runtime changes
- Digital Books
- AI lessons / summaries / videos
- Quizzes / assessments
