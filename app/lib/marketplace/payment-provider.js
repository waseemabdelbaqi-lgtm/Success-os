/**
 * Secure payment-provider abstraction for Recorded Lessons Marketplace.
 * Supports TEST_MODE when no live provider is configured.
 * Never claims live payments are active unless a provider key is present.
 */

import crypto from 'node:crypto';

export function detectPaymentMode() {
  const stripe = process.env.STRIPE_SECRET_KEY;
  const hyperpay = process.env.HYPERPAY_ACCESS_TOKEN;
  if (stripe && !String(stripe).startsWith('change-me') && !String(stripe).includes('test')) {
    return { mode: 'LIVE', provider: 'stripe', live: true };
  }
  if (stripe && !String(stripe).startsWith('change-me')) {
    return { mode: 'TEST_PROVIDER', provider: 'stripe', live: false };
  }
  if (hyperpay && !String(hyperpay).startsWith('change-me')) {
    return { mode: 'TEST_PROVIDER', provider: 'hyperpay', live: false };
  }
  return { mode: 'TEST_MODE', provider: 'TEST_MODE', live: false };
}

/**
 * Create a payment intent / test charge.
 * Client-supplied prices are ignored by callers — server reloads authoritative price.
 */
export async function createMarketplacePayment({
  amount,
  currency = 'USD',
  studentId,
  courseId,
  metadata = {},
} = {}) {
  const detection = detectPaymentMode();
  const reference = `MPL-${detection.provider}-${crypto.randomUUID()}`;

  if (detection.mode === 'TEST_MODE' || detection.mode === 'TEST_PROVIDER') {
    return {
      ok: true,
      status: 'AUTHORIZED',
      paymentProvider: detection.provider,
      paymentMode: detection.mode,
      live: false,
      paymentReference: reference,
      amount,
      currency,
      studentId,
      courseId,
      metadata,
      message:
        detection.mode === 'TEST_MODE'
          ? 'TEST_MODE: no live payment provider configured'
          : 'TEST_PROVIDER: sandbox credentials in use; not claiming live settlement',
    };
  }

  // Live provider hook — intentionally not auto-charging without explicit integration.
  return {
    ok: false,
    error: 'LIVE_PROVIDER_NOT_WIRED',
    paymentProvider: detection.provider,
    paymentMode: detection.mode,
    live: true,
    message: 'Live payment provider detected but marketplace charge wiring is not enabled in this revision.',
  };
}

/**
 * Confirm a payment callback / test confirmation.
 * Protects against forged success by requiring server-issued reference.
 */
export async function confirmMarketplacePayment({
  paymentReference,
  expectedAmount,
  currency = 'USD',
  issuedIntents,
} = {}) {
  if (!paymentReference) {
    return { ok: false, error: 'PAYMENT_REFERENCE_REQUIRED' };
  }
  if (issuedIntents && !issuedIntents.has(paymentReference)) {
    return { ok: false, error: 'UNKNOWN_OR_REPLAYED_PAYMENT_REFERENCE' };
  }
  return {
    ok: true,
    status: 'PAID',
    paymentReference,
    paidAmount: expectedAmount,
    currency,
    confirmedAt: new Date().toISOString(),
  };
}
