# Interactive Lesson Engine — tools & limits

## Why the old lesson failed
`public/ai-lessons/g1-math/lesson.mp3` + baked MP4 was a narrated slideshow:
no pause-for-answer, no animated teaching loop, no mastery/resume, weak TTS ceiling.

## What replaced it
Scene-based React player (`InteractiveLessonPlayer`) driven by JSON lesson definitions.
G1 math number-line is the first prototype (`interactivePlayer: true`).

## Packages used
- `framer-motion` (already in project) — board animations
- `edge-tts` CLI (dev/agent) — Arabic `ar-JO-SanaNeural` + English `en-US-JennyNeural` clips
- `localStorage` — progress / resume / mastery

## Not activated (need your approval / keys)
| Service | Why | Approx cost | Free alternative in use |
|---|---|---|---|
| ElevenLabs | Higher-quality human-like voice | paid per char | edge-tts Jordanian/English neural |
| HeyGen / Synthesia | Photoreal talking teacher avatar | paid seats | AI assistant teacher chip + animated board |
| Remotion | Programmatic video export | free OSS + render cost | Live interactive scenes instead of flat MP4 |

## Files
- `src/lib/interactive-lesson/types.ts`
- `src/lib/interactive-lesson/lessons/jordan-g1-math-number-line.ts`
- `src/components/interactive-lesson/*`
- `public/interactive-lessons/g1-math/audio/{ar,en}/*`
