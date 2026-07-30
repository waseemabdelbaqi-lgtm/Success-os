/**
 * Continuous provider governance — auto health, downgrade, recovery, failover.
 * NEVER auto-promotes. NEVER runs paid media generation.
 */
import {
  CanonicalStatus,
  ProviderLifecycle,
  isGreenStatus,
  normalizeLifecycleStage,
  PROVIDER_FACTORY,
} from "./status-model.js";
import {
  createEmptyProviderRecord,
  historyStatsFor,
  loadHealthState,
  normalizeProviderRecord,
  saveHealthState,
  appendHistory,
  buildDashboardFromState,
} from "./health-store.js";
import {
  ALL_PROVIDER_IDS,
  FACTORY_PROVIDERS,
  computeFactoryReadiness,
  runHealthCommand,
} from "./health-runner.js";
import {
  continuousConfig,
  continuousIntervals,
  continuousThresholds,
  factoryPriorities,
  intervalForLifecycle,
} from "./continuous-config.js";
import {
  buildHistoryEntry,
  classifyProbeError,
  dispatchAlerts,
  loadGovernanceState,
  saveGovernanceState,
} from "./continuous-history.js";

const MEDIA_IDS = new Set(["heygen", "elevenlabs", "openai-images", "blender"]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isHealthyCertified(rec) {
  if (!rec) return false;
  const stage = normalizeLifecycleStage(rec.lifecycleStage);
  return (
    isGreenStatus(rec.status) &&
    (stage === ProviderLifecycle.READY ||
      stage === ProviderLifecycle.PRODUCTION_CERTIFIED ||
      stage === ProviderLifecycle.MISSION_CRITICAL) &&
    rec.liveProbe === "PASSED"
  );
}

function isProbeFailure(rec) {
  if (!rec) return true;
  if (isGreenStatus(rec.status)) return false;
  const fail = new Set([
    CanonicalStatus.PROBE_FAILED,
    CanonicalStatus.AUTH_FAILED,
    CanonicalStatus.NETWORK_FAILED,
    CanonicalStatus.MODEL_UNAVAILABLE,
    CanonicalStatus.RATE_LIMITED,
    CanonicalStatus.BROWSER_NOT_INSTALLED,
    CanonicalStatus.BROWSER_LAUNCH_FAILED,
    CanonicalStatus.TEST_ASSERTION_FAILED,
    CanonicalStatus.REMOTE_TESTING_BLOCKED,
    CanonicalStatus.LOCAL_APP_UNAVAILABLE,
  ]);
  return fail.has(rec.status) || rec.liveProbe === "FAILED";
}

/**
 * Automatic downgrade only — never promote.
 * MC → PRODUCTION_CERTIFIED on failure
 * PRODUCTION_CERTIFIED → READY after threshold
 * READY live fail → PROBE_FAILED status (lifecycle stays at credentials/probe level via normalize)
 */
export function applyAutomaticDowngrade(record, previous = null, thresholds = continuousThresholds()) {
  const before = {
    status: previous?.status || record.status,
    lifecycle: previous?.lifecycleStage || record.lifecycleStage,
    productionCertified: Boolean(previous?.productionCertified ?? record.productionCertified),
    missionCritical: Boolean(previous?.missionCritical ?? record.missionCritical),
  };

  if (!isProbeFailure(record)) {
    return {
      record,
      downgraded: false,
      before,
      after: {
        status: record.status,
        lifecycle: record.lifecycleStage,
        productionCertified: record.productionCertified,
        missionCritical: record.missionCritical,
      },
      alerts: [],
    };
  }

  const failures = Number(record.consecutiveFailures || previous?.consecutiveFailures || 1);
  const stage = normalizeLifecycleStage(before.lifecycle);
  const alerts = [];
  let next = { ...record };
  let downgraded = false;
  let event = null;

  if (stage === ProviderLifecycle.MISSION_CRITICAL && failures >= thresholds.missionCriticalFailToCertified) {
    next = normalizeProviderRecord(
      {
        ...record,
        status: record.status,
        productionCertified: true,
        missionCritical: false,
        autoDowngradedFrom: ProviderLifecycle.MISSION_CRITICAL,
        autoDowngradedTo: ProviderLifecycle.PRODUCTION_CERTIFIED,
        autoDowngradedAt: new Date().toISOString(),
      },
      previous || record,
    );
    // Demotion floor must survive failed-probe normalize (which clears star flags).
    next.missionCritical = false;
    next.productionCertified = true;
    next.certificationDemotionFloor = ProviderLifecycle.PRODUCTION_CERTIFIED;
    downgraded = true;
    event = {
      from: ProviderLifecycle.MISSION_CRITICAL,
      to: ProviderLifecycle.PRODUCTION_CERTIFIED,
      reason: "AUTO_DOWNGRADE_MISSION_CRITICAL",
    };
    alerts.push({
      type: "MISSION_CRITICAL_DOWNGRADE",
      severity: "critical",
      providerId: record.providerId,
      message: `${record.providerId} downgraded MISSION_CRITICAL → PRODUCTION_CERTIFIED after failure`,
      from: event.from,
      to: event.to,
    });
    alerts.push({
      type: "CERTIFICATION_REVOKED",
      severity: "critical",
      providerId: record.providerId,
      message: `Mission-critical certification revoked for ${record.providerId}`,
      revoked: "MISSION_CRITICAL",
    });
  } else if (
    (stage === ProviderLifecycle.PRODUCTION_CERTIFIED || before.productionCertified) &&
    !before.missionCritical &&
    failures >= thresholds.certifiedFailToReady
  ) {
    next = normalizeProviderRecord(
      {
        ...record,
        productionCertified: false,
        missionCritical: false,
        autoDowngradedFrom: ProviderLifecycle.PRODUCTION_CERTIFIED,
        autoDowngradedTo: ProviderLifecycle.READY,
        autoDowngradedAt: new Date().toISOString(),
      },
      previous || record,
    );
    next.productionCertified = false;
    next.missionCritical = false;
    next.certificationDemotionFloor = ProviderLifecycle.READY;
    downgraded = true;
    event = {
      from: ProviderLifecycle.PRODUCTION_CERTIFIED,
      to: ProviderLifecycle.READY,
      reason: "AUTO_DOWNGRADE_PRODUCTION_CERTIFIED",
    };
    alerts.push({
      type: "CERTIFICATION_REVOKED",
      severity: "warning",
      providerId: record.providerId,
      message: `${record.providerId} downgraded PRODUCTION_CERTIFIED → READY after ${failures} failures`,
      from: event.from,
      to: event.to,
    });
  }

  // READY live probe fail → ensure PROBE_FAILED-class status surfaces
  if (
    normalizeLifecycleStage(before.lifecycle) === ProviderLifecycle.READY &&
    !before.productionCertified &&
    !before.missionCritical &&
    isProbeFailure(record)
  ) {
    if (record.status === CanonicalStatus.READY) {
      next = {
        ...next,
        status: CanonicalStatus.PROBE_FAILED,
        liveProbe: "FAILED",
        result: "failure",
      };
    }
    alerts.push({
      type: "PROVIDER_UNAVAILABLE",
      severity: "warning",
      providerId: record.providerId,
      message: `${record.providerId} READY → probe failure (${record.status})`,
      statusBefore: CanonicalStatus.READY,
      statusAfter: next.status,
    });
  }

  if (record.status === CanonicalStatus.AUTH_FAILED) {
    alerts.push({
      type: "AUTHENTICATION_FAILURE",
      severity: "critical",
      providerId: record.providerId,
      message: `Authentication failure for ${record.providerId}`,
    });
  }
  if (record.status === CanonicalStatus.RATE_LIMITED) {
    alerts.push({
      type: "QUOTA_RATE_LIMIT",
      severity: "warning",
      providerId: record.providerId,
      message: `Rate limit / quota detected for ${record.providerId}`,
    });
  }
  if (
    Number.isFinite(Number(record.latencyMs)) &&
    Number(record.latencyMs) > thresholds.latencyAlertMs
  ) {
    alerts.push({
      type: "LATENCY_THRESHOLD",
      severity: "warning",
      providerId: record.providerId,
      message: `Latency ${record.latencyMs}ms exceeds ${thresholds.latencyAlertMs}ms`,
      latencyMs: record.latencyMs,
      thresholdMs: thresholds.latencyAlertMs,
    });
  }
  if (failures >= 3) {
    alerts.push({
      type: "CONSECUTIVE_FAILURES_EXCEEDED",
      severity: "warning",
      providerId: record.providerId,
      message: `${record.providerId} has ${failures} consecutive failures`,
      count: failures,
    });
  }

  return {
    record: next,
    downgraded,
    event,
    before,
    after: {
      status: next.status,
      lifecycle: next.lifecycleStage,
      productionCertified: next.productionCertified,
      missionCritical: next.missionCritical,
    },
    alerts,
  };
}

/**
 * Rank providers in a factory by configured priority among healthy ones.
 * Prefers MISSION_CRITICAL > PRODUCTION_CERTIFIED > READY.
 */
export function rankFactoryProviders(records = [], factory = "coding") {
  const priorities = factoryPriorities()[factory] || FACTORY_PROVIDERS[factory] || [];
  const byId = new Map(records.map((r) => [r.providerId, r]));
  const tierScore = (rec) => {
    const stage = normalizeLifecycleStage(rec?.lifecycleStage);
    if (stage === ProviderLifecycle.MISSION_CRITICAL) return 300;
    if (stage === ProviderLifecycle.PRODUCTION_CERTIFIED) return 200;
    if (stage === ProviderLifecycle.READY) return 100;
    return 0;
  };

  const ranked = priorities
    .map((id, idx) => {
      const rec = byId.get(id);
      const healthy = isHealthyCertified(rec);
      return {
        providerId: id,
        priority: idx + 1,
        healthy,
        tierScore: tierScore(rec),
        status: rec?.status || "NOT_TESTED",
        lifecycleStage: rec?.lifecycleStage || "SLOT",
        displayMark: rec?.displayMark || "⚪",
        latencyMs: rec?.latencyMs ?? null,
        productionCertified: Boolean(rec?.productionCertified),
        missionCritical: Boolean(rec?.missionCritical),
      };
    })
    .sort((a, b) => {
      if (a.healthy !== b.healthy) return a.healthy ? -1 : 1;
      if (b.tierScore !== a.tierScore) return b.tierScore - a.tierScore;
      return a.priority - b.priority;
    });

  const selected = ranked.find((r) => r.healthy) || null;
  return { factory, ranked, selected, priorities };
}

export function computeFactoryHealthReport(records = []) {
  const base = computeFactoryReadiness(records);
  const priorities = factoryPriorities();
  const byId = new Map(records.map((r) => [r.providerId, r]));
  const factories = ["coding", "education", "media", "infrastructure"];

  const report = {};
  for (const factory of factories) {
    const ids = priorities[factory] || FACTORY_PROVIDERS[factory] || [];
    const recs = ids.map((id) => byId.get(id)).filter(Boolean);
    const green = recs.filter((r) => isHealthyCertified(r));
    const certified = green.filter(
      (r) =>
        r.lifecycleStage === ProviderLifecycle.PRODUCTION_CERTIFIED ||
        r.lifecycleStage === ProviderLifecycle.MISSION_CRITICAL,
    );
    const mission = green.filter((r) => r.lifecycleStage === ProviderLifecycle.MISSION_CRITICAL);
    const ranking = rankFactoryProviders(records, factory);
    const latencies = green
      .map((r) => Number(r.latencyMs))
      .filter((n) => Number.isFinite(n));
    const avgLatency = latencies.length
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;
    const successRate =
      recs.length === 0
        ? 0
        : Number(
            (
              recs.filter((r) => isGreenStatus(r.status)).length / Math.max(1, recs.length)
            ).toFixed(3),
          );
    const healthScore = Math.round(
      (green.length / Math.max(1, ids.length)) * 60 +
        (certified.length / Math.max(1, ids.length)) * 25 +
        (mission.length / Math.max(1, ids.length)) * 15,
    );

    const fallbackAvailable = green.length >= 2 || (green.length >= 1 && ids.length > 1);

    report[factory] = {
      readiness: base[factory]?.status || "NOT_READY",
      readyProviders: green.map((r) => r.providerId),
      certifiedProviders: certified.map((r) => r.providerId),
      missionCriticalProviders: mission.map((r) => r.providerId),
      fallbackAvailability: fallbackAvailable,
      selectedProvider: ranking.selected?.providerId || null,
      ranking: ranking.ranked,
      overallHealthScore: Math.min(100, healthScore),
      averageLatencyMs: avgLatency,
      successRate,
      providerCount: ids.length,
      healthyCount: green.length,
    };
  }

  return {
    ...base,
    factories: report,
    priorities,
  };
}

/**
 * Select highest-ranked healthy fallback excluding the failed provider.
 */
export function selectFallbackProvider(records, failedProviderId) {
  const factory = PROVIDER_FACTORY[failedProviderId] || null;
  if (!factory) return null;
  const ranking = rankFactoryProviders(records, factory);
  const fallback = ranking.ranked.find(
    (r) => r.healthy && r.providerId !== failedProviderId,
  );
  return fallback
    ? {
        factory,
        from: failedProviderId,
        to: fallback.providerId,
        ranking: ranking.ranked,
        selected: ranking.selected,
      }
    : { factory, from: failedProviderId, to: null, ranking: ranking.ranked, selected: null };
}

/**
 * Recovery: retry probe, maybe downgrade, failover to healthy peer.
 */
export async function recoverProvider({
  providerId,
  rootDir = process.cwd(),
  persist = true,
} = {}) {
  const cfg = continuousConfig();
  const thresholds = cfg.thresholds;
  const attempts = [];
  let lastHealth = null;

  for (let i = 0; i < thresholds.recoveryRetries; i += 1) {
    lastHealth = await runHealthCommand({
      mode: "live",
      provider: providerId,
      rootDir,
      persist: true,
    });
    const rec = (lastHealth.providers || []).find((p) => p.providerId === providerId);
    attempts.push({
      attempt: i + 1,
      status: rec?.status,
      lifecycleStage: rec?.lifecycleStage,
      latencyMs: rec?.latencyMs,
      success: isHealthyCertified(rec),
    });
    if (isHealthyCertified(rec)) {
      const recoveryEvent = buildHistoryEntry({
        providerId,
        eventType: "recovery",
        statusBefore: attempts[0]?.status,
        statusAfter: rec.status,
        lifecycleBefore: attempts[0]?.lifecycleStage,
        lifecycleAfter: rec.lifecycleStage,
        success: true,
        latencyMs: rec.latencyMs,
        model: rec.model,
        probeType: rec.probeType,
        note: `Recovered after ${i + 1} retry(ies)`,
      });
      const gov = loadGovernanceState(rootDir);
      gov.recoveries = [...(gov.recoveries || []), recoveryEvent];
      gov.history = [...(gov.history || []), recoveryEvent];
      if (persist) saveGovernanceState(gov, rootDir);
      await dispatchAlerts(
        [
          {
            type: "PROVIDER_RECOVERED",
            severity: "info",
            providerId,
            message: `${providerId} recovered after ${i + 1} retry(ies)`,
          },
        ],
        rootDir,
      );
      return {
        ok: true,
        recovered: true,
        providerId,
        attempts,
        failover: null,
        record: rec,
        autoPromote: false,
      };
    }
    if (i < thresholds.recoveryRetries - 1) {
      await sleep(thresholds.recoveryRetryDelayMs);
    }
  }

  // Still failing — apply downgrade + failover
  const state = loadHealthState(rootDir);
  const byId = new Map((state?.providers || []).map((p) => [p.providerId, p]));
  const prev = byId.get(providerId);
  const failed = prev || createEmptyProviderRecord(providerId);
  const downgrade = applyAutomaticDowngrade(failed, prev, thresholds);
  byId.set(providerId, downgrade.record);

  const records = ALL_PROVIDER_IDS.map((id) => byId.get(id) || createEmptyProviderRecord(id));
  const failover = selectFallbackProvider(records, providerId);

  const historyEntries = [
    buildHistoryEntry({
      providerId,
      eventType: "recovery_failed",
      statusBefore: attempts[0]?.status,
      statusAfter: downgrade.record.status,
      lifecycleBefore: downgrade.before.lifecycle,
      lifecycleAfter: downgrade.after.lifecycle,
      success: false,
      errorClassification: classifyProbeError(downgrade.record),
      note: "Recovery retries exhausted",
      meta: { attempts },
    }),
  ];
  if (downgrade.downgraded) {
    historyEntries.push(
      buildHistoryEntry({
        providerId,
        eventType: "auto_downgrade",
        statusBefore: downgrade.before.status,
        statusAfter: downgrade.after.status,
        lifecycleBefore: downgrade.before.lifecycle,
        lifecycleAfter: downgrade.after.lifecycle,
        success: false,
        note: downgrade.event?.reason,
        meta: downgrade.event,
      }),
    );
  }
  if (failover?.to) {
    historyEntries.push(
      buildHistoryEntry({
        providerId,
        eventType: "failover",
        statusBefore: failed.status,
        statusAfter: downgrade.record.status,
        lifecycleBefore: downgrade.before.lifecycle,
        lifecycleAfter: downgrade.after.lifecycle,
        success: true,
        note: `Failover ${providerId} → ${failover.to}`,
        meta: failover,
      }),
    );
  }

  const factories = computeFactoryHealthReport(records);
  const nextState = {
    checkedAt: new Date().toISOString(),
    mode: "recover",
    providers: records,
    factories: computeFactoryReadiness(records),
    factoryHealth: factories,
    alerts: [...(state?.alerts || []), ...downgrade.alerts],
    ready: records.filter((r) => isGreenStatus(r.status)).map((r) => r.providerId),
    vercelAutoDeployBlocked: true,
    secretsExposed: false,
  };
  if (persist) {
    saveHealthState(nextState, rootDir);
    appendHistory(
      historyEntries.map((e) => ({
        providerId: e.providerId,
        status: e.statusAfter,
        liveProbe: downgrade.record.liveProbe,
        testedAt: e.timestamp,
        latencyMs: e.latencyMs,
        model: e.model,
        safeErrorMessage: e.errorClassification || "none",
        mode: "recover",
        lifecycleStage: e.lifecycleAfter,
      })),
      rootDir,
    );
  }

  const gov = loadGovernanceState(rootDir);
  gov.history = [...(gov.history || []), ...historyEntries];
  gov.recoveries = [...(gov.recoveries || []), ...historyEntries.filter((e) => e.eventType.startsWith("recovery"))];
  gov.downgrades = [
    ...(gov.downgrades || []),
    ...historyEntries.filter((e) => e.eventType === "auto_downgrade"),
  ];
  gov.failovers = [
    ...(gov.failovers || []),
    ...historyEntries.filter((e) => e.eventType === "failover"),
  ];
  if (persist) saveGovernanceState(gov, rootDir);

  const alertList = [
    ...downgrade.alerts,
    {
      type: failover?.to ? "FAILOVER" : "FAILOVER_UNAVAILABLE",
      severity: failover?.to ? "warning" : "critical",
      providerId,
      message: failover?.to
        ? `Failover ${providerId} → ${failover.to} (${failover.factory})`
        : `No healthy fallback for ${providerId}`,
      failover,
    },
  ];
  await dispatchAlerts(alertList, rootDir);

  return {
    ok: Boolean(failover?.to),
    recovered: false,
    providerId,
    attempts,
    downgrade: downgrade.event,
    failover,
    alerts: alertList,
    factoryHealth: factories,
    autoPromote: false,
    mediaGenerationRun: false,
  };
}

/**
 * Dry-run / live failover test for a factory or provider.
 */
export async function runFailoverTest({
  providerId = null,
  factory = null,
  rootDir = process.cwd(),
  live = false,
} = {}) {
  let state = loadHealthState(rootDir);
  if (live || !state?.providers?.length) {
    await runHealthCommand({
      mode: "live",
      provider: providerId,
      factory,
      rootDir,
      persist: true,
    });
    state = loadHealthState(rootDir);
  }
  const records = state?.providers || [];
  const target =
    providerId ||
    (factory
      ? (factoryPriorities()[factory] || [])[0]
      : records.find((r) => isHealthyCertified(r))?.providerId);
  if (!target) {
    return { ok: false, error: "NO_PROVIDER", message: "No provider available for failover test" };
  }
  const failover = selectFallbackProvider(records, target);
  const event = buildHistoryEntry({
    providerId: target,
    eventType: "failover_test",
    statusBefore: records.find((r) => r.providerId === target)?.status,
    statusAfter: records.find((r) => r.providerId === target)?.status,
    lifecycleBefore: records.find((r) => r.providerId === target)?.lifecycleStage,
    lifecycleAfter: records.find((r) => r.providerId === target)?.lifecycleStage,
    success: Boolean(failover?.to),
    note: failover?.to
      ? `Failover test OK: ${target} → ${failover.to}`
      : `Failover test: no healthy fallback for ${target}`,
    meta: { simulated: true, failover },
  });
  const gov = loadGovernanceState(rootDir);
  gov.failovers = [...(gov.failovers || []), event];
  gov.history = [...(gov.history || []), event];
  saveGovernanceState(gov, rootDir);
  return {
    ok: Boolean(failover?.to),
    simulated: true,
    providerId: target,
    failover,
    event,
    autoPromote: false,
    mediaGenerationRun: false,
  };
}

function providersDueForProbe(records, gov, now = Date.now()) {
  const intervals = continuousIntervals();
  const due = [];
  for (const rec of records) {
    const stage = normalizeLifecycleStage(rec.lifecycleStage);
    if (
      stage !== ProviderLifecycle.READY &&
      stage !== ProviderLifecycle.PRODUCTION_CERTIFIED &&
      stage !== ProviderLifecycle.MISSION_CRITICAL
    ) {
      continue;
    }
    // Skip media generation — connection probes only (already true in runLiveProbe)
    const interval = intervalForLifecycle(stage, intervals);
    const last = gov.nextDueByProvider?.[rec.providerId];
    const lastMs = last ? Date.parse(last) : 0;
    if (!lastMs || now >= lastMs) {
      due.push({ providerId: rec.providerId, stage, intervalMs: interval });
    }
  }
  return due;
}

/**
 * One continuous tick: probe due providers, downgrade on failure, record history.
 */
export async function runContinuousTick({
  rootDir = process.cwd(),
  forceAll = false,
  provider = null,
  factory = null,
} = {}) {
  const cfg = continuousConfig();
  const gov = loadGovernanceState(rootDir);
  let state = loadHealthState(rootDir);

  if (!state?.providers?.length || forceAll || provider || factory) {
    await runHealthCommand({
      mode: "live",
      provider,
      factory,
      rootDir,
      persist: true,
    });
    state = loadHealthState(rootDir);
  }

  const records = state?.providers || [];
  const due = forceAll || provider || factory
    ? records
        .filter((r) => {
          if (provider) return r.providerId === provider;
          if (factory) return (FACTORY_PROVIDERS[factory] || []).includes(r.providerId);
          const stage = normalizeLifecycleStage(r.lifecycleStage);
          return (
            stage === ProviderLifecycle.READY ||
            stage === ProviderLifecycle.PRODUCTION_CERTIFIED ||
            stage === ProviderLifecycle.MISSION_CRITICAL
          );
        })
        .map((r) => ({
          providerId: r.providerId,
          stage: r.lifecycleStage,
          intervalMs: intervalForLifecycle(r.lifecycleStage),
        }))
    : providersDueForProbe(records, gov);

  const results = [];
  const alerts = [];
  const history = [];
  const downgrades = [];
  const byId = new Map(records.map((r) => [r.providerId, r]));

  for (const item of due) {
    // Never run media generation in continuous mode
    if (MEDIA_IDS.has(item.providerId) && cfg.mediaGenerationAllowed) {
      /* still never generation — connection probe only via runHealthCommand */
    }

    const before = byId.get(item.providerId);
    const health = await runHealthCommand({
      mode: "live",
      provider: item.providerId,
      rootDir,
      persist: true,
    });
    let after = (health.providers || []).find((p) => p.providerId === item.providerId) || before;

    const downgrade = applyAutomaticDowngrade(after, before, cfg.thresholds);
    after = downgrade.record;
    byId.set(item.providerId, after);
    alerts.push(...downgrade.alerts);

    const entry = buildHistoryEntry({
      providerId: item.providerId,
      eventType: "continuous_probe",
      statusBefore: before?.status,
      statusAfter: after.status,
      lifecycleBefore: before?.lifecycleStage,
      lifecycleAfter: after.lifecycleStage,
      latencyMs: after.latencyMs,
      providerVersion: after.packageVersion || after.browserVersion || null,
      model: after.model,
      probeType: after.probeType,
      success: isHealthyCertified(after),
      errorClassification: isProbeFailure(after) ? classifyProbeError(after) : null,
    });
    history.push(entry);
    if (downgrade.downgraded) {
      const dEntry = buildHistoryEntry({
        providerId: item.providerId,
        eventType: "auto_downgrade",
        statusBefore: downgrade.before.status,
        statusAfter: downgrade.after.status,
        lifecycleBefore: downgrade.before.lifecycle,
        lifecycleAfter: downgrade.after.lifecycle,
        success: false,
        note: downgrade.event?.reason,
        meta: downgrade.event,
      });
      history.push(dEntry);
      downgrades.push(dEntry);
    }

    // Schedule next due
    gov.nextDueByProvider = gov.nextDueByProvider || {};
    gov.nextDueByProvider[item.providerId] = new Date(
      Date.now() + item.intervalMs,
    ).toISOString();

    results.push({
      providerId: item.providerId,
      success: isHealthyCertified(after),
      status: after.status,
      lifecycleStage: after.lifecycleStage,
      displayMark: after.displayMark,
      downgraded: downgrade.downgraded,
      intervalMs: item.intervalMs,
    });
  }

  const finalRecords = ALL_PROVIDER_IDS.map((id) => byId.get(id) || createEmptyProviderRecord(id));
  const factoryHealth = computeFactoryHealthReport(finalRecords);
  const nextState = {
    checkedAt: new Date().toISOString(),
    mode: "continuous",
    providers: finalRecords,
    factories: computeFactoryReadiness(finalRecords),
    factoryHealth,
    alerts: [...(state?.alerts || []), ...alerts],
    ready: finalRecords.filter((r) => isGreenStatus(r.status)).map((r) => r.providerId),
    vercelAutoDeployBlocked: true,
    secretsExposed: false,
  };
  saveHealthState(nextState, rootDir);
  appendHistory(
    history.map((e) => ({
      providerId: e.providerId,
      status: e.statusAfter,
      liveProbe: byId.get(e.providerId)?.liveProbe,
      testedAt: e.timestamp,
      latencyMs: e.latencyMs,
      model: e.model,
      safeErrorMessage: e.errorClassification || "none",
      mode: "continuous",
      lifecycleStage: e.lifecycleAfter,
    })),
    rootDir,
  );

  gov.lastTickAt = new Date().toISOString();
  gov.history = [...(gov.history || []), ...history];
  gov.downgrades = [...(gov.downgrades || []), ...downgrades];
  saveGovernanceState(gov, rootDir);
  await dispatchAlerts(alerts, rootDir);

  return {
    ok: true,
    mode: "continuous-tick",
    checkedAt: nextState.checkedAt,
    probed: results,
    dueCount: due.length,
    alerts,
    downgrades,
    factoryHealth,
    dashboard: buildDashboardFromState(nextState, rootDir),
    config: {
      intervals: cfg.intervals,
      thresholds: cfg.thresholds,
      priorities: cfg.priorities,
      autoPromote: false,
      mediaGenerationAllowed: false,
    },
    autoPromote: false,
    mediaGenerationRun: false,
  };
}

/**
 * Long-running continuous scheduler (blocks until stopMs or signal).
 */
export async function runContinuousScheduler({
  rootDir = process.cwd(),
  once = false,
  maxTicks = Infinity,
  tickDelayMs = null,
} = {}) {
  const cfg = continuousConfig();
  const gov = loadGovernanceState(rootDir);
  gov.scheduler = { running: true, startedAt: new Date().toISOString() };
  saveGovernanceState(gov, rootDir);

  const ticks = [];
  let count = 0;
  const minDelay =
    tickDelayMs ??
    Math.min(
      cfg.intervals.MISSION_CRITICAL,
      cfg.intervals.PRODUCTION_CERTIFIED,
      cfg.intervals.READY,
    );

  do {
    const tick = await runContinuousTick({ rootDir, forceAll: count === 0 });
    ticks.push({ at: tick.checkedAt, dueCount: tick.dueCount, alerts: tick.alerts.length });
    count += 1;
    if (once || count >= maxTicks) break;
    await sleep(Math.max(1000, Math.min(minDelay, 60_000))); // cap wait in interactive runs
  } while (count < maxTicks);

  const done = loadGovernanceState(rootDir);
  done.scheduler = { running: false, stoppedAt: new Date().toISOString(), ticks: count };
  saveGovernanceState(done, rootDir);

  return {
    ok: true,
    mode: "continuous",
    ticks: count,
    summary: ticks,
    autoPromote: false,
    mediaGenerationRun: false,
    factoryHealth: computeFactoryHealthReport(loadHealthState(rootDir)?.providers || []),
  };
}

export function getContinuousHistory({ rootDir = process.cwd(), limit = 100 } = {}) {
  const gov = loadGovernanceState(rootDir);
  const state = loadHealthState(rootDir);
  const probeHistory = [];
  for (const id of ALL_PROVIDER_IDS) {
    const stats = historyStatsFor(id, rootDir);
    for (const e of stats.entries || []) {
      probeHistory.push({ ...e, providerId: id });
    }
  }
  probeHistory.sort((a, b) => String(a.testedAt).localeCompare(String(b.testedAt)));

  return {
    ok: true,
    governance: {
      lastTickAt: gov.lastTickAt,
      nextDueByProvider: gov.nextDueByProvider,
      scheduler: gov.scheduler,
    },
    history: (gov.history || []).slice(-limit),
    downgrades: (gov.downgrades || []).slice(-limit),
    failovers: (gov.failovers || []).slice(-limit),
    recoveries: (gov.recoveries || []).slice(-limit),
    certifications: (gov.certifications || []).slice(-limit),
    last100Probes: probeHistory.slice(-100),
    factoryHealth: computeFactoryHealthReport(state?.providers || []),
    rankings: Object.fromEntries(
      ["coding", "education", "media", "infrastructure"].map((f) => [
        f,
        rankFactoryProviders(state?.providers || [], f),
      ]),
    ),
    config: continuousConfig(),
    autoPromote: false,
  };
}

export function buildContinuousDashboardExtras(rootDir = process.cwd()) {
  const hist = getContinuousHistory({ rootDir, limit: 100 });
  return {
    continuousMonitoring: true,
    governance: hist.governance,
    lifecycleTimeline: (hist.history || []).slice(-50),
    certificationHistory: hist.certifications,
    downgradeHistory: hist.downgrades,
    failoverHistory: hist.failovers,
    recoveryHistory: hist.recoveries,
    providerRankings: hist.rankings,
    factoryHealth: hist.factoryHealth,
    last100Probes: hist.last100Probes,
    trustMarks: {
      SLOT: "⚪",
      NOT_CONFIGURED: "⚪",
      CREDENTIALS_DETECTED: "🟡",
      PROBE_RUNNING: "🟡",
      READY: "🟢",
      PRODUCTION_CERTIFIED: "🟢⭐",
      MISSION_CRITICAL: "🟢⭐⭐",
    },
  };
}
