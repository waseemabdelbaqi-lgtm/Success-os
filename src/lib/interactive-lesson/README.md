# Interactive Lesson Engine — diagnosis, tools & test report

## Why the rejected `.mp4` URL was wrong
Opening `/ai-lessons/g1-math/lesson.mp4` served a **static file from `public/`**.
That path bypasses React entirely. It was never the interactive player.
The previous agent also kept regenerating/linking that MP4 as the “preview,” which
hid the real interactive work under a long digital-library URL.

## Files that caused MP4-as-product
| File | Problem |
|---|---|
| `public/ai-lessons/g1-math/lesson.mp4` | Static asset; URL looked like “the lesson” |
| `public/ai-lessons/g1-math/manifest.json` | `"video": "/ai-lessons/g1-math/lesson.mp4"` |
| `src/components/digital-library/AiTeacherTheater.tsx` | JoAcademy-style `<video>` player |
| `app/lib/curriculum/elementary-studio.js` | `previewVideo` pointed at the MP4 |

## Architecture (interactive product)
`App Router page` → `G1MathInteractiveClass` → `InteractiveLessonPlayer` → JSON scenes
→ Framer Motion board + audio timeline → state machine (play / await / hint / reexplain / feedback / continue)
→ `localStorage` progress.

Canonical route: **`/ai-lessons/g1-math`** (HTML page, not `.mp4`).
Old MP4 redirected to that route; file moved to `media/archived-slideshow.mp4`.

## Packages
- `framer-motion` — board animation
- `edge-tts` (prebaked clips) — AR/EN neural voice
- Web Speech API — spoken hint/feedback
- React / Next.js App Router

## Paid services (not activated)
| Service | Why | Free alternative |
|---|---|---|
| ElevenLabs | More natural teacher voice | edge-tts `ar-JO-SanaNeural` |
| HeyGen | Photoreal talking avatar | Animated board + teacher chip |

## Preview
`/ai-lessons/g1-math`
