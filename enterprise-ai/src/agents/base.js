import { gatewayChat } from "../gateway/ai-gateway.js";
import { parseJsonLoose } from "../contracts/agent-output.js";

/**
 * Resolve a chat provider via AI Gateway registry (cloud → ollama → offline stub).
 */
export async function resolveChat(preferredOrder, { system, user, maxTokens = 1600, role = "default" } = {}) {
  const chat = await gatewayChat({
    role,
    preferred: preferredOrder,
    system,
    user,
    maxTokens,
  });
  return {
    ...chat,
    tried: chat.tried || [],
  };
}

export { parseJsonLoose };
