#!/usr/bin/env python3
"""Bake a real MP4 lesson video with illustrated teacher + board + audio."""

from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "ai-lessons" / "g1-math"
FRAMES = Path("/tmp/lesson-frames")
AUDIO_DIR = OUT / "audio"
FACES_DIR = OUT / "faces"
ILLUST = Path("/opt/cursor/artifacts/assets")

W, H = 1280, 720
FPS = 12

BEATS = [
    {
        "id": "01",
        "title": "مرحباً يا بطل الصف الأول",
        "body": "اليوم نتعلم الجمع بخط الأعداد\nمع المعلمة لاما النوري",
        "board": "welcome",
    },
    {
        "id": "02",
        "title": "خط الأعداد",
        "body": "خط مستقيم عليه أرقام مرتبة\nمن اليسار لليمين",
        "board": "numberline",
    },
    {
        "id": "03",
        "title": "قف عند البداية",
        "body": "في المسألة 3 + 2\nنبدأ من الرقم 3",
        "board": "start3",
    },
    {
        "id": "04",
        "title": "اقفز قفزات الجمع",
        "body": "لأننا نجمع 2\nنقفز قفزتين لليمين",
        "board": "jumps",
    },
    {
        "id": "05",
        "title": "أين وصلنا؟",
        "body": "3 ثم 4 ثم 5\nالإجابة هي 5",
        "board": "answer5",
    },
    {
        "id": "06",
        "title": "تحدي صغير",
        "body": "جرّب أنت:\n2 + 3 = ؟",
        "board": "challenge",
    },
    {
        "id": "07",
        "title": "الحل معاً",
        "body": "من 2 نقفز 3 قفزات\nفنصل إلى 5",
        "board": "solve",
    },
    {
        "id": "08",
        "title": "نشاط سريع",
        "body": "ارسم خط أعداد من 0 إلى 10\nوحل 4 + 1",
        "board": "activity",
    },
    {
        "id": "09",
        "title": "تحقق",
        "body": "4 ثم قفزة واحدة\nالنتيجة 5",
        "board": "check",
    },
    {
        "id": "10",
        "title": "قاعدة ذهبية",
        "body": "ابدأ من العدد الأول\nثم اقفز بعدد الجمع",
        "board": "rule",
    },
    {
        "id": "11",
        "title": "تذكر",
        "body": "الجمع بخط الأعداد\nيعني قفزات لليمين",
        "board": "remember",
    },
    {
        "id": "12",
        "title": "أحسنت",
        "body": "أنت تتعلم بطريقة الأبطال\nإلى اللقاء في الدرس القادم",
        "board": "bye",
    },
]

BRAND = (158, 23, 34, 255)
GOLD = (242, 215, 124, 255)
INK = (36, 22, 24, 255)
CREAM = (255, 248, 240, 255)
SOFT = (255, 236, 214, 255)


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
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    font_path = next((p for p in candidates if os.path.exists(p)), None)
    if not font_path:
        d = ImageFont.load_default()
        return d, d, d, d
    return (
        ImageFont.truetype(font_path, 54),
        ImageFont.truetype(font_path, 40),
        ImageFont.truetype(font_path, 26),
        ImageFont.truetype(font_path, 36),
    )


def prepare_faces():
    FACES_DIR.mkdir(parents=True, exist_ok=True)
    for name in ("idle", "talk"):
        src = ILLUST / f"lama-illust-{name}.png"
        img = Image.open(src).convert("RGBA")
        w, h = img.size
        img = img.crop((int(w * 0.08), int(h * 0.02), int(w * 0.92), int(h * 0.98)))
        img.save(FACES_DIR / f"{name}.png")
    return (
        Image.open(FACES_DIR / "idle.png").convert("RGBA"),
        Image.open(FACES_DIR / "talk.png").convert("RGBA"),
    )


