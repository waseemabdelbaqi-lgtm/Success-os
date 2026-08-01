#!/usr/bin/env python3
"""
Grade 1 Math — colorful classroom board lesson (Success OS).

What the user asked for:
- Teacher SPEAKS clearly (Jordan Arabic female voice via edge-tts)
- Writing appears BESIDE her on a colorful chalkboard
- Board content MATCHES what she is saying (phrase-synced cues)
- Illustrations + bright colors for young learners
- Clear worked examples on the board

Layout 1280x720: teacher stage (left) + living chalkboard (right).
Optional: later composite a HeyGen talking avatar over the teacher stage
via scripts/compose-heygen-board-lesson.py when HEYGEN_* secrets exist.
"""
from __future__ import annotations

import asyncio
import json
import math
import os
import shutil
import subprocess
import wave
from pathlib import Path

import edge_tts
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps
from pydub import AudioSegment

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "content" / "media" / "jordan-g1-colorful-board"
AUDIO_DIR = BASE / "audio"
FRAMES_DIR = BASE / "frames"
PUBLIC_DIR = ROOT / "public" / "media" / "jordan-g1-colorful-board"
ARTIFACT = Path("/opt/cursor/artifacts")
OUTPUT_VIDEO = BASE / "jordan-g1-colorful-board-lesson.mp4"
POSES = ROOT / "content" / "media" / "jordan-g1-math-reel" / "poses"

WIDTH, HEIGHT = 1280, 720
FPS = 24
VOICE = os.environ.get("G1_TEACHER_VOICE", "ar-JO-SanaNeural")

# Soft classroom palette — bright for young grades, not purple-default AI look
WALL_TOP = (255, 244, 220)
WALL_BOT = (255, 228, 186)
WOOD = (120, 78, 48)
BOARD = (34, 110, 78)
BOARD_EDGE = (92, 58, 34)
CHALK = (250, 248, 235)
CHALK_YELLOW = (255, 230, 120)
CHALK_PINK = (255, 170, 190)
CHALK_BLUE = (150, 220, 255)
CHALK_ORANGE = (255, 180, 110)
INK = (40, 36, 48)
CREAM = (255, 250, 240)
ACCENT = (230, 90, 70)

