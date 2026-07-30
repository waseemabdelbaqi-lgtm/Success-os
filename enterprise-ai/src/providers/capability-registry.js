/**
 * AIOS Provider Capability Registry.
 * Router rejects tasks whose required capability is not declared.
 */

export const Capabilities = Object.freeze({
  CHAT: "chat",
  REASONING: "reasoning",
  VISION: "vision",
  IMAGE_GENERATION: "image_generation",
  EMBEDDINGS: "embeddings",
  CODING: "coding",
  LONG_CONTEXT: "long_context",
  EDUCATION: "education",
  DOCUMENTS: "documents",
  LOCAL_CHAT: "local_chat",
  LOCAL_REASONING: "local_reasoning",
  AVATAR_VIDEO: "avatar_video",
  SPEECH: "speech",
  BROWSER_AUTOMATION: "browser_automation",
  CLOUD_BROWSER: "cloud_browser",
  INFRA_READ: "infra_read",
});

/** Task type → required capability (+ optional factory hint). */
export const TASK_CAPABILITY_MAP = Object.freeze({
  chat: Capabilities.CHAT,
  reasoning: Capabilities.REASONING,
  coding: Capabilities.CODING,
  long_context: Capabilities.LONG_CONTEXT,
  education: Capabilities.EDUCATION,
  vision: Capabilities.VISION,
  documents: Capabilities.DOCUMENTS,
  embeddings: Capabilities.EMBEDDINGS,
  image_generation: Capabilities.IMAGE_GENERATION,
  avatar_video: Capabilities.AVATAR_VIDEO,
  speech: Capabilities.SPEECH,
  browser_automation: Capabilities.BROWSER_AUTOMATION,
  cloud_browser: Capabilities.CLOUD_BROWSER,
  local_chat: Capabilities.LOCAL_CHAT,
  local_reasoning: Capabilities.LOCAL_REASONING,
  infra_read: Capabilities.INFRA_READ,
});

/**
 * Canonical capability declarations per provider.
 * Costs are USD units for estimation (overridable via env).
 */
