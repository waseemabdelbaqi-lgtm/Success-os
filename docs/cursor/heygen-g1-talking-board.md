# معلمة تتكلم + سبورة ملوّنة (HeyGen)

الهدف: المعلمة **تحكي بصوت واضح**، والسبورة جنبَها **تكتب وتوضح بنفس اللحظة**، بألوان ورسوم للصفوف الصغيرة.

## اللي صار جاهز بدون مفتاح

```bash
npm run media:g1-colorful-board
```

ينتج:

- `content/media/jordan-g1-colorful-board/jordan-g1-colorful-board-lesson.mp4`
- صوت أردني نسائي واضح: `ar-JO-SanaNeural` (edge-tts)
- سبورة خضراء ملوّنة: أرقام / تفاحات / أمثلة تظهر **متزامنة مع كلامها**
- سكربت جاهز لـ HeyGen: `heygen-script.txt`

## تفعيل HeyGen (اشتراكك)

أضف الأسرار في بيئة Cursor Cloud / `.env.local` (**لا ترفعها على Git**):

```bash
HEYGEN_API_KEY=...
HEYGEN_AVATAR_ID=...      # Digital Twin look id أو avatar عام
HEYGEN_VOICE_ID=...       # صوت عربي نسائي إن أمكن
# اختياري:
HEYGEN_ENGINE=avatar_iv
HEYGEN_REMOVE_BG=1
```

اكتشف المعرفات:

```bash
python3 scripts/generate-heygen-g1-teacher.py --list-avatars
python3 scripts/generate-heygen-g1-teacher.py --list-voices
```

ثم:

```bash
npm run media:heygen-g1-teacher   # يولّد فيديو المعلمة المتحركة من HeyGen
npm run media:compose-heygen-g1   # يركّبها على يسار السبورة الملونة
```

## لماذا السبورة عندنا مش جوّا HeyGen فقط؟

HeyGen ممتاز لـ **وجه + شفاه + إيماءات**.  
السبورة الملونة والكتابة المتزامنة والرسوم للأطفال تُدار عندنا بإطار زمني دقيق (`timeline.json`) حتى يبقى الشرح **مطابق للكلام** حرفياً.
