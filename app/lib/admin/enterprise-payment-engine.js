/**
 * ADMIN-NEXT — Automatic payment splitting + payout engine.
 */

import path from 'node:path';
import {
  erpAppendAudit,
  erpEnsureDirs,
  erpId,
  erpList,
  erpNow,
  erpReadCollection,
  erpReadJson,
  erpRoot,
  erpWriteCollection,
  erpWriteJson,
} from './enterprise-erp-store.js';
import { resolveCommission, ensureCommissionDefaults } from './enterprise-commission-engine.js';

export const PAYOUT_METHODS = Object.freeze([
  'bank_transfer',
  'stripe',
  'paypal',
  'wise',
  'hyperpay',
  'apple_pay',
  'google_pay',
  'manual_transfer',
]);

function money(n) {
  return Number(Number(n || 0).toFixed(6));
}

function financeDoc() {
  erpEnsureDirs();
  const file = path.join(erpRoot(), 'finance.json');
  let doc = erpReadJson(file);
  if (!doc) {
    doc = {
      monthlySales: 0,
      annualSales: 0,
      revenue: 0,
      profit: 0,
      outstandingPayments: 0,
      refunds: 0,
      subscriptionRevenue: 0,
      teacherRevenue: 0,
      partnerRevenue: 0,
      invoices: [],
      payments: [],
      updatedAt: erpNow(),
    };
    erpWriteJson(file, doc);
  }
  return { file, doc };
}

function convertCurrency(amount, from, to, rates) {
  if (!from || !to || from === to) return money(amount);
  const table = rates || ensureCommissionDefaults().fxRates || {};
  const fromRate = Number(table[from] || 1);
  const toRate = Number(table[to] || 1);
  // rates relative to USD baseline if provided
  const usd = money(amount / fromRate);
  return money(usd * toRate);
}

/**
 * After a successful payment, calculate full split and persist artifacts.
 */
export function processSuccessfulPayment(input = {}, meta = {}) {
  ensureCommissionDefaults();
  const currency = input.currency || ensureCommissionDefaults().defaultCurrency || 'USD';
  const gross = money(input.grossAmount);
  const discount = money(input.discount);
  const coupon = money(input.coupon);
  const taxes = money(input.taxes);
  const gatewayFees = money(input.gatewayFees);
  const afterDiscounts = money(Math.max(0, gross - discount - coupon));

  const commission = resolveCommission({
    ...input,
    grossAmount: afterDiscounts,
  });

  const platformCommission = money(commission.commissionAmount);
  const partnerShare = money(Math.max(0, afterDiscounts - platformCommission - gatewayFees));
  const companyShare = money(platformCommission);
  const teacherReceives = money(
    commission.teacherReceives != null ? commission.teacherReceives : partnerShare,
  );
  const successOs = money(commission.successOs != null ? commission.successOs : companyShare);
  const netAmount = money(afterDiscounts - gatewayFees);
  const converted = input.targetCurrency
    ? convertCurrency(netAmount, currency, input.targetCurrency)
    : netAmount;

  const paymentId = erpId();
  const split = {
    id: erpId(),
    paymentId,
    at: erpNow(),
    currency,
    targetCurrency: input.targetCurrency || currency,
    grossAmount: gross,
    teacherPrice: afterDiscounts,
    discount,
    coupon,
    taxes,
    gatewayFees,
    platformCommission,
    platformCommissionPercent: commission.percent ?? null,
    partnerShare,
    companyShare,
    teacherReceives,
    successOs,
    netAmount,
    convertedNet: converted,
    commission,
    partnerId: input.partnerId || null,
    partnerType: input.partnerType || null,
    service: input.service || null,
    gateway: input.gateway || null,
    status: 'completed',
    meta: input.meta || {},
  };

  const splits = erpReadCollection('payment-splits');
  splits.items = [split, ...erpList(splits.items)].slice(0, 20000);
  erpWriteCollection('payment-splits', splits);

  const invoice = {
    id: erpId(),
    paymentId,
    splitId: split.id,
    number: `INV-${Date.now()}`,
    partnerId: input.partnerId || null,
    grossAmount: gross,
    taxes,
    total: money(afterDiscounts + taxes),
    currency,
    status: 'issued',
    createdAt: erpNow(),
  };
  const invoices = erpReadCollection('invoices');
  invoices.items = [invoice, ...erpList(invoices.items)].slice(0, 20000);
  erpWriteCollection('invoices', invoices);

  const receipt = {
    id: erpId(),
    paymentId,
    invoiceId: invoice.id,
    number: `RCT-${Date.now()}`,
    amount: netAmount,
    currency,
    status: 'issued',
    createdAt: erpNow(),
  };
  const receipts = erpReadCollection('receipts');
  receipts.items = [receipt, ...erpList(receipts.items)].slice(0, 20000);
  erpWriteCollection('receipts', receipts);

  const ledgerEntry = {
    id: erpId(),
    paymentId,
    type: 'payment',
    debit: netAmount,
    credit: 0,
    currency,
    partnerId: input.partnerId || null,
    memo: input.memo || 'payment_split',
    createdAt: erpNow(),
  };
  const ledger = erpReadCollection('ledger');
  ledger.items = [ledgerEntry, ...erpList(ledger.items)].slice(0, 50000);
  erpWriteCollection('ledger', ledger);

  const settlement = {
    id: erpId(),
    paymentId,
    splitId: split.id,
    partnerId: input.partnerId || null,
    partnerShare,
    platformCommission,
    currency,
    status: 'pending_payout',
    createdAt: erpNow(),
  };
  const settlements = erpReadCollection('settlements');
  settlements.items = [settlement, ...erpList(settlements.items)].slice(0, 20000);
  erpWriteCollection('settlements', settlements);

  const payout = {
    id: erpId(),
    paymentId,
    settlementId: settlement.id,
    transactionId: `TXN-${erpId().slice(0, 8).toUpperCase()}`,
    partnerId: input.partnerId || null,
    partnerName: input.partnerName || null,
    method: PAYOUT_METHODS.includes(input.payoutMethod) ? input.payoutMethod : 'manual_transfer',
    grossAmount: afterDiscounts,
    commission: platformCommission,
    fees: gatewayFees,
    taxes,
    netAmount: partnerShare,
    currency,
    approval: 'pending',
    transferStatus: 'queued',
    transferDate: null,
    settlementDate: null,
    referenceNumber: null,
    createdAt: erpNow(),
    updatedAt: erpNow(),
    status: 'queued',
  };
  const payouts = erpReadCollection('payouts');
  payouts.items = [payout, ...erpList(payouts.items)].slice(0, 20000);
  erpWriteCollection('payouts', payouts);

  const { file, doc } = financeDoc();
  doc.revenue = money((doc.revenue || 0) + companyShare);
  doc.partnerRevenue = money((doc.partnerRevenue || 0) + partnerShare);
  doc.monthlySales = money((doc.monthlySales || 0) + afterDiscounts);
  doc.annualSales = money((doc.annualSales || 0) + afterDiscounts);
  doc.profit = money((doc.revenue || 0) - (doc.refunds || 0) - money(sumExpenses()));
  doc.payments = [{ id: paymentId, at: erpNow(), amount: afterDiscounts }, ...erpList(doc.payments)].slice(
    0,
    500,
  );
  doc.invoices = [{ id: invoice.id, number: invoice.number }, ...erpList(doc.invoices)].slice(0, 500);
  doc.updatedAt = erpNow();
  erpWriteJson(file, doc);

  erpAppendAudit({
    action: 'payment',
    moduleId: 'payment-splits',
    entityId: split.id,
    user: meta.user || 'system',
    newValue: { paymentId, platformCommission, partnerShare, netAmount },
  });

  return {
    ok: true,
    paymentId,
    split,
    invoice,
    receipt,
    ledgerEntry,
    settlement,
    payout,
  };
}

