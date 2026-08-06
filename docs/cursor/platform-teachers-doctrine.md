# Platform Teachers Doctrine — Sara & Ali

Status: **Binding product constitution — world-class phase**  
Schema: `success-os.platform-teachers.v1`

## Mission (highest priority)

Platform success is measured **only** by Sara & Ali teaching quality — not feature count or code volume.

- Do **not** build any new teacher or character until Sara and Ali reach world-class professional teacher quality.
- Goal is **not** Avatar / Digital Human alone — world-class teachers a student forgets are AI.
- They must teach **any** future subject, book, curriculum, university, educational system, or course **without** rewriting the Human Engine.
- **Understand first, then teach:** before every lesson the teacher analyzes the full content and builds a dynamic plan (objectives, concepts, common mistakes, examples, analogies, questions, drawings, experiments/sims, 3D models, assessment). They do not read text aloud.
- Subject pedagogy: math → step-by-step · physics → diagrams/simulation · chemistry → lab/molecular · biology → anatomy models · language → dialogue/pronunciation · programming → write/run/explain code.
- Auto-remediate when confusion is detected — student should not have to ask.
- Close every lesson with summary + quiz + follow-up plan.
- Core entity: `types/ai-teacher-profile.ts` (`TeacherProfile` / `TeacherID`).
- Dynamic plan: `types/lesson-teaching-plan.ts` + `lib/human-engine/lesson-content-analyzer.ts`.

## Official faces

- They are the public face of Success OS.
- أي مادة أو منهج أو كتاب أو دورة تُضاف مستقبلاً يجب أن يستطيع علي وسارة تدريسها دون الحاجة لإنشاء معلم جديد.
- No new teacher identity unless it serves a **fundamentally different role** (never for subject coverage).
- Specialists only after Sara and Ali teach the material at professional quality.

## Locked personas (stable across every subject and language)

| Teacher | Personality lock |
|---------|------------------|
| **سارة** | هادئة، مشجعة، منظمة، تشرح بالتدرج (calm, encouraging, organized, gradual) |
| **علي** | مباشر، عملي، يركز على حل المشكلات والتفكير التحليلي (direct, practical, problem-solving, analytical) |

Sara stays Sara and Ali stays Ali across subjects **and** languages/dialects. Multilingual voice engines may change language — never the core persona.

## Required capabilities

| Capability | Requirement |
|------------|-------------|
| Deep mastery | Understand content deeply before explaining |
| Multi-strategy | Multiple explanation styles; pick the best automatically |
| Adaptive depth | Graduate by student level |
| Live Q&A | Ask mid-lesson, evaluate answers, correct mistakes |
| Remediation | Re-explain differently when needed |
| Board multimodal | Board, drawings, equations |
| Rich multimodal | 3D models, simulations, experiments when they add learning value |
| Session memory | Know what the student understood / missed in-session |
| Stable identity | Persona never collapses when subject changes |
| Multilingual voice | Support as many languages/dialects as AI voice engines allow |
| Purposeful motion | Every look, smile, point, stand, walk, write, draw, and voice tone has an educational reason — no random or looping noise |
| World studio feel | Student feels they are in a world-class teaching studio with a professional teacher |

## Multi-subject completion gate

Sara and Ali are **not complete** until they pass real acceptance tests on different subjects with **the same quality**:

- Mathematics · Physics · Chemistry · Biology · Languages · Programming  
  (and further subjects as they join the platform)

Each subject × each teacher requires dual acceptance (below).

## Engineering lock

| Layer | Rule |
|-------|------|
| Catalog | Exactly two platform teachers: `sara`, `ali` |
| Content | New lessons/books/courses → universal bridge → Human Engine; cast Sara or Ali |
| Teacher Mind | Distinct locked personas — identity never collapses |
| Human Engine | One engine; content/subject/language swap; core pipeline stays |
| Motion | Act-driven + persona-biased; anti-repeat; no purposeless random motion |
| Specialists | Deferred; different *role* only |

## Original identity (mandatory)

Sara and Ali are **original** digital teachers. Study teaching *technique* from
https://www.youtube.com/@Success4SureCenter — never copy faces, voices, hair,
clothing, body proportions, or identities of any real teacher.

Binding policy: `docs/cursor/original-human-teachers-policy.md`

## Dual acceptance (mandatory)

A capability or checklist item is **complete** only when **both** are true:

1. It succeeds in agent/CI verification.
2. The product owner can exercise it on a **live public Demo URL** that actually works.

After every improvement: ship a working Demo the owner can try. Anything they cannot try remains incomplete.

Voice (checklist item 4) stays incomplete until the owner confirms success on Demo.

Mandatory 10s Sara public test surface: `/demo/sara-10s/` (and `/ai-teacher/sara-10s`).

## Surfaces

| Path | Role |
|------|------|
| `/ai-teacher` | Production — Sara/Ali teach any ILE lesson |
| `/ai-teacher/demo` · `/ai-teacher/proof` | Multi-subject acceptance labs (owner Demo) |
| `/admin/ai-teachers` | Edit Teacher Mind profiles |

## Pluggable stack (keep HE stable for years)

| Concern | Now (standard port) | Upgrade path without HE rewrite |
|---------|---------------------|----------------------------------|
| Reasoning / plan | `success-os.teacher-reasoner.v1` (deterministic analyzer) | Swap `TeacherProfile.llmModel` → cloud LLM adapter |
| Voice | `edge-tts` via `voiceProvider` / `voiceID` | ElevenLabs / Azure / HeyGen voice IDs |
| Body / face | R3F + Mixamo skinned GLB + HE tracks | MetaHuman / Unreal adapter (existing port) |
| Content → teach | `lesson-content-analyzer` → HE blocks | Richer misconception DB / curriculum graph |

## Related

- `types/ai-teacher-profile.ts` · `lib/ai-teachers/core-profiles.ts`
- `types/lesson-teaching-plan.ts` · `lib/human-engine/lesson-content-analyzer.ts`
- `types/platform-teachers.ts`
- `docs/cursor/original-human-teachers-policy.md`
- `docs/cursor/human-engine.md`
- `lib/human-engine/universal-lesson-bridge.ts`
- `lib/human-engine/proof-lessons.ts`
