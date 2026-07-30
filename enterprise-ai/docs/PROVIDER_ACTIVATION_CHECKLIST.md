# SUCCESS AI OS — Provider Activation Checklist

**Trust lifecycle ladder (no skipping):**

```
SLOT ⚪
  ↓
NOT_CONFIGURED ⚪
  ↓
CREDENTIALS_DETECTED 🟡
  ↓
PROBE_RUNNING 🟡
  ↓
READY 🟢
  ↓
PRODUCTION_CERTIFIED 🟢⭐
  ↓
MISSION_CRITICAL 🟢⭐⭐
```

| Stage | Meaning | Mark |
|-------|---------|------|
| **SLOT** | Listed; no usable adapter | ⚪ |
| **NOT_CONFIGURED** | Adapter present; credentials missing | ⚪ |
| **CREDENTIALS_DETECTED** | Credentials/package detected — never green alone | 🟡 |
| **PROBE_RUNNING** | Live probe in progress / transitional | 🟡 |
| **READY** | Authenticated live probe + persisted evidence | 🟢 |
| **PRODUCTION_CERTIFIED** | Explicit `--certify` from READY only | 🟢⭐ |
| **MISSION_CRITICAL** | Explicit `--mission-critical` from PRODUCTION_CERTIFIED only | 🟢⭐⭐ |

**Hard rules**

- Stage skipping is forbidden.
- READY requires a successful authenticated live probe with persisted evidence.
- Never infer readiness from adapters, configuration files, or detected credentials alone.
- `PRODUCTION_CERTIFIED` is granted **only** by:
  `npm run ai:aios:health -- --provider=<id> --certify`
  (fresh live probe → verify requirements → reject with structured diagnostics if not READY).
- `MISSION_CRITICAL` is granted **only** by:
  `npm run ai:aios:health -- --provider=<id> --mission-critical`
  (fresh live probe → confirm PRODUCTION_CERTIFIED → operational thresholds → audit).
- Media providers additionally require `generationVerified=true` for star tiers.

## Mission-critical operational thresholds (configurable)

| Env | Default | Meaning |
|-----|---------|---------|
| `AIOS_PRODUCTION_CERTIFY_MIN_STREAK` | 1 | Min consecutive successes for certify |
| `AIOS_MISSION_CRITICAL_MIN_STREAK` | 5 | Min consecutive successes |
| `AIOS_MISSION_CRITICAL_SUCCESS_RATE` | 0.9 | Min success rate over recent history |
| `AIOS_MISSION_CRITICAL_MAX_LATENCY_MS` | 15000 | Max current/avg latency |
| `AIOS_MISSION_CRITICAL_MIN_HISTORY` | 3 | Preferred history sample size |
| `AIOS_FALLBACK_POLICY_DECLARED` | — | Required for most text providers |

Failed verification immediately blocks promotion and returns `diagnostics[].failedRequirements`.

## Required activation order

| # | Provider | Factory | Notes |
|---|----------|---------|--------|
| 1 | Playwright | infrastructure | Local Chromium smoke |
| 2 | Supabase | infrastructure | Authorised read; service-role server-only |
| 3 | GitHub | infrastructure | Authenticated user/repo read; no commits/PRs |
| 4 | OpenAI | coding / education | Minimal text; configured model required |
| 5 | Claude (Anthropic) | coding / education | Minimal message; configured model required |
| 6 | Gemini | education | Minimal text; configured model required |
| 7 | Wolfram | education | Lightweight query (e.g. 2+2) |
| 8 | Browserbase | infrastructure | Account/project status; sessions optional |
| 9 | Sentry | infrastructure | Auth/SDK check; live event only if approved |
| 10 | Vercel | infrastructure | Read-only project metadata — **NEVER_AUTO_DEPLOY** |
| 11 | ElevenLabs | media | Account/voices only — no paid audio in standard health |
| 12 | HeyGen | media | Account/avatars only — no video generation in standard health |
| 13 | OpenAI Images | media | Separate from text; generation requires approval |

## Commands

```bash
# Config only (never READY)
npm run ai:aios:health -- --mode=config --provider=playwright

# Live probe one provider
npm run ai:aios:health -- --mode=live --provider=playwright

# Explicit PRODUCTION CERTIFIED 🟢⭐ (requires READY after fresh live probe)
npm run ai:aios:health -- --provider=playwright --certify

# Explicit MISSION CRITICAL 🟢⭐⭐ (requires PRODUCTION_CERTIFIED + operational checks)
npm run ai:aios:health -- --provider=playwright --mission-critical

# Full live sweep
npm run ai:aios:health -- --mode=live

# Playwright smoke (local only by default)
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e:smoke
```

## Safety

- Do not commit `.env.local` or secrets
- Do not deploy / merge from health probes
- Vercel health never deploys
- Remote Playwright URLs require `PLAYWRIGHT_ALLOW_REMOTE=true`
- Trust audit: `data/master-ai-orchestrator/health/provider-trust-audit.json` (gitignored)
