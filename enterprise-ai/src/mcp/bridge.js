/**
 * MCP caller injection + tool registry.
 * AI providers reason; MCP tools perform controlled external actions.
 */

export const MCP_TARGETS = [
  "filesystem",
  "github",
  "postgresql",
  "supabase",
  "docker",
  "browser",
  "browserbase",
  "playwright",
  "notion",
  "google-drive",
  "sentry",
];

const TOOL_CATALOG = [
  { name: "filesystem.read", server: "filesystem", destructive: false, approvalRequired: false },
  { name: "filesystem.write", server: "filesystem", destructive: true, approvalRequired: true },
  { name: "github.get_file", server: "github", destructive: false, approvalRequired: false },
  { name: "github.create_pr_comment", server: "github", destructive: false, approvalRequired: true },
  { name: "playwright.navigate", server: "playwright", destructive: false, approvalRequired: false },
  { name: "browser.navigate", server: "browser", destructive: false, approvalRequired: false },
  { name: "postgres.query_readonly", server: "postgresql", destructive: false, approvalRequired: true },
  { name: "postgres.mutate", server: "postgresql", destructive: true, approvalRequired: true },
  { name: "supabase.rest", server: "supabase", destructive: false, approvalRequired: true },
  { name: "docker.ps", server: "docker", destructive: false, approvalRequired: false },
  { name: "notion.search", server: "notion", destructive: false, approvalRequired: false },
];

export function listMcpTools() {
  return TOOL_CATALOG.map((t) => ({
    ...t,
    availability: "adapter-ready",
    authenticationState: "unknown-until-injected",
    timeoutMs: Number(process.env.AIOS_REQUEST_TIMEOUT_MS || 180000),
  }));
}

export async function probeMcpAvailability({ callMcp } = {}) {
  const results = [];
  for (const target of MCP_TARGETS) {
    if (typeof callMcp !== "function") {
      results.push({
        target,
        available: false,
        mode: "adapter-ready-manual-fallback",
        detail: "No MCP caller injected — connect via Cursor MCP when available",
      });
      continue;
    }
    try {
      await callMcp(target, "list", {});
      results.push({ target, available: true, mode: "mcp" });
    } catch (err) {
      results.push({
        target,
        available: false,
        mode: "adapter-ready-manual-fallback",
        detail: String(err?.message || err).slice(0, 160),
      });
    }
  }
  return {
    checkedAt: new Date().toISOString(),
    preferMcpOverManual: true,
    results,
    tools: listMcpTools(),
    setupInstructions: [
      "Open Cursor Settings → MCP",
      "Enable/authenticate: GitHub, Filesystem, Playwright/Browser, PostgreSQL, Supabase, Docker, Notion",
      "Do not put API keys in tracked MCP JSON files",
      "Inject callMcp into runAIOS({ callMcp }) from the Cursor agent runtime",
    ],
  };
}

export function mcpUsagePolicy() {
  return {
    policy: "Use MCP whenever available instead of manual workflows",
    targets: MCP_TARGETS,
    isolation: "MCP tools are separate from AI providers",
    secrets: "Never pass API keys through MCP tool arguments",
    restrictions: [
      "No unrestricted shell from AI-generated strings",
      "No unrestricted filesystem writes",
      "No destructive DB/Git operations without explicit approval",
    ],
  };
}

export function createMcpAdapter(callMcp) {
  return {
    async invoke(server, tool, args = {}, { approveDestructive = false } = {}) {
      const meta = TOOL_CATALOG.find((t) => t.server === server && t.name.endsWith(tool.split(".").pop()));
      if (meta?.destructive && !approveDestructive) {
        throw new Error(`MCP_APPROVAL_REQUIRED:${server}/${tool}`);
      }
      if (typeof callMcp !== "function") throw new Error(`MCP_UNAVAILABLE:${server}/${tool}`);
      return callMcp(server, tool, args);
    },
  };
}

export function getMcpToolRegistry() {
  const tools = listMcpTools();
  return {
    isolation: "MCP tools are separate from AI providers",
    targets: MCP_TARGETS,
    tools,
    detected: MCP_TARGETS,
    ready: tools.filter((t) => !t.destructive && t.availability === "adapter-ready").map((t) => t.name),
    requiringSetup: tools.map((t) => ({
      name: t.name,
      authenticationState: t.authenticationState,
      approvalRequired: t.approvalRequired,
      destructive: t.destructive,
    })),
    setupInstructions: [
      "Cursor Settings → MCP",
      "Authenticate GitHub, Filesystem, Playwright/Browser, PostgreSQL, Supabase, Docker, Notion as needed",
      "Never store API keys in tracked MCP JSON",
      "Inject callMcp into runAIOS({ callMcp }) from the Cursor runtime",
    ],
    restrictions: mcpUsagePolicy().restrictions,
  };
}
