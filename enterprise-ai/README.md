# Success OS — Enterprise AI Operating System (AIOS)

Permanent intelligent operating layer for Success OS.

**Additive only.** Does not modify existing routes, pages, database schema, UI, APIs, or business logic.

## Pipeline

```
AI Gateway
→ Master Orchestrator
→ Planning Engine
→ Task Queue
→ Parallel Agent Dispatcher
→ Result Aggregator
→ Quality Validator
→ Security Validator
→ Performance Optimizer
→ Automatic Documentation
→ Git Integration
→ Cursor Project Update (report)
```

## Quick start

```bash
npm run ai:aios:detect
npm run ai:aios:health
npm run ai:aios:test
npm run ai:aios -- "Research official curriculum sources and propose a secure API extension plan"
# Explicit execute (still no auto-commit/push/deploy by default):
npm run ai:aios:execute -- "Approved objective"
```

Default mode is **REVIEW** (`AIOS_AUTO_COMMIT=false`). Add provider keys and model ids in `.env.local` — see [docs/SETUP.md](./docs/SETUP.md) and [docs/AIOS_ARCHITECTURE.md](./docs/AIOS_ARCHITECTURE.md).
