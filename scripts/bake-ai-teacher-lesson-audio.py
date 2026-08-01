#!/usr/bin/env python3
"""Bake neural Arabic lesson audio for Sara & Ali (edge-tts)."""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "content" / "media" / "ai-teachers"
PUB = ROOT / "public" / "media" / "ai-teachers"

VOICES = {
    "sara": "ar-JO-SanaNeural",
    "ali": "ar-JO-TaimNeural",
}

LINES = {
    "sara": {
        "welcome": "مرحبا يا أبطال! أنا المعلمة سارة. اليوم نتعلّم العدّ حتى ثلاثة بطريقة ممتعة وواضحة. راقب السبورة، واضغط الأزرار أو كلّمني متى ما احتجت.",
        "one": "انظر معي. هذا واحد. الرقم واحد يعني شيئاً واحداً فقط. أرسم تفاحة واحدة… واحد!",
        "two": "والآن اثنان. اثنان يعني شيئين معاً. نعدّ ببطء: واحد… اثنان. وأرسم تفاحتين جميلتين.",
        "three": "وأخيراً ثلاثة! ثلاثة أشياء معاً. عدّوا بصوت عالٍ معي: واحد، اثنان، ثلاثة!",
        "practice": "هيا نتمرّن كالأبطال! طابق الكمية مع الرقم: واحد، اثنان، ثلاثة. أنا معك خطوة بخطوة.",
        "bye": "أحسنت يا بطل! تعلّمنا واحد، اثنان، ثلاثة. أنا فخورة فيك جداً. إلى اللقاء — وعدني أن تعدّ كل يوم!",
        "simpler": "لا بأس يا بطل. أنا المعلمة سارة وجاهزة أبسّطها لك. نعد ببطء معاً: واحد… اثنان… ثلاثة. كرّر ورائي.",
        "example": "مثال من حياتنا: قلم واحد على الطاولة هو واحد. قلمان هما اثنان. ثلاثة أقلام هي ثلاثة. شوف السبورة وتابع معي.",
        "challenge": "تحدٍّ سريع: إذا رأيت تفاحتين، أي رقم؟ وإذا رأيت ثلاثة نجوم؟ قل الجواب بصوت عالٍ ثم اضغط التالي.",
        "correct": "ممتاز! جوابك صحيح. أنت تتقدم بسرعة.",
        "wrong": "قرّبنا! لا بأس — نتعلم بالمحاولة. هيا نعيدها معاً.",
        "intro": "مرحبا! أنا المعلمة سارة. أشرح أوضح من أي كتاب — اضغط ابدأ الدرس.",
    },
    "ali": {
        "welcome": "أهلاً. أنا المعلم علي. هدفنا اليوم: إتقان العدّ حتى ثلاثة بدقة وسرعة. تابع السبورة، واستخدم الأوامر أو الميكروفون.",
        "one": "ركز: واحد يساوي شيئاً واحداً. الرقم واحد. الكمية واحدة. طابق بينهما الآن.",
        "two": "اثنان يساوي شيئين. نعدّ: واحد، اثنان. الكمية تطابق الرقم اثنين.",
        "three": "ثلاثة يساوي ثلاث كميات. عدّ بدقة: واحد، اثنان، ثلاثة. ثبّت الإجابة في ذهنك.",
        "practice": "تمرين سريع: طابق كل كمية مع رقمها. الدقة أولاً، ثم السرعة.",
        "bye": "أحسنت. أتقنت واحداً واثنين وثلاثة. أنا فخور بأدائك. كرّر التمرين غداً لتثبيت الإتقان.",
        "simpler": "ركز معي. المعنى ببساطة: الرقم يساوي الكمية. واحد شيء، اثنان شيئان، ثلاثة أشياء. أعد الخطوة الآن.",
        "example": "مثال عملي: كرة واحدة تساوي واحد. كرتان تساويان اثنان. ثلاث كرات تساوي ثلاثة. طابق الرقم مع الكمية فوراً.",
        "challenge": "تحدٍّ سريع: إذا رأيت تفاحتين، أي رقم؟ وإذا رأيت ثلاثة نجوم؟ قل الجواب بصوت عالٍ ثم اضغط التالي.",
        "correct": "صحيح. هذا الجواب الدقيق. ممتاز.",
        "wrong": "ليس بعد. ركّز على الكمية ثم أعد.",
        "intro": "مرحبا! أنا المعلم علي. اضغط ابدأ الدرس ولنبدأ بإتقان العد.",
    },
}


async def bake_one(teacher: str, key: str, text: str, voice: str):
    import edge_tts

    dest_dir = OUT / teacher / "audio"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{key}.mp3"
    communicate = edge_tts.Communicate(text, voice, rate="-5%", pitch="+0Hz")
    await communicate.save(str(dest))
    pub_dir = PUB / teacher / "audio"
    pub_dir.mkdir(parents=True, exist_ok=True)
    pub = pub_dir / f"{key}.mp3"
    pub.write_bytes(dest.read_bytes())
    print(f"  {teacher}/{key}.mp3 ({dest.stat().st_size // 1024} KB)")


async def main():
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        print("Install edge-tts: pip install edge-tts", file=sys.stderr)
        raise SystemExit(1)

    print("=== Bake AI teacher lesson audio ===")
    for teacher, lines in LINES.items():
        voice = VOICES[teacher]
        print(f"{teacher} → {voice}")
        for key, text in lines.items():
            await bake_one(teacher, key, text, voice)

    manifest = {
        "schema": "success-os.ai-teacher-audio.v1",
        "voices": VOICES,
        "lines": {t: list(LINES[t].keys()) for t in LINES},
    }
    for base in (OUT, PUB):
        (base / "audio-manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    print("DONE")


if __name__ == "__main__":
    asyncio.run(main())
