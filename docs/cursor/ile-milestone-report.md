# Interactive Lesson Engine — Milestone Report (Quality Foundation)

Date: 2026-07-30  
Branch: `cursor/interactive-lesson-engine-bca1`  
Phase: Quality foundation (no curriculum import, no paid AI video generation)

## Architecture summary

Lesson JSON packages render through `BlockRenderer` → **capability adapters**:

- Formula → KaTeX
- Diagrams/timelines → Mermaid (dynamic)
- Notes → TipTap (dynamic)
- 3D / lab shell → React Three Fiber + Drei (dynamic)
- Digital book pages → PDF.js (dynamic)
- AI chat / video / voice → gated placeholders → AIOS later

Heavy SDKs load only when blocks need them (`next/dynamic` / client-only).

## Technologies selected

| Area | Tech | Cost |
|---|---|---|
| Math | KaTeX | $0 |
| Diagrams | Mermaid | $0 |
| Rich text | TipTap | $0 |
| 3D | Three + R3F + Drei | $0 |
| PDF | PDF.js | $0 |
| AI / media | AIOS placeholders | $0 until enabled |

Full ADR: `docs/cursor/ile-technology-selection.md`

## Third-party services added

**Shipped OSS (npm):** katex, mermaid, @tiptap/react + starter-kit, three, @react-three/fiber, @react-three/drei, pdfjs-dist

**Not activated (documented only):** OpenAI, Anthropic, Gemini, ElevenLabs, HeyGen, Browserbase, H5P, Excalidraw, MathLive, React Flow, LangGraph

## Estimated monthly operating costs

| Item | Now | When enabled |
|---|---|---|
| OSS adapters | **$0** | $0 |
| AI text (OpenAI/Claude/Gemini) | $0 | usage (~$20–$500+/mo) |
| HeyGen video | $0 | ~$30–$300+/mo |
| ElevenLabs voice | $0 | ~$5–$99+/mo |
| Browserbase | $0 | existing AIOS probe budget |

## Remaining implementation stages

1. Live AI explanation/chat via AIOS router (keyed environments only)
2. MathLive for assessment input
3. Excalidraw whiteboard
4. React Flow knowledge-graph lessons
5. Jordan curriculum → ILE package importer (academic gate)
6. HeyGen / ElevenLabs production media (approval gate)
7. H5P selective activities after license review

## Risks

- Bundle size mitigated by dynamic imports
- SSR constraints for Mermaid / Three / TipTap / PDF.js (client-only)
- PDF worker CDN dependency (can vendor worker later)
- TipTap Cloud unused — stay on MIT core

## Recommendations

1. Keep all paid vendors behind AIOS + phase locks
2. Prefer adapter swaps over rewriting lesson JSON
3. Next quality win: MathLive + Excalidraw + AIOS chat wiring
4. Do not enable auto video generation in CI/health paths
