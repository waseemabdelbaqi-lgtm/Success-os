#!/usr/bin/env python3
"""
EST Physics Pilot Lesson — Forces & Newton's Laws (Success OS).

Offline Success4Sure-style renderer (SPENDING_LOCKED compatible):
- Presenter frame (left) — Mr. Waseem stand-in / replaceable photo
- Progressive slides with equations
- Narration timed from real TTS durations (gTTS + pydub)
- Output: 1280x720 MP4

No Kling / HeyGen / paid clip APIs.
"""
from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps
from gtts import gTTS
from pydub import AudioSegment

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "content" / "media" / "est-physics-pilot"
AUDIO_DIR = BASE / "audio"
FRAMES_DIR = BASE / "frames"
PUBLIC_DIR = ROOT / "public" / "media" / "est-physics-pilot"
ARTIFACT = Path("/opt/cursor/artifacts")
OUTPUT_VIDEO = BASE / "est-physics-pilot-lesson.mp4"
PRESENTER_SRC = BASE / "assets" / "mr-waseem-presenter.jpg"

WIDTH, HEIGHT = 1280, 720
FPS = 24
BG_COLOR = (12, 18, 32)
SLIDE_BG = (22, 32, 52)
ACCENT_COLOR = (185, 28, 28)  # deep crimson — Success4Sure direction
TEXT_COLOR = (255, 255, 255)
SUBTITLE_COLOR = (186, 198, 214)
EQUATION_COLOR = (96, 214, 168)
HIGHLIGHT_COLOR = (251, 191, 36)
PANEL = (16, 24, 42)

