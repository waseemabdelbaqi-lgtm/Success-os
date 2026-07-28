# AIOS Setup Guide (Phase 3 — Live Providers)

## 1. Add keys safely

1. Copy `enterprise-ai/config/.env.orchestrator.example` values into **`.env.local`** at the repo root.
2. Fill only the keys and model ids you own. Leave unused providers empty.
3. Never commit `.env.local`. It is gitignored.
4. Never put secrets in source, JSON, docs, logs, runtime reports, or tracked MCP config.

### Windows PowerShell

```powershell
Copy-Item enterprise-ai\config\.env.orchestrator.example .env.local
notepad .env.local
# Set OPENAI_API_KEY / OPENAI_MODEL (and others) — leave unused blank
npm run ai:aios:detect
npm run ai:aios:health
```

### macOS / Linux

```bash
cp enterprise-ai/config/.env.orchestrator.example .env.local
# edit .env.local — set keys + model ids only for providers you use
npm run ai:aios:detect
npm run ai:aios:health
```

The AIOS CLI loads `.env.local` then `.env` via `dotenv` on every platform (no Unix-only syntax required).

## 2. Supported environment variable names

| Provider | Key variables (first wins) | Model |
|----------|----------------------------|-------|
| OpenAI | `OPENAI_API_KEY`, `OPENAI_CONTENT_API_KEY` | `OPENAI_MODEL` (required; empty → `MODEL_NOT_CONFIGURED`) |
| Anthropic | `ANTHROPIC_API_KEY`, `CLAUDE_API_KEY` | `ANTHROPIC_MODEL` |
| Gemini | `GEMINI_API_KEY` → `GOOGLE_API_KEY` → `GOOGLE_GENERATIVE_AI_API_KEY` | `GEMINI_MODEL` |
| Ollama | n/a (local) | `OLLAMA_MODEL` + `OLLAMA_BASE_URL` |

Role routing vars: `AIOS_DEFAULT_PROVIDER`, `AIOS_ENGINEERING_PROVIDER`, `AIOS_FRONTEND_PROVIDER`, `AIOS_BACKEND_PROVIDER`, `AIOS_DATABASE_PROVIDER`, `AIOS_SECURITY_PROVIDER`, `AIOS_CURRICULUM_PROVIDER`, `AIOS_DOCUMENTATION_PROVIDER`, `AIOS_RESEARCH_PROVIDER`, `AIOS_VERIFICATION_PROVIDER`, `AIOS_MULTIMODAL_PROVIDER`, `AIOS_TESTING_PROVIDER`, `AIOS_FALLBACK_PROVIDER`.

Guards: `AIOS_MAX_PARALLEL_TASKS`, `AIOS_REQUEST_TIMEOUT_MS`, `AIOS_MAX_RETRIES`, `AIOS_AUTO_COMMIT=false`, `AIOS_EXECUTION_MODE=review`, `AIOS_COST_LIMIT_ENABLED`, `AIOS_MAX_TASK_COST_USD`, `AIOS_MAX_DAILY_COST_USD`.

Do not invent model names. Use the exact model id available to your account.

## 3. Provider health checks

```bash
npm run ai:aios:detect   # configuration presence only (no secrets)
npm run ai:aios:health   # minimal live probe: expect exact text AIOS_OK
```

Statuses: `READY`, `NOT_CONFIGURED`, `MODEL_NOT_CONFIGURED`, `AUTHENTICATION_FAILED`, `RATE_LIMITED`, `NETWORK_ERROR`, `TIMEOUT`, `MODEL_UNAVAILABLE`, `PROVIDER_ERROR`, `OPTIONAL_OFFLINE`.

Health reports never print API keys or auth headers.

## 4. Provider routing & fallback

| Task family | Order |
|-------------|-------|
| Engineering | OpenAI → Anthropic → Gemini → Ollama |
| Curriculum / docs | Anthropic → OpenAI → Gemini → Ollama |
| Research / verification | Gemini → OpenAI → Anthropic → Ollama |
| Testing | Playwright/local first → OpenAI when reasoning required |
| Security | Local deterministic checks → OpenAI → Anthropic |

Circuit breakers open after repeated failures and recover after cooldown. Ollama is optional fallback only when reachable + model installed; complex curriculum / major repo edits are not auto-routed to a weak local model.

## 5. Cost & concurrency

- Per-task and daily limits via `AIOS_MAX_TASK_COST_USD` / `AIOS_MAX_DAILY_COST_USD`.
- Without `AIOS_PROVIDER_PRICING_JSON`, estimated cost is `UNKNOWN` (never invented).
- Parallelism capped by `AIOS_MAX_PARALLEL_TASKS` plus per-provider concurrency.

## 6. REVIEW vs EXECUTE

```bash
# REVIEW (default) — plan, reason, propose patches; no file application / commit / push / deploy
npm run ai:aios -- "Your objective"

# EXECUTE — explicit only; still no auto-commit/push/deploy unless separately approved
npm run ai:aios:execute -- "Your objective"
```

`AIOS_AUTO_COMMIT` must remain `false` unless you intentionally enable it in a trusted environment.

## 7. MCP caller injection

AI providers reason; MCP tools act. Inject from Cursor:

```js
await runAIOS(objective, {
  callMcp: async (server, tool, args) => /* Cursor MCP bridge */,
});
```

Targets: GitHub, Filesystem, Playwright, Browser, PostgreSQL, Supabase, Docker, Notion. Destructive ops require approval. No unrestricted shell or filesystem writes from AI-generated strings.

## 8. Troubleshooting

| Symptom | Action |
|---------|--------|
| `AUTHENTICATION_FAILED` | Rotate/replace key; ensure correct env var name |
| `MODEL_NOT_CONFIGURED` | Set `*_MODEL` — do not leave blank |
| `MODEL_UNAVAILABLE` | Confirm model id for your account; do not silently substitute |
| `RATE_LIMITED` | Wait; retries use exponential backoff; circuit breaker may open |
| Gemini ignored with `GEMINI_DISABLED=true` | Set key+model or `AIOS_ALLOW_GEMINI=true` |
| Ollama `OPTIONAL_OFFLINE` | Start Ollama or ignore (optional) |

## 9. Smoke / validation

```bash
npm run ai:aios:test
```

Uses `AIOS_FORCE_OFFLINE_STUB=true` for deterministic offline validation.
