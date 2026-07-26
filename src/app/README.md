# SUCCESS OS — University Admission Funnel (`src/`)

Ultra-simplified Arabic admission platform: onboard → smart discovery → $5 Stripe unlock → dual-route apply.

## Routes (mounted from root `app/`)

| URL | Source | Role |
|-----|--------|------|
| `/onboard` | `src/app/onboard/page.tsx` | Nationality + GPA only |
| `/?nationality&gpa` | middleware → `/admission` | Spec-compatible dashboard entry |
| `/admission` | `src/app/page.tsx` | Discovery board + live criteria |
| `/apply/[institutionId]` | `src/app/apply/...` | PDF upload (gated by payment) |
| `/api/checkout` | `src/app/api/checkout` | Stripe $5 session |
| `/api/webhook/stripe` | `src/app/api/webhook/stripe` | Mark payment completed |

> Root `/` without query params remains the marketing homepage (`app/page.jsx`).

## Core actions

- `src/actions/fetchAdmissionCriteria.ts` — cache → Tavily → OpenAI → save
- `src/actions/submitApplication.ts` — Route A partner notifications / Route B Resend email

## Schema

See `supabase/migrations/20260725_admission_funnel.sql`:
`profiles`, `institutions`, `admission_criteria`, `payments`, `applications`, `notifications`.

## Env

Copy from `.env.example`: Supabase, Stripe, `TAVILY_API_KEY`, `OPENAI_API_KEY`, Resend.
Without live keys the funnel runs in **preview mode** (mock criteria + preview checkout).
