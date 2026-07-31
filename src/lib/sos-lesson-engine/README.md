# SUCCESS OS Interactive Learning Engine

Original Success OS architecture for Jordan national curriculum books.

Benchmark platforms (Nearpod, Kahoot, Padlet, Classera, Madrasati) inform **educational functions only**.
No copied branding, source code, proprietary content, or embedded third-party lesson players.

## Modes
- Student-paced journey (15 required stages)
- Teacher-paced live session (join code, stage lock, anonymous distributions)
- Assignment mode
- Revision game (untimed by default; speed points off by default)

## Reference lesson
`sos-il-jo-g1-math-u0-l1-numbers-123` — Grade 1 Math · Unit 0 · Numbers 1, 2, 3

Routes:
- `/jordan-books/lesson-engine/[lessonId]`
- `/jordan-books/lesson-engine/[lessonId]/review-game`
- `/teacher/live-lesson`
- `/admin/lesson-studio`
- `/admin/lesson-reports`
- API: `/api/sos-lesson-engine`

Data store (JSON): `data/sos-lesson-engine/`

AI Tutor: lesson-scoped rule assistant — no uncontrolled internet, no answer reveal before attempt, no AI teacher video.

Interactive books remain the parent container; the lesson engine embeds via book-reader links and shared mastery.
