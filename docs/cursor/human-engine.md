# Human Engine (independent digital-human layer)

Schema: `success-os.human-engine.v1` · version `1.3.0`

## Platform teachers (lock)

**Sara and Ali only.** No new teachers until these two are world-class.
They are the official face of Success OS and must teach **any** platform subject
through the same Human Engine (content swaps; core code stays).

## Purpose

**Human Engine** directs every teaching sentence from **meaning** into a full performance:
face, eyes, head, hands, locomotion, gaze, camera, lighting, and on-screen elements.

`universal-lesson-bridge` maps any Interactive Lesson Engine package → `HumanLessonInput`
with subject-aware acts (board write, draw, step solve, 3D zoom, lab, checks).

Anti-repeat (`performance-variety` + session STM) avoids cloning gestures, cameras, and phrases.

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
**Semantic Sentence** · Showcase Lesson · **Teacher Mind** (Behaviour Tree + profiles + session memory)

## Teacher Mind

Human Engine manages the **full teacher**, not only motion:

| Piece | Path |
|-------|------|
| Schema | `types/teacher-mind.ts` |
| Editable profiles | `content/ai-teachers/profiles/{sara,ali}.json` |
| Overrides (admin save) | `.data/ai-teachers/profiles/` |
| Behaviour Tree | `lib/human-engine/behaviour-tree.ts` + `teacher-mind.ts` |
| Session memory | `lib/human-engine/session-memory.ts` |
| Live adapt | `lib/human-engine/adapt.ts` (unused-first remediation) |
| Admin UI | `/admin/ai-teachers` |
| API | `GET/POST /api/teacher-mind` |

Adding a teacher = drop another JSON profile with the same schema. No engine rewrite.

When the student is confused twice, the BT picks the **next unused** mode from `remediationOrder` (analogy → diagram → experiment → model_3d → slower_steps → …) — not the same words.

## Surfaces

| Path | Role |
|------|------|
| **`/ai-teacher`** | **Production** — Sara/Ali teach any ILE lesson in 3D studio |
| `/ai-teacher/proof` · `/ai-teacher/demo` | Technical labs (honesty table / skinned proof) |
| **`/admin/ai-teachers`** | Edit Sara/Ali Teacher Mind profiles |
| `/ai-teacher/live` | Showcase studio (law/draw/experiment/3D) |
| `/ai-teacher/human-engine-preview` | 10s preview |
| `/ai-teacher/studio` | Three.js phase-1 studio (legacy DHS player) |
| `GET /api/human-engine?action=status\|catalog\|teach\|proof` | plans |
| `GET/POST /api/teacher-mind` | profiles · tree · save · adapt · session |

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
| Teacher Mind BT + editable JSON profiles + session memory | Additional teachers beyond Sara/Ali |
| Any ILE lesson → HE acts (board/draw/3D/lab/Q&A) | Photogrammetry MetaHuman identity mesh |
| Anti-repeat gestures/cameras/phrases in-session | |

## Validate

```bash
npm run validate:human-engine
```

## Honest limits

- Local adapter = photoreal classroom PNGs + phoneme mouth + pose map + screen plane.
- True MetaHuman skeletal mesh / production visemes are **not** shipped; adapter port is ready.
