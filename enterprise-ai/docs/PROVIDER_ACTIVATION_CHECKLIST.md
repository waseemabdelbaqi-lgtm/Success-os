# SUCCESS AI OS — Provider Activation Checklist

**Rule:** No provider may skip from `SLOT` / `NOT_CONFIGURED` / `CREDENTIALS_DETECTED` to `READY`.

Every provider must pass, in order:

1. **Configuration detected** — required env vars present (no secrets logged)
2. **Authentication probe** — authenticated, non-destructive API/local call
3. **Capability probe** — minimal capability confirmed (not paid media generation)
4. **Persisted evidence** — written to health state store
5. **Dashboard READY** — green only when evidence is complete

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
NOT_INSTALLED
  → CREDENTIALS_NOT_REQUIRED (package available; no API key needed)
  → PROBE_RUNNING
  → READY   (only after Chromium launch + local smoke + persisted evidence)
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
