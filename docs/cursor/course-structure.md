# Course → Unit → Lesson structure

Additive Success OS learning hierarchy (does not replace Book portal or Recorded Marketplace).

```
Course
 └── Unit
      └── Lesson
            ├── Interactive Slides
            ├── Teacher Video
            ├── AI Explanation
            ├── 3D Simulation
            ├── Notes
            ├── Attachments
            ├── Interactive Questions
            ├── AI Chat
            ├── Homework
            ├── Quiz
            └── Progress
```

## Schema

`success-os.course-structure.v1` — see `types/course-structure.ts`

## Routes

| Route | Purpose |
|-------|---------|
| `/student/courses` | Course catalog |
| `/student/courses/[courseId]` | Course tree + units |
| `/student/courses/.../lessons/[lessonId]` | Lesson workspace (all blocks) |
| `/api/course-structure` | JSON API (`?course=&unit=&lesson=`) |

## Demo

`content/demo/course-structure.ts` — marked demo; teacher video stays `not-produced` until real media exists.

## Validate

```bash
npm run validate:course-structure
```
