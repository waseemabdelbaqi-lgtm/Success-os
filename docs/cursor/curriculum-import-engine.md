# Curriculum Import Engine (Jordan First)

Schema: `success-os.curriculum-import-engine.v1`  
Role: **compiler only** — never renders lessons ([ADR-0050](./adr/ADR-0050-curriculum-import-compiler.md)).  
Runtime: packages target `success-os.interactive-lesson-engine.v1` ([ADR-0049](./adr/ADR-0049-interactive-lesson-engine-single-runtime.md)).

## Pipeline

```
Source Discovery → Source Verification → Rights Verification → Metadata Extraction
→ Book Detection → Unit Detection → Lesson Detection → Content Normalization
→ Asset Extraction → ILE Package Builder → Validation → Publishing Queue
```

## Deliverable modules

| Module | Path |
|--------|------|
| IMPORT_PIPELINE | `lib/curriculum-import-engine/pipeline.ts` |
| SOURCE_CONNECTORS | `lib/curriculum-import-engine/connectors/` |
| VERIFICATION_ENGINE | `lib/curriculum-import-engine/verification/engine.ts` |
| RIGHTS_ENGINE | `lib/curriculum-import-engine/rights/engine.ts` |
| METADATA_ENGINE | `lib/curriculum-import-engine/metadata/engine.ts` |
| ILE_PACKAGE_BUILDER | `lib/curriculum-import-engine/ile-package-builder.ts` |
| IMPORT_DASHBOARD | `components/curriculum-import-engine/import-dashboard.tsx` |

## Verification gates

Source · Rights · Duplicate · Metadata · Structure · Package  

**Unverified content can never be published.**

## Jordan Phase 1

- Connector: `jordan-nccd`  
- Demo book: Grade 5 Science Semester 1 structure → ILE packages  
- No AI explanations, rewrites, videos, or quizzes  

## Routes

| Route | Purpose |
|-------|---------|
| `/admin/curriculum-import` | Import dashboard |
| `/api/curriculum-import-engine` | status / dashboard / jobs / run-jordan |

## Validate

```bash
npm run validate:curriculum-import-engine
```
