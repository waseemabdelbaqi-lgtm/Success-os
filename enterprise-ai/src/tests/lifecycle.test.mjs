#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CanonicalStatus,
  ProviderLifecycle,
  colorForLifecycle,
  deriveLifecycleStage,
  displayMarkForLifecycle,
  hasMissionCriticalEvidence,
  hasProductionCertificationEvidence,
  hasReadyEvidence,
  lifecycleProgress,
  normalizeLifecycleStage,
} from "../providers/status-model.js";
import {
  appendHistory,
  normalizeProviderRecord,
  saveHealthState,
} from "../providers/health-store.js";
import { certifyProviders, promoteMissionCritical } from "../providers/health-runner.js";
import {
  evaluateMissionCriticalRequirements,
  evaluateProductionCertifyRequirements,
} from "../providers/trust-lifecycle.js";

assert.equal(normalizeLifecycleStage("CONFIGURED"), ProviderLifecycle.CREDENTIALS_DETECTED);
assert.equal(normalizeLifecycleStage("LIVE_VERIFIED"), ProviderLifecycle.PROBE_RUNNING);
assert.equal(displayMarkForLifecycle(ProviderLifecycle.SLOT), "⚪");
assert.equal(displayMarkForLifecycle(ProviderLifecycle.NOT_CONFIGURED), "⚪");
assert.equal(displayMarkForLifecycle(ProviderLifecycle.CREDENTIALS_DETECTED), "🟡");
assert.equal(displayMarkForLifecycle(ProviderLifecycle.PROBE_RUNNING), "🟡");
assert.equal(displayMarkForLifecycle(ProviderLifecycle.READY), "🟢");
assert.equal(displayMarkForLifecycle(ProviderLifecycle.PRODUCTION_CERTIFIED), "🟢⭐");
assert.equal(displayMarkForLifecycle(ProviderLifecycle.MISSION_CRITICAL), "🟢⭐⭐");

const slot = deriveLifecycleStage({ status: CanonicalStatus.SLOT, adapterAvailable: false });
assert.equal(slot, ProviderLifecycle.SLOT);

const notConfigured = deriveLifecycleStage({
  status: CanonicalStatus.NOT_CONFIGURED,
  adapterAvailable: true,
  credentialsDetected: false,
});
assert.equal(notConfigured, ProviderLifecycle.NOT_CONFIGURED);

const credentials = deriveLifecycleStage({
  status: CanonicalStatus.CREDENTIALS_DETECTED,
  credentialsDetected: true,
  adapterAvailable: true,
});
assert.equal(credentials, ProviderLifecycle.CREDENTIALS_DETECTED);
assert.equal(colorForLifecycle(credentials), "yellow");

const probing = deriveLifecycleStage({
  status: CanonicalStatus.PROBE_RUNNING,
  credentialsDetected: true,
  adapterAvailable: true,
  liveProbeExecuted: true,
  liveProbe: "RUNNING",
});
assert.equal(probing, ProviderLifecycle.PROBE_RUNNING);

const ready = deriveLifecycleStage({
  status: CanonicalStatus.READY,
  credentialsDetected: true,
  authenticated: true,
  liveProbeExecuted: true,
  liveProbe: "PASSED",
  result: "success",
  testedAt: "2026-07-30T00:00:00.000Z",
  latencyMs: 100,
  errorCode: "none",
});
assert.equal(ready, ProviderLifecycle.READY);

// Streak alone must NOT auto-certify
assert.equal(
  hasProductionCertificationEvidence({
    providerId: "openai",
    status: CanonicalStatus.READY,
    authenticated: true,
    liveProbeExecuted: true,
    liveProbe: "PASSED",
    result: "success",
    testedAt: "2026-07-30T00:00:00.000Z",
    latencyMs: 10,
    errorCode: "none",
    consecutiveSuccesses: 99,
  }),
  false,
);

