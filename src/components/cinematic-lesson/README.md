# Approach C — Cinematic 3D teacher proof

Approved production approach: **Premium 3D teacher**.

## Route
`/ai-lessons/g1-math`

## What this proof contains
- Full-screen R3F classroom (depth, window light, rug, desk, smartboard)
- Visible stylized 3D teacher (أ. لاما النوري) with walk-in, pointing, eye direction, audio-driven mouth
- Smartboard: apples 1→3→5, number-line jumps, equation writing
- Camera shot changes synced to narration timeline (~45s)
- Automatic pause → interactive MCQ → hint → re-explain audio → continue
- Progress in localStorage
- **No** `speechSynthesis` in this player

## Voice status (blocked for final acceptance)
| Service | Status | Why |
|---|---|---|
| ElevenLabs | **MISSING KEY** | Required for human-quality approved voice |
| Current interim | `ar-JO-SanaNeural` via edge-tts | Neural Arabic for sync development only |

Add to `.env.local` then request re-bake:
```
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID_AR=...
```

## Preserved
Interaction pause logic · progress · `/ai-lessons/g1-math` route · no MP4-as-product

## Replaced
CSS dark stage · teacher chip · micro quiz widget look as the product surface
