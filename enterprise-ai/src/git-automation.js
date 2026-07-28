/**
 * Optional git automation for orchestrator completions.
 * Default: DRY / disabled — never force commits without MASTER_ORCHESTRATOR_AUTO_COMMIT=true.
 */
import { spawnSync } from "node:child_process";

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  return {
    ok: r.status === 0,
    status: r.status,
    stdout: (r.stdout || "").trim(),
    stderr: (r.stderr || "").trim(),
  };
}

export function gitAutomationStatus(cwd = process.cwd()) {
  const autoCommit = process.env.MASTER_ORCHESTRATOR_AUTO_COMMIT === "true";
  const autoPush = process.env.MASTER_ORCHESTRATOR_AUTO_PUSH === "true";
  const dryRun = process.env.MASTER_ORCHESTRATOR_DRY_RUN !== "false";
  const status = run("git", ["status", "-sb"], cwd);
  return {
    autoCommit,
    autoPush,
    dryRun,
    branch: status.stdout.split("\n")[0] || "",
    dirty: /^( M|M |\?\?|A |D )/m.test(status.stdout),
  };
}

export function maybeAutoCommit({ message, cwd = process.cwd(), files = [] } = {}) {
  const cfg = gitAutomationStatus(cwd);
  if (!cfg.autoCommit) {
    return { skipped: true, reason: "MASTER_ORCHESTRATOR_AUTO_COMMIT!=true", cfg };
  }
  if (cfg.dryRun) {
    return { skipped: true, reason: "DRY_RUN", wouldCommit: message, files, cfg };
  }
  if (files.length) {
    run("git", ["add", ...files], cwd);
  } else {
    run("git", ["add", "-A"], cwd);
  }
  const commit = run("git", ["commit", "-m", message], cwd);
  let push = null;
  if (commit.ok && cfg.autoPush) {
    push = run("git", ["push"], cwd);
  }
  return { skipped: false, commit, push, cfg };
}
