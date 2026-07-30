# SUCCESS AI OS — Provider Activation Checklist

**Lifecycle ladder (no skipping):**

```
SLOT
  ↓
NOT_CONFIGURED
  ↓
CREDENTIALS_DETECTED
  ↓
PROBE_RUNNING
  ↓
READY 🟢
  ↓
PRODUCTION_CERTIFIED ⭐
  ↓
MISSION_CRITICAL ⭐⭐
```

| Stage | Meaning | Colour |
|-------|---------|--------|
| **SLOT** | Listed in config; no usable adapter yet | grey |
| **NOT_CONFIGURED** | Adapter present; credentials missing | grey |
| **CREDENTIALS_DETECTED** | Credentials/package detected — never green alone | yellow |
| **PROBE_RUNNING** | Live probe in progress or intermediate after credentials | yellow |
| **READY 🟢** | Live verified + persisted evidence complete | **green** |
| **PRODUCTION_CERTIFIED ⭐** | READY + stability streak (default 3) and/or explicit certify | **green + ⭐** |
| **MISSION_CRITICAL ⭐⭐** | PRODUCTION_CERTIFIED + explicit elevation (or high streak) | **green + ⭐⭐** |

No provider may jump stages. Green is only READY / PRODUCTION_CERTIFIED / MISSION_CRITICAL.

**Rule:** No provider may skip from `SLOT` / `NOT_CONFIGURED` / `CREDENTIALS_DETECTED` to `READY`.

Every provider must pass, in order:

1. **Slot / adapter** — provider listed → SLOT or NOT_CONFIGURED
2. **Credentials detected** — required env vars present (no secrets logged) → CREDENTIALS_DETECTED
3. **Live probe** — authenticated, non-destructive API/local call → PROBE_RUNNING → READY
4. **Persisted evidence** — written to health state store → READY 🟢
5. **Production certification** — consecutive successes and/or `--certify` / `AIOS_CERTIFY_<PROVIDER>=true` → ⭐
6. **Mission critical** — PRODUCTION_CERTIFIED + `--mission-critical` / `AIOS_MISSION_CRITICAL_<PROVIDER>=true` → ⭐⭐

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

## Status progression (example: Playwright)

```
SLOT / NOT_INSTALLED
  → NOT_CONFIGURED / CREDENTIALS_DETECTED (package available; CREDENTIALS_NOT_REQUIRED)
  → PROBE_RUNNING (Chromium launch in progress)
  → READY 🟢 (evidence persisted — dashboard green)
  → PRODUCTION_CERTIFIED ⭐ (after certify streak / explicit --certify)
  → MISSION_CRITICAL ⭐⭐ (after --mission-critical / high streak)
```

Failure statuses (examples): `BROWSER_NOT_INSTALLED`, `BROWSER_LAUNCH_FAILED`,
`LOCAL_APP_UNAVAILABLE`, `TEST_ASSERTION_FAILED`, `PROBE_FAILED`, `NETWORK_FAILED`, `AUTH_FAILED`.

## Media providers

Standard health may set `CONNECTION_READY=true` without `GENERATION_VERIFIED`.

Paid generation (HeyGen video, ElevenLabs audio, OpenAI images) requires:

- explicit admin action
- visible cost warning
- approval
- temporary output acknowledgement

## Commands

```bash
# Config only (never READY)
npm run ai:aios:health -- --mode=config --provider=playwright

# Live probe one provider
npm run ai:aios:health -- --mode=live --provider=playwright

# Explicit PRODUCTION CERTIFIED ⭐ (requires READY first)
npm run ai:aios:health -- --provider=playwright --certify

# Explicit MISSION CRITICAL ⭐⭐ (requires PRODUCTION CERTIFIED first)
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
