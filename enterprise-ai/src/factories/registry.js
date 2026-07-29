/**
 * Success AI OS — Factory registry
 * Maps agents/providers into Coding / Education / Media factories under Master Orchestrator.
 *
 * HARD RULE: readyProviders / green status require a live authenticated probe success
 * from the last health check — never credential presence alone.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectProviders } from "../providers/detect.js";
import {
  displayColorForProbe,
  isLiveAuthenticatedReady,
  loadHealthSnapshot,
  toInfrastructureRow,
} from "../providers/live-status.js";
import { ProviderStatus } from "../providers/errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../config/factories.manifest.json"), "utf8"),
);

const AGENT_TO_FACTORY = new Map();
for (const factory of MANIFEST.factories) {
  for (const agent of factory.agents) {
    AGENT_TO_FACTORY.set(agent, factory.id);
  }
}

export function getFactoriesManifest() {
  return MANIFEST;
}

export function factoryForAgent(agentId) {
  return AGENT_TO_FACTORY.get(agentId) || null;
}

export function listFactories() {
  return MANIFEST.factories.map((f) => ({
    id: f.id,
    label: f.label,
    mission: f.mission,
    providers: f.providers,
    agents: f.agents,
    notes: f.notes || [],
  }));
}

export function listInfrastructure() {
  return MANIFEST.infrastructure.map((i) => ({ ...i }));
}

function envPresent(key) {
  const v = process.env[key];
  return Boolean(v && String(v).trim() && !String(v).startsWith("change-me"));
}

function infraCredentialsPresent(item) {
  if (item.detect === "playwright-module") {
    return null; // resolved via live probe / detection
  }
  const anyOk = !item.envAny?.length || item.envAny.some(envPresent);
  const allOk = !item.envAll?.length || item.envAll.every(envPresent);
  return anyOk && allOk;
}

function probeMapFromLive(liveProbes = [], rootDir = process.cwd()) {
  const byId = new Map();
  const list = Array.isArray(liveProbes) ? liveProbes : [];
  if (list.length) {
    for (const p of list) {
      const id = p.provider || p.id;
      if (id) byId.set(id, p);
      if (id === "ollama") byId.set("ollama-local", { ...p, provider: "ollama-local" });
      if (id === "ollama-local") byId.set("ollama", { ...p, provider: "ollama" });
    }
    return byId;
  }
  const snap = loadHealthSnapshot(rootDir);
  for (const p of snap?.providers || []) {
    const id = p.provider || p.id;
    if (id) byId.set(id, p);
    if (id === "ollama") byId.set("ollama-local", { ...p, provider: "ollama-local" });
    if (id === "ollama-local") byId.set("ollama", { ...p, provider: "ollama" });
  }
  return byId;
}

function providerLiveRow(pid, detectionHit, liveProbe) {
  const credentialsPresent = Boolean(detectionHit?.configured);
  const liveReady = isLiveAuthenticatedReady(liveProbe || {});
  const displayColor = displayColorForProbe(liveProbe || {});
  let status;
  if (liveReady) status = ProviderStatus.READY;
  else if (detectionHit?.disabled) status = "DISABLED";
  else if (liveProbe?.status) status = liveProbe.status;
  else if (credentialsPresent) status = "CONFIGURED"; // keys only — never green
  else if (detectionHit) status = "NOT_CONFIGURED";
  else status = "SLOT";

  return {
    id: pid,
    configured: credentialsPresent,
    credentialsPresent,
    liveReady,
    displayColor,
    detail: liveReady
      ? `live authenticated OK (${liveProbe.latencyMs ?? "?"}ms)`
      : credentialsPresent
        ? "credentials present — awaiting live authenticated probe success"
        : detectionHit?.detail || "adapter-slot",
    status,
    lastTestAt: liveProbe?.checkedAt || liveProbe?.lastCheckedAt || null,
    lastError: liveReady ? null : liveProbe?.lastError || liveProbe?.errorCategory || null,
    latencyMs: liveReady ? liveProbe?.latencyMs ?? null : null,
  };
}

/**
 * Factory + infrastructure readiness snapshot (no secrets).
 * @param {{ providerDetection?: object, liveProbes?: object[], rootDir?: string }} [opts]
 */
