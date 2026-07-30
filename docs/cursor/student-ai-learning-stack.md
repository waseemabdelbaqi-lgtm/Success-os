# Student AI Learning Stack (PR #59 Foundation)

Official student journey architecture.

```
Student
↓
Open Lesson
↓
S4S Intelligence Teacher appears
↓
"Hello Ahmad,
Last time you struggled with Fractions.
Would you like me to review them first?"
↓
Conversation Engine → Reasoning → Knowledge Graph → …
→ Interactive Lesson Engine → Quizzes → Assessments
```

Schema: `success-os.student-ai-learning-stack.v1` · ADR-0059

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

## Layer status

| Layer | Status | Activates |
|-------|--------|-----------|
| Student | operational | #50.3 / #59 |
| S4S Intelligence Teacher (AI Teacher) | foundation | #59 |
| Conversation Engine | stub | #59 |
| Reasoning Engine | stub | #59 |
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
| `POST run-stack` | Demo run |

Admin: `/admin/student-ai-learning-stack`

## Validation

```bash
npm run validate:student-ai-learning-stack
```

## Samples

- [`student-ai-learning-stack.example.json`](../../content/demo/generated/student-ai-learning-stack.example.json)
- [`student-learning-session-plan.example.json`](../../content/demo/generated/student-learning-session-plan.example.json)
