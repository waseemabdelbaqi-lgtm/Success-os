# AI Teachers — سارة وعلي (شبه الحصة الحقيقية)

معلمان فقط، بتجربة صفّية أقرب لمعلم حقيقي وأوضح منه في التغذية الراجعة:

| ID | الاسم | صوت عصبي | حضور |
|----|------|----------|------|
| `sara` | المعلمة سارة | `ar-JO-SanaNeural` | تقف / تشير / تكتب |
| `ali` | المعلم علي | `ar-JO-TaimNeural` | يقف / يشير / يكتب |

## Preview

```bash
npm run ai-teachers:bake-audio
npm run ai-teachers:factory
npm run dev
# http://127.0.0.1:3000/ai-teacher/classroom
```

## What “real class” means here

- Teacher **stands beside the chalkboard** (one classroom scene)
- Classroom poses: `classroom/{stand,point,write}.png`
- Natural Jordanian class phrasing (“شوفوا السبورة”، “عدّوا وراي”)
- Neural audio (not browser TTS as primary)
- Pose shifts while speaking: stand → write/point like a live teacher
- Micro-checks after each number + mastery stars

## Assets

```
content/media/ai-teachers/{sara|ali}/
  portrait.png
  classroom/{stand,point,write}.png
  poses/{talk,point,write,idle}.png
  flagship/...
  alive/...
  audio/*.mp3
```

## Validate

```bash
npm run validate:ai-teachers
```
