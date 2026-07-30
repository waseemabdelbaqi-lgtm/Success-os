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

## Production vs demo

| Mode | Behavior |
|------|----------|
| **Production** (`demoMode` omitted/false) | Requires `studentId`, `countryId`, `curriculumId`, `focusLessonId`, `utterance`. No Jordan/name/skill defaults. |
| **Demo** (`action=demo` or `demoMode: true`) | May seed Jordan reference fixtures for local demos only. |

## Durable storage

Runtime data (gitignored under `/library/`):

- `library/ai-teacher-engine/memory/`
- `library/ai-teacher-engine/sessions/`
- `library/ai-teacher-engine/audit/`
- `library/ai-teacher-engine/metrics/`

## Safety

- Never invent curriculum facts.
- Ground in approved curriculum, verified digital books, and platform KB.
- When uncertain, state uncertainty instead of guessing.

## Permissions

Platform permissions in `types/permissions.ts`:

`ate:session:start` · `ate:session:chat` · `ate:memory:read` · `ate:memory:write` · `ate:recommend` · `ate:admin` · `ate:voice:use` · `ate:whiteboard:use`

Protected routes enforce via `requireAtePermission`. For local contract tests only: `ATE_DEV_OPEN=1`.

## APIs

Base: `/api/ai-teacher-engine`  
Envelope: `{ success, data|error, meta }` via `withApiHandler`.

| Method | Action | Auth |
|--------|--------|------|
| GET | `status`, `snapshot`, `architecture`, `demo`, `voice`, `whiteboard`, `permissions` | Public |
| GET/POST | `chat` / `turn` | `ate:session:chat` |
| GET | `memory`, `session-record` | `ate:memory:read` |
| POST | `memory` / `memory:write` | `ate:memory:write` |
| POST | `memory:clear` | `ate:admin` |
| GET | `recommend` | `ate:recommend` |
| GET | `metrics` | `ate:admin` |

Admin: `/admin/ai-teacher-engine`

## Validation

```bash
ATE_DEV_OPEN=1 npm run validate:ai-teacher-engine
```

Runs contract + integration + API handler e2e scripts.

## Protocol status

See [`reports/pr-55-protocol-verification.md`](./reports/pr-55-protocol-verification.md).  
ATE-scoped gates are green; full-repo lint/typecheck/build remain blocked by pre-existing debt — PR is **not declared complete** under the Non-Negotiable Execution Protocol until those pass.

## Out of scope (mission)

Avatars · Animations · AI-generated videos · Live classrooms · Digital Book/Video/Assessment engines (#56–#58)
