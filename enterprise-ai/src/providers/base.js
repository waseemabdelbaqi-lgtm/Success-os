/** Shared provider adapter helpers. */

export class ProviderNotConfiguredError extends Error {
  constructor(providerId) {
    super(`PROVIDER_NOT_CONFIGURED:${providerId}`);
    this.name = "ProviderNotConfiguredError";
    this.providerId = providerId;
  }
}

export function firstEnv(keys) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && String(v).trim()) return { key: k, value: String(v).trim() };
  }
  return null;
}

export async function httpJson(url, { method = "GET", headers = {}, body, timeoutMs = 60000 } = {}) {
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 2000) };
  }
  if (!res.ok) {
    const err = new Error(`HTTP_${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
