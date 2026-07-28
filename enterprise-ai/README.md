# Success OS — Enterprise AI Operating System (AIOS)

Permanent intelligent operating layer for **Success AI OS**.

**Additive only.** Does not modify existing routes, pages, database schema, UI, APIs, or business logic.

## Success AI OS map

```
Coding Factory          Education Factory         Media Factory
Claude Code · OpenAI    Claude · Gemini · Wolfram HeyGen · ElevenLabs
Cursor                                            OpenAI Images · Blender
                    ↓
            Master Orchestrator (AIOS)
                    ↓
     GitHub · Supabase · Browserbase · Playwright · Sentry · Vercel
```

## Pipeline

```
Factories (Coding / Education / Media)
→ AI Gateway
→ Master Orchestrator
→ Planning Engine (factory-tagged tasks)
→ Parallel Agent Dispatcher
→ Result Aggregator
→ Quality / Security / Performance gates
→ Report (REVIEW default)
```

## Quick start

```bash
npm run ai:aios:detect
npm run ai:aios:factories
npm run ai:aios:health
npm run ai:aios:test
npm run ai:aios -- "Research official curriculum sources and propose a secure API extension plan"
npm run ai:aios:execute -- "Approved objective"
```

Default mode is **REVIEW** (`AIOS_AUTO_COMMIT=false`). See [docs/SETUP.md](./docs/SETUP.md) and [docs/AIOS_ARCHITECTURE.md](./docs/AIOS_ARCHITECTURE.md).
