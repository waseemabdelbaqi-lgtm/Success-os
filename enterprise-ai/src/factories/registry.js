/**
 * Success AI OS — Factory registry
 * Maps agents/providers into Coding / Education / Media factories under Master Orchestrator.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectProviders } from "../providers/detect.js";

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

function infraConfigured(item) {
  if (item.detect === "playwright-module") {
    return null; // resolved async in summarizeFactories
  }
  const anyOk = !item.envAny?.length || item.envAny.some(envPresent);
  const allOk = !item.envAll?.length || item.envAll.every(envPresent);
  return anyOk && allOk;
}

/**
 * Factory + infrastructure readiness snapshot (no secrets).
 */
export async function summarizeFactories({ providerDetection } = {}) {
  const detection = providerDetection || (await detectProviders());
  const byId = new Map(detection.providers.map((p) => [p.id, p]));

  const factories = MANIFEST.factories.map((factory) => {
    const providerStatus = factory.providers.map((pid) => {
      const hit = byId.get(pid);
      return {
        id: pid,
        configured: Boolean(hit?.configured),
        detail: hit?.detail || "adapter-slot",
        status: hit ? (hit.configured ? "CONFIGURED" : hit.disabled ? "DISABLED" : "NOT_CONFIGURED") : "SLOT",
      };
    });
    const readyProviders = providerStatus.filter((p) => p.configured).map((p) => p.id);
    return {
      id: factory.id,
      label: factory.label,
      mission: factory.mission,
      agents: factory.agents,
      providers: providerStatus,
      readyProviders,
      readiness:
        readyProviders.length >= 2 ? "MULTI_PROVIDER" : readyProviders.length === 1 ? "PARTIAL" : "AWAITING_KEYS",
    };
  });

  const infrastructure = [];
  for (const item of MANIFEST.infrastructure) {
    if (item.detect === "playwright-module") {
      const hit = byId.get("playwright");
      infrastructure.push({
        id: item.id,
        layer: item.layer,
        role: item.role,
        configured: Boolean(hit?.configured),
        detail: hit?.detail || "playwright not installed",
        autoAction: "never",
      });
      continue;
    }
    infrastructure.push({
      id: item.id,
      layer: item.layer,
      role: item.role,
      configured: Boolean(infraConfigured(item)),
      detail: infraConfigured(item) ? "credentials present" : "credentials missing — adapter ready",
      autoAction: item.id === "vercel" ? "never-auto-deploy" : "approval-required",
    });
  }

  return {
    system: MANIFEST.system,
    diagram: MANIFEST.diagram,
    masterOrchestrator: "AIOS",
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
