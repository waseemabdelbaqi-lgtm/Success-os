# Admission funnel — `src/` layout

Next.js prioritizes root `./app` over `./src/app`. This tree is the **source of truth**;
thin re-exports under root `app/` mount the routes.

```
src/
├── app/
│   ├── layout.tsx                 # AdmissionLayout shell
│   ├── page.tsx                   # Smart filter / matching institutions → /admission
│   ├── onboard/page.tsx           → /onboard
│   ├── apply/[institutionId]/page.tsx → /apply/:id (locked until $5)
│   └── api/
│       ├── checkout/route.ts      → /api/checkout
│       └── webhook/stripe/route.ts → /api/webhook/stripe
├── actions/
│   └── submitApplication.ts       # Dual-route Server Action
├── components/
│   ├── ui/
│   ├── InstitutionCard.tsx
│   └── PaymentModal.tsx
└── utils/
    └── supabase/
        ├── client.ts
        └── server.ts
```

## User journey

1. `/onboard` — nationality, GPA, degree, major  
2. `/admission` — filtered institutions + nationality criteria · **Apply Now** opens PaymentModal  
3. Stripe / preview unlock → `/apply/[institutionId]`  
4. `submitApplication` — partner notification **or** Resend email with PDFs  
