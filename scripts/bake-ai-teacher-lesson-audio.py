#!/usr/bin/env python3
"""Bake neural Arabic classroom audio for Sara & Ali (edge-tts)."""
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

# Natural classroom pacing — slightly slower, clearer.
RATE = "-8%"

LINES = {
    "sara": {
        "welcome": "مرحبا يا أحلى صف. أنا المعلمة سارة. اليوم مثل أي حصة حقيقية: نركز، نشوف السبورة، ونعدّ مع بعض لحد ثلاثة. جاهزين؟",
        "one": "شوفوا السبورة معي. برسم الرقم واحد. واحد يعني شيء واحد فقط. وهون تفاحة واحدة. عدّوا وراي: واحد.",
        "two": "حلو. هلأ اثنان. يعني شيئين مع بعض. بصوّر تفاحتين، وبرجع أشير على الرقم. عدّوا وراي: واحد… اثنان.",
        "three": "وآخر عدد لليوم: ثلاثة. بكتب ثلاثة، وبرسم ثلاث تفاحات. بصوت عالي معي: واحد، اثنان، ثلاثة!",
        "practice": "هيا نراجع زي صف حقيقي. طابقوا الكمية مع الرقم: واحد، اثنان، ثلاثة. أنا ماشية معكم سطر سطر.",
        "bye": "أحسنتم. تعلّمنا واحد، اثنان، ثلاثة مثل حصة كاملة. أنا فخورة فيكم. خلصنا لليوم، وإلى اللقاء.",
        "simpler": "ولا يهمك. أنا المعلمة سارة وجاهزة أشرح أبطأ. المعنى: نعد الأشياء. واحد… اثنان… ثلاثة. كرّر وراي بهدوء.",
        "example": "مثال من الصف: قلم واحد على الطاولة هو واحد. قلمان اثنان. ثلاثة أقلام ثلاثة. شوف السبورة وطابق.",
        "challenge": "سؤال صفّي: إذا شفت تفاحتين، الرقم كم؟ وإذا شفت ثلاث نجوم؟ جاوب بصوت عالي ثم التالي.",
        "correct": "صح عليك! جواب صفّي ممتاز.",
        "wrong": "قرّبنا. عادي، هيك بنتعلم. نعيدها.",
        "intro": "مرحبا! أنا المعلمة سارة. اضغط ابدأ الحصة وخلينا نشرح زي الصف الحقيقي.",
    },
    "ali": {
        "welcome": "أهلاً يا جماعة. أنا المعلم علي. خلينا نتعامل كأننا بصف حقيقي: تركيز، سبورة، وعدّ مضبوط لحد ثلاثة. يلا نبدأ.",
        "one": "ركزوا على السبورة. بكتب واحد. واحد يساوي كمية واحدة. تفاحة واحدة. عدّوا: واحد.",
        "two": "تمام. الآن اثنان. شيئان معاً. تفاحتان، والرقم اثنان. عدّوا بدقة: واحد، اثنان.",
        "three": "آخر عدد: ثلاثة. بكتب الرقم، وبثبت ثلاث كميات. عدّوا بوضوح: واحد، اثنان، ثلاثة.",
        "practice": "مراجعة صفّية سريعة. طابقوا كل كمية مع رقمها: واحد، اثنان، ثلاثة. الدقة قبل السرعة.",
        "bye": "أحسنتم. ثبتنا واحداً واثنين وثلاثة. أنا فخور بأدائكم. انتهت الحصة، وإلى اللقاء.",
        "simpler": "تمام، نبسّط. الرقم يساوي الكمية. شيء واحد، شيئان، ثلاثة أشياء. أعد معي الآن.",
        "example": "مثال عملي: كرة واحدة تساوي واحد. كرتان تساويان اثنان. ثلاث كرات تساوي ثلاثة. طابق فوراً.",
        "challenge": "سؤال صفّي: إذا شفت تفاحتين، الرقم كم؟ وإذا شفت ثلاث نجوم؟ جاوب بصوت عالي ثم التالي.",
        "correct": "صحيح. هذا الجواب. ممتاز.",
        "wrong": "ليس بعد. ركّز على الكمية وأعد.",
        "intro": "أهلاً. أنا المعلم علي. اضغط ابدأ الحصة لنبدأ كالصف الحقيقي.",
    },
}


async def bake_one(teacher: str, key: str, text: str, voice: str):
    import edge_tts

    dest_dir = OUT / teacher / "audio"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{key}.mp3"
    communicate = edge_tts.Communicate(text, voice, rate=RATE)
    await communicate.save(str(dest))
    pub_dir = PUB / teacher / "audio"
    pub_dir.mkdir(parents=True, exist_ok=True)
    (pub_dir / f"{key}.mp3").write_bytes(dest.read_bytes())
    print(f"  {teacher}/{key}.mp3 ({dest.stat().st_size // 1024} KB)")


async def main():
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        print("Install edge-tts: pip install edge-tts", file=sys.stderr)
        raise SystemExit(1)

    print("=== Bake real-classroom AI teacher audio ===")
    for teacher, lines in LINES.items():
        voice = VOICES[teacher]
        print(f"{teacher} → {voice} @ {RATE}")
        for key, text in lines.items():
            await bake_one(teacher, key, text, voice)

    manifest = {
        "schema": "success-os.ai-teacher-audio.v1",
        "voices": VOICES,
        "rate": RATE,
        "style": "real-classroom",
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
