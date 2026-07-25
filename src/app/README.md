# Admission funnel — intended `src/app` layout

Next.js allows **either** root `app/` **or** `src/app/` as the App Router root — not both.
This monorepo already ships the full SUCCESS OS product from root `app/`, so **route entry files** stay there as thin pages. All funnel domain code lives under `src/`.

## Canonical module map (requested structure)

```
src/
  app/
    README.md                 ← this file (folder map)
  actions/
    admission.ts              ← filterInstitutions, uploadAdmissionDocument, submitApplication
  components/
    ui/                       ← Shadcn primitives (button, dialog, input, …)
    admission-funnel/         ← onboarding, cards, payment dialog, apply form, notifications
  hooks/
    use-admission-notifications.ts  ← Supabase Realtime subscription
  lib/
    supabase/ client.ts + server.ts
    stripe.ts · resend.ts · utils.ts
    admission/                ← constants, fallback catalogue, preview store, email HTML
  types/
    admission.ts

app/                          ← Next.js route root (cannot move without migrating whole product)
  admission-funnel/page.tsx   → renders AdmissionFunnelApp
  api/checkout/route.ts       → Stripe Checkout Session ($5 USD)
  api/checkout/confirm/route.ts
  api/webhooks/stripe/route.ts

supabase/migrations/
  20260725_admission_funnel.sql
```

## Workflow wiring

| Step | Implementation |
|---|---|
| 1 Smart filter | `filterInstitutions` Server Action + `OnboardingForm` / `InstitutionCard` |
| 2 Stripe $5 | Blocking `PaymentDialog` → `POST /api/checkout` → webhook unlocks form |
| 3 Application | `ApplicationForm` + Storage upload (`admission-documents`) |
| 4 Dual route | `submitApplication`: partner → DB + Realtime notifications; non-partner → Resend HTML + PDF attachments |

## Env vars

See root `.env.example` (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `RESEND_API_KEY`, `EMAIL_FROM`).
Without credentials the funnel runs in **preview mode** (in-memory store + seeded institutions).
