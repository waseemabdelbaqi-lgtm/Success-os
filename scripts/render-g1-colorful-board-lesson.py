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


def load_pose(name: str, height: int = 520) -> Image.Image:
    path = POSES / f"teacher-{name}.png"
    if not path.exists():
        path = POSES / "teacher-talk.png"
    img = Image.open(path).convert("RGBA")
    ratio = height / img.height
    img = img.resize((max(1, int(img.width * ratio)), height), Image.Resampling.LANCZOS)
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
    d.rectangle((0, HEIGHT - 48), fill=(210, 175, 130))
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


def draw_teacher_stage(
    img: Image.Image,
    pose_img: Image.Image,
    mouth: float,
    pose_name: str,
    progress: float,
):
    d = ImageDraw.Draw(img)
    # stage panel
    d.rounded_rectangle((22, 78, 410, HEIGHT - 70), radius=22, fill=(255, 255, 255))
    d.rounded_rectangle((34, 92, 398, 150), radius=14, fill=(255, 236, 210))
    d.text((216, 121), "المعلمة سارة", font=font(FONT_AR_B, 24), fill=INK, anchor="mm")

    # bob while talking
    bob = int(4 * math.sin(progress * 14) * (0.4 + mouth))
    px = 216 - pose_img.width // 2
    py = 175 + bob
    # soft shadow
    shadow = Image.new("RGBA", (pose_img.width, 28), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((10, 0, pose_img.width - 10, 26), fill=(0, 0, 0, 45))
    img.paste(shadow, (px, py + pose_img.height - 18), shadow)

    teacher = pose_img.copy()
    if mouth > 0.12:
        # slight brightness pulse = “alive” speaking energy
        teacher = ImageEnhance.Brightness(teacher).enhance(1.0 + 0.04 * mouth)

    img.paste(teacher, (px, py), teacher)

    # mouth / voice bars
    bar_y = HEIGHT - 125
    d.text((216, bar_y - 18), "تتكلم الآن" if mouth > 0.12 else "…", font=font(FONT_AR, 16), fill=(120, 90, 70), anchor="mm")
    for i in range(7):
        h = int(8 + mouth * 28 * abs(math.sin(progress * 18 + i)))
        color = (70, 170, 120) if i % 2 == 0 else ACCENT
        x = 150 + i * 20
        d.rounded_rectangle((x, bar_y + 30 - h, x + 12, bar_y + 30), radius=4, fill=color)

    # pose label
    labels = {"talk": "تشرح", "write": "تكتب على السبورة", "point": "تشير للمثال", "idle": "تستمع"}
    d.text((216, HEIGHT - 85), labels.get(pose_name, ""), font=font(FONT_AR, 15), fill=(140, 110, 90), anchor="mm")


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
    gap = AudioSegment.silent(duration=450)
    full = AudioSegment.silent(duration=300)
    timeline = []
    cursor_ms = 300

    print(f"Voice: {VOICE}")
    for i, beat in enumerate(BEATS, start=1):
        mp3 = AUDIO_DIR / f"beat_{i:02d}.mp3"
        print(f"  TTS beat {i}: {beat['id']}")
        asyncio.run(synth_beat(beat["say"], mp3))
        seg = AudioSegment.from_file(mp3)
        # normalize a bit for clarity
        seg = seg.apply_gain(-seg.max_dBFS - 1.5) if seg.max_dBFS != float("-inf") else seg
        start = cursor_ms / 1000.0
        end = (cursor_ms + len(seg)) / 1000.0
        timeline.append({**beat, "start": start, "end": end, "index": i})
        full += seg + gap
        cursor_ms += len(seg) + len(gap)

    wav = AUDIO_DIR / "full_narration.wav"
    full.export(wav, format="wav")
    print(f"Audio total: {len(full)/1000:.1f}s")
    return timeline, wav, len(full) / 1000.0


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


def render_frames(timeline, total_duration, rms):
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)
    FRAMES_DIR.mkdir(parents=True)

    poses = {
        "talk": load_pose("talk"),
        "write": load_pose("write"),
        "point": load_pose("point"),
        "idle": load_pose("idle") if (POSES / "teacher-idle.png").exists() else load_pose("talk"),
    }

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
        # boost mouth during beat speech window
        if beat["start"] <= t <= beat["end"]:
            mouth = max(mouth, 0.25)
        else:
            mouth *= 0.3

        pose_name = beat.get("pose", "talk")
        if progress > 0.85 and pose_name == "write":
            pose_name = "talk"
        pose_img = poses.get(pose_name, poses["talk"])

        frame = classroom_base()
        draw_board(frame, beat["board"], progress, mouth)
        draw_teacher_stage(frame, pose_img, mouth, pose_name, progress)
        draw_progress(frame, t, total_duration, beat["index"], len(timeline))
        frame.save(FRAMES_DIR / f"frame_{fi:06d}.jpg", quality=88)
        if fi % 120 == 0:
            print(f"  {fi}/{total_frames}")
    print(f"Done {total_frames} frames")


def compose_video(wav: Path):
    print("Composing MP4…")
    OUTPUT_VIDEO.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", str(FRAMES_DIR / "frame_%06d.jpg"),
        "-i", str(wav),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        str(OUTPUT_VIDEO),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-1000:])
        raise SystemExit(1)
    print(f"Video: {OUTPUT_VIDEO} ({OUTPUT_VIDEO.stat().st_size} bytes)")


def main():
    print("=== G1 Colorful Board Lesson (speech-synced) ===")
    if not POSES.exists():
        raise SystemExit(f"Missing teacher poses at {POSES}")

    BASE.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT.mkdir(parents=True, exist_ok=True)

    timeline, wav, total = build_audio()
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

    rms = load_rms(wav)
    render_frames(timeline, total, rms)
    compose_video(wav)

    first = sorted(FRAMES_DIR.glob("frame_*.jpg"))[0]
    shutil.copy2(first, BASE / "poster.jpg")
    for dest in (PUBLIC_DIR, ARTIFACT):
        shutil.copy2(OUTPUT_VIDEO, dest / OUTPUT_VIDEO.name)
        shutil.copy2(BASE / "poster.jpg", dest / "jordan-g1-colorful-board-poster.jpg")

    gif = ARTIFACT / "jordan-g1-colorful-board-preview.gif"
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(OUTPUT_VIDEO),
            "-vf", "fps=10,scale=480:-1:flags=lanczos",
            "-t", "8", "-an", str(gif),
        ],
        check=True,
        capture_output=True,
    )

    shutil.rmtree(FRAMES_DIR, ignore_errors=True)
    for p in AUDIO_DIR.glob("beat_*.mp3"):
        p.unlink(missing_ok=True)
    # keep wav for HeyGen audio upload option; actually drop to keep repo light
    wav.unlink(missing_ok=True)

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
