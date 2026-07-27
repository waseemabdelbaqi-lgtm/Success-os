#!/usr/bin/env python3
"""Bake JoAcademy-style MP4: big board + Jordanian teacher PiP + JO voice."""

from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "ai-lessons" / "g1-math"
FRAMES = Path("/tmp/lesson-frames-jo")
AUDIO_DIR = OUT / "audio"
FACES_DIR = OUT / "faces"
SRC_IDLE = Path("/opt/cursor/artifacts/assets/lama-jo-idle.png")
SRC_TALK = Path("/opt/cursor/artifacts/assets/lama-jo-talk.png")

W, H = 1280, 720
FPS = 15

BEATS = [
    {"id": "01", "title": "مرحباً يا بطل", "body": "اليوم نتعلم الجمع\nبخط الأعداد", "board": "welcome", "eq": "3 + 2 = ؟"},
    {"id": "02", "title": "ما هو خط الأعداد؟", "body": "خط مستقيم\nوأرقام مرتبة من اليسار لليمين", "board": "numberline"},
    {"id": "03", "title": "نبدأ من العدد الأول", "body": "في المسألة 3 + 2\nنقف عند الرقم 3", "board": "start3"},
    {"id": "04", "title": "قفزات الجمع", "body": "نجمع 2\nفنقفز قفزتين لليمين", "board": "jumps"},
    {"id": "05", "title": "النتيجة", "body": "3 ← 4 ← 5\nإذن الإجابة 5", "board": "answer5", "eq": "3 + 2 = 5"},
    {"id": "06", "title": "تحدّيك الآن", "body": "حل بنفسك:\n2 + 3 = ؟", "board": "challenge", "eq": "2 + 3 = ؟"},
    {"id": "07", "title": "الحل معاً", "body": "من 2 ثلاث قفزات\nفنصل إلى 5", "board": "solve", "eq": "2 + 3 = 5"},
    {"id": "08", "title": "نشاط سريع", "body": "ارسم خط أعداد 0–10\nوحل 4 + 1", "board": "activity", "eq": "4 + 1 = ؟"},
    {"id": "09", "title": "التحقق", "body": "من 4 قفزة واحدة\nالنتيجة 5", "board": "check", "eq": "4 + 1 = 5"},
    {"id": "10", "title": "القاعدة الذهبية", "body": "ابدأ من العدد الأول\nثم اقفز بعدد الجمع", "board": "rule"},
    {"id": "11", "title": "لنتذكر", "body": "الجمع = قفزات لليمين\nعلى خط الأعداد", "board": "remember"},
    {"id": "12", "title": "أحسنت يا بطل", "body": "تعلّمت بطريقة الأبطال\nإلى اللقاء في الدرس القادم", "board": "bye"},
]

BRAND = (158, 23, 34, 255)
GOLD = (242, 215, 124, 255)
INK = (32, 20, 22, 255)
BOARD = (250, 246, 240, 255)
SOFT = (255, 236, 214, 255)
NAVY = (28, 18, 22, 255)


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
    bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    reg = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    path = bold if os.path.exists(bold) else reg if os.path.exists(reg) else None
    if not path:
        d = ImageFont.load_default()
        return d, d, d, d, d
    return (
        ImageFont.truetype(path, 52),
        ImageFont.truetype(path, 38),
        ImageFont.truetype(path, 28),
        ImageFont.truetype(path, 34),
        ImageFont.truetype(path, 64),
    )


def prep_faces():
    FACES_DIR.mkdir(parents=True, exist_ok=True)
    for src, name in ((SRC_IDLE, "idle.png"), (SRC_TALK, "talk.png")):
        img = Image.open(src).convert("RGBA")
        # focus upper body / face
        w, h = img.size
        img = img.crop((int(w * 0.06), int(h * 0.02), int(w * 0.94), int(h * 0.92)))
        # slight warmth
        img = ImageEnhance.Color(img).enhance(1.05)
        img = ImageEnhance.Contrast(img).enhance(1.04)
        img.save(FACES_DIR / name)
    return (
        Image.open(FACES_DIR / "idle.png").convert("RGBA"),
        Image.open(FACES_DIR / "talk.png").convert("RGBA"),
    )


def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return m


def draw_number_line(d, num_font, small_font, highlight=None, jumps=None, start=None, y=455):
    x0, x1 = 90, 860
    d.line([(x0, y), (x1, y)], fill=BRAND, width=7)
    positions = {}
    for n in range(0, 11):
        x = x0 + int(n * (x1 - x0) / 10)
        positions[n] = x
        fill = GOLD if highlight == n else BRAND
        d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=fill, outline=INK)
        d.text((x - 8, y + 18), str(n), font=num_font, fill=INK)
    if start is not None:
        x = positions[start]
        d.ellipse([x - 20, y - 62, x + 20, y - 22], fill=BRAND, outline=GOLD, width=3)
        d.text((x - 7, y - 55), "★", font=small_font, fill=GOLD)
    if jumps:
        for a, b in jumps:
            xa, xb = positions[a], positions[b]
            d.arc([xa, y - 78, xb, y + 8], start=200, end=340, fill=(196, 92, 42, 255), width=5)


