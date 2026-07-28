/**
 * MCP Support — isolated adapters for Cursor MCP servers.
 * Prefer MCP over manual workflows when a caller is injected.
 */

export const MCP_TARGETS = [
  "filesystem",
  "github",
  "postgresql",
  "supabase",
  "docker",
  "browser",
  "playwright",
  "notion",
  "google-drive",
];

/**
 * @param {object} opts
 * @param {(server:string, tool:string, args?:object)=>Promise<any>} [opts.callMcp]
 */
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
    futureServers: ["linear", "slack", "custom-mcp"],
  };
}

export function mcpUsagePolicy() {
  return {
    policy: "Use MCP whenever available instead of manual workflows",
    targets: MCP_TARGETS,
    isolation: "Each connector is isolated behind an adapter; app code never talks to MCP SDKs directly",
    secrets: "Never pass API keys through MCP tool arguments; rely on server-side auth",
  };
}

/** Thin adapter facade for future MCP tool calls */
export function createMcpAdapter(callMcp) {
  return {
    async invoke(server, tool, args = {}) {
      if (typeof callMcp !== "function") {
        throw new Error(`MCP_UNAVAILABLE:${server}/${tool}`);
      }
      return callMcp(server, tool, args);
    },
  };
}
