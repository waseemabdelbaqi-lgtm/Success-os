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
ILLUSTRATED_POSES = ROOT / "content" / "media" / "jordan-g1-math-reel" / "poses"
AI_TEACHERS_ROOT = ROOT / "content" / "media" / "ai-teachers"
CATALOG_PATH = AI_TEACHERS_ROOT / "catalog.json"

WIDTH, HEIGHT = 1280, 720
FPS = 24

# AI teacher pack: sara | omar (photoreal). Fallback: illustrated poses.
TEACHER_ID = os.environ.get("AI_TEACHER_ID", "sara").strip().lower()


def load_teacher_profile(teacher_id: str) -> dict:
    defaults = {
        "sara": {
            "id": "sara",
            "name_ar": "المعلمة سارة",
            "name_en": "Teacher Sara",
            "gender": "female",
            "voice": "ar-JO-SanaNeural",
            "title_line": "صف الأبطال الصغار",
        },
        "omar": {
            "id": "omar",
            "name_ar": "المعلم عمر",
            "name_en": "Teacher Omar",
            "gender": "male",
            "voice": "ar-JO-TaimNeural",
            "title_line": "صف الأبطال الصغار",
        },
    }
    profile = dict(defaults.get(teacher_id, defaults["sara"]))
    if CATALOG_PATH.exists():
        try:
            data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
            for t in data.get("teachers", []):
                if t.get("id") == teacher_id:
                    dn = t.get("displayName") or {}
                    profile["name_ar"] = dn.get("ar") or profile["name_ar"]
                    profile["name_en"] = dn.get("en") or profile["name_en"]
                    profile["gender"] = t.get("gender") or profile["gender"]
                    voice = (t.get("voice") or {}).get("edgeTts")
                    if voice:
                        profile["voice"] = voice
                    break
        except Exception:
            pass
    profile["poses_dir"] = AI_TEACHERS_ROOT / teacher_id / "poses"
    profile["use_ai_pack"] = (profile["poses_dir"] / "talk.png").exists()
    return profile


TEACHER = load_teacher_profile(TEACHER_ID)
VOICE = os.environ.get("G1_TEACHER_VOICE", TEACHER["voice"])
POSES = TEACHER["poses_dir"] if TEACHER["use_ai_pack"] else ILLUSTRATED_POSES

# Sunny Story Classroom — playful kid palette (no purple / no beige-corporate)
SKY_TOP = (120, 210, 255)
SKY_BOT = (190, 245, 220)
SUN = (255, 210, 70)
SUN_RAY = (255, 230, 140)
GRASS = (90, 200, 120)
GRASS_DARK = (55, 160, 95)
WOOD = (255, 170, 90)
BOARD = (20, 150, 150)          # bright teal board
BOARD_EDGE = (255, 140, 70)     # orange frame
BOARD_INNER = (12, 125, 128)
CHALK = (255, 255, 245)
CHALK_YELLOW = (255, 236, 80)
CHALK_PINK = (255, 130, 180)
CHALK_BLUE = (120, 220, 255)
CHALK_ORANGE = (255, 170, 70)
INK = (35, 45, 70)
CREAM = (255, 252, 240)
ACCENT = (255, 90, 100)
BUBBLE = (255, 255, 255)

FONT_AR_B = "/usr/share/fonts/truetype/noto/NotoKufiArabic-Bold.ttf"
FONT_AR = "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf"
FONT_NUM = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
# fallback if Kufi missing
if not os.path.exists(FONT_AR_B):
    FONT_AR_B = "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf"