export async function summarizeFactories({
  providerDetection,
  liveProbes,
  rootDir = process.cwd(),
} = {}) {
  const detection = providerDetection || (await detectProviders());
  const byId = new Map(detection.providers.map((p) => [p.id, p]));
  const liveById = probeMapFromLive(liveProbes, rootDir);

  const factories = MANIFEST.factories.map((factory) => {
    const providerStatus = factory.providers.map((pid) =>
      providerLiveRow(pid, byId.get(pid), liveById.get(pid)),
    );
    // GREEN / ready: live authenticated success only
    const readyProviders = providerStatus.filter((p) => p.liveReady).map((p) => p.id);
    const credentialed = providerStatus.filter((p) => p.credentialsPresent).map((p) => p.id);
    return {
      id: factory.id,
      label: factory.label,
      mission: factory.mission,
      agents: factory.agents,
      providers: providerStatus,
      readyProviders,
      credentialedProviders: credentialed,
      readiness:
        readyProviders.length >= 2
          ? "MULTI_PROVIDER"
          : readyProviders.length === 1
            ? "PARTIAL"
            : credentialed.length
              ? "AWAITING_LIVE_PROBE"
              : "AWAITING_KEYS",
    };
  });

  const infrastructure = [];
  for (const item of MANIFEST.infrastructure) {
    const liveProbe = liveById.get(item.id);
    const detectionHit = byId.get(item.id);
    const credentialsPresent =
      item.detect === "playwright-module"
        ? Boolean(detectionHit?.configured || liveProbe?.configured)
        : Boolean(infraCredentialsPresent(item));
    const row = toInfrastructureRow(
      liveProbe || {
        provider: item.id,
        status: credentialsPresent ? "CONFIGURED" : ProviderStatus.NOT_CONFIGURED,
        authenticationValid: false,
        minimalRequestPassed: false,
        configured: credentialsPresent,
        checkedAt: liveProbe?.checkedAt || null,
        lastError: liveProbe ? null : "NO_LIVE_AUTHENTICATED_PROBE",
      },
      { id: item.id },
    );
    infrastructure.push({
      id: item.id,
      layer: item.layer,
      role: item.role,
      configured: credentialsPresent,
      credentialsPresent,
      liveReady: row.liveReady,
      displayColor: row.displayColor,
      status: row.status,
      detail: row.liveReady
        ? `live authenticated OK (${row.latencyMs ?? "?"}ms)`
        : credentialsPresent
          ? "credentials present — awaiting live authenticated probe success"
          : detectionHit?.detail || "credentials missing — adapter ready",
      lastTestAt: row.lastTestAt,
      "آخر اختبار": row["آخر اختبار"],
      النتيجة: row.النتيجة,
      "زمن الاستجابة": row["زمن الاستجابة"],
      "آخر خطأ": row["آخر خطأ"],
      autoAction: item.id === "vercel" ? "never-auto-deploy" : "approval-required",
    });
  }

  return {
    system: MANIFEST.system,
    diagram: MANIFEST.diagram,
    masterOrchestrator: "AIOS",
    rule: "GREEN_ONLY_AFTER_LIVE_AUTHENTICATED_SUCCESS",
    ruleAr: "لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.",
    factories,
    infrastructure,
    agentFactoryMap: Object.fromEntries(AGENT_TO_FACTORY.entries()),
    checkedAt: new Date().toISOString(),
    secretsExposed: false,
  };
}

export function annotateTasksWithFactory(tasks = []) {
  return tasks.map((t) => ({
    ...t,
    factory: factoryForAgent(t.agent) || "unassigned",
  }));
}
