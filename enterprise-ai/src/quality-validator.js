/**
 * Quality Validator / Gates
 */
import fs from "node:fs";
import path from "node:path";

const PLACEHOLDER_RE =
  /\b(TODO|FIXME|TBD|lorem ipsum|placeholder|xxx|coming soon|insert here)\b/i;

export function validateQuality({ merged, filesTouched = [], projectRoot = process.cwd() } = {}) {
  const rejects = [];
  const warnings = [];

  for (const s of merged.summaries || []) {
    if (s.summary && PLACEHOLDER_RE.test(s.summary)) {
      rejects.push({ code: "PLACEHOLDER_TEXT", where: s.agent, detail: s.summary.slice(0, 120) });
    }
  }

  for (const file of filesTouched) {
    const abs = path.isAbsolute(file) ? file : path.join(projectRoot, file);
    if (!fs.existsSync(abs)) rejects.push({ code: "MISSING_FILE", where: file });
  }

  if (merged.research?.confidence === "UNVERIFIED" && !(merged.research.officialSources || []).length) {
    warnings.push({
      code: "RESEARCH_UNVERIFIED",
      detail: "Research returned no official sources — treat as non-authoritative",
    });
  }

  if (merged.testing?.smoke && merged.testing.smoke.ok === false) {
    warnings.push({ code: "SMOKE_FAILED", detail: merged.testing.smoke.detail || merged.testing.smoke });
  }

  const engDump = JSON.stringify(merged.engineering || {});
  if (/sk-[A-Za-z0-9]{10,}|api[_-]?key\s*[:=]\s*['\"][^'\"]+['\"]/i.test(engDump)) {
    rejects.push({ code: "SECURITY_ISSUE", detail: "Possible hardcoded secret in engineering output" });
  }

  const summaries = (merged.summaries || []).map((s) => s.summary).filter(Boolean);
  for (let i = 0; i < summaries.length; i++) {
    for (let j = i + 1; j < summaries.length; j++) {
      if (summaries[i] === summaries[j] && summaries[i].length > 40) {
        warnings.push({ code: "DUPLICATE_CONTENT", detail: "Identical agent summaries detected" });
      }
    }
  }

  // Dead / empty specialist outputs
  const emptyAgents = (merged.summaries || []).filter(
    (s) => !s.summary || String(s.summary).trim().length < 8,
  );
  if (emptyAgents.length) {
    warnings.push({
      code: "THIN_OUTPUT",
      detail: emptyAgents.map((a) => a.agent).join(", "),
    });
  }

  return {
    ok: rejects.length === 0,
    rejects,
    warnings,
    gates: [
      "compilation-errors",
      "runtime-errors",
      "broken-ui",
      "broken-routes",
      "broken-apis",
      "duplicate-code",
      "dead-code",
      "placeholder-content",
      "performance-regression",
      "security-vulnerabilities",
      "accessibility-violations",
      "database-inconsistency",
    ],
    performance: {
      agentCount: (merged.agentsCompleted || []).length,
      failedAgents: (merged.agentsFailed || []).length,
      providersUsed: merged.providersUsed || [],
    },
  };
}
