# AI Teachers — سارة وعلي فقط

Success OS ships **exactly two** AI teachers — cinematic live classroom with neural Arabic voice:

| ID | الاسم | الجنس | صوت عصبي |
|----|------|------|----------|
| `sara` | المعلمة سارة | أنثى | `ar-JO-SanaNeural` |
| `ali` | المعلم علي | ذكر | `ar-JO-TaimNeural` |

## Interactive live classroom

```bash
npm run ai-teachers:bake-audio   # regenerates MP3s (needs edge-tts)
npm run dev
# open http://127.0.0.1:3000/ai-teacher/classroom
```

What makes it feel beyond a typical lesson:
- **Neural pre-baked Arabic audio** (not robotic browser TTS as primary)
- Mouth energy driven by real audio amplitude when possible
- Pose switching: talk / point / write / gesture
- Full-bleed cinematic stage + living chalkboard (not a dashboard of cards)
- Laser/glow board cues synced to speech progress
- Micro-checks + mastery stars + auto-play
- Adaptive coach lines: أبسط / مثال / تحدٍّ

## Assets

```
content/media/ai-teachers/{sara|ali}/
  portrait.png
  poses/{talk,point,write,idle}.png
  flagship/{mouth-closed,mouth-open,mouth-wide,gesture}.png
  alive/{blink,listen,half}.png
  audio/{welcome,one,two,three,practice,bye,simpler,example,...}.mp3
```

## Commands

```bash
npm run validate:ai-teachers
npm run ai-teachers:factory
npm run ai-teachers:bake-audio
npm run media:flagship-sara
npm run media:flagship-ali
```

## API

`GET /api/ai-teachers` → Sara + Ali only  
`GET /api/ai-teachers?id=sara|ali`