export const PROVIDER_CAPABILITIES = Object.freeze({
  openai: {
    displayName: "OpenAI",
    factory: ["coding", "education", "media"],
    capabilities: [
      Capabilities.CHAT,
      Capabilities.REASONING,
      Capabilities.VISION,
      Capabilities.IMAGE_GENERATION,
      Capabilities.EMBEDDINGS,
      Capabilities.CODING,
      Capabilities.EDUCATION,
    ],
    cost: {
      inputPer1kTokens: Number(process.env.AIOS_COST_OPENAI_INPUT_1K || 0.005),
      outputPer1kTokens: Number(process.env.AIOS_COST_OPENAI_OUTPUT_1K || 0.015),
      imageGeneration: Number(process.env.AIOS_COST_OPENAI_IMAGE || 0.04),
    },
    limits: {
      rpm: Number(process.env.AIOS_LIMIT_OPENAI_RPM || 60),
      monthlyBudgetUsd: Number(process.env.AIOS_BUDGET_OPENAI_USD || 100),
    },
  },
  anthropic: {
    displayName: "Claude",
    factory: ["coding", "education"],
    capabilities: [
      Capabilities.CHAT,
      Capabilities.CODING,
      Capabilities.LONG_CONTEXT,
      Capabilities.REASONING,
      Capabilities.EDUCATION,
    ],
    cost: {
      inputPer1kTokens: Number(process.env.AIOS_COST_ANTHROPIC_INPUT_1K || 0.003),
      outputPer1kTokens: Number(process.env.AIOS_COST_ANTHROPIC_OUTPUT_1K || 0.015),
    },
    limits: {
      rpm: Number(process.env.AIOS_LIMIT_ANTHROPIC_RPM || 60),
      monthlyBudgetUsd: Number(process.env.AIOS_BUDGET_ANTHROPIC_USD || 100),
    },
  },
  gemini: {
    displayName: "Gemini",
    factory: ["education", "coding"],
    capabilities: [
      Capabilities.CHAT,
      Capabilities.EDUCATION,
      Capabilities.VISION,
      Capabilities.DOCUMENTS,
      Capabilities.REASONING,
    ],
    cost: {
      inputPer1kTokens: Number(process.env.AIOS_COST_GEMINI_INPUT_1K || 0.0005),
      outputPer1kTokens: Number(process.env.AIOS_COST_GEMINI_OUTPUT_1K || 0.0015),
    },
    limits: {
      rpm: Number(process.env.AIOS_LIMIT_GEMINI_RPM || 60),
      monthlyBudgetUsd: Number(process.env.AIOS_BUDGET_GEMINI_USD || 50),
    },
  },
  ollama: {
    displayName: "Ollama",
    factory: ["coding", "education"],
    capabilities: [
      Capabilities.CHAT,
      Capabilities.LOCAL_CHAT,
      Capabilities.LOCAL_REASONING,
      Capabilities.REASONING,
      Capabilities.CODING,
    ],
    cost: {
      inputPer1kTokens: 0,
      outputPer1kTokens: 0,
    },
    limits: {
      rpm: Number(process.env.AIOS_LIMIT_OLLAMA_RPM || 120),
      monthlyBudgetUsd: Number(process.env.AIOS_BUDGET_OLLAMA_USD || 0),
    },
  },
  "ollama-local": {
    displayName: "Ollama",
    factory: ["coding", "education"],
    capabilities: [
      Capabilities.CHAT,
      Capabilities.LOCAL_CHAT,
      Capabilities.LOCAL_REASONING,
      Capabilities.REASONING,
      Capabilities.CODING,
    ],
    cost: { inputPer1kTokens: 0, outputPer1kTokens: 0 },
    limits: { rpm: 120, monthlyBudgetUsd: 0 },
  },
  heygen: {
    displayName: "HeyGen",
    factory: ["media"],
    capabilities: [Capabilities.AVATAR_VIDEO],
    cost: {
      avatarVideo: Number(process.env.AIOS_COST_HEYGEN_VIDEO || 1.0),
    },
    limits: {
      rpm: Number(process.env.AIOS_LIMIT_HEYGEN_RPM || 10),
      monthlyBudgetUsd: Number(process.env.AIOS_BUDGET_HEYGEN_USD || 50),
    },
  },
  elevenlabs: {
    displayName: "ElevenLabs",
    factory: ["media"],
    capabilities: [Capabilities.SPEECH],
    cost: {
      speechPer1kChars: Number(process.env.AIOS_COST_ELEVENLABS_1K_CHARS || 0.3),
    },
    limits: {
      rpm: Number(process.env.AIOS_LIMIT_ELEVENLABS_RPM || 20),
      monthlyBudgetUsd: Number(process.env.AIOS_BUDGET_ELEVENLABS_USD || 50),
    },
  },
  "openai-images": {
    displayName: "OpenAI Images",
    factory: ["media"],
    capabilities: [Capabilities.IMAGE_GENERATION],
    cost: {
      imageGeneration: Number(process.env.AIOS_COST_OPENAI_IMAGE || 0.04),
    },
    limits: {
      rpm: Number(process.env.AIOS_LIMIT_OPENAI_IMAGES_RPM || 20),
      monthlyBudgetUsd: Number(process.env.AIOS_BUDGET_OPENAI_IMAGES_USD || 50),
    },
  },
  playwright: {
    displayName: "Playwright",
    factory: ["infrastructure"],
    capabilities: [Capabilities.BROWSER_AUTOMATION],
    cost: { browserSession: 0 },
    limits: { rpm: 30, monthlyBudgetUsd: 0 },
  },
  browserbase: {
    displayName: "Browserbase",
    factory: ["infrastructure"],
    capabilities: [Capabilities.CLOUD_BROWSER, Capabilities.BROWSER_AUTOMATION],
    cost: {
      browserSession: Number(process.env.AIOS_COST_BROWSERBASE_SESSION || 0.05),
    },
    limits: {
      rpm: Number(process.env.AIOS_LIMIT_BROWSERBASE_RPM || 20),
      monthlyBudgetUsd: Number(process.env.AIOS_BUDGET_BROWSERBASE_USD || 30),
    },
  },
  wolfram: {
    displayName: "Wolfram",
    factory: ["education"],
    capabilities: [Capabilities.EDUCATION, Capabilities.REASONING],
    cost: { query: Number(process.env.AIOS_COST_WOLFRAM_QUERY || 0.01) },
    limits: { rpm: 30, monthlyBudgetUsd: Number(process.env.AIOS_BUDGET_WOLFRAM_USD || 20) },
  },
  github: {
    displayName: "GitHub",
    factory: ["infrastructure"],
    capabilities: [Capabilities.INFRA_READ],
    cost: {},
    limits: { rpm: 60, monthlyBudgetUsd: 0 },
  },
  supabase: {
    displayName: "Supabase",
    factory: ["infrastructure"],
    capabilities: [Capabilities.INFRA_READ],
    cost: {},
    limits: { rpm: 60, monthlyBudgetUsd: 0 },
  },
  sentry: {
    displayName: "Sentry",
    factory: ["infrastructure"],
    capabilities: [Capabilities.INFRA_READ],
    cost: {},
    limits: { rpm: 30, monthlyBudgetUsd: 0 },
  },
  vercel: {
    displayName: "Vercel",
    factory: ["infrastructure"],
    capabilities: [Capabilities.INFRA_READ],
    cost: {},
    limits: { rpm: 30, monthlyBudgetUsd: 0 },
  },
});

export function normalizeProviderId(id) {
  if (id === "claude") return "anthropic";
  if (id === "ollama-local") return "ollama";
  return id;
}

export function getProviderCapabilities(providerId) {
  const id = normalizeProviderId(providerId);
  return PROVIDER_CAPABILITIES[id] || PROVIDER_CAPABILITIES[providerId] || null;
}

export function providerSupportsCapability(providerId, capability) {
  const meta = getProviderCapabilities(providerId);
  if (!meta) return false;
  return meta.capabilities.includes(capability);
}

export function resolveRequiredCapability(taskType) {
  const key = String(taskType || "chat").toLowerCase().replace(/-/g, "_");
  return TASK_CAPABILITY_MAP[key] || Capabilities.CHAT;
}

export function listCapabilityRegistry() {
  return Object.entries(PROVIDER_CAPABILITIES).map(([providerId, meta]) => ({
    providerId,
    displayName: meta.displayName,
    factory: meta.factory,
    capabilities: meta.capabilities,
    limits: meta.limits,
  }));
}
