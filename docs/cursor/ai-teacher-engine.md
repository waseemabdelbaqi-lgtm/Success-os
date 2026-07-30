# AI Teacher Engine (ATE) — PR #55

The **AI Teacher Engine** is the core intelligence of Success OS. It is a **virtual teacher**, not a chatbot.

Schema: `success-os.ai-teacher-engine.v1` · ADR-0055  
Parent: [#54 Universal Curriculum Mapping Engine](./universal-curriculum-mapping.md)

## Architecture path

```
Student
↓ AI Teacher
↓ Conversation Engine
↓ Reasoning Engine
↓ Student Memory
↓ Knowledge Graph
↓ Curriculum Registry
↓ Interactive Lesson Engine
↓ Digital Books
↓ Videos
↓ Assessments
```

## What this PR builds

| Area | Status |
|------|--------|
| Architecture & layer contracts | ✓ |
| Conversation Engine (intents / controls / affect) | ✓ operational |
| Reasoning Engine (curriculum-aware moves) | ✓ operational |
| Student Memory | ✓ operational |
| Knowledge-grounded replies + uncertainty | ✓ |
| Lesson-aware recommendations | ✓ foundation |
| Voice-ready contract | ✓ architecture |
| Whiteboard-ready contract | ✓ architecture |
| Multilingual (en/ar) reply surfaces | ✓ |
| Permissions (`ate:*`) | ✓ |
| APIs + admin dashboard | ✓ |
| Avatars / animations / AI videos / live classrooms | ✗ out of scope |

## Student controls

Explain again · Explain differently · Easier example · Harder question · Translate · Summarize · Test me · Skip · Continue · Go back · Teach slowly · Teach faster · Don’t understand

## Multimodal contracts

Text, voice, image, screenshot, homework photo, PDF, handwritten solution.  
Future reserved: video conversations, live whiteboard.

## Safety

- Never invent curriculum facts.
- Ground in approved curriculum, verified digital books, and platform KB.
- When uncertain, state uncertainty instead of guessing.

## APIs

Base: `/api/ai-teacher-engine`

| Method | Action | Purpose |
|--------|--------|---------|
| GET | `status` | Engine status |
| GET | `snapshot` / `architecture` | Full ATE snapshot |
| GET/POST | `demo` | Demo teaching turn (“I don’t understand”) |
| GET/POST | `chat` / `turn` / `session` | Run a grounded teaching turn |
| GET | `memory` | Read student memory |
| POST | `memory` / `memory:write` | Update memory |
| POST | `memory:reset` | Clear in-memory store |
| GET | `recommend` | Lesson-aware recommendations |
| GET | `permissions` | ATE permissions for a role |
| GET | `voice` / `whiteboard` | Ready-architecture contracts |

Admin: `/admin/ai-teacher-engine`

## Validation

```bash
npm run validate:ai-teacher-engine
```

## Examples

- [`ai-teacher-engine.example.json`](../../content/demo/generated/ai-teacher-engine.example.json)
- [`ate-teaching-turn.example.json`](../../content/demo/generated/ate-teaching-turn.example.json)
- [`ate-student-memory.example.json`](../../content/demo/generated/ate-student-memory.example.json)

## Integration points

| System | Role |
|--------|------|
| Global Curriculum Registry (#50.3) | Curriculum grounding |
| UCE (#54) | Cross-curriculum equivalents / prereqs |
| Knowledge Graph (#50.3) | Skill/lesson relationships |
| ILE (#49) | Sole lesson runtime |
| Digital Book Engine (#56) | Book section recommendations |
| AI Lesson & Media (#57) | Verified video recommendations |
| Assessment Engine (#58) | Practice / mini-quiz / assessments |
| Learning Intelligence (#59) | Deeper intelligence on top of ATE |

## Related

S4S Intelligence Teacher greeting and re-explain flows remain available via the Student AI Learning Stack module and are invoked by ATE orchestration.
