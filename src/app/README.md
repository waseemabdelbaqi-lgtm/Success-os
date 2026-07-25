# Intended `src/app` layout

Next.js allows **either** root `app/` **or** `src/app/` as the App Router root — not both.

This repository already uses root `app/` for the full SUCCESS OS product. Admission funnel **routes** therefore live under:

| Route | Path |
|---|---|
| Funnel UI | `app/admission-funnel/page.tsx` |
| Stripe Checkout | `app/api/checkout/route.ts` |
| Checkout confirm | `app/api/checkout/confirm/route.ts` |
| Stripe webhook | `app/api/webhooks/stripe/route.ts` |

Domain code (recommended `src/` layout) lives here:

```
src/
  actions/admission.ts          # filterInstitutions, submitApplication, uploads
  components/
    ui/                         # Shadcn-style primitives
    admission-funnel/           # Funnel UI
  lib/
    supabase/                   # clients
    stripe.ts / resend.ts
    admission/                  # fallback catalogue, preview store, email HTML
  types/admission.ts
```

When migrating the whole product to `src/app/`, move the `app/` tree into `src/app/` in one PR.
