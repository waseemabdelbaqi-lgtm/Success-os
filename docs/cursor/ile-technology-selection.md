# Interactive Lesson Engine — Technology Selection (ADR)

Status: Accepted for foundation quality upgrade (2026-07-30)  
Schema: `success-os.interactive-lesson-engine.v1`

## Decision principles

1. Quality-first; prefer mature production SDKs over custom reimplementation.
2. Every vendor capability sits behind a Success OS adapter (swap without rewriting lessons).
3. No unnecessary dependencies; no duplicate of existing platform features.
4. Paid APIs (OpenAI, Claude, Gemini, ElevenLabs, HeyGen, Browserbase) remain behind AIOS / placeholder gates until keys + academic policy allow live use.
5. Do not import national curricula in this milestone.

## Selected now (shipped)

| Capability | Selected | Alternatives considered | Why selected | License | Est. monthly cost | Replace path |
|---|---|---|---|---|---|---|
| Math / formulas | **KaTeX** | MathJax (heavier), MathLive (editable input), custom HTML | Fastest production math display for STEM lessons; MIT; tiny CSS | MIT | $0 | `FormulaAdapter` → MathLive/MathJax |
| Diagrams / timelines | **Mermaid** | React Flow (interactive graphs), Graphviz, custom SVG | Text→diagram for biology timelines, chemistry flows, lesson maps; SSR-safe via dynamic import | MIT | $0 | `DiagramAdapter` → React Flow / Excalidraw |
| Rich notes / teacher text | **TipTap** (+ StarterKit) | Lexical, Slate, Quill, contentEditable | ProseMirror-based, React-first, extensible, MIT core | MIT (Cloud paid optional — not used) | $0 | `RichTextAdapter` → Lexical |
| 3D / virtual lab shell | **Three.js + React Three Fiber + Drei** | Babylon.js, plain WebGL, iframe embeds | De-facto React 3D stack; lazy-loaded only on 3D blocks | MIT | $0 | `Scene3dAdapter` → Babylon |
| Digital book PDF pages | **PDF.js** | react-pdf wrapper, commercial viewers, iframe | Mozilla standard for in-browser PDF; Apache-2.0 | Apache-2.0 | $0 | `PdfAdapter` → commercial viewer |

## Explicitly deferred (adapters stubbed)

| Capability | Intended stack | Why deferred | Est. cost when enabled |
|---|---|---|---|
| AI lesson chat / explanations | OpenAI / Claude / Gemini via existing AIOS gateway | Keys + academic gates; avoid unpaid live calls in CI | Usage-based (~$20–$500+/mo by traffic) |
| AI teacher video | HeyGen | Placeholder only; paid media generation blocked until approval | ~$30–$300+/mo |
| Voice narration | ElevenLabs | Same gate | ~$5–$99+/mo |
| Handwriting / whiteboard | Excalidraw or Fabric.js | Canvas MVP exists; Excalidraw is large — next milestone | $0 (OSS) |
| Interactive graphs (drag nodes) | React Flow (@xyflow) | Mermaid covers static lesson diagrams first | $0 |
| Editable math input | MathLive | KaTeX display first; MathLive when assessments need input | $0 |
| H5P activities | H5P | Licensing/integration complexity — evaluate per activity type | Hosting + license review |
| OCR / Whisper / FFmpeg / LibreOffice / OpenCV | As needed for ingestion pipelines | Curriculum ingestion not in this milestone | Infra + API variable |
| Browser automation probes | Playwright / Browserbase (already in AIOS) | Do not duplicate | Existing |

## Architecture

```
Lesson Package (JSON)
   └── ContentBlock[]
         └── BlockRenderer
               ├── FormulaAdapter (KaTeX)
               ├── DiagramAdapter (Mermaid)
               ├── RichTextAdapter (TipTap)
               ├── Scene3dAdapter (R3F)        [dynamic import]
               ├── PdfAdapter (PDF.js)         [dynamic import]
               └── PlaceholderAdapter (video/sim/AI — gated)
```

AIOS Provider Router remains the only path for paid AI/media providers.

## Risks

- Bundle size: Three.js / Mermaid / TipTap / PDF.js are heavy → all loaded via `next/dynamic` / dynamic `import()`.
- SSR: Mermaid and Three require client-only mounts.
- Accessibility: KaTeX exposes MathML where possible; 3D scenes need text fallbacks (enforced in adapters).
- Vendor drift: TipTap Cloud features unused; stay on MIT core.

## Recommendations (next stages)

1. Wire AIOS `executeWithFallback` into AI explanation + chat adapters (live keys only).
2. Add MathLive for assessment answer entry.
3. Add Excalidraw for teacher/student whiteboard.
4. Jordan curriculum package importer → ILE schema (after academic gate).
5. Optional React Flow for knowledge-graph lesson maps.
