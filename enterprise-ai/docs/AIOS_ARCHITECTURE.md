# AIOS Architecture — Success AI OS

## System map

```
SUCCESS AI OS
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
 Coding Factory      Education Factory     Media Factory
     │                     │                     │
 Claude Code         Claude               HeyGen
 OpenAI              Gemini               ElevenLabs
 Cursor              Wolfram             OpenAI Images
     │                     │              Blender
     └──────────────┬──────┴──────────────┘
                    │
            Master Orchestrator (AIOS)
                    │
        GitHub • Supabase • Browserbase
                    │
              Playwright • Sentry
                    │
                  Vercel
```

## Factories

| Factory | Mission | Preferred providers | Agents |
|---------|---------|---------------------|--------|
| **Coding** | Engineering, APIs, DB, security, deploy plans | Claude Code / Anthropic, OpenAI, Cursor | engineering, backend, frontend, database, security, performance, deployment, monitoring, documentation, testing, accessibility |
| **Education** | Curriculum, research, verification, translation | Anthropic, Gemini, Wolfram | curriculum, research, translation, documentation |
| **Media** | Video, voice, images, optional 3D | HeyGen, ElevenLabs, OpenAI Images, Blender | video, voice |

Factories are planning/routing namespaces. They do **not** replace the Master Orchestrator — AIOS still owns planning, parallel dispatch, quality/security gates, and REPORT/REVIEW defaults.

## Infrastructure spine

| Tool | Role | AIOS rule |
|------|------|-----------|
| GitHub | source / PRs | no auto-push/merge |
| Supabase | data/auth | no destructive DB without approval |
| Browserbase | remote browser | adapter-ready; optional |
| Playwright | e2e / route smoke | local tools first for testing |
| Sentry | errors | observe only unless explicitly tasked |
| Vercel | deploy target | **never auto-deploy** |

## Principles

1. **Provider independence** — App code never imports provider SDKs; AI Gateway + Provider Registry only.
2. **Official SDKs** — `openai`, `@anthropic-ai/sdk`, `@google/genai`; Ollama local fallback; media/infra via adapters.
3. **Modular agents** — `registerAgent(id, runner)`; factories group agents, they do not hard-wire SDKs into pages.
4. **Non-destructive** — AIOS extends Success OS; no rewrite of routes/pages/schema/business APIs.
5. **REVIEW by default** — Propose only; execute/apply/commit/push/deploy require explicit overrides.
6. **MCP-first for actions** — Providers reason; MCP/infra tools perform controlled external actions.

## Layers

| Layer | Module |
|-------|--------|
| Factories | `config/factories.manifest.json`, `src/factories/registry.js` |
| Env loader | `src/env/load.js` |
| AI Gateway | `src/gateway/ai-gateway.js` |
| Provider Registry | `src/providers/registry.js` |
| Provider adapters | `src/providers/{openai,anthropic,gemini,ollama-fallback,playwright}.js` |
| Cost / context / contracts | `src/cost`, `src/context`, `src/contracts` |
| Master Orchestrator | `src/aios.js` |
| Planning / Dispatcher | `src/planning/engine.js`, `src/queue/dispatcher.js` |
| Gates | quality, security, performance |
| MCP Bridge | `src/mcp/bridge.js` |
| Git Integration | `src/git-automation.js` (disabled by default) |

## Multi-agent flow

```
User objective
  → Master Orchestrator (AIOS)
  → Task Planner (factory-tagged + dependency waves)
  → Parallel Dispatcher (AIOS_MAX_PARALLEL_TASKS)
      → Coding / Education / Media agents via role-routed providers
  → Result Aggregator
  → Quality + Security gates
  → Report (REVIEW: proposals only)
```

## Structured contracts & context

Validated Zod agent outputs (one repair attempt). Context is relevance-selected — never the whole repo or secrets.

## Safety defaults

- `AIOS_EXECUTION_MODE=review`
- `AIOS_AUTO_COMMIT=false`
- Auto-push / auto-deploy: never
