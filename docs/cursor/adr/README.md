# Architecture Decision Records (ADR)

Success OS ADRs for learning-platform and platform architecture decisions.

| ID | Title | Status |
|----|-------|--------|
| [ADR-0049](./ADR-0049-interactive-lesson-engine-single-runtime.md) | Interactive Lesson Engine (ILE) is the only lesson runtime | Accepted |
| [ADR-0050](./ADR-0050-curriculum-import-compiler.md) | Curriculum Import Engine is a compiler, not a renderer | Accepted |
| [ADR-0050.1](./ADR-0050.1-jordan-curriculum-reference.md) | Jordan is the reference curriculum import implementation | Accepted |
| [ADR-0050.2](./ADR-0050.2-jordan-reference-dataset.md) | Jordan Reference Dataset is the official curriculum metadata standard (incl. Global Subject Registry) | Accepted |
| [ADR-0050.3](./ADR-0050.3-global-curriculum-registry.md) | Global Curriculum Registry is the permanent multi-country foundation (dynamic discovery; Jordan first only) | Accepted |
| [ADR-0054](./ADR-0054-universal-curriculum-mapping.md) | Universal Curriculum Mapping Engine relates curricula via Global IDs (never copies content) | Accepted |
| [ADR-0059](./ADR-0059-student-ai-learning-stack.md) | Student AI Learning Stack path is the official orchestration contract (ILE sole runtime) | Accepted |

## Convention

- Decision IDs align with the founding PR when practical (`ADR-0049` ↔ PR #49).  
- New learning-platform PRs that change runtime contracts must add or amend an ADR.  
- Completion reports include section **14. Architecture Decision Record (ADR)** when a decision is made.  
