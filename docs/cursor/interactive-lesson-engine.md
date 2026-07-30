# Interactive Lesson Engine (Foundation)

Core learning experience for Success OS. Books-first today; curriculum import and AI video later.

## Principles

- Do not redesign existing portals, auth, or business logic
- Reusable across country / curriculum / subject / language
- Lessons are interactive blocks — not a static PDF or single video
- No curriculum ingestion in this phase
- No AI video generation in this phase

## Lesson structure

Overview → Learning Objectives → Interactive Slides → Concepts → Images & Diagrams → Animations → 3D/Simulation → Teacher Video → AI Explanation → Student Notes → Attachments → Practice Questions → AI Chat → Homework → Lesson Summary → Progress → Next Lesson

## Routes

| Route | Purpose |
|-------|---------|
| `/student/interactive-lessons` | Engine demo viewer |
| `/student/books/.../lessons/[id]` | **Default** = Interactive Lesson Engine (books-first). `?classic=1` = legacy reader |
| `/admin/interactive-lessons` | Admin editor (create/reorder/preview/version/publish) |
| `/api/interactive-lesson-engine` | status / blocks / catalog / lesson / placeholders |

## Validate

```bash
npm run validate:interactive-lesson-engine
```
