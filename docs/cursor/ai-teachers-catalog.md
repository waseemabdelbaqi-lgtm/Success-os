# AI Teachers — سارة وعلي فقط

Success OS ships **exactly two** AI teachers — designed to outperform a typical human lesson on clarity, patience, and instant feedback:

| ID | الاسم | الجنس | صوت | أسلوب |
|----|------|------|-----|--------|
| `sara` | المعلمة سارة | أنثى | `ar-JO-SanaNeural` | دافئة · تبسيط ومثال وتشجيع |
| `ali` | المعلم علي | ذكر | `ar-JO-TaimNeural` | واضح · دقة وفحص فهم لحظي |

## Interactive live classroom

```bash
npm run dev
# open http://127.0.0.1:3000/ai-teacher/classroom
```

Master-coach features (beyond a static video teacher):
- Photoreal face that **never freezes** (breath, sway, blink, mouth morph, celebrate)
- Arabic speech with gender-aware voice pick (Web Speech API)
- Synced colorful board + **laser pointer cues** tied to speech progress
- Micro-checks after each number beat (choose the answer → instant coaching)
- Adaptive buttons: أبسط / مثال / تحدٍّ (persona-aware scripts)
- Mastery stars (0–5) + optional auto-play through the lesson
- Mic commands: ابدأ، التالي، أعد، أبسط، مثال، تحدٍّ، توقف

## Assets

```
content/media/ai-teachers/{sara|ali}/
  portrait.png
  poses/{talk,point,write,idle}.png
  flagship/{mouth-closed,mouth-open,mouth-wide,gesture}.png
  alive/{blink,listen,half}.png
```

## Commands

```bash
npm run validate:ai-teachers
npm run ai-teachers:factory
npm run media:flagship-sara
npm run media:flagship-ali
npm run media:g1-sara
npm run media:g1-ali
```

## API

`GET /api/ai-teachers` → Sara + Ali only  
`GET /api/ai-teachers?id=sara|ali`
