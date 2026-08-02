# Human Engine (independent digital-human layer)

Schema: `success-os.human-engine.v1`

## Purpose

Phase-2 **Human Engine** is independent of the Three.js Teaching Studio (phase 1).
It generates a full performance plan from lesson content and binds it through a
`DigitalHumanAdapter` so Sara/Ali can later swap to MetaHuman (or HeyGen) without
rewriting the platform.

## Modules

| Module | Path |
|--------|------|
| Character Generator | `lib/human-engine/character-generator.ts` |
| Skeleton Animation | `lib/human-engine/skeleton-animation.ts` |
| Facial Rig | `lib/human-engine/facial-rig.ts` |
| Blend Shapes | `lib/human-engine/blend-shapes.ts` |
| Lip Sync (phoneme) | `lib/human-engine/lip-sync.ts` |
| Eye Tracking | `lib/human-engine/eye-tracking.ts` |
| Head Tracking | `lib/human-engine/head-tracking.ts` |
| Emotion System | `lib/human-engine/emotion-system.ts` |
| Gesture Engine | `lib/human-engine/gesture-engine.ts` |
| AI Behaviour Engine | `lib/human-engine/ai-behaviour-engine.ts` |
| Camera Director | `lib/human-engine/camera-director.ts` |
| Lighting Director | `lib/human-engine/lighting-director.ts` |
| Animation Timeline | `lib/human-engine/animation-timeline.ts` |
| Lesson Director | `lib/human-engine/lesson-director.ts` |

Contracts: `types/human-engine.ts`

## Adapters

- `local_photoreal_preview` — live DOM/canvas photoreal (not Three.js characters)
- `metahuman` — stub, same plan/frame API
- `heygen` — stub / needs credentials

## Preview

- UI: `/ai-teacher/human-engine-preview` — 10s Sara & Ali
- API: `GET /api/human-engine?action=status|demo|preview`
- Validate: `npm run validate:human-engine`

## Honest limits

- Local preview uses photoreal classroom PNGs + phoneme mouth drive + pose map.
- True MetaHuman skeletal mesh / production viseme bake is **not** shipped yet;
  the adapter port is ready for that next phase.