const readyRec = normalizeProviderRecord({
  providerId: "ollama",
  status: CanonicalStatus.READY,
  authenticated: true,
  liveProbeExecuted: true,
  liveProbe: "PASSED",
  result: "success",
  testedAt: "2026-07-30T00:00:00.000Z",
  latencyMs: 990,
  model: "qwen3:8b",
  errorCode: "none",
  safeErrorMessage: "none",
  credentialsDetected: true,
});
assert.equal(readyRec.lifecycleStage, ProviderLifecycle.READY);
assert.equal(readyRec.displayMark, "🟢");
assert.equal(readyRec.productionCertified, false);

// Explicit flag → PRODUCTION CERTIFIED
const certifiedRec = normalizeProviderRecord(
  {
    ...readyRec,
    productionCertified: true,
    certifiedAt: "2026-07-30T01:00:00.000Z",
  },
  readyRec,
);
assert.equal(certifiedRec.lifecycleStage, ProviderLifecycle.PRODUCTION_CERTIFIED);
assert.equal(certifiedRec.status, CanonicalStatus.PRODUCTION_CERTIFIED);
assert.equal(certifiedRec.displayMark, "🟢⭐");
assert.equal(hasMissionCriticalEvidence(certifiedRec), false);

const mcRec = normalizeProviderRecord(
  {
    ...certifiedRec,
    missionCritical: true,
    productionCertified: true,
    missionCriticalAt: "2026-07-30T02:00:00.000Z",
  },
  certifiedRec,
);
assert.equal(mcRec.lifecycleStage, ProviderLifecycle.MISSION_CRITICAL);
assert.equal(mcRec.displayMark, "🟢⭐⭐");

// Historical previousStage alone must NEVER restore star tiers without explicit flags
const noHistoryStar = deriveLifecycleStage(
  {
    status: CanonicalStatus.READY,
    credentialsDetected: true,
    authenticated: true,
    liveProbeExecuted: true,
    liveProbe: "PASSED",
    result: "success",
    testedAt: "2026-07-30T00:00:00.000Z",
    latencyMs: 50,
    errorCode: "none",
    productionCertified: false,
    missionCritical: false,
  },
  ProviderLifecycle.MISSION_CRITICAL,
);
assert.equal(noHistoryStar, ProviderLifecycle.READY);
assert.equal(displayMarkForLifecycle(noHistoryStar), "🟢");

// Credentials/adapter alone never READY
assert.notEqual(
  deriveLifecycleStage({
    status: CanonicalStatus.CREDENTIALS_DETECTED,
    credentialsDetected: true,
    adapterAvailable: true,
  }),
  ProviderLifecycle.READY,
);

// Media cannot certify without generationVerified
const mediaReady = {
  providerId: "heygen",
  status: CanonicalStatus.READY,
  lifecycleStage: ProviderLifecycle.READY,
  authenticated: true,
  liveProbeExecuted: true,
  liveProbe: "PASSED",
  result: "success",
  testedAt: "2026-07-30T00:00:00.000Z",
  latencyMs: 100,
  errorCode: "none",
  credentialsDetected: true,
  consecutiveSuccesses: 3,
  generationVerified: false,
};
const mediaEval = evaluateProductionCertifyRequirements(mediaReady);
assert.equal(mediaEval.ok, false);
assert.ok(mediaEval.failedRequirements.some((r) => r.id === "generationVerified"));

const progress = lifecycleProgress(ProviderLifecycle.PROBE_RUNNING);
assert.equal(progress.filter((p) => p.reached).length, 4);
assert.ok(
  hasReadyEvidence({
    status: CanonicalStatus.READY,
    authenticated: true,
    liveProbeExecuted: true,
    result: "success",
    testedAt: "2026-07-30T00:00:00.000Z",
    latencyMs: 10,
    errorCode: null,
  }),
);

