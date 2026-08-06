/**
 * Provider-agnostic AI service ports.
 * Bindings are configurable; no live SDK calls in this PR.
 */
import type { ProviderBinding } from "@/types/ai-digital-human-teacher";

function L(en: string, ar: string) {
  return { en, ar };
}

/** Canonical port catalog — replaceable without redesigning Success OS. */
export const DEFAULT_PROVIDER_BINDINGS: ProviderBinding[] = [
  {
    port: "reasoning_conversation",
    providerId: "openai",
    label: L("Reasoning & conversation", "الاستدلال والمحادثة"),
    exampleVendors: ["OpenAI"],
    enabled: false,
    configured: false,
    implementationStatus: "architecture_ready",
    notes: ["Provider-agnostic port; live keys not required for architecture."],
  },
  {
    port: "multimodal_understanding",
    providerId: "google_gemini",
    label: L("Multimodal understanding", "الفهم متعدد الوسائط"),
    exampleVendors: ["Google Gemini"],
    enabled: false,
    configured: false,
    implementationStatus: "architecture_ready",
    notes: ["Images, homework photos, PDFs, handwriting contracts."],
  },
  {
    port: "text_to_speech",
    providerId: "elevenlabs",
    label: L("High-quality multilingual voices", "أصوات متعددة اللغات عالية الجودة"),
    exampleVendors: ["ElevenLabs"],
    enabled: false,
    configured: false,
    implementationStatus: "architecture_ready",
    notes: ["Localized accents via admin voice keys on teacher profiles."],
  },
  {
    port: "speech_to_text",
    providerId: "azure_speech",
    label: L("Speech recognition", "التعرّف على الكلام"),
    exampleVendors: ["Azure AI Speech", "Google Cloud Speech"],
    enabled: false,
    configured: false,
    implementationStatus: "architecture_ready",
    notes: ["Interruptions + accent tolerance are contract requirements."],
  },
  {
    port: "digital_human_video",
    providerId: "tavus",
    label: L("Digital human video", "فيديو المعلم الرقمي"),
    exampleVendors: ["Tavus", "similar digital-human video technology"],
    enabled: false,
    configured: false,
    implementationStatus: "architecture_ready",
    notes: ["No live avatar video shipped in this PR (ADR-0055 / ADR-0055.1)."],
  },
  {
    port: "avatar_generation",
    providerId: "heygen",
    label: L("Avatar generation", "توليد الصور الرمزية"),
    exampleVendors: ["HeyGen", "similar avatar generation"],
    enabled: false,
    configured: false,
    implementationStatus: "architecture_ready",
    notes: ["Admin-selected presets only; not auto-invented identities."],
  },
  {
    port: "realtime_media",
    providerId: "livekit",
    label: L("Realtime media infrastructure", "بنية الوسائط في الوقت الحقيقي"),
    exampleVendors: ["LiveKit", "equivalent realtime media"],
    enabled: false,
    configured: false,
    implementationStatus: "architecture_ready",
    notes: ["Supports interruptible voice sessions when activated later."],
  },
  {
    port: "orchestration_graph",
    providerId: "langgraph",
    label: L("Orchestration framework", "إطار التنسيق"),
    exampleVendors: ["LangGraph", "equivalent orchestration"],
    enabled: false,
    configured: false,
    implementationStatus: "architecture_ready",
    notes: ["ATE remains the pedagogical orchestrator; this port deepens graphs later."],
  },
  {
    port: "vector_memory",
    providerId: "vector_db",
    label: L("Long-term vector memory", "ذاكرة متجهات طويلة الأمد"),
    exampleVendors: ["Vector database"],
    enabled: false,
    configured: false,
    implementationStatus: "architecture_ready",
    notes: ["Complements durable ATE student memory files."],
  },
  {
    port: "knowledge_graph",
    providerId: "success_os_knowledge_graph",
    label: L("Curriculum knowledge graph", "شبكة معرفة المنهج"),
    exampleVendors: ["Success OS Knowledge Graph"],
    enabled: true,
    configured: true,
    implementationStatus: "adapter_stub",
    notes: ["Grounding already wired through ATE → CIE knowledge graph."],
  },
];

export function listProviderBindings(): ProviderBinding[] {
  return DEFAULT_PROVIDER_BINDINGS.map((p) => ({
    ...p,
    exampleVendors: [...p.exampleVendors],
    notes: [...p.notes],
    label: { ...p.label },
  }));
}

/**
 * Adapter stub — refuses live calls. Never fakes provider success.
 */
export function invokeProviderPort(port: string): {
  ok: false;
  live: false;
  reason: string;
} {
  return {
    ok: false,
    live: false,
    reason: `Provider port "${port}" is architecture-ready only. No live SDK call executed.`,
  };
}
