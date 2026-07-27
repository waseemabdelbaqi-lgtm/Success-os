# Interactive Lesson Engine — diagnosis, tools & test report

## Why the old lesson failed
`public/ai-lessons/g1-math/lesson.mp4` + `AiTeacherTheater` produced a narrated slideshow:
no pause-for-answer, no hint/re-explain loop, no mastery/resume as product core, weak TTS ceiling.
That pathway is **opted out** for G1 math via `interactivePlayer: true` on the lesson registry entry.

## What replaced it
Scene-based React player (`InteractiveLessonPlayer`) driven by JSON lesson definitions
(`success-os.interactive-lesson.v1`). First prototype: Jordan Grade 1 · Addition on the number line.

Hierarchy: Country → Curriculum → Grade → Subject → Unit → Lesson → Scene → Narration → Visual Events → Interaction → Feedback → Mastery.

## Packages / services used
| Item | Role | License / notes |
|---|---|---|
| `framer-motion` (existing) | Number-line board animations | MIT |
| `edge-tts` (agent CLI) | Pre-baked AR/EN neural narration clips | Free Microsoft voices |
| `localStorage` | Progress / resume / mastery | Browser |
| React / Next.js App Router | Player + route wiring | existing stack |

## Not activated (need your approval / keys)
| Service | Why | Approx cost | Free alternative in use |
|---|---|---|---|
| ElevenLabs | Higher-quality human-like voice | paid per char | edge-tts `ar-JO-SanaNeural` / `en-US-JennyNeural` |
| HeyGen / Synthesia | Photoreal talking teacher avatar | paid seats | AI assistant teacher chip + animated board |
| Remotion | Programmatic video export | free OSS + render cost | Live interactive scenes (not a flat MP4) |
| Gemini API | Script/visual studio rebuild | paid API | Original hand-authored Success OS scenes |

## Local preview route
`/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد#ai-class`

## Files
- `src/lib/interactive-lesson/types.ts` — schema
- `src/lib/interactive-lesson/answer.ts` — answer checking
- `src/lib/interactive-lesson/lessons/jordan-g1-math-number-line.ts` — G1 prototype content
- `src/components/interactive-lesson/*` — player, board, interactions, state machine, progress
- `public/interactive-lessons/g1-math/audio/{ar,en}/*` — narration clips
- `scripts/test-interactive-lesson-engine.mjs` — contract + answer-path smoke tests

## Testing executed (this iteration)
| Check | Result |
|---|---|
| Lesson JSON contract (16 scenes, 9 interactions) | PASS (`node scripts/test-interactive-lesson-engine.mjs`) |
| Interaction types present: mcq, tap, type, drag, match, draw | PASS |
| Correct / incorrect answer helpers (mcq, type, drag, match, draw) | PASS |
| AR/EN audio assets HTTP 200 for all core scenes | PASS |
| Lesson page SSR markers (Prepared by, معلّمة مساعدة, interactivePlayer, ai-class) | PASS |
| Interactive-lesson TypeScript errors | PASS (`tsc` filtered — no IL errors) |
| Full repo `tsc` / production build | NOT claimed PASS — pre-existing errors outside this feature |
| Full browser E2E (every hint path, keyboard, screen reader, viewport matrix) | NOT fully automated — manual review still required |
| Firebase progress DB | NOT wired — localStorage resume works |
| Premium commercial voice / photoreal avatar | BLOCKED pending your API keys |

## Quality gate honesty
This prototype is a **real interactive digital class** (scene engine + pause + feedback), not an MP4 slideshow.
It is **not** yet ElevenLabs/HeyGen cinema quality. Do not treat paid-voice absence as DoD completion.