def compose_frame(beat, t, fonts, idle, talk):
    title_f, body_f, small_f, num_f, eq_f = fonts
    img = Image.new("RGBA", (W, H), (245, 236, 228, 255))
    d = ImageDraw.Draw(img)

    # soft gradient backdrop
    for i in range(H):
        r = 245 - int(18 * i / H)
        g = 236 - int(22 * i / H)
        b = 228 - int(16 * i / H)
        d.line([(0, i), (W, i)], fill=(r, g, b, 255))

    # top bar like course platform
    d.rectangle([0, 0, W, 64], fill=NAVY)
    d.text((28, 18), "Success OS  ·  الصف الأول  ·  الرياضيات", font=small_f, fill=GOLD)
    d.text((W - 310, 18), "المعلمة لاما النوري", font=small_f, fill=(255, 255, 255, 230))

    # main board
    d.rounded_rectangle([36, 88, 900, 668], radius=26, fill=BOARD, outline=(220, 190, 160, 255), width=3)
    d.text((70, 118), beat["title"], font=title_f, fill=BRAND)
    y = 195
    for line in beat["body"].split("\n"):
        d.text((70, y), line, font=body_f, fill=INK)
        y += 54

    if beat.get("eq"):
        d.rounded_rectangle([70, 310, 520, 400], radius=18, fill=SOFT, outline=GOLD, width=3)
        d.text((100, 325), beat["eq"], font=eq_f, fill=BRAND)

    b = beat["board"]
    start = highlight = None
    jumps = None
    if b == "numberline":
        pass
    elif b == "start3":
        start, highlight = 3, 3
    elif b == "jumps":
        start, jumps = 3, [(3, 4), (4, 5)]
    elif b == "answer5":
        highlight, jumps = 5, [(3, 4), (4, 5)]
    elif b == "challenge":
        start, highlight = 2, 2
    elif b == "solve":
        highlight, jumps = 5, [(2, 3), (3, 4), (4, 5)]
    elif b == "activity":
        start, highlight = 4, 4
    elif b == "check":
        highlight, jumps = 5, [(4, 5)]
    elif b in ("rule", "remember", "welcome", "bye"):
        if b != "welcome" and b != "bye":
            draw_number_line(d, num_f, small_f)
    if b not in ("welcome", "bye", "rule", "remember"):
        draw_number_line(d, num_f, small_f, highlight=highlight, jumps=jumps, start=start)
    elif b in ("rule", "remember"):
        draw_number_line(d, num_f, small_f)

    if b == "bye":
        d.rounded_rectangle([70, 420, 820, 560], radius=18, fill=NAVY, outline=GOLD, width=3)
        d.text((110, 465), "أنت بطل اليوم ★", font=title_f, fill=GOLD)

    # teacher PiP camera (JoAcademy-like talking head)
    cam_w, cam_h = 330, 430
    talking = (int(t * 7) % 2) == 0
    face = talk if talking else idle
    face_r = face.resize((cam_w, cam_h), Image.Resampling.LANCZOS)
    bob = int(math.sin(t * 3.8) * 4)
    # frame card
    card = Image.new("RGBA", (cam_w + 18, cam_h + 70), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle([0, 0, cam_w + 17, cam_h + 69], radius=22, fill=(18, 10, 12, 235), outline=GOLD, width=3)
    face_masked = Image.new("RGBA", (cam_w, cam_h), (0, 0, 0, 0))
    face_masked.paste(face_r, (0, 0))
    face_masked.putalpha(rounded_mask((cam_w, cam_h), 18))
    card.alpha_composite(face_masked, (9, 9 + bob))
    cd.text((18, cam_h + 22), "أ. لاما النوري", font=small_f, fill=GOLD)
    cd.text((18, cam_h + 46), "معلمة الصف الأول", font=small_f, fill=(255, 255, 255, 200))
    img.alpha_composite(card, (920, 100))

    # progress tip
    d.rounded_rectangle([36, 680, 900, 708], radius=10, fill=(255, 255, 255, 180))
    d.text((55, 684), "درس مصوّر  ·  صوت أردني  ·  Success OS", font=small_f, fill=BRAND)
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
            frame.save(FRAMES / f"f{frame_idx:05d}.png", optimize=True)
            frame_idx += 1
        manifest_beats.append(
            {
                "id": beat["id"],
                "title": beat["title"],
                "duration": round(dur, 3),
                "audio": f"/ai-lessons/g1-math/audio/beat-{beat['id']}.mp3",
            }
        )
        print(f"beat {beat['id']} {dur:.2f}s frames={nframes}")

    list_file = Path("/tmp/audio_list_jo.txt")
    with list_file.open("w") as f:
        for beat in BEATS:
            f.write(f"file '{AUDIO_DIR / f'beat-{beat['id']}.mp3'}'\n")
    concat_audio = Path("/tmp/lesson_audio_jo.mp3")
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
            str(FRAMES / "f%05d.png"),
            "-i",
            str(concat_audio),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-preset",
            "fast",
            "-crf",
            "20",
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
        [
            "ffmpeg",
            "-y",
            "-ss",
            "4",
            "-i",
            str(video_out),
            "-frames:v",
            "1",
            "-q:v",
            "2",
            str(OUT / "poster.jpg"),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    total_dur = probe_duration(video_out)
    manifest = {
        "lessonId": "jordan-g1-math-number-line-addition",
        "teacher": "أ. لاما النوري",
        "voice": "ar-JO-SanaNeural",
        "style": "joacademy-course-player",
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
