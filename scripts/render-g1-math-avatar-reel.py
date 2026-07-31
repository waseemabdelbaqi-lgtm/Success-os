#!/usr/bin/env python3
"""
Render a neat Instagram-reel-style Grade 1 Math video:
Jordan National Curriculum — Lesson «العد حتى ثلاثة»
Teacher = tidy avatar, vertical 9:16, original Success OS content.
"""
from __future__ import annotations

import math
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from gtts import gTTS

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "content" / "media" / "jordan-g1-math-reel"
PUBLIC_DIR = ROOT / "public" / "media" / "jordan-g1-math-reel"
ARTIFACT_DIR = Path("/opt/cursor/artifacts/g1-math-reel")

W, H = 1080, 1920
FPS = 30

BG_PATH = OUT_DIR / "g1-math-reel-bg.png"
AVATAR_PATH = OUT_DIR / "g1-math-teacher-avatar.png"

FONT_AR = "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf"
FONT_AR_REG = "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf"
FONT_LATIN = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Soft educational palette (avoid purple/glow clichés)
CREAM = (248, 244, 236, 255)
INK = (34, 42, 48, 255)
SAGE = (74, 112, 98, 255)
TERRACOTTA = (196, 104, 72, 255)  # accent only — not cream+serif combo page
GOLD = (214, 168, 78, 255)
WHITE = (255, 255, 255, 255)
SOFT_CARD = (255, 255, 255, 220)


def ar(text: str) -> str:
    # Pillow/HarfBuzz shapes Arabic correctly for Noto fonts — do not reverse via bidi.
    return str(text)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def load_bg() -> Image.Image:
    img = Image.open(BG_PATH).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    # Soft dim overlay for text readability
    overlay = Image.new("RGBA", (W, H), (20, 28, 26, 70))
    return Image.alpha_composite(img, overlay)


def circular_avatar(size: int = 420) -> Image.Image:
    src = Image.open(AVATAR_PATH).convert("RGBA")
    src = src.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((0, 0, size - 1, size - 1), fill=255)
    # Soft ring
    out = Image.new("RGBA", (size + 24, size + 24), (0, 0, 0, 0))
    ring = ImageDraw.Draw(out)
    ring.ellipse((0, 0, size + 23, size + 23), fill=(255, 255, 255, 230))
    ring.ellipse((6, 6, size + 17, size + 17), fill=(74, 112, 98, 255))
    out.paste(src, (12, 12), mask)
    return out


