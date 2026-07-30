# Student AI Learning Stack (PR #59 Foundation)

Official student journey architecture.

```
Student
↓
AI Teacher
↓
Conversation Engine
↓
Reasoning Engine
↓
Knowledge Graph
↓
Digital Books
↓
Videos
↓
Interactive Lesson Engine
↓
Quizzes
↓
Assessments
```

Schema: `success-os.student-ai-learning-stack.v1` · ADR-0059

**AI Teacher persona:** S4S Intelligence Teacher (open-lesson greeting + don’t-understand re-explain).

## Open Lesson — S4S Intelligence Teacher

When a student opens a lesson, the **S4S Intelligence Teacher** greets them using skill progress (missing/weak skills). Demo default:

```
Hello Ahmad,
Last time you struggled with Fractions.
Would you like me to review them first?
```

- Component: `components/student-ai-learning-stack/s4s-intelligence-teacher.tsx`
- Builder: `lib/student-ai-learning-stack/s4s-intelligence-teacher.ts`
- API: `GET /api/student-ai-learning-stack?action=greeting&studentName=Ahmad`
- Mounted on student book lesson + ILE package pages (ILE runtime unmodified)

## “I don’t understand” → re-explain differently

```
Student: I don't understand this.
↓
Teacher: No problem. Let's explain it differently.
↓ Animation → Drawing → Example → Question → Checks understanding
```

- Builder: `lib/student-ai-learning-stack/re-explain.ts`
- UI: `S4sTeacherDock` (“I don't understand this”) + `S4sReExplainFlow`
- API: `GET /api/student-ai-learning-stack?action=re-explain`
- Scripted pedagogy only — no AI lesson generation

## Layer status

| Layer | Status | Activates |
|-------|--------|-----------|
| Student | operational | #50.3 / #59 |
| AI Teacher (S4S Intelligence Teacher persona) | foundation | #59 |
| Conversation Engine | foundation | #59 |
| Reasoning Engine | foundation | #59 |
| Knowledge Graph | foundation (wired) | #50.3 |
| Digital Books | reserved | #55 |
| Videos | reserved | #56–57 |
| Interactive Lesson Engine | operational | #49 |
| Quizzes | reserved | #58 |
| Assessments | reserved | #58 |

## Rules

- Orchestration only — **no** AI lesson/video/quiz/assessment generation in this PR.
- ILE is the **sole** lesson runtime.
- Reasoning may use Knowledge Graph + UCE mappings; it never copies curricula.
- Reserved layers return empty placeholders until their engine PRs land.

## APIs

Base: `/api/student-ai-learning-stack`

| Action | Purpose |
|--------|---------|
| `status` | Engine status |
| `snapshot` | Layer contracts + path |
| `plan` / `session` | Run orchestration for a student context |
| `demo` | Snapshot + sample session plan |
| `greeting` | S4S Intelligence Teacher open-lesson message |
| `re-explain` | Don’t-understand → Animation→Drawing→Example→Question→Check |
| `POST run-stack` | Demo run |

Admin: `/admin/student-ai-learning-stack`

## Validation

```bash
npm run validate:student-ai-learning-stack
```

## Samples

- [`student-ai-learning-stack.example.json`](../../content/demo/generated/student-ai-learning-stack.example.json)
- [`student-learning-session-plan.example.json`](../../content/demo/generated/student-learning-session-plan.example.json)
