/**
 * Automatic Documentation — generates operator notes for each AIOS run.
 */
import fs from "node:fs";
import path from "node:path";

export function generateRunDocumentation({
  projectRoot = process.cwd(),
  plan,
  merged,
  quality,
  security,
  performance,
  reportPath,
} = {}) {
  const dir = path.join(projectRoot, "data/master-ai-orchestrator/docs");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${plan.planId}.md`);

  const lines = [
    `# AIOS Run — ${plan.planId}`,
    "",
    `**Objective:** ${plan.objective || plan.userRequest}`,
    `**Complexity:** ${plan.complexity?.level || "n/a"}`,
    `**Created:** ${plan.createdAt}`,
    "",
    "## Providers",
    "",
    ...(merged.providersUsed || []).map((p) => `- ${p}`),
    "",
    "## Agents",
    "",
    ...(merged.summaries || []).map(
      (s) => `- **${s.agent}** (${s.provider}${s.stub ? ", stub" : ""}): ${s.summary || "—"}`,
    ),
    "",
    "## Quality",
    "",
    `- OK: ${quality?.ok}`,
    `- Rejects: ${(quality?.rejects || []).length}`,
    `- Warnings: ${(quality?.warnings || []).length}`,
    "",
    "## Security",
    "",
    `- Status: ${security?.status}`,
    `- Rejects: ${(security?.rejects || []).length}`,
    "",
    "## Performance",
    "",
    `- Status: ${performance?.status}`,
    `- Total: ${performance?.totalMs}ms`,
    `- Suggestions:`,
    ...(performance?.suggestions || []).map((s) => `  - ${s}`),
    "",
    "## Report JSON",
    "",
    reportPath || "(in-memory)",
    "",
    "## Decision notes",
    "",
    "- Existing Success OS routes/pages/schema/business logic were not modified by AIOS scaffolding.",
    "- Provider-specific SDKs remain isolated behind the AI Gateway adapters.",
    "",
  ];

  fs.writeFileSync(file, `${lines.join("\n")}\n`);
  return { path: file, markdown: lines.join("\n") };
}
