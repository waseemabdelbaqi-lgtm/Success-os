# ADR-0049 — Interactive Lesson Engine is the only lesson runtime

**Decision ID:** ADR-0049  
**Status:** Accepted  
**Date:** 2026-07-30  
**PR:** [#49](https://github.com/waseemabdelbaqi-lgtm/Success-os/pull/49)  
**Related:** `success-os.interactive-lesson-engine.v1`, [`learning-platform-roadmap.md`](../learning-platform-roadmap.md)

---

## Decision

**Interactive Lesson Engine (ILE) is the only lesson runtime.**

## Reason

Avoid multiple renderers and duplicated learning experiences.

## Alternatives Considered

| Alternative | Verdict |
|-------------|---------|
| Multiple lesson runtimes | ❌ Rejected |
| Curriculum-specific renderers | ❌ Rejected |

## Consequences

- All future content must compile into **ILE packages**.
- **Curriculum Import Engine** (#50) becomes a **compiler**, not a renderer.
- **AI Lesson Generator** (#52–53) publishes **ILE packages only**.
- Digital Book Engine (#51), Assessment (#54), and Labs (#55) extend or emit ILE packages — they must not ship a parallel student lesson viewer.
- Country / curriculum logic lives in **import adapters / compilers**, never inside a second runtime.

## Non-negotiables

1. One viewer stack: `InteractiveLessonViewer` + block/slide engines  
2. One package schema: `success-os.interactive-lesson-engine.v1`  
3. New content sources must provide adapters that output ILE packages  
4. Legacy book reader remains opt-in (`?classic=1`) until retired — not a competing product runtime  

## References

- `docs/cursor/interactive-lesson-engine.md`  
- `docs/cursor/learning-platform-roadmap.md`  
- `docs/cursor/reports/pr-49-completion-report.md`  
- `types/interactive-lesson-engine.ts`  
