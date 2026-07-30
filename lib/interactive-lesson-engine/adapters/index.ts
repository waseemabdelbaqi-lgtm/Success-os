/**
 * Adapter registry — keeps vendor SDKs swappable.
 */
export {
  FormulaAdapter,
  FORMULA_ADAPTER_META,
} from "./formula-adapter";
export {
  DiagramAdapter,
  DIAGRAM_ADAPTER_META,
} from "./diagram-adapter";
export {
  RichTextAdapter,
  RICH_TEXT_ADAPTER_META,
} from "./rich-text-adapter";
export {
  Scene3dAdapter,
  SCENE_3D_ADAPTER_META,
} from "./scene-3d-adapter";
export {
  PdfAdapter,
  PDF_ADAPTER_META,
} from "./pdf-adapter";

/** Static metadata for docs / API. */
export const ADAPTER_REGISTRY = [
  {
    capability: "formula",
    id: "katex",
    replaceWith: ["mathlive", "mathjax"],
    license: "MIT",
    monthlyCostUsd: 0,
    gated: false,
  },
  {
    capability: "diagram",
    id: "mermaid",
    replaceWith: ["react-flow", "excalidraw"],
    license: "MIT",
    monthlyCostUsd: 0,
    gated: false,
  },
  {
    capability: "rich_text",
    id: "tiptap",
    replaceWith: ["lexical", "slate"],
    license: "MIT",
    monthlyCostUsd: 0,
    gated: false,
  },
  {
    capability: "scene_3d",
    id: "react-three-fiber",
    replaceWith: ["babylonjs"],
    license: "MIT",
    monthlyCostUsd: 0,
    gated: false,
  },
  {
    capability: "pdf",
    id: "pdfjs",
    replaceWith: ["commercial-pdf-sdk"],
    license: "Apache-2.0",
    monthlyCostUsd: 0,
    gated: false,
  },
  {
    capability: "ai_chat",
    id: "aios-gateway-placeholder",
    replaceWith: ["openai", "anthropic", "gemini"],
    license: "vendor",
    monthlyCostUsd: "usage-based",
    gated: true,
  },
  {
    capability: "ai_video",
    id: "heygen-placeholder",
    replaceWith: ["heygen"],
    license: "commercial",
    monthlyCostUsd: "30-300+",
    gated: true,
  },
  {
    capability: "voice",
    id: "elevenlabs-placeholder",
    replaceWith: ["elevenlabs"],
    license: "commercial",
    monthlyCostUsd: "5-99+",
    gated: true,
  },
] as const;
