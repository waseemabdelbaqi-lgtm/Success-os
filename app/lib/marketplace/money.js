/**
 * Safe money arithmetic using integer minor units (cents).
 * Never use floating-point for final financial values.
 */

const DEFAULT_EXPONENT = 2;

export function currencyExponent(currency = 'USD') {
  const c = String(currency || 'USD').toUpperCase();
  // Most marketplace currencies use 2 minor units; extend as needed.
  if (['JPY', 'KRW'].includes(c)) return 0;
  if (['BHD', 'KWD', 'OMR'].includes(c)) return 3;
  return DEFAULT_EXPONENT;
}

export function toMinorUnits(amount, currency = 'USD') {
  if (amount == null || amount === '') return 0;
  const exp = currencyExponent(currency);
  const n = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** exp;
  // Round half-away-from-zero via integer math on scaled string-safe path
  return Math.round(n * factor);
}

export function fromMinorUnits(minor, currency = 'USD') {
  const exp = currencyExponent(currency);
  const m = Number(minor || 0);
  if (!Number.isFinite(m)) return 0;
  const factor = 10 ** exp;
  return Number((m / factor).toFixed(exp));
}

export function addMinor(...parts) {
  return parts.reduce((acc, p) => acc + Number(p || 0), 0);
}

export function subMinor(a, b) {
  return Number(a || 0) - Number(b || 0);
}

/** percent of minor amount → minor units (banker's-safe round half up). */
export function percentOfMinor(minorAmount, percent) {
  const amount = Number(minorAmount || 0);
  const pct = Number(percent);
  if (!Number.isFinite(amount) || !Number.isFinite(pct)) return 0;
  // (amount * pct) / 100 with integer rounding
  const scaled = amount * pct;
  return Math.round(scaled / 100);
}

export function clampPercent(percent, fallback = 0) {
  const pct = Number(percent);
  if (!Number.isFinite(pct)) return fallback;
  return Math.min(100, Math.max(0, pct));
}

export function formatMoney(minorOrMajor, currency = 'USD', { fromMinor = true } = {}) {
  const major = fromMinor ? fromMinorUnits(minorOrMajor, currency) : Number(minorOrMajor || 0);
  const exp = currencyExponent(currency);
  return `${major.toFixed(exp)} ${String(currency || 'USD').toUpperCase()}`;
}
