# ADR-0050 — Curriculum Import Engine is a compiler, not a renderer

**Decision ID:** ADR-0050  
**Status:** Accepted  
**Date:** 2026-07-30  
**PR:** Curriculum Import Engine (Jordan First)  
**Depends on:** [ADR-0049](./ADR-0049-interactive-lesson-engine-single-runtime.md)

---

## Decision

The **Curriculum Import Engine** is the only official pipeline for importing educational content into Success OS. It is a **compiler**: it transforms verified curriculum sources into standardized **ILE packages**. It must **never render** lessons.

## Reason

- Avoid duplicate learning experiences and curriculum-specific viewers  
- Keep verification, rights, and provenance outside the student runtime  
- Scale from Jordan to every national/international curriculum via modular connectors  

## Alternatives Considered

| Alternative | Verdict |
|-------------|---------|
| Curriculum-specific lesson renderers | ❌ Rejected (ADR-0049) |
| Import engine that also displays lessons | ❌ Rejected |
| AI rewrite during import | ❌ Rejected in this phase |

## Consequences

- All imports emit `success-os.interactive-lesson-engine.v1` packages only  
- Unverified content can never be published  
- ILE remains the only runtime that displays educational content  
- Connectors are modular (ministry, authority, OER, licensed, open textbook, internal)  
- Jordan is Phase 1 — first supported curriculum  

## Non-negotiables

1. `rendersLessons: false` forever for this engine  
2. No AI explanations / videos / quizzes generated in import  
3. Human-verifiable gates before publishing queue  
4. Rights and duplicate detection required  

## References

- `docs/cursor/curriculum-import-engine.md`  
- `types/curriculum-import-engine.ts`  
- `lib/curriculum-import-engine/`  