FONT_AR_B = "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf"
FONT_AR = "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf"
FONT_NUM = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Each beat: spoken Arabic + board actions that reveal while that beat plays.
# Board actions are fractions [0..1] within the beat's audio window.
BEATS = [
    {
        "id": "welcome",
        "pose": "talk",
        "say": "مرحبا أصدقائي! أنا المعلمة سارة. اليوم نحكي قصة العد حتى ثلاثة، على السبورة الملونة.",
        "board": {
            "title": "العدّ حتى ثلاثة",
            "subtitle": "الصف 1 · الرياضيات",
            "cues": [
                {"at": 0.05, "type": "title"},
                {"at": 0.35, "type": "subtitle"},
                {"at": 0.55, "type": "stars", "n": 3},
                {"at": 0.75, "type": "banner", "text": "هيا نبدأ!"},
            ],
        },
    },
    {
        "id": "one",
        "pose": "write",
        "say": "انظر معي على السبورة. هذا واحد. أكتب الرقم واحد، وأرسم تفاحة واحدة فقط.",
        "board": {
            "title": "العدد واحد",
            "subtitle": "1 = واحد",
            "cues": [
                {"at": 0.05, "type": "title"},
                {"at": 0.25, "type": "big_number", "n": 1, "word": "واحد"},
                {"at": 0.45, "type": "apples", "n": 1},
                {"at": 0.70, "type": "example", "text": "مثال: تفاحة واحدة"},
                {"at": 0.88, "type": "equation", "text": "1 = واحد"},
            ],
        },
    },
    {
        "id": "two",
        "pose": "write",
        "say": "والآن اثنان. أكتب الرقم اثنين، وأرسم تفاحتين جنباً إلى جنب. واحد، اثنان.",
        "board": {
            "title": "العدد اثنان",
            "subtitle": "2 = اثنان",
            "cues": [
                {"at": 0.05, "type": "title"},
                {"at": 0.22, "type": "big_number", "n": 2, "word": "اثنان"},
                {"at": 0.45, "type": "apples", "n": 2},
                {"at": 0.72, "type": "example", "text": "مثال: تفاحتان"},
                {"at": 0.88, "type": "equation", "text": "2 = اثنان"},
            ],
        },
    },
    {
        "id": "three",
        "pose": "point",
        "say": "وأخيراً ثلاثة. ثلاثة أشياء معاً. أكتب ثلاثة، وأرسم ثلاث تفاحات ملونة. واحد، اثنان، ثلاثة!",
        "board": {
            "title": "العدد ثلاثة",
            "subtitle": "3 = ثلاثة",
            "cues": [
                {"at": 0.05, "type": "title"},
                {"at": 0.20, "type": "big_number", "n": 3, "word": "ثلاثة"},
                {"at": 0.42, "type": "apples", "n": 3},
                {"at": 0.68, "type": "example", "text": "مثال: ثلاث تفاحات"},
                {"at": 0.85, "type": "equation", "text": "3 = ثلاثة"},
            ],
        },
    },
    {
        "id": "practice",
        "pose": "talk",
        "say": "هيا نتمرن على السبورة. أشر وعدّ معي: دائرة واحدة، دائرتان، ثلاث دوائر. طابق الكمية مع الرقم.",
        "board": {
            "title": "تمرين سريع",
            "subtitle": "طابق الكمية مع الرقم",
            "cues": [
                {"at": 0.05, "type": "title"},
                {"at": 0.25, "type": "practice_row", "n": 1},
                {"at": 0.50, "type": "practice_row", "n": 2},
                {"at": 0.72, "type": "practice_row", "n": 3},
                {"at": 0.90, "type": "banner", "text": "ممتاز!"},
            ],
        },
    },
    {
        "id": "bye",
        "pose": "talk",
        "say": "أحسنت يا بطل! تعلّمنا واحد، اثنان، ثلاثة. أنا فخورة فيك. إلى اللقاء في الدرس القادم.",
        "board": {
            "title": "أحسنت!",
            "subtitle": "تعلّمنا العدّ حتى ثلاثة",
            "cues": [
                {"at": 0.05, "type": "title"},
                {"at": 0.30, "type": "summary"},
                {"at": 0.60, "type": "stars", "n": 3},
                {"at": 0.80, "type": "banner", "text": "إلى اللقاء"},
            ],
        },
    },
]


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    if os.path.exists(path):
        return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def cutout_sage_bg(img: Image.Image) -> Image.Image:
    """Remove flat sage studio background so teacher sits cleanly on stage."""
    arr = np.array(img.convert("RGBA")).astype(np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    # studio bg ~ RGB(173,176,147)
    dist = np.sqrt((r - 173) ** 2 + (g - 176) ** 2 + (b - 147) ** 2)
    alpha = np.where(dist < 38, 0, np.where(dist < 58, ((dist - 38) / 20) * 255, 255))
    arr[:, :, 3] = np.minimum(arr[:, :, 3], alpha)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def load_pose(name: str, height: int = 440) -> Image.Image:
    path = POSES / f"teacher-{name}.png"
    if not path.exists():
        path = POSES / "teacher-talk.png"
    img = cutout_sage_bg(Image.open(path).convert("RGBA"))
    ratio = height / img.height
    img = img.resize((max(1, int(img.width * ratio)), height), Image.Resampling.LANCZOS)
    return img


# Mouth center on source 1024×1536 talk pose (calibrated on lip pixels)
MOUTH_SRC = (540, 506)


def apply_lip_sync(pose_img: Image.Image, mouth: float, t: float) -> Image.Image:
    """Open/close the illustrated mouth by stretching the mouth band with audio RMS."""
    img = pose_img.copy().convert("RGBA")
    w, h = img.size
    scale = h / 1536.0
    mx = int(MOUTH_SRC[0] * scale)
    my = int(MOUTH_SRC[1] * scale)

    open_amt = max(0.0, min(1.0, mouth))
    if open_amt > 0.08:
        open_amt = min(1.0, 0.70 * open_amt + 0.30 * abs(math.sin(t * 30)))
    else:
        return img

    half_w = int(40 * scale)
    top = max(0, my - int(14 * scale))
    bot = min(h, my + int(18 * scale))
    left = max(0, mx - half_w)
    right = min(w, mx + half_w)
    band = img.crop((left, top, right, bot))
    if band.height < 4:
        return img

    # jaw drop: stretch band taller; visible open/close with speech energy
    extra = int(band.height * (0.25 + 0.90 * open_amt))
    stretched = band.resize((band.width, band.height + extra), Image.Resampling.LANCZOS)
    mask = Image.new("L", stretched.size, 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle(
        (1, 1, stretched.width - 2, stretched.height - 2),
        radius=max(4, int(8 * scale)),
        fill=255,
    )
    mask = mask.filter(ImageFilter.GaussianBlur(radius=max(1, int(1.5 * scale))))
    img.paste(stretched, (left, top), mask)
    return img


def classroom_base() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), WALL_TOP)
    d = ImageDraw.Draw(img)
    for y in range(HEIGHT):
        t = y / HEIGHT
        col = (
            int(WALL_TOP[0] + (WALL_BOT[0] - WALL_TOP[0]) * t),
            int(WALL_TOP[1] + (WALL_BOT[1] - WALL_TOP[1]) * t),
            int(WALL_TOP[2] + (WALL_BOT[2] - WALL_TOP[2]) * t),
        )
        d.line([(0, y), (WIDTH, y)], fill=col)

    # soft wall dots (playful, not clutter)
    rng = np.random.default_rng(7)
    for _ in range(40):
        x, y = int(rng.integers(20, WIDTH - 20)), int(rng.integers(20, HEIGHT - 80))
        r = int(rng.integers(2, 5))
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 210, 160))

    # top brand strip
    d.rounded_rectangle((18, 14, WIDTH - 18, 58), radius=16, fill=(255, 255, 255))
    d.text((36, 36), "SUCCESS OS", font=font(FONT_NUM, 18), fill=(60, 120, 95), anchor="lm")
    d.text(
        (WIDTH // 2, 36),
        "المعلمة سارة · العدّ حتى ثلاثة",
        font=font(FONT_AR_B, 22),
        fill=INK,
        anchor="mm",
    )
    d.text((WIDTH - 36, 36), "الصف 1", font=font(FONT_AR, 16), fill=(120, 90, 70), anchor="rm")

    # floor
    d.rectangle((0, HEIGHT - 48, WIDTH, HEIGHT), fill=(210, 175, 130))
    d.rectangle((0, HEIGHT - 54, WIDTH, HEIGHT - 46), fill=(180, 145, 105))
    return img


def draw_apple(d: ImageDraw.ImageDraw, cx: int, cy: int, scale: float = 1.0, color=(230, 70, 70)):
    s = scale
    d.ellipse(
        (cx - 28 * s, cy - 22 * s, cx + 28 * s, cy + 30 * s),
        fill=color,
        outline=(160, 40, 40),
        width=2,
    )
    d.ellipse(
        (cx - 10 * s, cy - 14 * s, cx + 2 * s, cy - 2 * s),
        fill=(255, 140, 140),
    )
    d.line([(cx, cy - 22 * s), (cx + 4 * s, cy - 38 * s)], fill=(90, 60, 40), width=3)
    d.ellipse(
        (cx + 2 * s, cy - 42 * s, cx + 18 * s, cy - 30 * s),
        fill=(80, 170, 80),
    )


def draw_circle_token(d: ImageDraw.ImageDraw, cx: int, cy: int, color, label: str | None = None):
    d.ellipse((cx - 26, cy - 26, cx + 26, cy + 26), fill=color, outline=CHALK, width=3)
    if label:
        d.text((cx, cy), label, font=font(FONT_NUM, 22), fill=INK, anchor="mm")


def active_cues(board: dict, progress: float) -> list[dict]:
    return [c for c in board.get("cues", []) if progress >= float(c.get("at", 0))]


def draw_board(img: Image.Image, board: dict, progress: float, mouth: float):
    d = ImageDraw.Draw(img)
    # board frame (right side)
    bx0, by0, bx1, by1 = 430, 78, WIDTH - 28, HEIGHT - 70
    d.rounded_rectangle((bx0, by0, bx1, by1), radius=22, fill=BOARD_EDGE)
    d.rounded_rectangle((bx0 + 14, by0 + 14, bx1 - 14, by1 - 28), radius=16, fill=BOARD)
    # chalk tray
    d.rounded_rectangle((bx0 + 40, by1 - 24, bx1 - 40, by1 - 8), radius=6, fill=(150, 110, 70))
    d.ellipse((bx0 + 55, by1 - 22, bx0 + 85, by1 - 10), fill=CHALK)
    d.ellipse((bx0 + 95, by1 - 22, bx0 + 120, by1 - 10), fill=CHALK_YELLOW)
    d.ellipse((bx0 + 130, by1 - 22, bx0 + 155, by1 - 10), fill=CHALK_PINK)

    cues = active_cues(board, progress)
    kinds = {c["type"] for c in cues}

    if "title" in kinds:
        d.text(
            ((bx0 + bx1) // 2, by0 + 48),
            board.get("title", ""),
            font=font(FONT_AR_B, 36),
            fill=CHALK,
            anchor="mm",
        )
    if "subtitle" in kinds:
        d.text(
            ((bx0 + bx1) // 2, by0 + 90),
            board.get("subtitle", ""),
            font=font(FONT_AR, 22),
            fill=CHALK_YELLOW,
            anchor="mm",
        )

    # chalk writing glow while speaking
    if mouth > 0.15:
        d.ellipse(
            (bx1 - 70, by0 + 30, bx1 - 40, by0 + 55),
            fill=(255, 255, 200),
            outline=CHALK_YELLOW,
        )

    for c in cues:
        t = c["type"]
        if t == "big_number":
            n = int(c["n"])
            word = c.get("word", "")
            cx = (bx0 + bx1) // 2 - 160
            cy = by0 + 220
            # colorful number badge
            colors = {1: CHALK_YELLOW, 2: CHALK_PINK, 3: CHALK_BLUE}
            d.rounded_rectangle(
                (cx - 70, cy - 70, cx + 70, cy + 70),
                radius=24,
                fill=(20, 80, 55),
                outline=colors.get(n, CHALK),
                width=4,
            )
            d.text((cx, cy - 8), str(n), font=font(FONT_NUM, 72), fill=colors.get(n, CHALK), anchor="mm")
            d.text((cx, cy + 95), word, font=font(FONT_AR_B, 28), fill=CHALK, anchor="mm")

        elif t == "apples":
            n = int(c["n"])
            colors = [(230, 70, 70), (255, 140, 60), (80, 170, 230)]
            base_x = (bx0 + bx1) // 2 + 90
            cy = by0 + 220
            gap = 70
            total = (n - 1) * gap
            x0 = base_x - total / 2
            for i in range(n):
                draw_apple(d, int(x0 + i * gap), cy, scale=1.05, color=colors[i % len(colors)])
            d.text((base_x, cy + 70), f"× {n}", font=font(FONT_NUM, 26), fill=CHALK_YELLOW, anchor="mm")

        elif t == "example":
            d.rounded_rectangle(
                (bx0 + 40, by1 - 150, bx1 - 40, by1 - 95),
                radius=14,
                fill=(22, 78, 55),
                outline=CHALK_ORANGE,
                width=2,
            )
            d.text(
                ((bx0 + bx1) // 2, by1 - 122),
                c.get("text", ""),
                font=font(FONT_AR_B, 24),
                fill=CHALK_ORANGE,
                anchor="mm",
            )

        elif t == "equation":
            d.rounded_rectangle(
                (bx0 + 80, by1 - 88, bx1 - 80, by1 - 40),
                radius=12,
                fill=(18, 70, 50),
                outline=CHALK_YELLOW,
                width=2,
            )
            d.text(
                ((bx0 + bx1) // 2, by1 - 64),
                c.get("text", ""),
                font=font(FONT_NUM, 28),
                fill=CHALK_YELLOW,
                anchor="mm",
            )

        elif t == "practice_row":
            n = int(c["n"])
            # stack rows for 1,2,3 as they appear
            row_index = n - 1
            y = by0 + 150 + row_index * 110
            colors = [CHALK_YELLOW, CHALK_PINK, CHALK_BLUE]
            d.text((bx0 + 50, y), f"{n}", font=font(FONT_NUM, 40), fill=colors[row_index], anchor="lm")
            d.text((bx0 + 100, y), "=", font=font(FONT_NUM, 32), fill=CHALK, anchor="lm")
            for i in range(n):
                draw_circle_token(d, bx0 + 180 + i * 70, y, colors[row_index])
            words = {1: "واحد", 2: "اثنان", 3: "ثلاثة"}
            d.text((bx1 - 50, y), words[n], font=font(FONT_AR_B, 26), fill=CHALK, anchor="rm")

        elif t == "stars":
            n = int(c.get("n", 3))
            cx = (bx0 + bx1) // 2
            cy = by0 + 200
            for i in range(n):
                x = cx + (i - (n - 1) / 2) * 70
                d.text((x, cy), "★", font=font(FONT_NUM, 48), fill=CHALK_YELLOW, anchor="mm")

        elif t == "summary":
            lines = ["1 = واحد", "2 = اثنان", "3 = ثلاثة"]
            colors = [CHALK_YELLOW, CHALK_PINK, CHALK_BLUE]
            for i, line in enumerate(lines):
                y = by0 + 160 + i * 70
                d.rounded_rectangle(
                    (bx0 + 70, y - 28, bx1 - 70, y + 28),
                    radius=14,
                    fill=(22, 78, 55),
                    outline=colors[i],
                    width=3,
                )
                d.text(((bx0 + bx1) // 2, y), line, font=font(FONT_NUM, 30), fill=colors[i], anchor="mm")

        elif t == "banner":
            d.rounded_rectangle(
                (bx0 + 90, by1 - 120, bx1 - 90, by1 - 55),
                radius=18,
                fill=ACCENT,
            )
            d.text(
                ((bx0 + bx1) // 2, by1 - 88),
                c.get("text", ""),
                font=font(FONT_AR_B, 28),
                fill=CREAM,
                anchor="mm",
            )


def draw_caption(img: Image.Image, text: str):
    """Large readable caption of what the teacher is saying right now."""
    d = ImageDraw.Draw(img)
    # keep caption short on screen
    short = text if len(text) <= 54 else text[:52] + "…"
    box = (430, HEIGHT - 118, WIDTH - 28, HEIGHT - 70)
    d.rounded_rectangle(box, radius=12, fill=(20, 40, 34))
    d.text(
        ((box[0] + box[2]) // 2, (box[1] + box[3]) // 2),
        short,
        font=font(FONT_AR_B, 18),
        fill=CHALK,
        anchor="mm",
    )


def draw_teacher_stage(
    img: Image.Image,
    pose_img: Image.Image,
    mouth: float,
    pose_name: str,
    t: float,
    caption: str,
):
    d = ImageDraw.Draw(img)
    # stage panel
    d.rounded_rectangle((22, 78, 410, HEIGHT - 70), radius=22, fill=(255, 255, 255))
    d.rounded_rectangle((34, 92, 398, 150), radius=14, fill=(255, 236, 210))
    d.text((216, 121), "المعلمة سارة", font=font(FONT_AR_B, 24), fill=INK, anchor="mm")

    # gentle sway only (no jumpy bob)
    sway = int(2 * math.sin(t * 1.4))
    px = 216 - pose_img.width // 2 + sway
    py = 160

    shadow = Image.new("RGBA", (pose_img.width, 24), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((8, 0, pose_img.width - 8, 22), fill=(0, 0, 0, 35))
    img.paste(shadow, (px, py + pose_img.height - 18), shadow)

    teacher = apply_lip_sync(pose_img, mouth, t)
    img.paste(teacher, (px, py), teacher)

    # voice meter under teacher (not on her body)
    bar_y = HEIGHT - 100
    d.text(
        (216, bar_y - 16),
        "تتكلم الآن" if mouth > 0.12 else "…",
        font=font(FONT_AR, 14),
        fill=(120, 90, 70),
        anchor="mm",
    )
    for i in range(7):
        bh = int(5 + mouth * 22 * (0.55 + 0.45 * abs(math.sin(t * 22 + i))))
        color = (70, 170, 120) if i % 2 == 0 else ACCENT
        x = 150 + i * 20
        d.rounded_rectangle((x, bar_y + 22 - bh, x + 12, bar_y + 22), radius=4, fill=color)

    if caption:
        draw_caption(img, caption)


def draw_progress(img: Image.Image, t: float, total: float, beat_idx: int, beat_count: int):
    d = ImageDraw.Draw(img)
    p = min(1.0, t / max(0.1, total))
    d.rounded_rectangle((22, HEIGHT - 36, WIDTH - 22, HEIGHT - 18), radius=8, fill=(255, 255, 255))
    d.rounded_rectangle((22, HEIGHT - 36, 22 + int((WIDTH - 44) * p), HEIGHT - 18), radius=8, fill=ACCENT)
    d.text(
        (WIDTH - 30, 70),
        f"{beat_idx}/{beat_count}",
        font=font(FONT_NUM, 14),
        fill=(120, 90, 70),
        anchor="rm",
    )


async def synth_beat(text: str, out_mp3: Path):
    communicate = edge_tts.Communicate(text, VOICE, rate="-5%")
    await communicate.save(str(out_mp3))


def build_audio():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    gap = AudioSegment.silent(duration=400)
    full = AudioSegment.silent(duration=250)
    timeline = []
    cursor_ms = 250

    print(f"Voice: {VOICE}")
    for i, beat in enumerate(BEATS, start=1):
        mp3 = AUDIO_DIR / f"beat_{i:02d}.mp3"
        print(f"  TTS beat {i}: {beat['id']}")
        asyncio.run(synth_beat(beat["say"], mp3))
        seg = AudioSegment.from_file(mp3)
        # Browser-friendly audio: 48kHz stereo + loud clear level
        seg = seg.set_frame_rate(48000).set_channels(2)
        if seg.max_dBFS != float("-inf"):
            # target ~-14 dBFS average, avoid clipping
            seg = seg.apply_gain(-seg.dBFS - 14.0)
            if seg.max_dBFS > -1.0:
                seg = seg.apply_gain(-1.0 - seg.max_dBFS)
        start = cursor_ms / 1000.0
        end = (cursor_ms + len(seg)) / 1000.0
        timeline.append({**beat, "start": start, "end": end, "index": i})
        full += seg + gap
        cursor_ms += len(seg) + len(gap)

    full = full.set_frame_rate(48000).set_channels(2)
    wav = AUDIO_DIR / "full_narration.wav"
    full.export(wav, format="wav", parameters=["-ar", "48000"])
    # also keep mp3 sidecar for players that struggle with wav probing
    mp3_full = AUDIO_DIR / "full_narration.mp3"
    full.export(mp3_full, format="mp3", bitrate="192k")
    print(f"Audio total: {len(full)/1000:.1f}s | dBFS={full.dBFS:.1f} | {full.channels}ch {full.frame_rate}Hz")
    return timeline, wav, mp3_full, len(full) / 1000.0


def load_rms(wav: Path, fps: int = FPS) -> np.ndarray:
    with wave.open(str(wav), "rb") as w:
        n, sw, rate, frames = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
        raw = w.readframes(frames)
    data = np.frombuffer(raw, dtype=np.int16)
    if n > 1:
        data = data.reshape(-1, n).mean(axis=1)
    samples_per_frame = max(1, int(rate / fps))
    # pad
    pad = (-len(data)) % samples_per_frame
    if pad:
        data = np.pad(data, (0, pad))
    shaped = data.reshape(-1, samples_per_frame).astype(np.float32)
    rms = np.sqrt(np.mean(shaped**2, axis=1))
    if rms.max() > 0:
        rms = rms / rms.max()
    return rms


def smooth_rms(rms: np.ndarray, win: int = 3) -> np.ndarray:
    if len(rms) < 3:
        return rms
    k = np.ones(win) / win
    pad = win // 2
    padded = np.pad(rms, (pad, pad), mode="edge")
    return np.convolve(padded, k, mode="valid")[: len(rms)]


def render_frames(timeline, total_duration, rms):
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)
    FRAMES_DIR.mkdir(parents=True)

    # Prefer talk pose for natural lip-sync; point only briefly for emphasis
    talk = load_pose("talk")
    point = load_pose("point")

    total_frames = int(math.ceil(total_duration * FPS))
    print(f"Rendering {total_frames} frames…")
    for fi in range(total_frames):
        t = fi / FPS
        beat = timeline[-1]
        for b in timeline:
            if b["start"] <= t <= b["end"] + 0.35:
                beat = b
                break
            if t < b["start"]:
                beat = b
                break
        dur = max(0.05, beat["end"] - beat["start"])
        progress = max(0.0, min(1.0, (t - beat["start"]) / dur))
        mouth = float(rms[fi]) if fi < len(rms) else 0.0
        speaking = beat["start"] <= t <= beat["end"]
        if speaking:
            # keep lips lively while TTS is active even in soft syllables
            mouth = max(mouth, 0.22)
        else:
            mouth *= 0.15

        # mostly talk; short point gesture mid-beat on "point" beats
        pose_name = "talk"
        pose_img = talk
        if beat.get("pose") == "point" and 0.35 < progress < 0.65:
            pose_name = "point"
            pose_img = point

        frame = classroom_base()
        draw_board(frame, beat["board"], progress, mouth)
        draw_teacher_stage(frame, pose_img, mouth, pose_name, t, beat["say"] if speaking else "")
        draw_progress(frame, t, total_duration, beat["index"], len(timeline))
        frame.save(FRAMES_DIR / f"frame_{fi:06d}.jpg", quality=88)
        if fi % 120 == 0:
            print(f"  {fi}/{total_frames}")
    print(f"Done {total_frames} frames")


def compose_video(audio_path: Path):
    print("Composing MP4 (stereo AAC 48kHz)…")
    OUTPUT_VIDEO.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", str(FRAMES_DIR / "frame_%06d.jpg"),
        "-i", str(audio_path),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
        "-shortest",
        "-movflags", "+faststart",
        str(OUTPUT_VIDEO),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-1200:])
        raise SystemExit(1)
    print(f"Video: {OUTPUT_VIDEO} ({OUTPUT_VIDEO.stat().st_size} bytes)")


def main():
    print("=== G1 Colorful Board Lesson (speech-synced) ===")
    if not POSES.exists():
        raise SystemExit(f"Missing teacher poses at {POSES}")

    BASE.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT.mkdir(parents=True, exist_ok=True)

    timeline, wav, mp3_full, total = build_audio()
    (BASE / "timeline.json").write_text(
        json.dumps(
            [
                {
                    "id": b["id"],
                    "start": b["start"],
                    "end": b["end"],
                    "say": b["say"],
                    "pose": b["pose"],
                    "board": b["board"],
                }
                for b in timeline
            ],
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    (BASE / "heygen-script.txt").write_text(
        "\n\n".join(b["say"] for b in BEATS) + "\n",
        encoding="utf-8",
    )

    rms = smooth_rms(load_rms(wav))
    render_frames(timeline, total, rms)
    compose_video(mp3_full)

    # mid-lesson frame as poster (shows open mouth + board)
    mid = FRAMES_DIR / f"frame_{int(total * FPS * 0.35):06d}.jpg"
    first = mid if mid.exists() else sorted(FRAMES_DIR.glob("frame_*.jpg"))[0]
    shutil.copy2(first, BASE / "poster.jpg")
    for dest in (PUBLIC_DIR, ARTIFACT):
        shutil.copy2(OUTPUT_VIDEO, dest / OUTPUT_VIDEO.name)
        shutil.copy2(BASE / "poster.jpg", dest / "jordan-g1-colorful-board-poster.jpg")
    # dedicated loudness-checked artifact name for chat playback
    shutil.copy2(OUTPUT_VIDEO, ARTIFACT / "jordan-g1-colorful-board-lesson.mp4")

    gif = ARTIFACT / "jordan-g1-colorful-board-preview.gif"
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(OUTPUT_VIDEO),
            "-vf", "fps=12,scale=480:-1:flags=lanczos",
            "-t", "6", "-an", str(gif),
        ],
        check=True,
        capture_output=True,
    )

    shutil.rmtree(FRAMES_DIR, ignore_errors=True)
    for p in AUDIO_DIR.glob("beat_*.mp3"):
        p.unlink(missing_ok=True)
    wav.unlink(missing_ok=True)
    # keep mp3_full for debugging audio; copy to artifacts then remove from repo tree
    shutil.copy2(mp3_full, ARTIFACT / "jordan-g1-colorful-board-audio.mp3")
    mp3_full.unlink(missing_ok=True)

    probe = subprocess.run(
        [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", str(OUTPUT_VIDEO),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    info = json.loads(probe.stdout)
    print("=== VERIFICATION ===")
    print(f"Duration: {float(info['format']['duration']):.1f}s")
    for stream in info["streams"]:
        if stream["codec_type"] == "video":
            print(f"Video: {stream['width']}x{stream['height']} {stream['codec_name']}")
        elif stream["codec_type"] == "audio":
            print(f"Audio: {stream['codec_name']} {stream.get('sample_rate')}Hz")
    print(f"HeyGen script ready: {BASE / 'heygen-script.txt'}")
    print("Next: set HEYGEN_API_KEY + HEYGEN_AVATAR_ID + HEYGEN_VOICE_ID then:")
    print("  npm run media:heygen-g1-teacher")


if __name__ == "__main__":
    main()
