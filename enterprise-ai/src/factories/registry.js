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
import { loadHealthState } from "../providers/health-store.js";
import { computeFactoryReadiness } from "../providers/health-runner.js";
import { CanonicalStatus } from "../providers/status-model.js";
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
  const liveReady =
    liveProbe?.status === CanonicalStatus.READY ||
    liveProbe?.status === "READY" ||
    isLiveAuthenticatedReady(liveProbe || {});
  const displayColor = liveReady
    ? "green"
    : credentialsPresent
      ? "yellow"
      : displayColorForProbe(liveProbe || {});
  let status;
  if (liveReady) status = CanonicalStatus.READY;
  else if (detectionHit?.disabled) status = CanonicalStatus.DISABLED;
  else if (liveProbe?.status && liveProbe.status !== "CONFIGURED") status = liveProbe.status;
  else if (credentialsPresent) status = CanonicalStatus.CREDENTIALS_DETECTED;
  else if (detectionHit) status = CanonicalStatus.NOT_CONFIGURED;
  else status = CanonicalStatus.SLOT;

  return {
    id: pid,
    configured: credentialsPresent,
    credentialsPresent,
    liveReady,
    displayColor,
    detail: liveReady
      ? `live authenticated OK (${liveProbe.latencyMs ?? "?"}ms)`
      : credentialsPresent
        ? "CREDENTIALS_DETECTED — awaiting live authenticated probe success"
        : detectionHit?.detail || "adapter-slot",
    status,
    lastTestAt: liveProbe?.checkedAt || liveProbe?.testedAt || liveProbe?.lastCheckedAt || "NOT_TESTED",
    lastError: liveReady
      ? "none"
      : liveProbe?.safeErrorMessage || liveProbe?.lastError || liveProbe?.errorCategory || "NOT_TESTED",
    latencyMs: liveReady ? liveProbe?.latencyMs ?? "NOT_TESTED" : "NOT_TESTED",
    model: liveProbe?.model || "NOT_TESTED",
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
  factoryReadiness = null,
} = {}) {
  const detection = providerDetection || (await detectProviders());
  const byId = new Map(detection.providers.map((p) => [p.id, p]));
  // Prefer persisted health-state records over legacy snapshot / detection
  const healthState = loadHealthState(rootDir);
  const stateProbes =
    liveProbes ||
    (healthState?.providers || []).map((p) => ({
      provider: p.providerId,
      status: p.status,
      authenticationValid: p.authenticated,
      minimalRequestPassed: p.status === CanonicalStatus.READY,
      latencyMs: p.latencyMs === "NOT_TESTED" ? null : p.latencyMs,
      model: p.model === "NOT_TESTED" ? null : p.model,
      checkedAt: p.testedAt === "NOT_TESTED" ? null : p.testedAt,
      configured: p.credentialsDetected,
      safeErrorMessage: p.safeErrorMessage,
      testedAt: p.testedAt,
    }));
  const liveById = probeMapFromLive(stateProbes, rootDir);

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
              : "NOT_READY",
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

  const records = [...liveById.values()].map((p) => ({
    providerId: p.provider || p.id,
    status: p.status,
    authenticated: p.authenticationValid,
    connectionReady: p.status === CanonicalStatus.READY || p.status === "READY",
    generationVerified: false,
    credentialsDetected: Boolean(p.configured || p.credentialsDetected),
  }));
  const computedReadiness = factoryReadiness || healthState?.factories || computeFactoryReadiness(records);

  return {
    system: MANIFEST.system,
    diagram: MANIFEST.diagram,
    masterOrchestrator: "AIOS",
    rule: "GREEN_ONLY_AFTER_LIVE_AUTHENTICATED_SUCCESS",
    ruleAr: "لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.",
    factories,
    infrastructure,
    factoryReadiness: computedReadiness,
    agentFactoryMap: Object.fromEntries(AGENT_TO_FACTORY.entries()),
    checkedAt: new Date().toISOString(),
    dataSource: healthState ? "persisted-probe-state" : "detection-only-never-green",
    secretsExposed: false,
  };
}

export function annotateTasksWithFactory(tasks = []) {
  return tasks.map((t) => ({
    ...t,
    factory: factoryForAgent(t.agent) || "unassigned",
  }));
}
