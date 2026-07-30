# ADR-0055 — AI Teacher Engine (ATE)

**Status:** Accepted  
**Date:** 2026-07-30  
**PR:** #55 AI Teacher Engine  
**Depends on:** ADR-0049 (ILE), ADR-0050 / ADR-0050.3 (CIE / GCR), ADR-0054 (UCE)  
**Related:** ADR-0059 (Student AI Learning Stack foundation — absorbed as tutoring persona + re-explain under ATE)

## Context

Success OS needs a **virtual teacher**, not a chatbot: something that teaches, listens, understands, remembers, guides, assesses, motivates, and adapts — while remaining grounded in the approved curriculum and ILE as the sole lesson runtime.

## Decision

1. The AI Teacher Engine path order is **immutable**:

   Student → AI Teacher → Conversation Engine → Reasoning Engine → Student Memory → Knowledge Graph → Curriculum Registry → Interactive Lesson Engine → Digital Books → Videos → Assessments.

2. ATE provides **architecture, APIs, student memory, orchestration, permissions, and integration points** — not avatars, animations, AI-generated videos, or live classrooms.

3. **Conversation Engine** maps utterances (and multimodal contracts) to student-control intents and affect signals.

4. **Reasoning Engine** selects pedagogical moves (style, pace, re-explain, recommendations) using memory, Knowledge Graph, Global Curriculum Registry, and UCE mappings.

5. **Student Memory** persists name, language, curriculum, grade, subjects, completed/weak/strong skills, prior questions, goals, pace, style, and conversation history across turns.

6. **Safety:** never invent curriculum facts; ground in approved curriculum / verified books / platform KB; state uncertainty when ungrounded.

7. **Voice** and **Whiteboard** are architecture-ready contracts (interrupt/pause/continue; diagrams/equations/highlights/step-by-step) without shipping rendering systems in this PR.

8. **Interactive Lesson Engine** remains the only lesson renderer (ADR-0049). Digital Books (#56), Media (#57), and Assessments (#58) are reserved integration layers.

9. S4S Intelligence Teacher greeting and don’t-understand re-explain remain product capabilities under the AI Teacher layer.

## Consequences

- Later engines plug into reserved layers without changing the ATE path.
- Learning Intelligence (#59) can deepen free-form LLM tutoring on top of these contracts.
- Admin/API can demonstrate grounded teaching turns today with safe placeholders.

## Alternatives rejected

- Treating the AI Teacher as an unconstrained chatbot.
- Rendering lessons outside ILE.
- Inventing curriculum content when citations are missing.
- Shipping avatars, animation systems, AI videos, or live classrooms in this PR.
