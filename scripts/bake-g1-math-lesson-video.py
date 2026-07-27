#!/usr/bin/env python3
"""Bake YouTube-education-style MP4 (teacher-forward), inspired by JO G1 channels.

Style reference only — original teacher/content, not a clone of any real educator.
"""

from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import arabic_reshaper
from bidi.algorithm import get_display

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "ai-lessons" / "g1-math"
FRAMES = Path("/tmp/lesson-frames-yt")
AUDIO_DIR = OUT / "audio"
FACES_DIR = OUT / "faces"
SRC_IDLE = Path("/opt/cursor/artifacts/assets/lama-yt-idle.png")
SRC_TALK = Path("/opt/cursor/artifacts/assets/lama-yt-talk.png")

W, H = 1280, 720
FPS = 10

BEATS = [
    {"id": "01", "title": "مرحبا يا أبطالي", "lines": ["اليوم: الجمع بخط الأعداد", "مع المعلمة لاما النوري"], "board": "welcome", "eq": "3 + 2"},
    {"id": "02", "title": "ما هو خط الأعداد؟", "lines": ["خط مستقيم", "أرقام من اليسار → اليمين"], "board": "numberline"},
    {"id": "03", "title": "نبدأ من العدد الأول", "lines": ["المسألة: 3 + 2", "نقف عند الرقم 3"], "board": "start3"},
    {"id": "04", "title": "قفزات الجمع لليمين", "lines": ["نجمع 2 = قفزتان", "3 → 4 → 5"], "board": "jumps"},
    {"id": "05", "title": "النتيجة", "lines": ["3 + 2 = 5", "ممتاز يا أبطالي!"], "board": "answer5", "eq": "3 + 2 = 5"},
    {"id": "06", "title": "دورك الآن", "lines": ["حل: 2 + 3", "ابدأ من الرقم 2"], "board": "challenge", "eq": "2 + 3 = ؟"},
    {"id": "07", "title": "الحل معاً", "lines": ["2 → 3 → 4 → 5", "الناتج = 5"], "board": "solve", "eq": "2 + 3 = 5"},
    {"id": "08", "title": "تمرين سريع", "lines": ["4 + 1", "قفزة واحدة لليمين"], "board": "activity", "eq": "4 + 1 = ؟"},
    {"id": "09", "title": "خطأ شائع", "lines": ["لا تبدأ من الصفر دائماً", "الجمع = لليمين فقط"], "board": "check", "eq": "4 + 1 = 5"},
    {"id": "10", "title": "القاعدة الذهبية", "lines": ["1) ابدأ من العدد الأول", "2) اقفز بعدد الجمع", "3) مكانك = الناتج"], "board": "rule"},
    {"id": "11", "title": "مراجعة سريعة", "lines": ["3+2=5   2+3=5   4+1=5", "أنتم فاهمين ما شاء الله"], "board": "remember"},
    {"id": "12", "title": "أحسنتم", "lines": ["ارسموا خط أعداد في البيت", "وبشوفكم الدرس الجاي"], "board": "bye"},
]



def ar(text: str) -> str:
    """Shape Arabic for correct Pillow rendering."""
    if not text:
        return text
    try:
        return get_display(arabic_reshaper.reshape(str(text)))
    except Exception:
        return str(text)

BRAND = (158, 23, 34, 255)
GOLD = (242, 215, 124, 255)
INK = (28, 18, 20, 255)
BOARD = (252, 248, 242, 255)
SOFT = (255, 236, 214, 255)
NAVY = (22, 12, 14, 255)


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(path),
        ],
        text=True,
    ).strip()
    return float(out)