{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aios-trust-"));
  const readyRow = normalizeProviderRecord({
    providerId: "playwright",
    status: CanonicalStatus.READY,
    authenticated: true,
    liveProbeExecuted: true,
    liveProbe: "PASSED",
    result: "success",
    testedAt: "2026-07-30T00:00:00.000Z",
    latencyMs: 120,
    model: "chromium",
    errorCode: "none",
    safeErrorMessage: "none",
    credentialsDetected: true,
    packageInstalled: true,
    consecutiveSuccesses: 2,
    factory: "infrastructure",
  });
  const configuredOnly = normalizeProviderRecord({
    providerId: "supabase",
    status: CanonicalStatus.CREDENTIALS_DETECTED,
    credentialsDetected: true,
    adapterAvailable: true,
  });
  saveHealthState(
    {
      checkedAt: new Date().toISOString(),
      mode: "test",
      providers: [readyRow, configuredOnly],
      factories: {},
      alerts: [],
      ready: ["playwright"],
      certified: [],
      missionCritical: [],
    },
    tmp,
  );

  const skipped = await certifyProviders({
    providerIds: ["supabase"],
    rootDir: tmp,
    persist: true,
  });
  assert.equal(skipped.ok, false);
  assert.equal(skipped.rejected[0]?.reason, "REQUIREMENTS_FAILED");
  assert.ok(skipped.diagnostics[0]?.failedRequirements?.length > 0);

  const skipMc = await promoteMissionCritical({
    providerIds: ["playwright"],
    rootDir: tmp,
    persist: true,
  });
  assert.equal(skipMc.ok, false);
  assert.ok(
    skipMc.diagnostics[0]?.failedRequirements?.some(
      (r) => r.id === "currentlyProductionCertified" || r.id === "noStageSkip",
    ),
  );

  const ok = await certifyProviders({
    providerIds: ["playwright"],
    rootDir: tmp,
    persist: true,
  });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.certified, ["playwright"]);
  const afterCert = ok.providers.find((p) => p.providerId === "playwright");
  assert.equal(afterCert.lifecycleStage, ProviderLifecycle.PRODUCTION_CERTIFIED);
  assert.equal(afterCert.displayMark, "🟢⭐");
  assert.ok(afterCert.certifiedAt);
  assert.ok(ok.auditPath);

  // Seed history + streak so mission-critical operational checks pass
  let seeded = afterCert;
  for (let i = 0; i < 5; i += 1) {
    seeded = normalizeProviderRecord(
      {
        providerId: "playwright",
        status: CanonicalStatus.READY,
        authenticated: true,
        liveProbeExecuted: true,
        liveProbe: "PASSED",
        result: "success",
        testedAt: `2026-07-30T03:0${i}:00.000Z`,
        latencyMs: 100 + i,
        model: "chromium",
        errorCode: "none",
        safeErrorMessage: "none",
        credentialsDetected: true,
        packageInstalled: true,
        productionCertified: true,
        factory: "infrastructure",
      },
      seeded,
    );
    appendHistory(
      [
        {
          providerId: "playwright",
          status: seeded.status,
          liveProbe: "PASSED",
          testedAt: seeded.testedAt,
          latencyMs: seeded.latencyMs,
          model: "chromium",
          safeErrorMessage: "none",
          mode: "live",
          lifecycleStage: seeded.lifecycleStage,
        },
      ],
      tmp,
    );
  }
  saveHealthState(
    {
      checkedAt: new Date().toISOString(),
      mode: "test",
      providers: [seeded, configuredOnly],
      factories: {},
      alerts: [],
      ready: ["playwright"],
      certified: ["playwright"],
      missionCritical: [],
    },
    tmp,
  );

  const mcEval = evaluateMissionCriticalRequirements(seeded, {
    historyStats: {
      last20Count: 5,
      successRate: 1,
      averageLatencyMs: 110,
    },
    alerts: [],
  });
  assert.equal(mcEval.ok, true, JSON.stringify(mcEval.failedRequirements, null, 2));

  const mc = await promoteMissionCritical({
    providerIds: ["playwright"],
    rootDir: tmp,
    persist: true,
  });
  assert.equal(mc.ok, true, JSON.stringify(mc.diagnostics, null, 2));
  assert.deepEqual(mc.missionCritical, ["playwright"]);
  const afterMc = mc.providers.find((p) => p.providerId === "playwright");
  assert.equal(afterMc.lifecycleStage, ProviderLifecycle.MISSION_CRITICAL);
  assert.equal(afterMc.displayMark, "🟢⭐⭐");
  assert.ok(afterMc.missionCriticalAt);
  assert.ok(mc.auditPath);

  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("lifecycle.test.mjs: OK");
