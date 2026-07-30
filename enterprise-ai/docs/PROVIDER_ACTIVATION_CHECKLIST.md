# SUCCESS AI OS — Provider Activation Checklist

**Lifecycle ladder (no skipping):**

```
SLOT
  ↓
CONFIGURED
  ↓
LIVE VERIFIED
  ↓
READY          ← dashboard green
  ↓
PRODUCTION CERTIFIED ⭐
```

| Stage | Meaning | Colour |
|-------|---------|--------|
| **SLOT** | Listed in config; no usable credentials/adapter yet | grey |
| **CONFIGURED** | Credentials/package detected — never green alone | yellow |
| **LIVE VERIFIED** | Authenticated live probe succeeded | yellow |
| **READY** | Live verified + persisted evidence complete | **green** |
| **PRODUCTION CERTIFIED ⭐** | READY + stability streak (default 3) and/or explicit certify flag; media also needs `generationVerified` | **green + ⭐** |

No provider may jump from SLOT/CONFIGURED to READY or PRODUCTION CERTIFIED.

**Rule:** No provider may skip from `SLOT` / `NOT_CONFIGURED` / `CREDENTIALS_DETECTED` to `READY`.

Every provider must pass, in order:

1. **Configuration detected** — required env vars present (no secrets logged) → CONFIGURED
2. **Authentication probe** — authenticated, non-destructive API/local call
3. **Capability probe** — minimal capability confirmed (not paid media generation) → LIVE VERIFIED
4. **Persisted evidence** — written to health state store → READY
5. **Dashboard READY** — green only when evidence is complete
6. **Production certification** — consecutive successful probes and/or `AIOS_CERTIFY_<PROVIDER>=true` → ⭐

## Required activation order

| # | Provider | Factory | Notes |
|---|----------|---------|--------|
| 1 | Playwright | infrastructure | Local Chromium smoke — **current checkpoint** |
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
  → CONFIGURED (package available; CREDENTIALS_NOT_REQUIRED)
  → LIVE VERIFIED (Chromium launch + local smoke passed)
  → READY (evidence persisted — dashboard green)
  → PRODUCTION CERTIFIED ⭐ (after certify streak / explicit flag)
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
