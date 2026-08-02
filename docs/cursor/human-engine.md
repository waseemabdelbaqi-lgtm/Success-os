# Human Engine (independent digital-human layer)

Schema: `success-os.human-engine.v1` · version `1.1.0`

## Purpose

Phase-2 **Human Engine** is independent of the Three.js Teaching Studio (phase 1).
Every teaching sentence is directed from **meaning** into a full performance package:
face, eyes, head, hands, locomotion, gaze, camera, lighting, and on-screen elements.

Sara/Ali can later swap to MetaHuman via `DigitalHumanAdapter` without rewriting the platform.

## Semantic sentence contract

`lib/human-engine/semantic-sentence.ts` maps line text → `ContentAct`:

| Act | Teacher behaviour | Screen |
|-----|-------------------|--------|
| `write_law` | write + explain | law / equation |
| `draw_diagram` | draw stroke | animated diagram |
| `run_experiment` | manipulate lab | experiment phases |
| `hold_model` / `rotate_model` / `zoom_*` | 3D interact | model_3d transform |
| `ask_check` | invite answer | question |
| … | … | … |

`LessonDirector` builds `sentences[]` + timeline tracks including `screen` + `locomotion`.

## Modules

Character Generator · Skeleton Animation · Facial Rig · Blend Shapes · Lip Sync ·
Eye Tracking · Head Tracking · Emotion System · Gesture Engine · AI Behaviour ·
Camera Director · Lighting Director · Animation Timeline · Lesson Director ·
**Semantic Sentence** · Showcase Lesson

## Surfaces

| Path | Role |
|------|------|
| **`/ai-teacher/proof`** | **Practical proof lab** — pick Sara/Ali + lesson, play ≥60s in Three.js, ask/re-explain, honesty table |
| `/ai-teacher/live` | Showcase studio (law/draw/experiment/3D) |
| `/ai-teacher/human-engine-preview` | 10s preview |
| `/ai-teacher/studio` | Three.js phase-1 studio (legacy DHS player) |
| `GET /api/human-engine?action=status\|proof\|showcase\|preview` | plans |

## Skinned digital humans (product path)

| Asset | Path |
|-------|------|
| Sara humanoid GLB | `public/media/ai-teachers/sara/humanoid/teacher.glb` |
| Ali humanoid GLB | `public/media/ai-teachers/ali/humanoid/teacher.glb` |
| Build | `npm run ai-teachers:humanoids` (base: `npm run ai-teachers:humanoids:fetch-base`) |
| Runtime | `components/ai-teachers/skinned-digital-human.tsx` |

Each GLB includes Mixamo full skeleton (fingers + eye bones) and 15 ARKit-named face morph targets driven by Human Engine frames. Billboard PNG teachers are **not** used in the 3D studio anymore.

## Honest limits (do not over-claim)

| Works now | Structure only |
|-----------|----------------|
| Skinned Sara/Ali in Three.js studio | Unreal MetaHuman Pixel Streaming (needs UE server) |
| Skeleton + fingers + walk cycle from HE | Offline-rendered twin video (HeyGen creds) |
| Face morph lip-sync / emotion | Photogrammetry MetaHuman identity mesh |
| ≥60s proof/demo + ask/re-explain | |

## Validate

```bash
npm run validate:human-engine
```

## Honest limits

- Local adapter = photoreal classroom PNGs + phoneme mouth + pose map + screen plane.
- True MetaHuman skeletal mesh / production visemes are **not** shipped; adapter port is ready.
