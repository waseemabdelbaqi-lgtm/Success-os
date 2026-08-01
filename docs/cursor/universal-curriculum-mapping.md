# Universal Curriculum Mapping Engine (UCE) — PR #54

Translation layer between every curriculum in the world.  
**Goal:** understand relationships — **not** copy curricula.

Parent: [Global Curriculum Registry](./global-curriculum-registry.md) (PR #50.3 / GitHub #53) · ADR-0054

## Core idea

```
Jordan Grade 8 Science
↓ Equivalent Topics
IGCSE Combined Science
↓
AP Biology
↓
US NGSS
↓
IB MYP Science
↓
Cambridge Lower Secondary
↓
Future AI Recommendations (placeholder — no AI content)
```

Every link uses **Global IDs** + **confidence** + **evidence**.

## Mapping entities

Country · Curriculum · Academic Year · Grade · Subject · Book · Unit · Lesson · Skill · Learning Objective · Competency · Standard · Assessment Objective

New ID prefixes: `OBJ` · `CMP` · `STD` · `ASO` · `MAP`

## Mapping types

| Relation | Meaning |
|----------|---------|
| `equivalent` | Same educational intent |
| `partially_equivalent` | Overlapping but not complete |
| `prerequisite` | Must come before |
| `advanced` | Deeper / later treatment |
| `related` | Thematically connected |
| `continuation` | Continues a sequence |
| `replacement` | Supersedes another entity |
| `historical_version` | Prior edition / year |

## Global Learning Objective Registry

Normalized reusable objectives (`OBJ-XXXXX`) linking:

- Lessons · Skills · Assessment Objectives  
- Digital Books / Videos / AI Tutors — **reserved fields only** (`aiTutorReady: false`)

## Global Skill Graph

Lessons across countries contribute edges to skills in the Global Skill Registry (`SKL-XXXXX`).

## Search index

Query by: Country · Curriculum · Grade · Subject · Book · Lesson · Skill · Objective · Keyword · Standard · Language (+ free text).

## APIs

Base: `/api/universal-curriculum-mapping`

| Action | Purpose |
|--------|---------|
| `status` | Engine status |
| `snapshot` | Full UCE snapshot |
| `mappings` | Filterable mapping list |
| `equivalents&lessonId=` | Cross-curriculum equivalents |
| `objectives` | Learning objective registry |
| `skill-graph` | Cross-country skill links |
| `search&q=` | Multilingual search |
| `POST run-uce` | Reset + run seed |

Admin UI: `/admin/universal-curriculum-mapping`

## Validation

```bash
npm run validate:universal-curriculum-mapping
```

## Out of scope

- AI lessons / summaries / videos  
- Digital books  
- Quizzes / assessments generation  
- ILE runtime changes  
- Copying full curricula  

## Samples

- [`universal-curriculum-mapping.example.json`](../../content/demo/generated/universal-curriculum-mapping.example.json)
- [`uce-cross-curriculum-pathway.example.json`](../../content/demo/generated/uce-cross-curriculum-pathway.example.json)
- [`uce-learning-objectives.example.json`](../../content/demo/generated/uce-learning-objectives.example.json)
- [`uce-skill-graph.example.json`](../../content/demo/generated/uce-skill-graph.example.json)
- [`uce-search.example.json`](../../content/demo/generated/uce-search.example.json)
