# ADR-0054 — Universal Curriculum Mapping Engine (UCE)

**Status:** Accepted  
**Date:** 2026-07-30  
**PR:** #54 Universal Curriculum Mapping Engine  
**Depends on:** ADR-0049, ADR-0050, ADR-0050.3 (Global Curriculum Registry / GitHub PR #53)

## Context

Success OS must relate lessons across national and international curricula without copying content or hardcoding any single country. The Global Curriculum Registry (#50.3 / PR #53) provides identity and hierarchy; UCE provides the translation layer.

## Decision

1. UCE is a **relationship engine**, not a content generator or curriculum copier.
2. All mappings reference **immutable Global IDs** (`MAP`, `OBJ`, `CMP`, `STD`, `ASO`, plus existing `CTR/CUR/GRD/SUB/LSN/SKL/…`).
3. Supported relations: Equivalent, Partially Equivalent, Prerequisite, Advanced, Related, Continuation, Replacement, Historical Version — each with **confidence** and **evidence**.
4. **Global Learning Objective Registry** normalizes objectives and links lessons, skills, assessments; digital books / videos / AI tutors are reserved fields only.
5. **Global Skill Graph** connects lessons across countries via the Global Skill Registry.
6. **Search index** supports multilingual queries by country, curriculum, grade, subject, book, lesson, skill, objective, keyword, standard, language.
7. No AI generation of lessons, videos, books, quizzes, or assessments in this PR.
8. ILE remains the only lesson runtime; UCE never renders lessons.

## Consequences

- Cross-curriculum recommendations and future AI tutors consume UCE mappings — they do not invent parallel content stores.
- New countries/curricula add mapped entities + evidence rows; platform core stays country-agnostic.

## Alternatives rejected

- Copying full foreign curricula into Jordan (or any country) trees.
- Hardcoding Jordan-only equivalence tables in the platform core.
- Generating AI lessons as part of mapping.
