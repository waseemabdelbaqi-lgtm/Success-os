/**
 * Auto-detect configured AI / infra providers from environment.
 * Never logs secret values — only presence + readiness.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../config/providers.manifest.json"), "utf8"),
);

function envPresent(key) {
  const v = process.env[key];
  return Boolean(v && String(v).trim() && !String(v).startsWith("change-me"));
}

function groupReadyAny(keys = []) {
  if (!keys.length) return true;
  return keys.some(envPresent);
}

function groupReadyAll(keys = []) {
  if (!keys.length) return true;
  return keys.every(envPresent);
}

async function detectPlaywright() {
  try {
    await import("playwright");
    return { ok: true, detail: "playwright module resolvable" };
  } catch {
    try {
      await import("@playwright/test");
      return { ok: true, detail: "@playwright/test resolvable" };
    } catch {
      return { ok: false, detail: "playwright not installed" };
    }
  }
}

async function detectOllama() {
  const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  try {
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(2500) });
    return { ok: res.ok, detail: res.ok ? `reachable ${base}` : `HTTP_${res.status}` };
  } catch (err) {
    return { ok: false, detail: String(err?.message || err) };
  }
}

export async function detectProviders() {
  const results = [];
  for (const p of MANIFEST.providers) {
    let configured = groupReadyAny(p.envAny) && groupReadyAll(p.envAll || []);
    let detail = configured ? "credentials present" : "credentials missing — adapter ready";
    let disabled = false;

    if (p.respectDisabledFlag && process.env[p.respectDisabledFlag] === "true") {
      disabled = true;
      detail = `${p.respectDisabledFlag}=true`;
    }

    if (p.detect === "playwright-module") {
      const d = await detectPlaywright();
      configured = d.ok;
      detail = d.detail;
    }
    if (p.detect === "ollama-loopback") {
      const d = await detectOllama();
      configured = d.ok;
      detail = d.detail;
    }

    results.push({
      id: p.id,
      label: p.label,
      agents: p.agents || [],
      configured: configured && !disabled,
      disabled,
      readyForActivation: !configured || disabled,
      detail,
      envAny: p.envAny || [],
      envAll: p.envAll || [],
    });
  }
  return {
    checkedAt: new Date().toISOString(),
    providers: results,
    active: results.filter((r) => r.configured).map((r) => r.id),
    inactive: results.filter((r) => !r.configured).map((r) => r.id),
  };
}

export function getProviderManifest() {
  return MANIFEST;
}
