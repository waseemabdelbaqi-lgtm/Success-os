# AIOS Architecture

## Principles

1. **Provider independence** — Application code never imports OpenAI/Anthropic/Gemini SDKs. All model I/O goes through `AI Gateway`.
2. **Unlimited providers** — Register future providers with `registerProvider(id, adapter)`.
3. **Modular agents** — Register specialists with `registerAgent(id, runner)`.
4. **Non-destructive** — AIOS extends Success OS; it does not rewrite working features.
5. **MCP-first** — When Cursor MCP is available, prefer MCP adapters over manual workflows.

## Layers

| Layer | Module |
|-------|--------|
| AI Gateway | `src/gateway/ai-gateway.js` |
| Master Orchestrator | `src/aios.js` |
| Planning Engine | `src/planning/engine.js` |
| Task Queue / Dispatcher | `src/queue/dispatcher.js` |
| Result Aggregator | `src/result-aggregator.js` |
| Quality Validator | `src/quality-validator.js` |
| Security Validator | `src/security/validator.js` |
| Performance Optimizer | `src/performance/optimizer.js` |
| Automatic Documentation | `src/documentation/auto-docs.js` |
| Git Integration | `src/git-automation.js` |
| MCP Bridge | `src/mcp/bridge.js` |

## Agents

Engineering, Backend, Frontend, Database, Security, Performance, Curriculum, Research, Video, Voice, Translation, Testing, Accessibility, Documentation, Deployment, Monitoring (+ future custom agents).

## Quality gates

Rejects placeholder content, missing files, apparent secrets, and related defects. Security validator enforces OWASP-oriented checks. Performance optimizer flags regression risk. Git auto-commit remains disabled by default.