def draw_bg(small_font):
    img = Image.new("RGBA", (W, H), (255, 248, 240, 255))
    d = ImageDraw.Draw(img)
    for i in range(H):
        a = int(18 * (i / H))
        d.line([(0, i), (W, i)], fill=(255, 220 - a, 200 - a // 2, 255))
    d.rectangle([0, 0, W, 56], fill=(75, 10, 17, 255))
    d.text((28, 14), "Success OS  ·  معلمة لاما النوري", font=small_font, fill=GOLD)
    d.text((W - 220, 14), "الصف 1  ·  رياضيات", font=small_font, fill=(255, 255, 255, 220))
    return img


def draw_number_line(d, num_font, small_font, highlight=None, jumps=None, start=None):
    y = 390
    d.line([(120, y), (760, y)], fill=BRAND, width=6)
    positions = {}
    for n in range(0, 11):
        x = 120 + n * 64
        positions[n] = x
        d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=GOLD if highlight == n else BRAND)
        d.text((x - 10, y + 16), str(n), font=num_font, fill=INK)
    if start is not None:
        x = positions[start]
        d.ellipse([x - 18, y - 54, x + 18, y - 18], fill=BRAND)
        d.text((x - 8, y - 48), "*", font=small_font, fill=GOLD)
    if jumps:
        for a, b in jumps:
            x1, x2 = positions[a], positions[b]
            mid = (x1 + x2) // 2
            d.arc([x1, y - 70, x2, y + 10], start=200, end=340, fill=(196, 92, 42, 255), width=4)
            d.text((mid - 8, y - 88), ">", font=small_font, fill=(196, 92, 42, 255))


def draw_board(base, beat, t_in_beat, fonts, idle, talk):
    title_font, body_font, small_font, num_font = fonts
    img = base.copy()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([48, 90, 820, 620], radius=28, fill=CREAM, outline=(232, 198, 168, 255), width=3)
    d.text((80, 120), beat["title"], font=title_font, fill=BRAND)
    y = 200
    for line in beat["body"].split("\n"):
        d.text((80, y), line, font=body_font, fill=INK)
        y += 58

    b = beat["board"]
    if b in (
        "numberline",
        "start3",
        "jumps",
        "answer5",
        "challenge",
        "solve",
        "activity",
        "check",
        "rule",
        "remember",
    ):
        start = (
            3
            if b in ("start3", "jumps")
            else (2 if b in ("challenge", "solve") else (4 if b in ("activity", "check") else None))
        )
        highlight = (
            5
            if b in ("answer5", "solve", "check")
            else (3 if b == "start3" else (2 if b == "challenge" else None))
        )
        jumps = None
        if b == "jumps":
            jumps = [(3, 4), (4, 5)]
        if b == "solve":
            jumps = [(2, 3), (3, 4), (4, 5)]
        if b == "check":
            jumps = [(4, 5)]
        if b == "numberline":
            highlight = None
            start = None
        draw_number_line(d, num_font, small_font, highlight=highlight, jumps=jumps, start=start)
    if b == "welcome":
        d.rounded_rectangle([80, 360, 760, 520], radius=20, fill=SOFT, outline=GOLD, width=3)
        d.text((110, 400), "3 + 2 = ?", font=title_font, fill=BRAND)
        d.text((110, 470), "سنتعلمها بخط الأعداد", font=body_font, fill=INK)
    if b == "bye":
        d.rounded_rectangle([80, 360, 760, 520], radius=20, fill=(75, 10, 17, 255), outline=GOLD, width=3)
        d.text((120, 410), "أنت بطل اليوم", font=title_font, fill=GOLD)

    d.rounded_rectangle([860, 90, 1230, 620], radius=28, fill=(255, 255, 255, 235), outline=(232, 198, 168, 255), width=3)
    talking = int(t_in_beat * 6) % 2 == 0
    face = talk if talking else idle
    fw, fh = 300, 420
    face_r = face.resize((fw, fh), Image.Resampling.LANCZOS)
    bob = int(math.sin(t_in_beat * 4.5) * 6)
    shadow = Image.new("RGBA", (fw + 20, fh + 20), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([10, fh - 30, fw + 10, fh + 10], fill=(0, 0, 0, 40))
    img.alpha_composite(shadow, (885, 140 + bob))
    img.alpha_composite(face_r, (895, 120 + bob))
    d.text((900, 560), "المعلمة لاما", font=small_font, fill=BRAND)
    d.text((900, 592), "تشرح بحب ووضوح", font=small_font, fill=(120, 70, 70, 255))
    return img.convert("RGB")


def main():
    fonts = load_fonts()
    idle, talk = prepare_faces()
    shutil.rmtree(FRAMES, ignore_errors=True)
    FRAMES.mkdir(parents=True, exist_ok=True)

    manifest_beats = []
    frame_idx = 0
    for beat in BEATS:
        audio = AUDIO_DIR / f"beat-{beat['id']}.mp3"
        dur = probe_duration(audio)
        beat = {**beat, "dur": dur}
        nframes = max(1, int(round(dur * FPS)))
        for i in range(nframes):
            t = i / FPS
            frame = draw_board(draw_bg(fonts[2]), beat, t, fonts, idle, talk)
            frame.save(FRAMES / f"f{frame_idx:05d}.png")
            frame_idx += 1
        manifest_beats.append(
            {
                "id": beat["id"],
                "title": beat["title"],
                "duration": round(dur, 3),
                "audio": f"/ai-lessons/g1-math/audio/beat-{beat['id']}.mp3",
            }
        )
        print(f"beat {beat['id']} dur={dur:.2f}s frames={nframes}")

    list_file = Path("/tmp/audio_list.txt")
    with list_file.open("w") as f:
        for beat in BEATS:
            f.write(f"file '{AUDIO_DIR / f'beat-{beat['id']}.mp3'}'\n")
    concat_audio = Path("/tmp/lesson_audio.mp3")
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

    total_dur = probe_duration(video_out)
    manifest = {
        "lessonId": "jordan-g1-math-number-line-addition",
        "teacher": "لاما النوري",
        "video": "/ai-lessons/g1-math/lesson.mp4",
        "poster": "/ai-lessons/g1-math/faces/idle.png",
        "duration": round(total_dur, 3),
        "beats": manifest_beats,
        "faces": {
            "idle": "/ai-lessons/g1-math/faces/idle.png",
            "talk": "/ai-lessons/g1-math/faces/talk.png",
        },
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("VIDEO", video_out, "size", video_out.stat().st_size, "dur", total_dur)


if __name__ == "__main__":
    main()
