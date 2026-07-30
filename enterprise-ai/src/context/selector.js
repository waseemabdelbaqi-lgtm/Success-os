/**
 * Context selection — send only relevant files/rules to providers.
 */
import fs from "node:fs";
import path from "node:path";

const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "coverage",
  "tmp",
  "data",
]);

export function selectContext({
  projectRoot = process.cwd(),
  objective = "",
  agent = "",
  maxFiles = 8,
  maxChars = 24000,
} = {}) {
  const roots = ["enterprise-ai", "scripts"].filter((d) => fs.existsSync(path.join(projectRoot, d)));
  const keywords = `${objective} ${agent}`.toLowerCase().split(/[^a-z0-9_./-]+/).filter((w) => w.length > 3);
  const scored = [];

  function walk(dir, depth = 0) {
    if (depth > 4) return;
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full, depth + 1);
        continue;
      }
      if (!/\.(js|mjs|ts|tsx|md|json)$/.test(ent.name)) continue;
      const rel = path.relative(projectRoot, full).replace(/\\/g, "/");
      let score = 0;
      const hay = rel.toLowerCase();
      for (const k of keywords) if (hay.includes(k)) score += 3;
      if (hay.includes("enterprise-ai")) score += 2;
      if (hay.includes(agent.toLowerCase())) score += 4;
      if (score > 0) scored.push({ path: rel, score });
    }
  }

  for (const r of roots) walk(path.join(projectRoot, r));
  scored.sort((a, b) => b.score - a.score);

  const files = [];
  let chars = 0;
  for (const item of scored.slice(0, maxFiles * 2)) {
    if (files.length >= maxFiles) break;
    const abs = path.join(projectRoot, item.path);
    let content = "";
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    if (content.length > 12000) content = `${content.slice(0, 12000)}\n/* …truncated… */\n`;
    if (chars + content.length > maxChars) break;
    files.push({ path: item.path, content, score: item.score });
    chars += content.length;
  }

  return {
    objective,
    agent,
    files,
    filePaths: files.map((f) => f.path),
    totalChars: chars,
    rules: [
      "Do not modify Success OS pages, routes, UI, schema, APIs, or business logic unless explicitly asked.",
      "Never hardcode secrets.",
      "Prefer additive enterprise-ai modules.",
      "REVIEW MODE: propose patches only unless execute mode is enabled.",
    ],
  };
}

export function formatContextForPrompt(ctx) {
  const parts = [
    `Objective: ${ctx.objective}`,
    `Agent: ${ctx.agent}`,
    "Rules:",
    ...ctx.rules.map((r) => `- ${r}`),
    "Relevant files:",
  ];
  for (const f of ctx.files) {
    parts.push(`\n--- FILE: ${f.path} ---`);
    parts.push(f.content);
  }
  return parts.join("\n");
}