# Each beat: spoken Arabic + board actions that reveal while that beat plays.
# Board actions are fractions [0..1] within the beat's audio window.
def build_beats(teacher_name_ar: str) -> list[dict]:
    return [
    {
        "id": "welcome",
        "pose": "talk",
        "say": f"مرحبا أصدقائي! أنا {teacher_name_ar}. اليوم نحكي قصة العد حتى ثلاثة، على السبورة الملونة.",
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
        "say": (
            "أحسنت يا بطل! تعلّمنا واحد، اثنان، ثلاثة. أنا فخور فيك. إلى اللقاء في الدرس القادم."
            if TEACHER.get("gender") == "male"
            else "أحسنت يا بطل! تعلّمنا واحد، اثنان، ثلاثة. أنا فخورة فيك. إلى اللقاء في الدرس القادم."
        ),
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


BEATS = build_beats(TEACHER["name_ar"])


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
    return Image.fromarray(arr.astype(np.uint8))


def load_pose(name: str, height: int = 440) -> Image.Image:
    """Load pose from AI teacher pack (talk.png) or illustrated fallback (teacher-talk.png)."""
    if TEACHER.get("use_ai_pack"):
        path = POSES / f"{name}.png"
        if not path.exists():
            path = POSES / "talk.png"
        img = Image.open(path).convert("RGBA")
        # Fit waist-up into stage height without sage cutout (photoreal classroom bg)
        img = ImageOps.fit(img, (int(height * 0.78), height), method=Image.Resampling.LANCZOS)
        return img

    path = ILLUSTRATED_POSES / f"teacher-{name}.png"
    if not path.exists():
        path = ILLUSTRATED_POSES / "teacher-talk.png"
    img = cutout_sage_bg(Image.open(path).convert("RGBA"))
    ratio = height / img.height
    img = img.resize((max(1, int(img.width * ratio)), height), Image.Resampling.LANCZOS)
    return img


# Mouth center on illustrated 1024×1536 talk pose (calibrated on lip pixels)
MOUTH_SRC = (540, 506)


def apply_lip_sync(pose_img: Image.Image, mouth: float, t: float) -> Image.Image:
    """Lip motion for illustrated avatar; photoreal AI packs use pose-swap only."""
    if TEACHER.get("use_ai_pack"):
        # Subtle speaking energy without warping photoreal face
        if mouth > 0.15:
            return ImageEnhance.Brightness(pose_img).enhance(1.0 + 0.03 * min(1.0, mouth))
        return pose_img

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


def _cloud(d: ImageDraw.ImageDraw, x: int, y: int, s: float = 1.0):
    cols = [(255, 255, 255), (245, 252, 255)]
    for i, (dx, dy, r) in enumerate([(-18, 4, 22), (0, 0, 28), (20, 6, 20), (8, 10, 18)]):
        d.ellipse(
            (x + dx * s - r * s, y + dy * s - r * s, x + dx * s + r * s, y + dy * s + r * s),
            fill=cols[i % 2],
        )


def _balloon(d: ImageDraw.ImageDraw, x: int, y: int, color, t: float, phase: float = 0.0):
    bob = int(6 * math.sin(t * 2.2 + phase))
    yy = y + bob
    d.ellipse((x - 16, yy - 22, x + 16, yy + 18), fill=color, outline=(255, 255, 255), width=2)
    d.polygon([(x - 4, yy + 16), (x + 4, yy + 16), (x, yy + 26)], fill=color)
    d.line([(x, yy + 26), (x, yy + 55)], fill=(90, 90, 110), width=2)


def classroom_base(t: float = 0.0) -> Image.Image:
    """Playful sunny storybook classroom — one lively composition for kids."""
    img = Image.new("RGB", (WIDTH, HEIGHT), SKY_TOP)
    d = ImageDraw.Draw(img)
    for y in range(HEIGHT):
        u = y / HEIGHT
        col = (
            int(SKY_TOP[0] + (SKY_BOT[0] - SKY_TOP[0]) * u),
            int(SKY_TOP[1] + (SKY_BOT[1] - SKY_TOP[1]) * u),
            int(SKY_TOP[2] + (SKY_BOT[2] - SKY_TOP[2]) * u),
        )
        d.line([(0, y), (WIDTH, y)], fill=col)

    # sun with rotating soft rays
    sx, sy = 1180, 78
    for i in range(10):
        ang = t * 0.6 + i * (math.pi / 5)
        x2 = sx + int(48 * math.cos(ang))
        y2 = sy + int(48 * math.sin(ang))
        d.line([(sx, sy), (x2, y2)], fill=SUN_RAY, width=5)
    d.ellipse((sx - 28, sy - 28, sx + 28, sy + 28), fill=SUN, outline=(255, 245, 200), width=3)

    # drifting clouds
    _cloud(d, 180 + int(10 * math.sin(t * 0.4)), 70, 1.0)
    _cloud(d, 520 + int(8 * math.cos(t * 0.35)), 50, 0.85)
    _cloud(d, 900 + int(12 * math.sin(t * 0.5 + 1)), 95, 1.1)

    # grass hill floor
    d.ellipse((-80, HEIGHT - 120, WIDTH + 80, HEIGHT + 160), fill=GRASS)
    d.ellipse((-40, HEIGHT - 90, WIDTH + 40, HEIGHT + 140), fill=GRASS_DARK)
    # flower dots on grass
    rng = np.random.default_rng(11)
    for i in range(18):
        fx = int(rng.integers(30, WIDTH - 30))
        fy = int(rng.integers(HEIGHT - 55, HEIGHT - 18))
        fc = [(255, 120, 140), (255, 220, 80), (120, 200, 255), (255, 160, 80)][i % 4]
        d.ellipse((fx - 5, fy - 5, fx + 5, fy + 5), fill=fc)

    # floating balloons (motion)
    _balloon(d, 60, 160, ACCENT, t, 0.2)
    _balloon(d, 120, 210, CHALK_BLUE, t, 1.1)
    _balloon(d, 1240, 200, CHALK_PINK, t, 2.0)

    # colorful bunting / pennants under brand
    flags = [ACCENT, CHALK_YELLOW, CHALK_BLUE, CHALK_PINK, CHALK_ORANGE, GRASS]
    for i, fc in enumerate(flags * 4):
        x0 = 40 + i * 52
        if x0 > WIDTH - 60:
            break
        peak = 78 + int(3 * math.sin(t * 3 + i))
        d.polygon([(x0, 62), (x0 + 40, 62), (x0 + 20, peak + 28)], fill=fc)

    # brand ribbon — kid story title, brand as hero signal
    d.rounded_rectangle((90, 8, WIDTH - 90, 58), radius=22, fill=BUBBLE)
    d.rounded_rectangle((96, 12, WIDTH - 96, 54), radius=18, fill=(255, 248, 220))
    d.text((WIDTH // 2, 24), "SUCCESS OS", font=font(FONT_NUM, 14), fill=BOARD_INNER, anchor="mm")
    d.text(
        (WIDTH // 2, 42),
        f"مع {TEACHER['name_ar']} · هيا نعدّ حتى ثلاثة!",
        font=font(FONT_AR_B, 20),
        fill=INK,
        anchor="mm",
    )
    return img


def draw_apple(d: ImageDraw.ImageDraw, cx: int, cy: int, scale: float = 1.0, color=(230, 70, 70), bounce: float = 0.0):
    s = scale
    cy = int(cy + bounce)
    d.ellipse(
        (cx - 32 * s, cy - 24 * s, cx + 32 * s, cy + 34 * s),
        fill=color,
        outline=(255, 255, 255),
        width=3,
    )
    d.ellipse((cx - 12 * s, cy - 14 * s, cx + 2 * s, cy), fill=(255, 170, 170))
    d.line([(cx, cy - 24 * s), (cx + 5 * s, cy - 42 * s)], fill=(100, 70, 40), width=3)
    d.ellipse((cx + 2 * s, cy - 46 * s, cx + 22 * s, cy - 32 * s), fill=(90, 200, 90))


def draw_circle_token(d: ImageDraw.ImageDraw, cx: int, cy: int, color, bounce: float = 0.0):
    cy = int(cy + bounce)
    d.ellipse((cx - 30, cy - 30, cx + 30, cy + 30), fill=color, outline=(255, 255, 255), width=4)
    d.ellipse((cx - 12, cy - 16, cx - 2, cy - 6), fill=(255, 255, 255))


def draw_star(d: ImageDraw.ImageDraw, cx: int, cy: int, r: int, fill, rot: float = 0.0):
    pts = []
    for i in range(10):
        ang = rot + i * math.pi / 5 - math.pi / 2
        rad = r if i % 2 == 0 else r * 0.45
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    d.polygon(pts, fill=fill)


def active_cues(board: dict, progress: float) -> list[dict]:
    return [c for c in board.get("cues", []) if progress >= float(c.get("at", 0))]


def draw_board(img: Image.Image, board: dict, progress: float, mouth: float, t: float = 0.0):
    d = ImageDraw.Draw(img)
    # playful teal story-board with chunky orange frame
    bx0, by0, bx1, by1 = 420, 88, WIDTH - 24, HEIGHT - 78
    d.rounded_rectangle((bx0 - 6, by0 - 6, bx1 + 6, by1 + 6), radius=30, fill=(255, 220, 120))
    d.rounded_rectangle((bx0, by0, bx1, by1), radius=26, fill=BOARD_EDGE)
    d.rounded_rectangle((bx0 + 12, by0 + 12, bx1 - 12, by1 - 22), radius=20, fill=BOARD)
    # doodle dots on board edge
    for i, col in enumerate([CHALK_YELLOW, CHALK_PINK, CHALK_BLUE, ACCENT]):
        d.ellipse((bx0 + 30 + i * 28, by1 - 16, bx0 + 44 + i * 28, by1 - 2), fill=col)

    cues = active_cues(board, progress)
    kinds = {c["type"] for c in cues}

    if "title" in kinds:
        # title bubble
        d.rounded_rectangle(
            (bx0 + 50, by0 + 24, bx1 - 50, by0 + 78),
            radius=20,
            fill=(255, 255, 255),
        )
        d.text(
            ((bx0 + bx1) // 2, by0 + 51),
            board.get("title", ""),
            font=font(FONT_AR_B, 32),
            fill=INK,
            anchor="mm",
        )
    if "subtitle" in kinds:
        d.text(
            ((bx0 + bx1) // 2, by0 + 98),
            board.get("subtitle", ""),
            font=font(FONT_AR_B, 20),
            fill=CHALK_YELLOW,
            anchor="mm",
        )

    # chalk stick wiggle while speaking
    if mouth > 0.12:
        wx = bx1 - 55 + int(3 * math.sin(t * 16))
        d.rounded_rectangle((wx, by0 + 28, wx + 14, by0 + 70), radius=4, fill=CHALK_YELLOW)

    for c in cues:
        kind = c["type"]
        if kind == "big_number":
            n = int(c["n"])
            word = c.get("word", "")
            bounce = int(-10 * abs(math.sin(t * 5)))
            cx = (bx0 + bx1) // 2 - 170
            cy = by0 + 250 + bounce
            colors = {1: CHALK_YELLOW, 2: CHALK_PINK, 3: CHALK_BLUE}
            # giant candy number
            d.ellipse((cx - 88, cy - 88, cx + 88, cy + 88), fill=(255, 255, 255))
            d.ellipse((cx - 78, cy - 78, cx + 78, cy + 78), fill=colors.get(n, CHALK_YELLOW))
            d.text((cx, cy - 6), str(n), font=font(FONT_NUM, 86), fill=INK, anchor="mm")
            d.rounded_rectangle(
                (cx - 70, cy + 95, cx + 70, cy + 140),
                radius=16,
                fill=(255, 255, 255),
            )
            d.text((cx, cy + 118), word, font=font(FONT_AR_B, 26), fill=INK, anchor="mm")

        elif kind == "apples":
            n = int(c["n"])
            colors = [(255, 90, 90), (255, 160, 60), (80, 190, 255)]
            base_x = (bx0 + bx1) // 2 + 110
            cy = by0 + 250
            gap = 78
            total = (n - 1) * gap
            x0 = base_x - total / 2
            for i in range(n):
                bounce = int(-8 * abs(math.sin(t * 6 + i)))
                draw_apple(d, int(x0 + i * gap), cy, scale=1.15, color=colors[i % len(colors)], bounce=bounce)
            d.rounded_rectangle(
                (base_x - 40, cy + 78, base_x + 40, cy + 118),
                radius=14,
                fill=CHALK_YELLOW,
            )
            d.text((base_x, cy + 98), f"× {n}", font=font(FONT_NUM, 28), fill=INK, anchor="mm")

        elif kind == "example":
            d.rounded_rectangle(
                (bx0 + 36, by1 - 155, bx1 - 36, by1 - 100),
                radius=18,
                fill=(255, 255, 255),
            )
            d.text(
                ((bx0 + bx1) // 2, by1 - 128),
                c.get("text", ""),
                font=font(FONT_AR_B, 24),
                fill=ACCENT,
                anchor="mm",
            )

        elif kind == "equation":
            d.rounded_rectangle(
                (bx0 + 70, by1 - 92, bx1 - 70, by1 - 42),
                radius=16,
                fill=CHALK_YELLOW,
            )
            d.text(
                ((bx0 + bx1) // 2, by1 - 67),
                c.get("text", ""),
                font=font(FONT_NUM, 30),
                fill=INK,
                anchor="mm",
            )

        elif kind == "practice_row":
            n = int(c["n"])
            row_index = n - 1
            y = by0 + 155 + row_index * 105
            colors = [CHALK_YELLOW, CHALK_PINK, CHALK_BLUE]
            # candy row card
            d.rounded_rectangle(
                (bx0 + 30, y - 42, bx1 - 30, y + 42),
                radius=18,
                fill=(255, 255, 255),
            )
            d.ellipse((bx0 + 48, y - 32, bx0 + 112, y + 32), fill=colors[row_index])
            d.text((bx0 + 80, y), f"{n}", font=font(FONT_NUM, 36), fill=INK, anchor="mm")
            d.text((bx0 + 130, y), "=", font=font(FONT_NUM, 30), fill=INK, anchor="lm")
            for i in range(n):
                bounce = int(-5 * abs(math.sin(t * 7 + i + n)))
                draw_circle_token(d, bx0 + 200 + i * 72, y, colors[row_index], bounce=bounce)
            words = {1: "واحد", 2: "اثنان", 3: "ثلاثة"}
            d.text((bx1 - 50, y), words[n], font=font(FONT_AR_B, 24), fill=INK, anchor="rm")

        elif kind == "stars":
            n = int(c.get("n", 3))
            cx = (bx0 + bx1) // 2
            cy = by0 + 210
            for i in range(n):
                x = cx + (i - (n - 1) / 2) * 90
                bounce = int(-12 * abs(math.sin(t * 4 + i)))
                draw_star(d, int(x), cy + bounce, 34, CHALK_YELLOW, rot=t * 1.5 + i)

        elif kind == "summary":
            lines = ["1 = واحد", "2 = اثنان", "3 = ثلاثة"]
            colors = [CHALK_YELLOW, CHALK_PINK, CHALK_BLUE]
            for i, line in enumerate(lines):
                y = by0 + 165 + i * 75
                d.rounded_rectangle(
                    (bx0 + 55, y - 30, bx1 - 55, y + 30),
                    radius=18,
                    fill=colors[i],
                )
                d.text(((bx0 + bx1) // 2, y), line, font=font(FONT_NUM, 30), fill=INK, anchor="mm")

        elif kind == "banner":
            pulse = 1.0 + 0.04 * math.sin(t * 8)
            bw = int(280 * pulse)
            cx = (bx0 + bx1) // 2
            d.rounded_rectangle(
                (cx - bw // 2, by1 - 125, cx + bw // 2, by1 - 58),
                radius=22,
                fill=ACCENT,
            )
            d.text(
                (cx, by1 - 92),
                c.get("text", ""),
                font=font(FONT_AR_B, 30),
                fill=CREAM,
                anchor="mm",
            )


def draw_caption(img: Image.Image, text: str):
    d = ImageDraw.Draw(img)
    short = text if len(text) <= 48 else text[:46] + "…"
    box = (430, HEIGHT - 72, WIDTH - 24, HEIGHT - 28)
    d.rounded_rectangle(box, radius=18, fill=(255, 255, 255))
    d.rounded_rectangle((box[0] + 4, box[1] + 4, box[2] - 4, box[3] - 4), radius=14, fill=(255, 245, 210))
    d.text(
        ((box[0] + box[2]) // 2, (box[1] + box[3]) // 2),
        short,
        font=font(FONT_AR_B, 17),
        fill=INK,
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
    # storybook stage — sunny window, not a white office card
    d.rounded_rectangle((18, 78, 400, HEIGHT - 78), radius=28, fill=(255, 200, 90))
    d.rounded_rectangle((28, 88, 390, HEIGHT - 88), radius=24, fill=(255, 250, 235))
    # arched header
    d.ellipse((40, 70, 378, 170), fill=(255, 140, 150))
    d.rounded_rectangle((40, 110, 378, 168), radius=8, fill=(255, 140, 150))
    d.text((209, 125), TEACHER["name_ar"], font=font(FONT_AR_B, 24), fill=CREAM, anchor="mm")
    d.text((209, 150), TEACHER.get("title_line", "صف الأبطال الصغار"), font=font(FONT_AR, 14), fill=(255, 230, 230), anchor="mm")

    sway = int(2 * math.sin(t * 1.4))
    px = 209 - pose_img.width // 2 + sway
    py = 175

    shadow = Image.new("RGBA", (pose_img.width, 22), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((8, 0, pose_img.width - 8, 20), fill=(0, 0, 0, 30))
    img.paste(shadow, (px, py + pose_img.height - 16), shadow)

    teacher = apply_lip_sync(pose_img, mouth, t)
    img.paste(teacher, (px, py), teacher)

    # playful voice bubbles instead of clinical bars
    bar_y = HEIGHT - 108
    d.text(
        (209, bar_y - 14),
        "تتكلم الآن!" if mouth > 0.12 else "…",
        font=font(FONT_AR_B, 15),
        fill=ACCENT if mouth > 0.12 else (150, 140, 130),
        anchor="mm",
    )
    for i in range(5):
        bh = int(8 + mouth * 24 * (0.5 + 0.5 * abs(math.sin(t * 20 + i))))
        color = [ACCENT, CHALK_YELLOW, CHALK_BLUE, CHALK_PINK, GRASS][i]
        x = 145 + i * 28
        d.rounded_rectangle((x, bar_y + 26 - bh, x + 16, bar_y + 26), radius=6, fill=color)

    if caption:
        draw_caption(img, caption)


def draw_progress(img: Image.Image, t: float, total: float, beat_idx: int, beat_count: int):
    d = ImageDraw.Draw(img)
    p = min(1.0, t / max(0.1, total))
    # candy progress track
    d.rounded_rectangle((24, HEIGHT - 22, WIDTH - 24, HEIGHT - 8), radius=8, fill=(255, 255, 255))
    d.rounded_rectangle((24, HEIGHT - 22, 24 + int((WIDTH - 48) * p), HEIGHT - 8), radius=8, fill=ACCENT)
    # stepping stones
    for i in range(beat_count):
        x = 40 + i * ((WIDTH - 80) / max(1, beat_count - 1))
        fill = CHALK_YELLOW if i < beat_idx else (230, 230, 230)
        if i + 1 == beat_idx:
            fill = ACCENT
        d.ellipse((x - 7, HEIGHT - 28, x + 7, HEIGHT - 14), fill=fill, outline=(255, 255, 255), width=2)


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

    poses = {
        "talk": load_pose("talk"),
        "point": load_pose("point"),
        "write": load_pose("write"),
        "idle": load_pose("idle"),
    }

    total_frames = int(math.ceil(total_duration * FPS))
    print(f"Rendering {total_frames} frames… teacher={TEACHER_ID} ai_pack={TEACHER.get('use_ai_pack')}")
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
            mouth = max(mouth, 0.22)
        else:
            mouth *= 0.15

        wanted = beat.get("pose", "talk")
        pose_name = "talk"
        if wanted == "write" and 0.15 < progress < 0.85:
            pose_name = "write"
        elif wanted == "point" and 0.30 < progress < 0.75:
            pose_name = "point"
        elif not speaking:
            pose_name = "idle"
        pose_img = poses.get(pose_name) or poses["talk"]

        frame = classroom_base(t)
        draw_board(frame, beat["board"], progress, mouth, t)
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
    print(f"Teacher: {TEACHER_ID} · {TEACHER['name_ar']} · voice={VOICE} · ai_pack={TEACHER.get('use_ai_pack')}")
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
