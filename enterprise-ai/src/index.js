/**
 * Public API — Success OS Enterprise AI Operating System (AIOS)
 */
export { runAIOS, runMasterOrchestrator, formatOrchestratorDisplay, formatAiosDisplay, buildExecutiveReport } from "./aios.js";
export { detectProviders, getProviderManifest } from "./providers/detect.js";
export { gatewayChat, registerProvider, listGatewayProviders } from "./gateway/ai-gateway.js";
export { planRequest, planTasks } from "./planning/engine.js";
export { dispatchParallel, runTaskQueue } from "./queue/dispatcher.js";
export { aggregateResults } from "./result-aggregator.js";
export { validateQuality } from "./quality-validator.js";
export { validateSecurity } from "./security/validator.js";
export { optimizePerformance } from "./performance/optimizer.js";
export { generateRunDocumentation } from "./documentation/auto-docs.js";
export { probeMcpAvailability, mcpUsagePolicy, MCP_TARGETS, createMcpAdapter, getMcpToolRegistry, listMcpTools } from "./mcp/bridge.js";
export { gitAutomationStatus, maybeAutoCommit } from "./git-automation.js";
export { listAgents, getAgentRunner, registerAgent } from "./agents/registry.js";
export {
  createProviderRegistry,
  runAllHealthChecks,
  routeForRole,
  chatViaRegistry,
  validateConfiguredModels,
} from "./providers/registry.js";
export {
  isLiveAuthenticatedReady,
  displayColorForProbe,
  buildInfrastructureDashboard,
  loadHealthSnapshot,
  saveHealthSnapshot,
  AI_INFRASTRUCTURE_DISPLAY_IDS,
} from "./providers/live-status.js";
export { runInfrastructureHealthChecks } from "./providers/infra-health.js";
export {
  runHealthCommand,
  computeFactoryReadiness,
  certifyProviders,
  promoteMissionCritical,
} from "./providers/health-runner.js";
export {
  continuousConfig,
  continuousIntervals,
  factoryPriorities,
} from "./providers/continuous-config.js";
export {
  runContinuousTick,
  runContinuousScheduler,
  recoverProvider,
  runFailoverTest,
  getContinuousHistory,
  computeFactoryHealthReport,
  rankFactoryProviders,
  applyAutomaticDowngrade,
  buildContinuousDashboardExtras,
} from "./providers/continuous-governance.js";
export {
  loadHealthState,
  buildDashboardFromState,
  saveHealthState,
} from "./providers/health-store.js";
export {
  CanonicalStatus,
  LiveProbeResult,
  ProviderLifecycle,
  LIFECYCLE_LADDER,
  LIFECYCLE_LADDER_LABELS,
  colorForStatus,
  colorForLifecycle,
  deriveLifecycleStage,
  hasReadyEvidence,
  hasProductionCertificationEvidence,
  hasMissionCriticalEvidence,
  isGreenStatus,
  displayMarkForLifecycle,
  redactSecrets,
  HEALTH_SCHEMA_VERSION,
} from "./providers/status-model.js";
export {
  evaluateProductionCertifyRequirements,
  evaluateMissionCriticalRequirements,
  buildStructuredDiagnostic,
  trustConfig,
} from "./providers/trust-lifecycle.js";
export { loadAiosEnv } from "./env/load.js";
export {
  getFactoriesManifest,
  listFactories,
  listInfrastructure,
  summarizeFactories,
  factoryForAgent,
  annotateTasksWithFactory,
} from "./factories/registry.js";

// Legacy agent constants
export { GPT_ENGINEERING_AGENT } from "./agents/gpt-engineering.js";
export { CLAUDE_CURRICULUM_AGENT } from "./agents/claude-curriculum.js";
export { GEMINI_RESEARCH_AGENT } from "./agents/gemini-research.js";
export { VIDEO_AGENT } from "./agents/video.js";
export { VOICE_AGENT } from "./agents/voice.js";
export { TESTING_AGENT } from "./agents/testing.js";