def load_fonts():
    candidates = [
        "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoKufiArabic-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    path = next((p for p in candidates if os.path.exists(p)), None)
    if not path:
        d = ImageFont.load_default()
        return d, d, d, d, d
    return (
        ImageFont.truetype(path, 44),
        ImageFont.truetype(path, 32),
        ImageFont.truetype(path, 24),
        ImageFont.truetype(path, 30),
        ImageFont.truetype(path, 56),
    )


def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return m


def prep_faces():
    FACES_DIR.mkdir(parents=True, exist_ok=True)
    for src, name in ((SRC_IDLE, "idle.png"), (SRC_TALK, "talk.png")):
        img = Image.open(src).convert("RGBA")
        w, h = img.size
        img = img.crop((int(w * 0.04), 0, int(w * 0.96), int(h * 0.95)))
        img = ImageEnhance.Color(img).enhance(1.06)
        img = ImageEnhance.Contrast(img).enhance(1.05)
        img.save(FACES_DIR / name)
    return (
        Image.open(FACES_DIR / "idle.png").convert("RGBA"),
        Image.open(FACES_DIR / "talk.png").convert("RGBA"),
    )


def draw_number_line(d, num_font, highlight=None, jumps=None, start=None, y=470):
    x0, x1 = 70, 600
    d.line([(x0, y), (x1, y)], fill=BRAND, width=6)
    pos = {}
    for n in range(0, 11):
        x = x0 + int(n * (x1 - x0) / 10)
        pos[n] = x
        fill = GOLD if highlight == n else BRAND
        d.ellipse([x - 8, y - 8, x + 8, y + 8], fill=fill, outline=INK)
        d.text((x - 7, y + 14), str(n), font=num_font, fill=INK)
    if start is not None:
        x = pos[start]
        d.ellipse([x - 18, y - 56, x + 18, y - 20], fill=BRAND, outline=GOLD, width=3)
    if jumps:
        for a, b in jumps:
            xa, xb = pos[a], pos[b]
            d.arc([xa, y - 70, xb, y + 6], start=200, end=340, fill=(196, 92, 42, 255), width=4)


def compose_frame(beat, t, fonts, idle, talk):
    title_f, body_f, small_f, num_f, eq_f = fonts
    img = Image.new("RGBA", (W, H), (236, 228, 220, 255))
    d = ImageDraw.Draw(img)
    for i in range(H):
        d.line([(0, i), (W, i)], fill=(238 - i // 40, 228 - i // 45, 220 - i // 50, 255))

    # YouTube-like top strip
    d.rectangle([0, 0, W, 52], fill=NAVY)
    d.text((22, 14), ar("Success OS  ·  الصف الأول  ·  رياضيات"), font=small_f, fill=GOLD)
    d.text((W - 340, 14), ar("معلّمة مساعدة · درس مصوّر"), font=small_f, fill=(255, 255, 255, 220))

    # LEFT: large teacher camera (YouTube educator style)
    cam_w, cam_h = 560, 620
    talking = int(t * 6) % 2 == 0
    face = talk if talking else idle
    face_r = face.resize((cam_w, cam_h), Image.Resampling.LANCZOS)
    bob = int(math.sin(t * 3.2) * 3)
    cam = Image.new("RGBA", (cam_w + 16, cam_h + 16), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cam)
    cd.rounded_rectangle([0, 0, cam_w + 15, cam_h + 15], radius=26, fill=(12, 8, 9, 255), outline=GOLD, width=3)
    masked = Image.new("RGBA", (cam_w, cam_h), (0, 0, 0, 0))
    masked.paste(face_r, (0, 0))
    masked.putalpha(rounded_mask((cam_w, cam_h), 22))
    cam.alpha_composite(masked, (8, 8 + bob))
    img.alpha_composite(cam, (28, 68))

    # lower-third nameplate on teacher
    d.rounded_rectangle([48, 620, 520, 678], radius=14, fill=(12, 8, 9, 220), outline=GOLD, width=2)
    d.text((66, 628), ar("أ. لاما النوري · معلّمة مساعدة"), font=body_f, fill=GOLD)
    d.text((66, 656), ar("معلّمة ذكاء اصطناعي · صوت أردني"), font=small_f, fill=(255, 255, 255, 210))

    # RIGHT: live board
    d.rounded_rectangle([620, 68, 1250, 678], radius=24, fill=BOARD, outline=(214, 186, 158, 255), width=3)
    d.text((650, 95), ar(beat["title"]), font=title_f, fill=BRAND)
    y = 165
    for line in beat["lines"]:
        d.text((650, y), ar(line), font=body_f, fill=INK)
        y += 48

    if beat.get("eq"):
        d.rounded_rectangle([650, 300, 1120, 385], radius=16, fill=SOFT, outline=GOLD, width=3)
        d.text((680, 315), ar(beat["eq"]), font=eq_f, fill=BRAND)

    b = beat["board"]
    start = highlight = None
    jumps = None
    show_line = b not in ("welcome", "bye")
    if b == "start3":
        start = highlight = 3
    elif b == "jumps":
        start, jumps = 3, [(3, 4), (4, 5)]
    elif b == "answer5":
        highlight, jumps = 5, [(3, 4), (4, 5)]
    elif b == "challenge":
        start = highlight = 2
    elif b == "solve":
        highlight, jumps = 5, [(2, 3), (3, 4), (4, 5)]
    elif b == "activity":
        start = highlight = 4
    elif b == "check":
        highlight, jumps = 5, [(4, 5)]
    if show_line:
        draw_number_line(d, num_f, highlight=highlight, jumps=jumps, start=start, y=520)

    if b == "bye":
        d.rounded_rectangle([650, 420, 1200, 560], radius=18, fill=NAVY, outline=GOLD, width=3)
        d.text((690, 470), ar("أنتم أبطال اليوم ★"), font=title_f, fill=GOLD)

    # tiny progress footer
    d.rectangle([0, 696, W, H], fill=NAVY)
    d.text((22, 700), ar("ستايل دروس يوتيوب للصف الأول  ·  محتوى أصلي Success OS"), font=small_f, fill=(255, 255, 255, 190))
    return img.convert("RGB")


def main():
    fonts = load_fonts()
    idle, talk = prep_faces()
    shutil.rmtree(FRAMES, ignore_errors=True)
    FRAMES.mkdir(parents=True, exist_ok=True)

    manifest_beats = []
    frame_idx = 0
    for beat in BEATS:
        audio = AUDIO_DIR / f"beat-{beat['id']}.mp3"
        dur = probe_duration(audio)
        nframes = max(1, int(round(dur * FPS)))
        for i in range(nframes):
            frame = compose_frame(beat, i / FPS, fonts, idle, talk)
            frame.save(FRAMES / f"f{frame_idx:05d}.jpg", quality=88)
            frame_idx += 1
        manifest_beats.append(
            {
                "id": beat["id"],
                "title": beat["title"],
                "duration": round(dur, 3),
                "audio": f"/ai-lessons/g1-math/audio/beat-{beat['id']}.mp3",
            }
        )
        print(f"beat {beat['id']} {dur:.1f}s frames={nframes}", flush=True)

    list_file = Path("/tmp/audio_list_yt.txt")
    with list_file.open("w") as f:
        for beat in BEATS:
            f.write(f"file '{AUDIO_DIR / f'beat-{beat['id']}.mp3'}'\n")
    concat_audio = Path("/tmp/lesson_audio_yt.mp3")
    subprocess.check_call(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_file), "-c", "copy", str(concat_audio)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    video_out = OUT / "lesson.mp4"
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-framerate",
            str(FPS),
            "-i",
            str(FRAMES / "f%05d.jpg"),
            "-i",
            str(concat_audio),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-preset",
            "veryfast",
            "-crf",
            "21",
            "-r",
            str(FPS),
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(video_out),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    subprocess.check_call(
        ["ffmpeg", "-y", "-ss", "8", "-i", str(video_out), "-frames:v", "1", "-q:v", "2", str(OUT / "poster.jpg")],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    total_dur = probe_duration(video_out)
    manifest = {
        "lessonId": "jordan-g1-math-number-line-addition",
        "teacher": "أ. لاما النوري · معلّمة مساعدة",
        "teacherTitle": "معلّمة مساعدة",
        "teacherRole": "معلّمة مساعدة بالذكاء الاصطناعي",
        "voice": "ar-JO-SanaNeural",
        "style": "youtube-grade1-teacher-forward",
        "styleNote": "Inspired by Jordanian G1 YouTube lesson format (e.g. energy/pacing of channels like أ. رشا الحجاج) — fictional teacher, original content",
        "video": "/ai-lessons/g1-math/lesson.mp4",
        "poster": "/ai-lessons/g1-math/poster.jpg",
        "duration": round(total_dur, 3),
        "beats": manifest_beats,
        "faces": {
            "idle": "/ai-lessons/g1-math/faces/idle.png",
            "talk": "/ai-lessons/g1-math/faces/talk.png",
        },
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("VIDEO", video_out, video_out.stat().st_size, "dur", total_dur)


if __name__ == "__main__":
    main()
