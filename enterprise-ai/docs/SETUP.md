# AIOS Setup Guide

## 1. Credentials (never commit secrets)

Copy keys from `enterprise-ai/config/.env.orchestrator.example` into `.env.local`.

Supported:

- OpenAI — `OPENAI_API_KEY` / `OPENAI_CONTENT_API_KEY`
- Anthropic — `ANTHROPIC_API_KEY` / `CLAUDE_API_KEY`
- Gemini — `GEMINI_API_KEY` (+ `MASTER_ORCHESTRATOR_ALLOW_GEMINI=true` if `GEMINI_DISABLED=true`)
- Ollama — local loopback fallback (`OLLAMA_BASE_URL`)
- GitHub / Supabase / PostgreSQL / Playwright / media keys as needed

Missing keys do not crash AIOS. Agents degrade to offline stubs and stay activation-ready.

## 2. Commands

```bash
npm run ai:aios:detect    # provider + MCP + agent catalog
npm run ai:aios:test      # smoke tests
npm run ai:aios -- "Your objective"
npm run ai:aios -- --agents
npm run ai:aios -- --smoke "Check homepage with Playwright"
```

Aliases `ai:orchestrator*` remain for compatibility.

## 3. Programmatic use

```js
import { runAIOS, formatAiosDisplay } from './enterprise-ai/src/index.js';

const report = await runAIOS('Plan a secure curriculum API extension');
console.log(formatAiosDisplay(report));
console.log(report.executive);
```

## 4. Git automation

Defaults:

- `MASTER_ORCHESTRATOR_AUTO_COMMIT=false`
- `MASTER_ORCHESTRATOR_DRY_RUN=true`

Enable only in trusted automation environments after quality + security gates pass.

## 5. MCP

When running inside Cursor, inject an MCP caller:

```js
await runAIOS(objective, {
  callMcp: async (server, tool, args) => CallMcpTool(...),
});
```

Targets: filesystem, github, postgresql, supabase, docker, browser, playwright, notion, google-drive.
