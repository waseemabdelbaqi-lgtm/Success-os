# ADR-0059 — Student AI Learning Stack (Orchestration Foundation)

**Status:** Accepted  
**Date:** 2026-07-30  
**PR:** #59 Student AI Learning Stack (Foundation)  
**Depends on:** ADR-0049 (ILE), ADR-0050 / ADR-0050.3 (CIE / GCR), ADR-0054 (UCE)

## Context

The student journey must follow a single official stack:

Student → AI Teacher → Conversation Engine → Reasoning Engine → Knowledge Graph → Digital Books → Videos → Interactive Lesson Engine → Quizzes → Assessments.

Full activation spans Digital Books (#55), AI Media (#56–57), Assessment (#58), and Learning Intelligence (#59). This ADR freezes the **path and orchestration contract** so later engines plug in without forking runtimes.

## Decision

1. The Student AI Learning Stack path order is **immutable** for the product architecture.
2. Orchestration produces a **session plan** — it does not generate lessons, videos, quizzes, or assessments.
3. **Interactive Lesson Engine** remains the only lesson renderer (ADR-0049).
4. **Knowledge Graph** (and UCE mappings) inform Reasoning; they never replace ILE.
5. Digital Books, Videos, Quizzes, and Assessments are **reserved layers** until their engine PRs land.
6. **S4S Intelligence Teacher** appears on Open Lesson with a personalized review prompt derived from skill progress (e.g. Fractions) — scripted, not LLM-generated lessons.
7. Conversation / Reasoning remain **stubs** here; full LLM tutoring is deferred to later AI PRs.

## Consequences

- Later PRs implement layer bodies without changing the path.
- Admin/API can demonstrate the full hop sequence today with safe placeholders.

## Alternatives rejected

- Letting AI Teacher render lessons outside ILE.
- Generating quizzes/videos inside the orchestration PR.
- Country-hardcoded tutoring flows.
