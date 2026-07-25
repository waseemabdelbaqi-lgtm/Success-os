import { NextResponse } from 'next/server';
import { CONTACT_FEE_USD } from '@/app/data/admission-funnel';
import { createPayment } from '@/app/lib/admissions/funnel-store';
import { globalInstitutions } from '@/app/data/university-registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/v1/admissions/checkout
 * Creates a fixed $5 USD payment session for Apply Now.
 * Stripe PaymentIntent when STRIPE_SECRET_KEY is set; otherwise preview session.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const institutionId = String(body.institutionId || '');
    const institution = globalInstitutions.find((u) => u.id === institutionId);
    if (!institution) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INSTITUTION_NOT_FOUND', message: 'Institution not found' },
        },
        { status: 404 },
      );
    }

    const id = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    let clientSecret = null;
    let provider = 'preview';

    if (stripeKey) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeKey);
        const intent = await stripe.paymentIntents.create({
          amount: CONTACT_FEE_USD * 100,
          currency: 'usd',
          metadata: {
            kind: 'admission_application',
            institutionId,
            paymentId: id,
          },
          automatic_payment_methods: { enabled: true },
        });
        clientSecret = intent.client_secret;
        provider = 'stripe';
      } catch {
        provider = 'preview';
      }
    }

    const payment = await createPayment({
      id,
      kind: 'admission_application',
      amountUsd: CONTACT_FEE_USD,
      currency: 'USD',
      status: 'pending',
      provider,
      institutionId,
      institutionName: institution.name,
      nationality: body.nationality || '',
      studyCountry: body.studyCountry || institution.country,
      studentName: body.studentName || '',
      email: body.email || '',
      createdAt: new Date().toISOString(),
      stripeClientSecret: clientSecret,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          paymentId: payment.id,
          amountUsd: CONTACT_FEE_USD,
          currency: 'USD',
          provider,
          clientSecret,
          confirmUrl: `/api/v1/admissions/checkout/confirm`,
          institutionId,
          institutionName: institution.name,
        },
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'CHECKOUT_FAILED', message: error?.message || 'Checkout failed' },
      },
      { status: 400 },
    );
  }
}
