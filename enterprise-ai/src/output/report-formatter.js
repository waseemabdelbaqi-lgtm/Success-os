/**
 * Canonical AIOS output format for every completed request.
 */

export function buildExecutiveReport(report) {
  return {
    executiveSummary: [
      `AIOS ${report.status} for objective: ${report.plan?.objective || report.plan?.userRequest}`,
      `Complexity: ${report.plan?.complexity?.level || "n/a"}.`,
      `Providers: ${(report.aiProvidersUsed || []).join(", ") || "none-live"}.`,
      `Agents completed: ${(report.agentsUsed || []).join(", ")}.`,
      `Quality=${report.quality?.ok ? "PASS" : "FAIL"}; Security=${report.security?.status}; Performance=${report.performance?.status}.`,
    ].join(" "),
    aiProvidersUsed: report.aiProvidersUsed || [],
    agentsUsed: report.agentsUsed || [],
    filesModified: report.filesModified || [],
    testsExecuted: report.testsExecuted || [],
    performanceStatus: report.performance?.status || "UNKNOWN",
    securityStatus: report.security?.status || "UNKNOWN",
    documentationGenerated: report.documentation?.path || null,
    remainingTasks: report.remainingWork || [],
    recommendedNextStep: report.suggestedNextStep || null,
  };
}

export function formatAiosDisplay(report) {
  const e = buildExecutiveReport(report);
  return [
    "======== SUCCESS OS · AIOS ========",
    `Executive Summary: ${e.executiveSummary}`,
    `AI Providers Used: ${JSON.stringify(e.aiProvidersUsed)}`,
    `Agents Used: ${JSON.stringify(e.agentsUsed)}`,
    `Files Modified: ${JSON.stringify(e.filesModified)}`,
    `Tests Executed: ${JSON.stringify(e.testsExecuted)}`,
    `Performance Status: ${e.performanceStatus}`,
    `Security Status: ${e.securityStatus}`,
    `Documentation Generated: ${e.documentationGenerated}`,
    `Remaining Tasks: ${JSON.stringify(e.remainingTasks.slice(0, 10))}`,
    `Recommended Next Step: ${e.recommendedNextStep}`,
    `Report: ${report.reportPath}`,
    "==================================",
  ].join("\n");
}