# Pilot lesson: Forces & Newton's Laws (EST Physics)
# Narration is bilingual-friendly Arabic; slides show EN + AR key terms.
SLIDES = [
    {
        "id": 1,
        "title": "EST Physics — Forces",
        "subtitle": "القوى · Newton's Laws Pilot",
        "content_lines": [
            "Success4Sure Academy · Mr. Waseem",
            "EST Physics | Unit: Forces",
            "",
            "Lesson objectives:",
            "• Define force and net force",
            "• State Newton's three laws",
            "• Apply F = ma to a simple case",
            "• Read a free-body idea quickly",
        ],
        "equations": ["ΣF → a", "F = ma"],
        "is_title_slide": True,
        "say": (
            "مرحبا. أنا الأستاذ وسيم. اليوم نبدأ درس القوى في EST Physics. "
            "سنتعلم تعريف القوة، ثم قوانين نيوتن الثلاثة، ثم كيف نستخدم أف تساوي أم أي."
        ),
    },
    {
        "id": 2,
        "title": "What is a Force?",
        "subtitle": "ما هي القوة؟",
        "content_lines": [
            "A force is a push or a pull.",
            "القوة: دفع أو سحب.",
            "",
            "• Has magnitude (كم؟)",
            "• Has direction (إلى أين؟)",
            "• Measured in newtons (N)",
            "",
            "Net force ΣF = vector sum of all forces",
        ],
        "equations": ["Force → N", "ΣF = F1 + F2 + …"],
        "is_title_slide": False,
        "diagram": "force_arrow",
        "say": (
            "القوة هي دفع أو سحب. لها مقدار واتجاه، ووحدتها النيوتن. "
            "محصلة القوى هي مجموع كل القوى كمتجهات."
        ),
    },
    {
        "id": 3,
        "title": "Newton's First Law",
        "subtitle": "القانون الأول — القصور الذاتي",
        "content_lines": [
            "If ΣF = 0, velocity stays constant.",
            "إذا كانت محصلة القوى صفراً:",
            "• Object at rest stays at rest",
            "• Moving object keeps constant velocity",
            "",
            "Inertia = tendency to resist change",
            "القصور الذاتي يقاوم تغيّر الحركة",
        ],
        "equations": ["ΣF = 0  ⇒  a = 0"],
        "is_title_slide": False,
        "say": (
            "قانون نيوتن الأول: إذا كانت محصلة القوى صفرا، تبقى السرعة ثابتة. "
            "الجسم الساكن يبقى ساكنا، والمتحرك يستمر بسرعة ثابتة. هذا هو القصور الذاتي."
        ),
    },
    {
        "id": 4,
        "title": "Newton's Second Law",
        "subtitle": "القانون الثاني — F = ma",
        "content_lines": [
            "Net force causes acceleration.",
            "محصلة القوى تسبب تسارعاً.",
            "",
            "• Larger force → larger a",
            "• Larger mass → smaller a",
            "• Direction of a matches ΣF",
            "",
            "Example: m = 2 kg, a = 3 m/s² → F = 6 N",
        ],
        "equations": ["F = ma", "a = F / m"],
        "is_title_slide": False,
        "diagram": "fma",
        "say": (
            "قانون نيوتن الثاني: القوة المحصلة تساوي الكتلة ضرب التسارع. "
            "مثلا: كتلة كيلوغرامين وتسارع ثلاثة، فالقوة ستة نيوتن."
        ),
    },
    {
        "id": 5,
        "title": "Newton's Third Law",
        "subtitle": "القانون الثالث — الفعل ورد الفعل",
        "content_lines": [
            "For every action, there is an",
            "equal and opposite reaction.",
            "",
            "• Forces come in pairs",
            "• Same magnitude, opposite direction",
            "• Act on different objects",
            "",
            "You push the wall → wall pushes you",
        ],
        "equations": ["F_AB = − F_BA"],
        "is_title_slide": False,
        "diagram": "pair",
        "say": (
            "قانون نيوتن الثالث: لكل فعل رد فعل مساوٍ له في المقدار ومعاكس في الاتجاه. "
            "القوتان تعملان على جسمين مختلفين."
        ),
    },
    {
        "id": 6,
        "title": "Free-Body Thinking",
        "subtitle": "فكرة مخطط الجسم الحر",
        "content_lines": [
            "1. Isolate the object",
            "2. Draw every force on it",
            "3. Choose axes (x, y)",
            "4. Write ΣFx and ΣFy",
            "5. Solve with F = ma",
            "",
            "Tip: weight = mg downward",
            "Normal force ⊥ surface",
        ],
        "equations": ["ΣFx = max", "ΣFy = may"],
        "is_title_slide": False,
        "say": (
            "فكر كمهندس: اعزل الجسم، ارسم كل القوى عليه، اختر المحاور، "
            "ثم اكتب مجموع القوى في إكس وواي واستخدم أف تساوي أم أي."
        ),
    },
    {
        "id": 7,
        "title": "Quick Check",
        "subtitle": "تحقق سريع",
        "content_lines": [
            "Q1: ΣF = 0 → what about a?",
            "    → a = 0 (constant velocity)",
            "",
            "Q2: Which law is F = ma?",
            "    → Newton's Second Law",
            "",
            "Q3: Action-reaction forces act on",
            "    → two different objects",
        ],
        "equations": ["ΣF=0 → a=0", "F=ma", "pairs"],
        "is_title_slide": False,
        "say": (
            "تحقق سريع. إذا محصلة القوى صفر فالتسارع صفر. "
            "أف تساوي أم أي هو القانون الثاني. وقوى الفعل ورد الفعل تعملان على جسمين مختلفين."
        ),
    },
    {
        "id": 8,
        "title": "Summary",
        "subtitle": "الخلاصة",
        "content_lines": [
            "✓ Force = push/pull (vector, N)",
            "✓ 1st: ΣF = 0 → constant velocity",
            "✓ 2nd: F = ma",
            "✓ 3rd: equal & opposite pairs",
            "✓ Free-body → equations → solve",
            "",
            "Next: practice problems with Mr. Waseem",
            "إلى اللقاء في الدرس القادم",
        ],
        "equations": ["ΣF=0", "F=ma", "F=−F"],
        "is_title_slide": False,
        "say": (
            "أحسنت. راجعنا القوى وقوانين نيوتن الثلاثة. "
            "في الدرس القادم نحل مسائل معا. أنا الأستاذ وسيم — إلى اللقاء."
        ),
    },
]


