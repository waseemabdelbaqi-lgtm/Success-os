/**
 * Precise per-URL access diagnostics for Jordan official sources.
 * Classifies DNS / TLS / HTTP / redirect / timeout / network restriction.
 * Never bypasses CAPTCHA or auth walls.
 */
import dns from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";
import { URL } from "node:url";

export async function diagnoseJordanUrl(url, { timeoutMs = 12000 } = {}) {
  const started = Date.now();
  const result = {
    url,
    accessedAt: new Date().toISOString(),
    dns: null,
    tls: null,
    httpStatus: null,
    redirectTo: null,
    contentType: null,
    robots: null,
    reason: null,
    reasonType: null,
    elapsedMs: null,
  };

  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch (err) {
    result.reason = `INVALID_URL:${err.message}`;
    result.reasonType = "INVALID_URL";
    result.elapsedMs = Date.now() - started;
    return result;
  }

  try {
    const addrs = await dns.lookup(hostname, { all: true });
    result.dns = { ok: true, addresses: addrs.map((a) => a.address) };
  } catch (err) {
    result.dns = { ok: false, error: String(err.message || err) };
    result.reason = `DNS:${err.message || err}`;
    result.reasonType = "DNS";
    result.elapsedMs = Date.now() - started;
    return result;
  }

  try {
    await new Promise((resolve, reject) => {
      const socket = net.connect({ host: hostname, port: 443, timeout: timeoutMs });
      socket.once("error", reject);
      socket.once("timeout", () => reject(new Error("TCP_TIMEOUT")));
      socket.once("connect", () => {
        const secure = tls.connect(
          { socket, servername: hostname, rejectUnauthorized: true, timeout: timeoutMs },
          () => {
            result.tls = {
              ok: true,
              protocol: secure.getProtocol?.() || null,
              authorized: secure.authorized,
            };
            secure.end();
            socket.end();
            resolve();
          },
        );
        secure.once("error", reject);
        secure.setTimeout(timeoutMs, () => reject(new Error("TLS_TIMEOUT")));
      });
    });
  } catch (err) {
    const msg = String(err.message || err);
    result.tls = { ok: false, error: msg };
    if (/reset|ECONNRESET/i.test(msg)) {
      result.reason = "TLS_CONNECTION_RESET";
      result.reasonType = "TLS_RESET_OR_NETWORK_RESTRICTION";
    } else if (/timeout|TIMEOUT/i.test(msg)) {
      result.reason = "TLS_TIMEOUT";
      result.reasonType = "TIMEOUT";
    } else {
      result.reason = `TLS:${msg}`;
      result.reasonType = "TLS";
    }
    result.elapsedMs = Date.now() - started;
    return result;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "SUCCESS-OS-CurriculumWorker/1.0",
        Accept: "text/html,application/pdf,*/*",
      },
    });
    clearTimeout(timer);
    result.httpStatus = res.status;
    result.contentType = res.headers.get("content-type");
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      result.redirectTo = res.headers.get("location");
      result.reason = `HTTP_REDIRECT_${res.status}`;
      result.reasonType = "REDIRECT";
    } else if (res.status === 403) {
      result.reason = "HTTP_403_FORBIDDEN";
      result.reasonType = "HTTP_FORBIDDEN";
    } else if (res.status === 404) {
      result.reason = "HTTP_404";
      result.reasonType = "HTTP_NOT_FOUND";
    } else if (res.status >= 400) {
      result.reason = `HTTP_${res.status}`;
      result.reasonType = "HTTP_ERROR";
    } else {
      result.reason = "REACHABLE";
      result.reasonType = "OK";
    }
    // Soft robots hint from HTML homepage only
    if ((result.contentType || "").includes("text/html") && res.status < 400) {
      const text = (await res.text()).slice(0, 4000);
      if (/captcha|recaptcha|cf-challenge/i.test(text)) {
        result.reason = "CAPTCHA_OR_BOT_WALL";
        result.reasonType = "BOT_WALL";
      }
    }
  } catch (err) {
    const msg = String(err.message || err);
    if (/abort|timeout/i.test(msg)) {
      result.reason = "HTTP_TIMEOUT";
      result.reasonType = "TIMEOUT";
    } else if (/fetch failed|ECONNRESET/i.test(msg)) {
      result.reason = "HTTP_NETWORK_RESET";
      result.reasonType = "TLS_RESET_OR_NETWORK_RESTRICTION";
    } else {
      result.reason = `HTTP:${msg}`;
      result.reasonType = "HTTP_ERROR";
    }
  }

  result.elapsedMs = Date.now() - started;
  return result;
}

export async function diagnoseUrlBatch(urls, opts = {}) {
  const out = [];
  for (const url of urls) {
    out.push(await diagnoseJordanUrl(url, opts));
  }
  return out;
}

export function summarizeBlockReasons(diagnostics) {
  const byType = {};
  for (const d of diagnostics) {
    const key = d.reasonType || "UNKNOWN";
    byType[key] = (byType[key] || 0) + 1;
  }
  return byType;
}
