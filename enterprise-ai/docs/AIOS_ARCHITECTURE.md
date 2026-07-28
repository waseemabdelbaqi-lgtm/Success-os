# AIOS Architecture (Phase 3)

## Principles

1. **Provider independence** — Application code never imports OpenAI/Anthropic/Gemini SDKs. All model I/O goes through the AI Gateway + Provider Registry.
2. **Official SDKs only** — `openai`, `@anthropic-ai/sdk`, `@google/genai`; Ollama via local HTTP.
3. **Modular agents** — Register specialists with `registerAgent(id, runner)`.
4. **Non-destructive** — AIOS extends Success OS; it does not rewrite working pages, routes, schema, or business APIs.
5. **REVIEW by default** — Propose only; execute/apply/commit/push/deploy require explicit overrides.
6. **MCP-first for actions** — Providers reason; MCP tools perform controlled external actions.

## Layers

| Layer | Module |
|-------|--------|
| Env loader | `src/env/load.js` |
| AI Gateway | `src/gateway/ai-gateway.js` |
| Provider Registry | `src/providers/registry.js` |
| Provider adapters | `src/providers/{openai,anthropic,gemini,ollama-fallback}.js` |
| Cost guards | `src/cost/guards.js` |
| Context selector | `src/context/selector.js` |
| Agent contracts | `src/contracts/agent-output.js` |
| Master Orchestrator | `src/aios.js` |
| Planning Engine | `src/planning/engine.js` |
| Task Queue / Dispatcher | `src/queue/dispatcher.js` |
| Result Aggregator | `src/result-aggregator.js` |
| Quality / Security / Performance | `src/quality-validator.js`, `src/security/validator.js`, `src/performance/optimizer.js` |
| MCP Bridge | `src/mcp/bridge.js` |
| Git Integration | `src/git-automation.js` (disabled by default) |

## Multi-agent flow

```
User objective
  → Master Orchestrator
  → Task Planner (dependency waves)
  → Parallel Dispatcher (AIOS_MAX_PARALLEL_TASKS)
      → Role-routed providers (circuit breaker + concurrency)
  → Result Aggregator
  → Quality + Security gates
  → Report (REVIEW: proposals only)
```

Independent tasks run in parallel; dependents wait. Critical engineering/security failures abort dependent work. Successful independent outputs are preserved for review.

## Structured contracts

Every agent output is validated (Zod). Malformed JSON gets one controlled repair attempt. Unvalidated model output is never written into the repository automatically.

## Context selection

Agents receive objective, subtask, relevant file excerpts (path-cited), architectural rules, and the output schema — not the whole repo, secrets, `node_modules`, or build artifacts.

## Safety defaults

- `AIOS_EXECUTION_MODE=review`
- `AIOS_AUTO_COMMIT=false`
- Auto-push / auto-deploy: never