def rounded_rect(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def draw_dots(draw, cx, cy, count, color, r=34, gap=110):
    total_w = (count - 1) * gap
    x0 = cx - total_w / 2
    for i in range(count):
        x = x0 + i * gap
        draw.ellipse((x - r, cy - r, x + r, cy + r), fill=color)
        # inner highlight
        draw.ellipse((x - r + 10, cy - r + 8, x - 4, cy - 4), fill=(255, 255, 255, 90))


def make_scene(cfg: dict) -> Image.Image:
    base = load_bg()
    draw = ImageDraw.Draw(base, "RGBA")

    # Top brand bar — neat, not overpowering
    rounded_rect(draw, (70, 70, W - 70, 210), 36, (255, 255, 255, 210))
    draw.text((W // 2, 118), ar("SUCCESS OS"), font=font(FONT_LATIN, 34), fill=SAGE, anchor="mm")
    draw.text((W // 2, 168), ar(cfg["eyebrow"]), font=font(FONT_AR_REG, 36), fill=INK, anchor="mm")

    # Main card
    rounded_rect(draw, (70, 250, W - 70, 1180), 48, SOFT_CARD)

    # Headline
    draw.text(
        (W // 2, 340),
        ar(cfg["title"]),
        font=font(FONT_AR, 64),
        fill=INK,
        anchor="mm",
    )

    # Big numeral / visual
    if cfg.get("numeral"):
        draw.text(
            (W // 2, 560),
            str(cfg["numeral"]),
            font=font(FONT_LATIN, 280),
            fill=TERRACOTTA if cfg["numeral"] == 3 else SAGE,
            anchor="mm",
        )
        draw_dots(draw, W // 2, 820, cfg["numeral"], GOLD if cfg["numeral"] > 1 else SAGE)
        draw.text(
            (W // 2, 960),
            ar(cfg["word"]),
            font=font(FONT_AR, 72),
            fill=INK,
            anchor="mm",
        )
    else:
        # Hook / outro body
        for i, line in enumerate(cfg.get("lines", [])):
            draw.text(
                (W // 2, 520 + i * 90),
                ar(line),
                font=font(FONT_AR, 52),
                fill=INK,
                anchor="mm",
            )

    # Caption pill
    if cfg.get("caption"):
        rounded_rect(draw, (120, 1040, W - 120, 1140), 28, (74, 112, 98, 230))
        draw.text(
            (W // 2, 1090),
            ar(cfg["caption"]),
            font=font(FONT_AR, 40),
            fill=WHITE,
            anchor="mm",
        )

    # Teacher avatar — tidy lower composition
    avatar = circular_avatar(380)
    ax = (W - avatar.width) // 2
    ay = 1240
    base.alpha_composite(avatar, (ax, ay))

    # Name plate
    rounded_rect(draw, (220, 1680, W - 220, 1780), 30, (255, 255, 255, 235))
    draw.text((W // 2, 1710), ar("المعلمة سارة"), font=font(FONT_AR, 40), fill=INK, anchor="mm")
    draw.text((W // 2, 1755), ar("رياضيات · الصف 1"), font=font(FONT_AR_REG, 30), fill=SAGE, anchor="mm")

    return base.convert("RGB")


SCENES = [
    {
        "id": "01-hook",
        "eyebrow": "المنهاج الوطني الأردني · صف 1",
        "title": "العدّ حتى ثلاثة",
        "lines": ["هيا نتعلّم معًا", "واحد… اثنان… ثلاثة"],
        "caption": "درس قصير وواضح",
        "say": "مرحبا أصدقائي! أنا المعلمة سارة. اليوم نتعلم العد حتى ثلاثة، بطريقة سهلة ومرتبة.",
        "seconds": 4.2,
    },
    {
        "id": "02-one",
        "eyebrow": "الخطوة الأولى",
        "title": "هذا واحد",
        "numeral": 1,
        "word": "واحد",
        "caption": "شيء واحد فقط",
        "say": "انظر معي: واحد. الرمز واحد يعني شيئا واحدا.",
        "seconds": 3.6,
    },
    {
        "id": "03-two",
        "eyebrow": "الخطوة الثانية",
        "title": "هذا اثنان",
        "numeral": 2,
        "word": "اثنان",
        "caption": "شيئان معاً",
        "say": "والآن اثنان. نعد: واحد، اثنان.",
        "seconds": 3.8,
    },
    {
        "id": "04-three",
        "eyebrow": "الخطوة الثالثة",
        "title": "هذا ثلاثة",
        "numeral": 3,
        "word": "ثلاثة",
        "caption": "ثلاثة أشياء",
        "say": "وثلاثة. نعد معا: واحد، اثنان، ثلاثة.",
        "seconds": 4.0,
    },
    {
        "id": "05-practice",
        "eyebrow": "تمرين سريع",
        "title": "عدّ معي",
        "lines": ["أشر بإصبعك", "وقل: واحد، اثنان، ثلاثة"],
        "caption": "أنت تستطيع!",
        "say": "هيا نتمرن: أشر بإصبعك وقل معي واحد، اثنان، ثلاثة.",
        "seconds": 4.2,
    },
    {
        "id": "06-outro",
        "eyebrow": "أحسنت",
        "title": "أكملت الدرس",
        "lines": ["تعلّمنا العد حتى ثلاثة", "إلى اللقاء في الدرس القادم"],
        "caption": "SUCCESS OS",
        "say": "أحسنت! تعلمت العد حتى ثلاثة. أنا فخورة بك. إلى اللقاء.",
        "seconds": 4.0,
    },
]


def synthesize(text: str, path: Path):
    # gTTS Arabic — neat classroom pace
    tts = gTTS(text=text, lang="ar", slow=False)
    tts.save(str(path))


def render():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    work = Path(tempfile.mkdtemp(prefix="g1reel_"))
    frames_dir = work / "frames"
    audio_dir = work / "audio"
    clips_dir = work / "clips"
    frames_dir.mkdir()
    audio_dir.mkdir()
    clips_dir.mkdir()

    clip_paths = []
    for scene in SCENES:
        print(f"scene {scene['id']}…")
        img = make_scene(scene)
        frame_path = frames_dir / f"{scene['id']}.png"
        img.save(frame_path)

        audio_path = audio_dir / f"{scene['id']}.mp3"
        synthesize(scene["say"], audio_path)

        # Probe audio duration; pad/trim scene length
        probe = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(audio_path),
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        audio_dur = float(probe.stdout.strip() or scene["seconds"])
        dur = max(scene["seconds"], audio_dur + 0.35)

        clip_path = clips_dir / f"{scene['id']}.mp4"
        # Gentle zoom for reel presence
        vf = (
            f"scale={W}:{H},zoompan=z='min(1.06,1+0.0015*on)':"
            f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={int(dur * FPS)}:"
            f"s={W}x{H}:fps={FPS},format=yuv420p"
        )
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-loop",
                "1",
                "-i",
                str(frame_path),
                "-i",
                str(audio_path),
                "-vf",
                vf,
                "-c:v",
                "libx264",
                "-tune",
                "stillimage",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                "-shortest",
                "-t",
                f"{dur:.2f}",
                "-movflags",
                "+faststart",
                str(clip_path),
            ],
            check=True,
            capture_output=True,
        )
        clip_paths.append(clip_path)

    concat_list = work / "concat.txt"
    concat_list.write_text("".join(f"file '{p}'\n" for p in clip_paths), encoding="utf-8")

    out_mp4 = OUT_DIR / "jordan-g1-math-count-to-three-reel.mp4"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_list),
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            "-movflags",
            "+faststart",
            str(out_mp4),
        ],
        check=True,
        capture_output=True,
    )

    # Poster = first scene
    poster = OUT_DIR / "poster.jpg"
    make_scene(SCENES[0]).save(poster, quality=92)

    # Manifest / script
    manifest = {
        "schema": "success-os.jordan-g1-math-avatar-reel.v1",
        "lesson": {
            "country": "Jordan",
            "curriculum": "Jordan National Curriculum",
            "grade": "الصف 1",
            "subject": "الرياضيات",
            "unit": "الوحدة 1 — الأعداد من حولنا",
            "titleAr": "الدرس 1 — العدّ حتى ثلاثة",
            "titleEn": "Lesson 1 — Count to three",
            "source": "content/demo/jordan-grade1-math-reference.ts",
            "rights": "original-success-os-scaffold-not-textbook-copy",
        },
        "teacherAvatar": {
            "nameAr": "المعلمة سارة",
            "style": "neat-illustrated-avatar",
            "asset": "g1-math-teacher-avatar.png",
        },
        "format": {"aspect": "9:16", "width": W, "height": H, "fps": FPS, "style": "instagram-reel"},
        "scenes": [
            {"id": s["id"], "title": s["title"], "say": s["say"], "seconds": s["seconds"]}
            for s in SCENES
        ],
        "files": {
            "video": str(out_mp4.relative_to(ROOT)),
            "poster": str(poster.relative_to(ROOT)),
            "publicVideo": "public/media/jordan-g1-math-reel/jordan-g1-math-count-to-three-reel.mp4",
        },
    }
    import json

    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT_DIR / "script.ar.md").write_text(
        "# سكربت ريل — العدّ حتى ثلاثة\n\n"
        + "\n\n".join(f"## {s['title']}\n{s['say']}" for s in SCENES)
        + "\n",
        encoding="utf-8",
    )

    # Mirror public + artifacts
    for name in [
        "jordan-g1-math-count-to-three-reel.mp4",
        "poster.jpg",
        "manifest.json",
        "script.ar.md",
        "g1-math-teacher-avatar.png",
        "g1-math-reel-bg.png",
    ]:
        src = OUT_DIR / name
        if src.exists():
            shutil.copy2(src, PUBLIC_DIR / name)
            shutil.copy2(src, ARTIFACT_DIR / name)

    shutil.rmtree(work, ignore_errors=True)
    size = out_mp4.stat().st_size
    print(f"OK {out_mp4} ({size} bytes)")
    return out_mp4


if __name__ == "__main__":
    render()
