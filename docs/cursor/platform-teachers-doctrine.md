# Platform Teachers Doctrine — Sara & Ali

Status: **Binding product constitution — world-class phase**  
Schema: `success-os.platform-teachers.v1`

## Mission (highest priority)

Platform success depends on **two characters only**: سارة (Sara) and علي (Ali).

- Do **not** build any new teacher or character until Sara and Ali reach world-class professional teacher quality.
- Goal is **not** an Avatar — digital teachers a student cannot easily tell apart from skilled human teaching (plus AI personalization).
- They must teach **any** future subject, book, curriculum, university course, or lesson **without** reprogramming or rewriting the Human Engine (content swaps; engine stays).
- Any book / curriculum / lesson / university / course: Sara or Ali must **understand the content first**, then explain it professionally.

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

## Dual acceptance (mandatory)

A capability or checklist item is **complete** only when **both** are true:

1. It succeeds in agent/CI verification.
2. The product owner can exercise it on a **live public Demo URL** that actually works.

After every improvement: ship a working Demo the owner can try. Anything they cannot try remains incomplete.

Voice (checklist item 4) stays incomplete until the owner confirms success on Demo.

## Surfaces

| Path | Role |
|------|------|
| `/ai-teacher` | Production — Sara/Ali teach any ILE lesson |
| `/ai-teacher/demo` · `/ai-teacher/proof` | Multi-subject acceptance labs (owner Demo) |
| `/admin/ai-teachers` | Edit Teacher Mind profiles |

## Related

- `types/platform-teachers.ts`
- `docs/cursor/human-engine.md`
- `lib/ai-teachers/catalog.ts`
- `lib/human-engine/universal-lesson-bridge.ts`
- `lib/human-engine/proof-lessons.ts`
