#!/usr/bin/env node
/**
 * AIOS CLI
 *   node enterprise-ai/src/cli.js "your request"
 *   node enterprise-ai/src/cli.js --detect
 *   node enterprise-ai/src/cli.js --agents
 */
import { runAIOS, formatAiosDisplay } from "./aios.js";
import { detectProviders } from "./providers/detect.js";
import { listGatewayProviders } from "./gateway/ai-gateway.js";
import { listAgents } from "./agents/registry.js";
import { probeMcpAvailability, mcpUsagePolicy } from "./mcp/bridge.js";
import { gitAutomationStatus } from "./git-automation.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--agents")) {
    console.log(JSON.stringify({ agents: listAgents(), gatewayProviders: listGatewayProviders() }, null, 2));
    return;
  }

  if (args.includes("--detect") || args.includes("--health")) {
    const providers = await detectProviders();
    const mcp = await probeMcpAvailability();
    console.log(
      JSON.stringify(
        {
          system: "SUCCESS-OS-AIOS",
          gatewayProviders: listGatewayProviders(),
          agents: listAgents(),
          providers,
          mcp: { ...mcp, policy: mcpUsagePolicy() },
          git: gitAutomationStatus(),
          activation: {
            note: "Merge keys from enterprise-ai/config/.env.orchestrator.example into .env.local",
            inactiveProviders: providers.inactive,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  const request = args.filter((a) => !a.startsWith("--")).join(" ").trim();
  if (!request) {
    console.error('Usage: npm run ai:aios -- "Improve curriculum research pipeline"');
    console.error("       npm run ai:aios:detect");
    console.error("       npm run ai:aios -- --agents");
    process.exit(1);
  }

  const report = await runAIOS(request, {
    context: { source: "cli", runSmoke: args.includes("--smoke") },
  });

  console.log(formatAiosDisplay(report));
  console.log(JSON.stringify(report.executive, null, 2));

  if (!report.quality.ok || !report.security.ok) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
