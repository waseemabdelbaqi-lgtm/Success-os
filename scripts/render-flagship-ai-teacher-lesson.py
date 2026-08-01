#!/usr/bin/env python3
"""
Flagship AI Teacher Lesson — photoreal mouth-morph talking head + synced board.

What makes this different:
- Same-identity mouth frames (closed / open / wide) blended by audio energy
  → visible lip motion matched to speech (no fake oval overlay)
- Premium Jordan Arabic female voice (edge-tts ar-JO-SanaNeural, carefully paced)
- Cinematic teacher stage + playful kid board (G1 count to 3)
- Stereo loud 48kHz AAC

Usage:
  npm run media:flagship-sara
  AI_TEACHER_ID=sara python3 scripts/render-flagship-ai-teacher-lesson.py
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
TEACHER_ID = os.environ.get("AI_TEACHER_ID", "sara").strip().lower()
FLAGSHIP = ROOT / "content" / "media" / "ai-teachers" / TEACHER_ID / "flagship"
BASE = ROOT / "content" / "media" / "flagship-ai-teacher"
AUDIO_DIR = BASE / "audio"
FRAMES_DIR = BASE / "frames"
PUBLIC_DIR = ROOT / "public" / "media" / "flagship-ai-teacher"
ARTIFACT = Path("/opt/cursor/artifacts")
OUTPUT = BASE / "flagship-ai-teacher-lesson.mp4"

WIDTH, HEIGHT = 1280, 720
FPS = 24
VOICE = os.environ.get("G1_TEACHER_VOICE", "ar-JO-SanaNeural")
NAME_AR = "المعلمة سارة"

# Premium cinematic + kid-bright accents
INK = (22, 28, 40)
CREAM = (255, 250, 240)
GOLD = (255, 200, 90)
TEAL = (20, 140, 145)
CORAL = (255, 95, 105)
SKY = (130, 210, 255)
BOARD = (18, 135, 140)
CHALK = (255, 255, 245)
YELLOW = (255, 230, 90)
PINK = (255, 140, 180)
BLUE = (120, 210, 255)

FONT_AR_B = "/usr/share/fonts/truetype/noto/NotoKufiArabic-Bold.ttf"
FONT_AR = "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf"
FONT_NUM = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if not os.path.exists(FONT_AR_B):
    FONT_AR_B = "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf"

BEATS = [
    {
        "id": "welcome",
        "mode": "talk",
        "say": "مرحبا أصدقائي. أنا المعلمة سارة، معلمتكم بالذكاء الاصطناعي. اليوم سنتعلم العد حتى ثلاثة معاً، بصوت واضح وشرح على السبورة.",
        "board": {
            "title": "العدّ حتى ثلاثة",
            "subtitle": "معلمة ذكاء اصطناعي · الصف 1",
            "cues": [
                {"at": 0.05, "type": "title"},
                {"at": 0.35, "type": "subtitle"},
                {"at": 0.55, "type": "stars", "n": 3},
                {"at": 0.80, "type": "banner", "text": "هيا نبدأ!"},
            ],
        },
    },
    {
        "id": "one",
        "mode": "gesture",
        "say": "انظر معي. هذا واحد. الرقم واحد يعني شيئاً واحداً فقط. أرسم تفاحة واحدة على السبورة.",
        "board": {
            "title": "العدد واحد",
            "subtitle": "1 = واحد",
            "cues": [
                {"at": 0.05, "type": "title"},
                {"at": 0.25, "type": "big_number", "n": 1, "word": "واحد"},
                {"at": 0.50, "type": "apples", "n": 1},
                {"at": 0.78, "type": "equation", "text": "1 = واحد"},
            ],
        },
    },
    {
        "id": "two",
        "mode": "talk",
        "say": "والآن اثنان. اثنان يعني شيئين معاً. نعدّ: واحد، اثنان. وأرسم تفاحتين ملونتين.",
        "board": {
            "title": "العدد اثنان",
            "subtitle": "2 = اثنان",
            "cues": [
                {"at": 0.05, "type": "title"},
                {"at": 0.22, "type": "big_number", "n": 2, "word": "اثنان"},
                {"at": 0.48, "type": "apples", "n": 2},
                {"at": 0.78, "type": "equation", "text": "2 = اثنان"},
            ],
        },
    },
    {
        "id": "three",
        "mode": "gesture",
        "say": "وأخيراً ثلاثة. ثلاثة أشياء معاً. عدّوا بصوت عالٍ: واحد، اثنان، ثلاثة!",
        "board": {
            "title": "العدد ثلاثة",
            "subtitle": "3 = ثلاثة",
            "cues": [
                {"at": 0.05, "type": "title"},
                {"at": 0.20, "type": "big_number", "n": 3, "word": "ثلاثة"},
                {"at": 0.45, "type": "apples", "n": 3},
                {"at": 0.78, "type": "equation", "text": "3 = ثلاثة"},
            ],
        },
    },
    {
        "id": "practice",
        "mode": "talk",
        "say": "هيا نتمرن. طابق الكمية مع الرقم: واحد، اثنان، ثلاثة. ممتاز! أنتم أبطال العدّ.",
        "board": {
            "title": "تمرين الأبطال",
            "subtitle": "طابق الكمية مع الرقم",
            "cues": [
                {"at": 0.08, "type": "title"},
                {"at": 0.28, "type": "practice_row", "n": 1},
                {"at": 0.50, "type": "practice_row", "n": 2},
                {"at": 0.72, "type": "practice_row", "n": 3},
                {"at": 0.90, "type": "banner", "text": "ممتاز!"},
            ],
        },
    },
    {
        "id": "bye",
        "mode": "talk",
        "say": "أحسنت يا بطل. تعلّمنا واحد، اثنان، ثلاثة. أنا فخورة فيك. إلى اللقاء في درسنا القادم مع معلمة الذكاء الاصطناعي.",
        "board": {
            "title": "أحسنت!",
            "subtitle": "أنهيت درس العدّ",
            "cues": [
                {"at": 0.05, "type": "title"},
                {"at": 0.30, "type": "summary"},
                {"at": 0.60, "type": "stars", "n": 3},
                {"at": 0.82, "type": "banner", "text": "إلى اللقاء"},
            ],
        },
    },
]


def font(path: str, size: int):
    if os.path.exists(path):
        return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def load_aligned_faces():
    """Load mouth frames and align to same crop size for clean blending."""
    closed = Image.open(FLAGSHIP / "mouth-closed.png").convert("RGBA")
    open_ = Image.open(FLAGSHIP / "mouth-open.png").convert("RGBA")
    wide = Image.open(FLAGSHIP / "mouth-wide.png").convert("RGBA")
    gesture = Image.open(FLAGSHIP / "gesture.png").convert("RGBA")
    # Common talking-head canvas
    size = (420, 520)
    closed = ImageOps.fit(closed, size, method=Image.Resampling.LANCZOS)
    open_ = ImageOps.fit(open_, size, method=Image.Resampling.LANCZOS)
    wide = ImageOps.fit(wide, size, method=Image.Resampling.LANCZOS)
    gesture = ImageOps.fit(gesture, (380, 500), method=Image.Resampling.LANCZOS)
    return {"closed": closed, "open": open_, "wide": wide, "gesture": gesture}


def blend_faces(faces: dict, mouth: float) -> Image.Image:
    """
    Morph closed → open → wide by speech energy.
    mouth in [0..1] from RMS.
    """
    m = max(0.0, min(1.0, mouth))
    # add light flutter for syllables
    closed, open_, wide = faces["closed"], faces["open"], faces["wide"]
    if m < 0.12:
        return closed.copy()
    if m < 0.55:
        # closed → open
        t = (m - 0.12) / 0.43
        return Image.blend(closed, open_, t)
    # open → wide
    t = (m - 0.55) / 0.45
    return Image.blend(open_, wide, min(1.0, t))


def draw_apple(d, cx, cy, scale=1.0, color=(230, 70, 70), bounce=0):
    s = scale
    cy = cy + bounce
    d.ellipse((cx - 30 * s, cy - 22 * s, cx + 30 * s, cy + 32 * s), fill=color, outline=(255, 255, 255), width=3)
    d.ellipse((cx - 10 * s, cy - 12 * s, cx + 2 * s, cy), fill=(255, 160, 160))
    d.line([(cx, cy - 22 * s), (cx + 4 * s, cy - 40 * s)], fill=(90, 60, 40), width=3)
    d.ellipse((cx + 2 * s, cy - 44 * s, cx + 20 * s, cy - 30 * s), fill=(80, 190, 90))


def active_cues(board, progress):
    return [c for c in board.get("cues", []) if progress >= float(c.get("at", 0))]


def classroom(t: float) -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), SKY)
    d = ImageDraw.Draw(img)
    for y in range(HEIGHT):
        u = y / HEIGHT
        col = (
            int(100 + 40 * u),
            int(185 + 40 * u),
            int(235 - 30 * u),
        )
        d.line([(0, y), (WIDTH, y)], fill=col)
    # soft vignette bands
    d.ellipse((-100, HEIGHT - 130, WIDTH + 100, HEIGHT + 180), fill=(70, 185, 110))
    d.ellipse((-60, HEIGHT - 95, WIDTH + 60, HEIGHT + 150), fill=(50, 155, 90))
    # sun
    sx, sy = 1200, 70
    for i in range(8):
        ang = t * 0.5 + i * math.pi / 4
        d.line([(sx, sy), (sx + int(40 * math.cos(ang)), sy + int(40 * math.sin(ang)))], fill=GOLD, width=4)
    d.ellipse((sx - 26, sy - 26, sx + 26, sy + 26), fill=GOLD)
    # brand
    d.rounded_rectangle((70, 10, WIDTH - 70, 58), radius=20, fill=(255, 255, 255))
    d.text((WIDTH // 2, 22), "SUCCESS OS · AI TEACHER", font=font(FONT_NUM, 13), fill=TEAL, anchor="mm")
    d.text((WIDTH // 2, 42), f"{NAME_AR} · معلمة بالذكاء الاصطناعي", font=font(FONT_AR_B, 18), fill=INK, anchor="mm")
    return img


def draw_board(img: Image.Image, board: dict, progress: float, t: float):
    d = ImageDraw.Draw(img)
    bx0, by0, bx1, by1 = 470, 78, WIDTH - 22, HEIGHT - 70
    d.rounded_rectangle((bx0 - 5, by0 - 5, bx1 + 5, by1 + 5), radius=28, fill=GOLD)
    d.rounded_rectangle((bx0, by0, bx1, by1), radius=24, fill=(255, 150, 70))
    d.rounded_rectangle((bx0 + 12, by0 + 12, bx1 - 12, by1 - 18), radius=20, fill=BOARD)

    cues = active_cues(board, progress)
    kinds = {c["type"] for c in cues}
    if "title" in kinds:
        d.rounded_rectangle((bx0 + 40, by0 + 22, bx1 - 40, by0 + 72), radius=18, fill=(255, 255, 255))
        d.text(((bx0 + bx1) // 2, by0 + 47), board.get("title", ""), font=font(FONT_AR_B, 28), fill=INK, anchor="mm")
    if "subtitle" in kinds:
        d.text(((bx0 + bx1) // 2, by0 + 92), board.get("subtitle", ""), font=font(FONT_AR_B, 18), fill=YELLOW, anchor="mm")

    for c in cues:
        k = c["type"]
        if k == "big_number":
            n = int(c["n"])
            word = c.get("word", "")
            bounce = int(-8 * abs(math.sin(t * 5)))
            cx = (bx0 + bx1) // 2 - 150
            cy = by0 + 245 + bounce
            colors = {1: YELLOW, 2: PINK, 3: BLUE}
            d.ellipse((cx - 82, cy - 82, cx + 82, cy + 82), fill=(255, 255, 255))
            d.ellipse((cx - 72, cy - 72, cx + 72, cy + 72), fill=colors[n])
            d.text((cx, cy - 4), str(n), font=font(FONT_NUM, 80), fill=INK, anchor="mm")
            d.rounded_rectangle((cx - 66, cy + 90, cx + 66, cy + 132), radius=14, fill=(255, 255, 255))
            d.text((cx, cy + 111), word, font=font(FONT_AR_B, 24), fill=INK, anchor="mm")
        elif k == "apples":
            n = int(c["n"])
            colors = [(255, 90, 90), (255, 160, 60), (80, 180, 255)]
            base_x = (bx0 + bx1) // 2 + 120
            cy = by0 + 245
            gap = 76
            x0 = base_x - (n - 1) * gap / 2
            for i in range(n):
                draw_apple(d, int(x0 + i * gap), cy, 1.12, colors[i % 3], int(-7 * abs(math.sin(t * 6 + i))))
            d.rounded_rectangle((base_x - 36, cy + 78, base_x + 36, cy + 114), radius=12, fill=YELLOW)
            d.text((base_x, cy + 96), f"× {n}", font=font(FONT_NUM, 26), fill=INK, anchor="mm")
        elif k == "equation":
            d.rounded_rectangle((bx0 + 70, by1 - 88, bx1 - 70, by1 - 40), radius=14, fill=YELLOW)
            d.text(((bx0 + bx1) // 2, by1 - 64), c.get("text", ""), font=font(FONT_NUM, 28), fill=INK, anchor="mm")
        elif k == "practice_row":
            n = int(c["n"])
            y = by0 + 150 + (n - 1) * 100
            colors = [YELLOW, PINK, BLUE]
            d.rounded_rectangle((bx0 + 28, y - 38, bx1 - 28, y + 38), radius=16, fill=(255, 255, 255))
            d.ellipse((bx0 + 45, y - 28, bx0 + 105, y + 28), fill=colors[n - 1])
            d.text((bx0 + 75, y), str(n), font=font(FONT_NUM, 32), fill=INK, anchor="mm")
            d.text((bx0 + 120, y), "=", font=font(FONT_NUM, 28), fill=INK, anchor="lm")
            for i in range(n):
                cx = bx0 + 190 + i * 68
                d.ellipse(
                    (cx - 26, y - 26, cx + 26, y + 26),
                    fill=colors[n - 1],
                    outline=(255, 255, 255),
                    width=3,
                )
            words = {1: "واحد", 2: "اثنان", 3: "ثلاثة"}
            d.text((bx1 - 45, y), words[n], font=font(FONT_AR_B, 22), fill=INK, anchor="rm")
        elif k == "stars":
            cx = (bx0 + bx1) // 2
            cy = by0 + 200
            for i in range(int(c.get("n", 3))):
                x = cx + (i - 1) * 85
                d.text((x, cy + int(-10 * abs(math.sin(t * 4 + i)))), "★", font=font(FONT_NUM, 52), fill=YELLOW, anchor="mm")
        elif k == "summary":
            lines = ["1 = واحد", "2 = اثنان", "3 = ثلاثة"]
            colors = [YELLOW, PINK, BLUE]
            for i, line in enumerate(lines):
                y = by0 + 160 + i * 72
                d.rounded_rectangle((bx0 + 55, y - 28, bx1 - 55, y + 28), radius=16, fill=colors[i])
                d.text(((bx0 + bx1) // 2, y), line, font=font(FONT_NUM, 28), fill=INK, anchor="mm")
        elif k == "banner":
            cx = (bx0 + bx1) // 2
            d.rounded_rectangle((cx - 140, by1 - 120, cx + 140, by1 - 55), radius=20, fill=CORAL)
            d.text((cx, by1 - 88), c.get("text", ""), font=font(FONT_AR_B, 28), fill=CREAM, anchor="mm")


def draw_teacher(img: Image.Image, face: Image.Image, mouth: float, t: float, caption: str, mode: str):
    d = ImageDraw.Draw(img)
    # cinematic stage
    d.rounded_rectangle((18, 72, 450, HEIGHT - 68), radius=28, fill=(255, 190, 80))
    d.rounded_rectangle((28, 82, 440, HEIGHT - 78), radius=24, fill=(18, 28, 42))
    # gold ring
    d.rounded_rectangle((48, 110, 420, 560), radius=22, fill=(30, 42, 58), outline=GOLD, width=3)

    sway = int(2 * math.sin(t * 1.3))
    px = 234 - face.width // 2 + sway
    py = 130 + int(1.5 * math.sin(t * 2.1))
    # soft glow
    glow = Image.new("RGBA", (face.width + 30, face.height + 30), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((0, 10, face.width + 30, face.height + 20), fill=(255, 200, 100, 35))
    img.paste(glow, (px - 15, py - 10), glow)

    teacher = face
    if mouth > 0.2:
        teacher = ImageEnhance.Brightness(face).enhance(1.0 + 0.02 * mouth)
    img.paste(teacher, (px, py), teacher)

    # AI badge
    d.rounded_rectangle((60, 95, 250, 125), radius=12, fill=CORAL)
    d.text((155, 110), "AI TEACHER", font=font(FONT_NUM, 14), fill=CREAM, anchor="mm")

    d.text((234, 575), NAME_AR, font=font(FONT_AR_B, 22), fill=CREAM, anchor="mm")
    d.text((234, 600), "صوت وصورة متزامنان", font=font(FONT_AR, 14), fill=GOLD, anchor="mm")

    # voice meter
    for i in range(6):
        bh = int(6 + mouth * 22 * (0.5 + 0.5 * abs(math.sin(t * 22 + i))))
        color = [CORAL, GOLD, BLUE, PINK, TEAL, YELLOW][i]
        x = 140 + i * 30
        d.rounded_rectangle((x, 640 - bh, x + 16, 640), radius=5, fill=color)

    if caption:
        short = caption if len(caption) <= 46 else caption[:44] + "…"
        d.rounded_rectangle((470, HEIGHT - 62, WIDTH - 22, HEIGHT - 22), radius=14, fill=(255, 255, 255))
        d.text(((470 + WIDTH - 22) // 2, HEIGHT - 42), short, font=font(FONT_AR_B, 16), fill=INK, anchor="mm")


def draw_progress(img, t, total, idx, count):
    d = ImageDraw.Draw(img)
    p = min(1.0, t / max(0.1, total))
    d.rounded_rectangle((24, HEIGHT - 14, WIDTH - 24, HEIGHT - 4), radius=6, fill=(255, 255, 255))
    d.rounded_rectangle((24, HEIGHT - 14, 24 + int((WIDTH - 48) * p), HEIGHT - 4), radius=6, fill=CORAL)


async def synth(text: str, path: Path):
    # Slightly slower for clarity — flagship pronunciation
    await edge_tts.Communicate(text, VOICE, rate="-8%", pitch="+2Hz").save(str(path))


def build_audio():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    gap = AudioSegment.silent(duration=380)
    full = AudioSegment.silent(duration=280)
    timeline = []
    cursor = 280
    print(f"Voice: {VOICE}")
    for i, beat in enumerate(BEATS, 1):
        mp3 = AUDIO_DIR / f"beat_{i:02d}.mp3"
        print(f"  TTS {i}: {beat['id']}")
        asyncio.run(synth(beat["say"], mp3))
        seg = AudioSegment.from_file(mp3).set_frame_rate(48000).set_channels(2)
        if seg.max_dBFS != float("-inf"):
            seg = seg.apply_gain(-seg.dBFS - 14.0)
            if seg.max_dBFS > -1.0:
                seg = seg.apply_gain(-1.0 - seg.max_dBFS)
        start, end = cursor / 1000.0, (cursor + len(seg)) / 1000.0
        timeline.append({**beat, "start": start, "end": end, "index": i})
        full += seg + gap
        cursor += len(seg) + len(gap)
    full = full.set_frame_rate(48000).set_channels(2)
    wav = AUDIO_DIR / "full.wav"
    mp3 = AUDIO_DIR / "full.mp3"
    full.export(wav, format="wav")
    full.export(mp3, format="mp3", bitrate="192k")
    print(f"Audio {len(full)/1000:.1f}s dBFS={full.dBFS:.1f}")
    return timeline, wav, mp3, len(full) / 1000.0


def load_rms(wav: Path) -> np.ndarray:
    with wave.open(str(wav), "rb") as w:
        n, rate, frames = w.getnchannels(), w.getframerate(), w.getnframes()
        data = np.frombuffer(w.readframes(frames), dtype=np.int16).astype(np.float32)
    if n > 1:
        data = data.reshape(-1, n).mean(axis=1)
    spf = max(1, int(rate / FPS))
    pad = (-len(data)) % spf
    if pad:
        data = np.pad(data, (0, pad))
    shaped = data.reshape(-1, spf)
    rms = np.sqrt(np.mean(shaped**2, axis=1))
    if rms.max() > 0:
        rms = rms / rms.max()
    # smooth
    k = np.ones(3) / 3
    rms = np.convolve(np.pad(rms, (1, 1), mode="edge"), k, mode="valid")[: len(rms)]
    # boost speech contrast for clearer mouth morph
    rms = np.clip(rms * 1.25, 0, 1)
    return rms


def render(timeline, total, rms, faces):
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)
    FRAMES_DIR.mkdir(parents=True)
    nframes = int(math.ceil(total * FPS))
    print(f"Rendering {nframes} flagship frames…")
    for fi in range(nframes):
        t = fi / FPS
        beat = timeline[-1]
        for b in timeline:
            if b["start"] <= t <= b["end"] + 0.3:
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
            mouth = max(mouth, 0.18)
            # syllable flutter
            mouth = min(1.0, mouth * 0.75 + 0.25 * abs(math.sin(t * 28)))
        else:
            mouth *= 0.08

        if beat.get("mode") == "gesture" and 0.25 < progress < 0.75 and mouth < 0.35:
            face = faces["gesture"]
        else:
            face = blend_faces(faces, mouth)

        frame = classroom(t)
        draw_board(frame, beat["board"], progress, t)
        draw_teacher(frame, face, mouth, t, beat["say"] if speaking else "", beat.get("mode", "talk"))
        draw_progress(frame, t, total, beat["index"], len(timeline))
        frame.save(FRAMES_DIR / f"frame_{fi:06d}.jpg", quality=90)
        if fi % 120 == 0:
            print(f"  {fi}/{nframes}")
    print("Frames done")


def compose(audio: Path):
    print("Composing flagship MP4…")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", str(FRAMES_DIR / "frame_%06d.jpg"),
        "-i", str(audio),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
        "-shortest", "-movflags", "+faststart",
        str(OUTPUT),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-1200:])
        raise SystemExit(1)
    print(f"Video: {OUTPUT} ({OUTPUT.stat().st_size} bytes)")


def main():
    print("=== FLAGSHIP AI TEACHER LESSON ===")
    print(f"Teacher={TEACHER_ID} voice={VOICE}")
    for req in ("mouth-closed.png", "mouth-open.png", "mouth-wide.png", "gesture.png"):
        if not (FLAGSHIP / req).exists():
            raise SystemExit(f"Missing flagship asset: {FLAGSHIP / req}")

    BASE.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT.mkdir(parents=True, exist_ok=True)
    (ARTIFACT / "ai-teachers" / "flagship").mkdir(parents=True, exist_ok=True)

    faces = load_aligned_faces()
    # preview morph strip
    strip = Image.new("RGB", (420 * 3, 520), (20, 30, 45))
    for i, m in enumerate([0.0, 0.45, 0.95]):
        strip.paste(blend_faces(faces, m).convert("RGB"), (i * 420, 0))
    strip.save(ARTIFACT / "ai-teachers" / "flagship" / "mouth-morph-strip.jpg", quality=92)

    timeline, wav, mp3, total = build_audio()
    (BASE / "timeline.json").write_text(
        json.dumps(
            [{"id": b["id"], "start": b["start"], "end": b["end"], "say": b["say"]} for b in timeline],
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    rms = load_rms(wav)
    render(timeline, total, rms, faces)
    compose(mp3)

    mid = FRAMES_DIR / f"frame_{int(total * FPS * 0.3):06d}.jpg"
    poster = mid if mid.exists() else next(FRAMES_DIR.glob("frame_*.jpg"))
    shutil.copy2(poster, BASE / "poster.jpg")
    for dest in (PUBLIC_DIR, ARTIFACT, ARTIFACT / "ai-teachers" / "flagship"):
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copy2(OUTPUT, dest / OUTPUT.name)
        shutil.copy2(BASE / "poster.jpg", dest / "flagship-ai-teacher-poster.jpg")

    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(OUTPUT),
            "-vf", "fps=12,scale=480:-1:flags=lanczos",
            "-t", "6", "-an",
            str(ARTIFACT / "flagship-ai-teacher-preview.gif"),
        ],
        check=True,
        capture_output=True,
    )

    shutil.rmtree(FRAMES_DIR, ignore_errors=True)
    for p in AUDIO_DIR.glob("beat_*.mp3"):
        p.unlink(missing_ok=True)
    wav.unlink(missing_ok=True)
    mp3.unlink(missing_ok=True)

    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", str(OUTPUT)],
        capture_output=True,
        text=True,
        check=True,
    )
    info = json.loads(probe.stdout)
    print("=== FLAGSHIP OK ===")
    print(f"Duration: {float(info['format']['duration']):.1f}s")
    for s in info["streams"]:
        if s["codec_type"] == "video":
            print(f"Video: {s['width']}x{s['height']}")
        if s["codec_type"] == "audio":
            print(f"Audio: {s['codec_name']} {s.get('channels')}ch {s.get('sample_rate')}Hz")


if __name__ == "__main__":
    main()