def get_font(size, bold=False):
    paths = (
        [
            "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
        if bold
        else [
            "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
    )
    for fp in paths:
        if os.path.exists(fp):
            return ImageFont.truetype(fp, size)
    return ImageFont.load_default()


def load_presenter():
    if not PRESENTER_SRC.exists():
        raise SystemExit(f"Missing presenter asset: {PRESENTER_SRC}")
    img = Image.open(PRESENTER_SRC).convert("RGB")
    w, h = img.size
    # Prefer upper body / face region for the left column
    img = img.crop((0, 0, w, int(h * 0.85)))
    img = ImageOps.fit(img, (180, 220), method=Image.Resampling.LANCZOS)
    return img


def make_logo():
    img = Image.new("RGB", (60, 60), PANEL)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((4, 4, 56, 56), radius=10, fill=ACCENT_COLOR)
    d.text((30, 30), "S", font=get_font(28, bold=True), fill=(255, 255, 255), anchor="mm")
    return img


def draw_diagram(draw, kind, box):
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    draw.rounded_rectangle(box, radius=12, fill=(14, 22, 38), outline=EQUATION_COLOR, width=2)
    if kind == "force_arrow":
        draw.ellipse((cx - 14, cy - 14, cx + 14, cy + 14), fill=HIGHLIGHT_COLOR)
        draw.line([(cx + 18, cy), (cx + 70, cy)], fill=EQUATION_COLOR, width=4)
        draw.polygon([(cx + 70, cy), (cx + 58, cy - 8), (cx + 58, cy + 8)], fill=EQUATION_COLOR)
        draw.text((cx, y0 + 18), "F →", fill=EQUATION_COLOR, font=get_font(16, bold=True), anchor="mm")
    elif kind == "fma":
        draw.text((cx, cy - 10), "F = m a", fill=EQUATION_COLOR, font=get_font(22, bold=True), anchor="mm")
        draw.text((cx, cy + 22), "→ a", fill=HIGHLIGHT_COLOR, font=get_font(16, bold=True), anchor="mm")
    elif kind == "pair":
        draw.line([(cx - 60, cy), (cx - 10, cy)], fill=ACCENT_COLOR, width=4)
        draw.polygon([(cx - 60, cy), (cx - 48, cy - 8), (cx - 48, cy + 8)], fill=ACCENT_COLOR)
        draw.line([(cx + 10, cy), (cx + 60, cy)], fill=EQUATION_COLOR, width=4)
        draw.polygon([(cx + 60, cy), (cx + 48, cy - 8), (cx + 48, cy + 8)], fill=EQUATION_COLOR)
        draw.text((cx, y0 + 16), "A ↔ B", fill=SUBTITLE_COLOR, font=get_font(14), anchor="mm")


def draw_frame(slide_data, progress_within_slide, current_time, total_duration, presenter_img, logo_img):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    title_font = get_font(26, bold=True)
    subtitle_font = get_font(18)
    content_font = get_font(17)
    equation_font = get_font(18, bold=True)
    small_font = get_font(13)

    # Top bar
    draw.rectangle([(0, 0), (WIDTH, 50)], fill=PANEL)
    progress = min(1.0, current_time / max(0.1, total_duration))
    draw.rectangle([(0, 48), (int(WIDTH * progress), 50)], fill=ACCENT_COLOR)
    draw.text(
        (WIDTH - 130, 15),
        f"Slide {slide_data['id']}/{len(SLIDES)}",
        fill=SUBTITLE_COLOR,
        font=small_font,
    )
    draw.text(
        (10, 15),
        "EST Physics | Forces & Newton's Laws",
        fill=SUBTITLE_COLOR,
        font=small_font,
    )

    # Slide panel
    slide_x, slide_y = 220, 60
    slide_w, slide_h = WIDTH - slide_x - 20, HEIGHT - 120
    draw.rectangle(
        [(slide_x, slide_y), (slide_x + slide_w, slide_y + slide_h)],
        fill=SLIDE_BG,
        outline=(45, 58, 82),
        width=2,
    )

    if slide_data.get("is_title_slide"):
        draw.text(
            (slide_x + 36, slide_y + 40),
            slide_data["title"],
            fill=TEXT_COLOR,
            font=get_font(32, bold=True),
        )
        draw.text(
            (slide_x + 36, slide_y + 88),
            slide_data["subtitle"],
            fill=HIGHLIGHT_COLOR,
            font=get_font(20),
        )
        y_pos = slide_y + 140
    else:
        draw.text((slide_x + 20, slide_y + 14), slide_data["title"], fill=TEXT_COLOR, font=title_font)
        draw.text(
            (slide_x + 20, slide_y + 46),
            slide_data["subtitle"],
            fill=SUBTITLE_COLOR,
            font=subtitle_font,
        )
        draw.line(
            [(slide_x + 20, slide_y + 72), (slide_x + slide_w - 20, slide_y + 72)],
            fill=(45, 58, 82),
            width=1,
        )
        y_pos = slide_y + 86

    lines = slide_data["content_lines"]
    visible = int(len(lines) * min(1.0, progress_within_slide * 1.45 + 0.32))
    for line in lines[:visible]:
        if not line:
            y_pos += 11
            continue
        color = TEXT_COLOR
        if line.startswith("•") or line.startswith("✓"):
            color = TEXT_COLOR
        elif "→" in line or "=" in line or "Σ" in line or "F =" in line:
            color = EQUATION_COLOR
        elif line.startswith("Q") or line.startswith("Example") or line.startswith("Tip"):
            color = HIGHLIGHT_COLOR
        draw.text((slide_x + 28, y_pos), line, fill=color, font=content_font)
        y_pos += 26

    if slide_data.get("diagram") and progress_within_slide > 0.18:
        bx1 = slide_x + slide_w - 200
        by1 = slide_y + 160
        draw_diagram(draw, slide_data["diagram"], (bx1, by1, bx1 + 170, by1 + 120))

    if slide_data.get("equations"):
        eq_y = slide_y + slide_h - 52
        draw.rectangle(
            [(slide_x + 18, eq_y), (slide_x + slide_w - 18, eq_y + 40)],
            fill=(14, 22, 38),
            outline=EQUATION_COLOR,
            width=1,
        )
        eq_text = "  |  ".join(slide_data["equations"])
        draw.text((slide_x + 32, eq_y + 10), eq_text, fill=EQUATION_COLOR, font=equation_font)

    # Presenter column
    draw.rectangle([(0, 60), (210, HEIGHT - 60)], fill=PANEL)
    presenter_y = 90
    img.paste(presenter_img, (15, presenter_y))
    draw.rectangle([(15, presenter_y), (195, presenter_y + 220)], outline=(55, 70, 95), width=2)
    draw.text((15, presenter_y + 228), "Mr. Waseem", fill=TEXT_COLOR, font=small_font)
    draw.text((15, presenter_y + 246), "EST Physics", fill=SUBTITLE_COLOR, font=small_font)
    draw.text((15, presenter_y + 264), "Success4Sure", fill=(160, 170, 190), font=get_font(11))

    if progress_within_slide > 0.04:
        bar_y = presenter_y + 290
        for i in range(5):
            bar_h = int(8 + 16 * abs(math.sin(progress_within_slide * 12 + i * 0.9)))
            bar_color = EQUATION_COLOR if i % 2 == 0 else (52, 180, 120)
            draw.rectangle(
                [(30 + i * 20, bar_y + 22 - bar_h), (42 + i * 20, bar_y + 22)],
                fill=bar_color,
            )

    # Bottom bar
    draw.rectangle([(0, HEIGHT - 50), (WIDTH, HEIGHT)], fill=PANEL)
    img.paste(logo_img.resize((35, 35), Image.Resampling.LANCZOS), (10, HEIGHT - 43))
    draw.text((50, HEIGHT - 38), "Success OS · EST Physics Pilot", fill=SUBTITLE_COLOR, font=small_font)
    mins, secs = int(current_time // 60), int(current_time % 60)
    tmins, tsecs = int(total_duration // 60), int(total_duration % 60)
    draw.text(
        (WIDTH - 130, HEIGHT - 38),
        f"{mins:02d}:{secs:02d} / {tmins:02d}:{tsecs:02d}",
        fill=SUBTITLE_COLOR,
        font=small_font,
    )
    return img


def build_audio():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    gap = AudioSegment.silent(duration=650)
    full = AudioSegment.silent(duration=350)
    timeline = []
    cursor_ms = 350

    for slide in SLIDES:
        mp3 = AUDIO_DIR / f"slide_{slide['id']:02d}.mp3"
        print(f"  TTS slide {slide['id']}…")
        gTTS(text=slide["say"], lang="ar", slow=False).save(str(mp3))
        seg = AudioSegment.from_file(mp3)
        start = cursor_ms / 1000.0
        end = (cursor_ms + len(seg)) / 1000.0
        timeline.append({**slide, "start": start, "end": end})
        full += seg + gap
        cursor_ms += len(seg) + len(gap)

    wav = AUDIO_DIR / "full_narration.wav"
    full.export(wav, format="wav")
    print(f"Audio total: {len(full)/1000:.1f}s → {wav}")
    return timeline, wav, len(full) / 1000.0


def render_frames(timeline, total_duration, presenter_img, logo_img):
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)
    FRAMES_DIR.mkdir(parents=True)

    total_frames = int(math.ceil(total_duration * FPS))
    print(f"Rendering {total_frames} frames…")
    frame_num = 0
    for t_idx in range(total_frames):
        t = t_idx / FPS
        slide = timeline[-1]
        for s in timeline:
            if s["start"] <= t <= s["end"] + 0.35:
                slide = s
                break
            if t < s["start"]:
                slide = s
                break
        dur = max(0.05, slide["end"] - slide["start"])
        progress = max(0.0, min(1.0, (t - slide["start"]) / dur))
        frame = draw_frame(slide, progress, t, total_duration, presenter_img, logo_img)
        frame.save(FRAMES_DIR / f"frame_{frame_num:06d}.jpg", quality=88)
        frame_num += 1
        if frame_num % 120 == 0:
            print(f"  {frame_num}/{total_frames}")
    print(f"Done {frame_num} frames")
    return frame_num


def compose_video(wav: Path):
    print("Composing MP4…")
    OUTPUT_VIDEO.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", str(FRAMES_DIR / "frame_%06d.jpg"),
        "-i", str(wav),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        str(OUTPUT_VIDEO),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-800:])
        raise SystemExit(1)
    print(f"Video: {OUTPUT_VIDEO} ({OUTPUT_VIDEO.stat().st_size} bytes)")


def main():
    print("=== EST Physics Pilot — Forces & Newton's Laws ===")
    print("Mode: offline renderer (SPENDING_LOCKED compatible)")
    BASE.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT.mkdir(parents=True, exist_ok=True)
    (ARTIFACT / "est-physics-pilot").mkdir(parents=True, exist_ok=True)

    presenter_img = load_presenter()
    logo_img = make_logo()
    presenter_img.save(BASE / "presenter.jpg", quality=92)

    print("Building narration…")
    timeline, wav, total_duration = build_audio()
    (BASE / "timeline.json").write_text(
        json.dumps(
            [
                {
                    "id": s["id"],
                    "start": s["start"],
                    "end": s["end"],
                    "title": s["title"],
                    "say": s["say"],
                }
                for s in timeline
            ],
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    render_frames(timeline, total_duration, presenter_img, logo_img)
    compose_video(wav)

    first = sorted(FRAMES_DIR.glob("frame_*.jpg"))[0]
    shutil.copy2(first, BASE / "poster.jpg")
    for dest in (PUBLIC_DIR, ARTIFACT, ARTIFACT / "est-physics-pilot"):
        shutil.copy2(OUTPUT_VIDEO, dest / OUTPUT_VIDEO.name)
        shutil.copy2(BASE / "poster.jpg", dest / "est-physics-pilot-poster.jpg")

    gif = ARTIFACT / "est-physics-pilot-preview.gif"
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

    # Keep repo light: drop per-slide mp3s; keep full wav optional — drop wav too, keep timeline + mp4
    for p in AUDIO_DIR.glob("slide_*.mp3"):
        p.unlink(missing_ok=True)
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
    print(f"Artifact: {ARTIFACT / OUTPUT_VIDEO.name}")


if __name__ == "__main__":
    main()
