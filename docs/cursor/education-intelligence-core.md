# Education Intelligence Core (EIC)

The world's Educational Intelligence layer for Success OS.  
The AI must not simply answer questions — it must **think like an experienced teacher**.

Schema: `success-os.education-intelligence-core.v1` · [ADR-0055.2](./adr/ADR-0055.2-education-intelligence-core.md)

## Stack position

```
Student
  → AI Digital Human Teacher (presence)
  → AI Teacher Engine (conversation / grounding)
  → Education Intelligence Core (Learning DNA / adapt / predict)
  → Knowledge Graph → Curriculum → ILE → Books → Videos → Assessments
```

## Continuous understanding

What the student knows · does not know · why confused · which concept · which prerequisite · memory · learning speed · best explanation · repeated mistakes · guessing · true understanding

## Learning DNA (updated every interaction)

Knowledge · Understanding · Confidence · Attention · Memory Strength · Critical Thinking · Problem Solving · Reading · Listening · Speaking · Writing · Preferred Learning Style · Preferred Teacher Style · Preferred Examples · Preferred Language · Weak Skills · Strong Skills · Current Goals

Durable path: `library/education-intelligence-core/dna/`

## Adaptive answers

| Mode | Behavior |
|------|----------|
| Struggling | Simpler language, more examples, drawings, interaction |
| Advanced | Higher difficulty, less explanation, deeper questions |
| Novelty | Never reuse the same explanation fingerprint |

## Predictions

Next lesson · Review lessons · Concepts likely to confuse · Exam items likely missed · Skills not yet mastered

## Insight example

> I noticed that you still struggle with velocity and acceleration because of something we studied … Let's review that concept for two minutes before continuing.

## APIs

Base: `/api/education-intelligence-core`

| Action | Purpose |
|--------|---------|
| `status` / `snapshot` | Architecture |
| `demo` | Repeated-confusion insight demo |
| `dna` | Read Learning DNA |
| `interact` / `process` (POST) | Update DNA after an interaction |

Admin: `/admin/education-intelligence-core`

## Validation

```bash
npm run validate:education-intelligence-core
```

## Honesty

This wave is a **heuristic teacher-intelligence engine**. Deeper ML predictors plug into the same contracts in **PR #59 Learning Intelligence**. It never invents curriculum facts.
