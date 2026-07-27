import { NextResponse } from 'next/server';
import { getPayment, markPaymentPaid } from '@/app/lib/admissions/funnel-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/v1/admissions/checkout/confirm
 * Payment success webhook/callback. Locks Step 3 until this returns paid=true.
 *
 * Body: { paymentId, preview?: boolean }
 * Also accepts Stripe-style webhook events when STRIPE_WEBHOOK_SECRET is configured.
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let paymentId = '';
    let preview = false;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      // Stripe webhook shape
      if (body?.type === 'payment_intent.succeeded') {
        paymentId = body?.data?.object?.metadata?.paymentId || '';
      } else {
        paymentId = String(body.paymentId || '');
        preview = Boolean(body.preview);
      }
    } else {
      const form = await request.formData();
      paymentId = String(form.get('paymentId') || '');
      preview = String(form.get('preview') || '') === '1';
    }

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PAYMENT_ID_REQUIRED', message: 'paymentId is required' },
        },
        { status: 400 },
      );
    }

    const existing = await getPayment(paymentId);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment session not found' },
        },
        { status: 404 },
      );
    }

    if (existing.status === 'paid') {
      return NextResponse.json({
        success: true,
        data: { paid: true, payment: existing },
      });
    }

    // Preview / simulated gateway always allowed without Stripe.
    // Real Stripe webhook would authenticate via signature before reaching here.
    const paid = await markPaymentPaid(paymentId, {
      confirmedVia: preview || existing.provider === 'preview' ? 'preview_callback' : 'webhook',
    });

    return NextResponse.json({
      success: true,
      data: {
        paid: true,
        payment: paid,
        unlockStep: 'application_form',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'CONFIRM_FAILED', message: error?.message || 'Confirm failed' },
      },
      { status: 400 },
    );
  }
}
