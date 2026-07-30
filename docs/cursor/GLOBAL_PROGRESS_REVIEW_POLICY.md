# Global Progress & Review Policy

This policy applies to **every** implementation order, feature, milestone, Pull Request, and architectural change in Success OS.

## Mandatory completion report

At the end of every completed order, **automatically** generate a comprehensive implementation report. Never end an implementation without this report. Never require the user to ask separately for review links, progress, or status.

### Required sections (exact order)

1. **Objective** — what was requested; what was implemented  
2. **Completion Status** — ✅ / 🟡 / ❌ + overall completion %  
3. **Deliverables** — every completed feature  
4. **Files** — created / modified / deleted  
5. **Architecture Impact**  
6. **Dependencies** — packages, SDKs, APIs, services, infrastructure  
7. **Performance Impact**  
8. **Testing** — unit, integration, build, lint, typecheck, manual  
9. **Review** — PR URL, branch, commit, preview, files, architecture notes, testing, deployment, known issues, reviewer notes  
10. **Roadmap Progress** — full roadmap with current stage highlighted  
11. **Blockers**  
12. **Recommendations**  
13. **Next Order** — complete implementation order for the next PR  
14. **Architecture Decision Record (ADR)** — when an architectural decision is made or affirmed; link the ADR under `docs/cursor/adr/`  
15. **Definition of Done** — merge gate checklist (must be green before merge)  

## Definition of Done (merge gate)

A PR **cannot be merged** until:

| Gate | Requirement |
|------|-------------|
| ✅ Tests pass | Contract / unit / required validate scripts for the change |
| ✅ Lint passes | `npm run lint` |
| ✅ Typecheck passes | `npm run typecheck` |
| ✅ Build passes | `npm run build` |
| ✅ Documentation updated | Feature/architecture docs under `docs/cursor/` |
| ✅ Roadmap updated | `learning-platform-roadmap.md` reflects status |
| ✅ Completion report generated | `docs/cursor/reports/pr-<N>-completion-report.md` |
| ✅ Review section completed | Section 9 of the completion report filled |
| ✅ ADR added (if architecture changed) | Under `docs/cursor/adr/` when runtime/contracts change |

Record gate results in section **15** of every completion report.  

## Sync rules

- Always keep [`learning-platform-roadmap.md`](./learning-platform-roadmap.md) synchronized  
- Always identify the **active** Pull Request  
- Always identify the **next** Pull Request  
- Store the latest completion report under `docs/cursor/reports/` as `pr-<N>-completion-report.md`  

## Roadmap stages (reference)

| Stage | Status key |
|-------|------------|
| Completed | ✅ |
| Current / in progress | 🔄 |
| Pending | ⏳ |
| Blocked | ⛔ |
| Partial | 🟡 |
