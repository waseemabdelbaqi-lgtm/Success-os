# AI Teachers — سارة وعلي فقط

Success OS ships **exactly two** AI teachers:

| ID | الاسم | الجنس | صوت |
|----|------|------|-----|
| `sara` | المعلمة سارة | أنثى | `ar-JO-SanaNeural` |
| `ali` | المعلم علي | ذكر | `ar-JO-TaimNeural` |

## Interactive live classroom

```bash
npm run dev
# open http://127.0.0.1:3000/ai-teacher/classroom
```

Features:
- Photoreal face animation (mouth morph + blink + listen/gesture)
- Arabic speech (Web Speech API)
- Synced colorful board
- Buttons + microphone commands: ابدأ، التالي، أعد، أبسط، مثال، توقف

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