function sumExpenses() {
  return erpList(erpReadCollection('expenses').items)
    .filter((e) => !e.deletedAt)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
}

export function mutatePayout(action, payload = {}, meta = {}) {
  const doc = erpReadCollection('payouts');
  const items = erpList(doc.items);
  const idx = items.findIndex((p) => p.id === payload.id);
  if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
  const before = items[idx];

  if (action === 'approve') {
    items[idx] = {
      ...before,
      approval: 'approved',
      approvedAt: erpNow(),
      approvedBy: meta.user || 'admin',
      updatedAt: erpNow(),
    };
  } else if (action === 'reject') {
    items[idx] = {
      ...before,
      approval: 'rejected',
      transferStatus: 'cancelled',
      status: 'rejected',
      updatedAt: erpNow(),
    };
  } else if (action === 'markTransferred') {
    items[idx] = {
      ...before,
      transferStatus: 'transferred',
      status: 'transferred',
      transferDate: payload.transferDate || erpNow(),
      settlementDate: payload.settlementDate || erpNow(),
      referenceNumber: payload.referenceNumber || `REF-${Date.now()}`,
      method: payload.method || before.method,
      updatedAt: erpNow(),
    };
    const settlements = erpReadCollection('settlements');
    settlements.items = erpList(settlements.items).map((s) =>
      s.id === before.settlementId ? { ...s, status: 'settled', settledAt: erpNow() } : s,
    );
    erpWriteCollection('settlements', settlements);
  } else {
    return { ok: false, error: 'UNKNOWN_ACTION' };
  }

  erpWriteCollection('payouts', { items });
  erpAppendAudit({
    action: 'approval',
    moduleId: 'payouts',
    entityId: before.id,
    user: meta.user || 'admin',
    oldValue: { approval: before.approval, transferStatus: before.transferStatus },
    newValue: {
      approval: items[idx].approval,
      transferStatus: items[idx].transferStatus,
    },
  });
  return { ok: true, item: items[idx] };
}

export function getFinanceSummary() {
  const { doc } = financeDoc();
  const expenses = money(sumExpenses());
  const payroll = erpList(erpReadCollection('hr-payroll').items)
    .filter((p) => !p.deletedAt && p.status === 'paid')
    .reduce((s, p) => s + Number(p.netPay || p.amount || 0), 0);
  const refunds = erpList(erpReadCollection('refunds').items)
    .filter((r) => !r.deletedAt)
    .reduce((s, r) => s + Number(r.amount || 0), 0);
  const revenue = money(doc.revenue || 0);
  const profit = money(revenue - expenses - payroll - refunds);

  return {
    revenue,
    expenses,
    payroll: money(payroll),
    invoices: erpList(erpReadCollection('invoices').items).filter((i) => !i.deletedAt).length,
    receipts: erpList(erpReadCollection('receipts').items).filter((i) => !i.deletedAt).length,
    refunds: money(refunds),
    taxes: money(
      erpList(erpReadCollection('payment-splits').items).reduce((s, p) => s + Number(p.taxes || 0), 0),
    ),
    cashFlow: money(revenue - expenses - payroll),
    profitLoss: profit,
    partnerRevenue: money(doc.partnerRevenue || 0),
    outstandingPayments: money(doc.outstandingPayments || 0),
    gateways: PAYOUT_METHODS,
    ledgerEntries: erpList(erpReadCollection('ledger').items).length,
    generatedAt: erpNow(),
  };
}
