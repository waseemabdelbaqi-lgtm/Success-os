/** Normalized provider errors — never include secrets. */

export const ProviderStatus = {
  READY: "READY",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  MODEL_NOT_CONFIGURED: "MODEL_NOT_CONFIGURED",
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  MODEL_UNAVAILABLE: "MODEL_UNAVAILABLE",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  OPTIONAL_OFFLINE: "OPTIONAL_OFFLINE",
};

export class AiosProviderError extends Error {
  constructor(status, message, { provider, retryable = false } = {}) {
    super(message);
    this.name = "AiosProviderError";
    this.status = status;
    this.provider = provider;
    this.retryable = retryable;
  }
}

export function normalizeProviderError(provider, err) {
  const msg = String(err?.message || err || "PROVIDER_ERROR");
  const statusCode = err?.status || err?.statusCode || err?.code;
  const lower = msg.toLowerCase();

  if (/MODEL_NOT_CONFIGURED/i.test(msg)) {
    return new AiosProviderError(ProviderStatus.MODEL_NOT_CONFIGURED, "MODEL_NOT_CONFIGURED", {
      provider,
    });
  }
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    /auth|unauthorized|invalid.?api.?key|permission/i.test(lower)
  ) {
    return new AiosProviderError(ProviderStatus.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED", {
      provider,
    });
  }
  if (statusCode === 429 || /rate.?limit|quota/i.test(lower)) {
    return new AiosProviderError(ProviderStatus.RATE_LIMITED, "RATE_LIMITED", {
      provider,
      retryable: true,
    });
  }
  if (statusCode === 404 || /model.?not.?found|not.?found|does not exist/i.test(lower)) {
    return new AiosProviderError(ProviderStatus.MODEL_UNAVAILABLE, "MODEL_UNAVAILABLE", {
      provider,
    });
  }
  if (/timeout|aborted|AbortError/i.test(lower)) {
    return new AiosProviderError(ProviderStatus.TIMEOUT, "TIMEOUT", {
      provider,
      retryable: true,
    });
  }
  if (/fetch failed|ECONN|ENOTFOUND|network|socket/i.test(lower)) {
    return new AiosProviderError(ProviderStatus.NETWORK_ERROR, "NETWORK_ERROR", {
      provider,
      retryable: true,
    });
  }
  return new AiosProviderError(ProviderStatus.PROVIDER_ERROR, "PROVIDER_ERROR", { provider });
}

export async function withRetries(fn, { retries = 3, baseDelayMs = 500, signal } = {}) {
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw new AiosProviderError(ProviderStatus.TIMEOUT, "TIMEOUT", { retryable: false });
    try {
      return await fn(attempt);
    } catch (err) {
      last = err;
      const norm = err instanceof AiosProviderError ? err : normalizeProviderError("unknown", err);
      if (!norm.retryable || attempt === retries) throw norm;
      const delay = baseDelayMs * 2 ** attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw last;
}
