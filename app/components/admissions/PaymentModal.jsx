'use client';

import { useState } from 'react';
import { CONTACT_FEE_USD } from '../../data/admission-funnel';

/**
 * Blocking $5 payment modal. Step 3 (application) stays locked until
 * /api/v1/admissions/checkout/confirm returns paid=true.
 */
export default function PaymentModal({
  open,
  institution,
  profile,
  onClose,
  onPaid,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('card');

  if (!open || !institution) return null;

  async function pay(preview = false) {
    setBusy(true);
    setError('');
    try {
      const checkoutRes = await fetch('/api/v1/admissions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: institution.id,
          nationality: profile?.nationality || '',
          studyCountry: profile?.studyCountry || institution.country,
          studentName: profile?.studentName || '',
          email: profile?.email || '',
        }),
      });
      const checkoutJson = await checkoutRes.json();
      if (!checkoutJson.success) {
        throw new Error(checkoutJson.error?.message || 'Checkout failed');
      }

      const paymentId = checkoutJson.data.paymentId;
      const confirmRes = await fetch('/api/v1/admissions/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, preview: preview || checkoutJson.data.provider === 'preview' }),
      });
      const confirmJson = await confirmRes.json();
      if (!confirmJson.success || !confirmJson.data?.paid) {
        throw new Error(confirmJson.error?.message || 'Payment not confirmed');
      }

      onPaid?.({
        paymentId,
        amountUsd: CONTACT_FEE_USD,
        institutionId: institution.id,
        receipt: confirmJson.data.payment,
        provider: checkoutJson.data.provider,
        method,
      });
    } catch (err) {
      setError(err?.message || 'Payment failed');
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  return (
    <div className="funnel-modal-backdrop" role="presentation" onClick={busy ? undefined : onClose}>
      <div
        className="funnel-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="funnel-pay-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <small>STEP 2 · PAYMENT GATEWAY</small>
          <h2 id="funnel-pay-title">Application fee — ${CONTACT_FEE_USD} USD</h2>
          <p>
            Pay a fixed platform fee to unlock the unified application form for{' '}
            <strong>{institution.name}</strong> ({institution.kindLabelAr}).
          </p>
        </header>

        <div className="funnel-pay-summary">
          <div>
            <span>Institution</span>
            <b>{institution.name}</b>
          </div>
          <div>
            <span>Route after payment</span>
            <b>
              {institution.is_partner
                ? 'Partner → in-app notifications'
                : 'Non-partner → official admissions email'}
            </b>
          </div>
          <div>
            <span>Amount due</span>
            <b>${CONTACT_FEE_USD}.00</b>
          </div>
        </div>

        <label className="funnel-field">
          <span>Payment method</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)} disabled={busy}>
            <option value="card">Card (Stripe-ready)</option>
            <option value="wallet">Digital wallet</option>
            <option value="transfer">Bank transfer</option>
          </select>
        </label>

        {error ? <p className="funnel-error" role="alert">{error}</p> : null}

        <footer className="funnel-modal-actions">
          <button type="button" className="funnel-btn ghost" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="funnel-btn primary" disabled={busy} onClick={() => pay(false)}>
            {busy ? 'Processing…' : `Pay $${CONTACT_FEE_USD} & continue`}
          </button>
        </footer>
        <button
          type="button"
          className="funnel-btn link"
          disabled={busy}
          onClick={() => pay(true)}
        >
          Preview mode — mark as paid (no real charge)
        </button>
        <p className="funnel-pay-note">
          Step 3 stays locked until the payment success callback returns <code>paid: true</code>.
        </p>
      </div>
    </div>
  );
}
