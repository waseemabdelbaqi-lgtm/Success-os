/**
 * Security Validator — OWASP-oriented gates (no secrets in outputs, no unsafe patterns).
 */

const SECRET_RE =
  /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]+['"]|sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}/i;

const DANGEROUS_RE =
  /\beval\s*\(|new\s+Function\s*\(|dangerouslySetInnerHTML\s*=\s*\{\s*[^}]*user/i;

export function validateSecurity({ merged, filesTouched = [] } = {}) {
  const rejects = [];
  const warnings = [];
  const blob = JSON.stringify(merged || {});

  if (SECRET_RE.test(blob)) {
    rejects.push({
      code: "HARDCODED_SECRET",
      detail: "Possible credential material detected in agent outputs",
    });
  }

  if (DANGEROUS_RE.test(blob)) {
    warnings.push({
      code: "UNSAFE_PATTERN",
      detail: "Potentially unsafe code pattern mentioned in proposals",
    });
  }

  // Ensure agents did not propose committing .env secrets
  for (const f of filesTouched) {
    if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".example")) {
      rejects.push({ code: "ENV_FILE_TOUCH", detail: f });
    }
  }

  if ((merged.security?.risks || []).some((r) => /critical|rce|injection/i.test(String(r)))) {
    warnings.push({ code: "SECURITY_RISK_FLAGGED", detail: "Security agent flagged critical risks" });
  }

  return {
    ok: rejects.length === 0,
    status: rejects.length === 0 ? "PASS" : "FAIL",
    rejects,
    warnings,
    owaspNotes: [
      "Secrets only via environment variables",
      "Validate inputs / sanitize outputs before apply",
      "Least privilege for MCP and cloud credentials",
    ],
  };
}
