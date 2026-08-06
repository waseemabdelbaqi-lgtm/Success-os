#!/usr/bin/env python3
"""
G1 Math Pilot Lesson — EST-style video renderer (Success OS).

Same architecture as EST Physics pilot:
- Presenter frame (bottom-left) with teacher avatar
- Animated slides with progressive text reveal
- Synchronized narration audio
- Smooth slide timing from real audio durations
- Output: 1280x720 MP4
"""
from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps
from gtts import gTTS
from pydub import AudioSegment

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "content" / "media" / "jordan-g1-math-lesson"
AUDIO_DIR = BASE / "audio"
FRAMES_DIR = BASE / "frames"
PUBLIC_DIR = ROOT / "public" / "media" / "jordan-g1-math-lesson"
ARTIFACT = Path("/opt/cursor/artifacts")
OUTPUT_VIDEO = BASE / "jordan-g1-math-pilot-lesson.mp4"
PRESENTER_SRC = ROOT / "content" / "media" / "jordan-g1-math-reel" / "poses" / "teacher-talk.png"

WIDTH, HEIGHT = 1280, 720
FPS = 24
BG_COLOR = (15, 23, 42)
SLIDE_BG = (30, 41, 59)
ACCENT_COLOR = (220, 38, 38)
TEXT_COLOR = (255, 255, 255)
SUBTITLE_COLOR = (200, 200, 200)
EQUATION_COLOR = (74, 222, 128)
HIGHLIGHT_COLOR = (251, 191, 36)
PANEL = (20, 30, 50)

# Slide content + Arabic narration (timing computed from audio)
SLIDES = [
    {
        "id": 1,
        "title": "العدّ حتى ثلاثة",
        "subtitle": "Count to Three — الصف 1 · الرياضيات",
        "content_lines": [
            "Jordan National Curriculum | Grade 1",
            "المعلمة سارة · SUCCESS OS",
            "",
            "أهداف الدرس:",
            "• نطق: واحد، اثنان، ثلاثة",
            "• مطابقة العدد مع الكمية",
            "• العدّ بالإشارة خطوة بخطوة",
        ],
        "equations": ["1 → واحد", "2 → اثنان", "3 → ثلاثة"],
        "is_title_slide": True,
        "say": "مرحبا أصدقائي. أنا المعلمة سارة. اليوم نتعلم العد حتى ثلاثة، من المنهاج الوطني الأردني للصف الأول.",
    },
    {
        "id": 2,
        "title": "العدد واحد",
        "subtitle": "Number One",
        "content_lines": [
            "هذا واحد",
            "",
            "الرمز: 1",
            "الكلمة: واحد",
            "",
            "يعني شيئاً واحداً فقط",
            "نعدّ: واحد",
        ],
        "equations": ["1 = واحد"],
        "is_title_slide": False,
        "draw_count": 1,
        "say": "انظر معي. هذا واحد. الرمز واحد يعني شيئا واحدا فقط. نعد معا: واحد.",
    },
    {
        "id": 3,
        "title": "العدد اثنان",
        "subtitle": "Number Two",
        "content_lines": [
            "هذا اثنان",
            "",
            "الرمز: 2",
            "الكلمة: اثنان",
            "",
            "يعني شيئين معاً",
            "نعدّ: واحد، اثنان",
        ],
        "equations": ["2 = اثنان"],
        "is_title_slide": False,
        "draw_count": 2,
        "say": "والآن اثنان. الرمز اثنان يعني شيئين. عدوا معي: واحد، اثنان.",
    },
    {
        "id": 4,
        "title": "العدد ثلاثة",
        "subtitle": "Number Three",
        "content_lines": [
            "هذا ثلاثة",
            "",
            "الرمز: 3",
            "الكلمة: ثلاثة",
            "",
            "يعني ثلاثة أشياء",
            "نعدّ: واحد، اثنان، ثلاثة",
        ],
        "equations": ["3 = ثلاثة"],
        "is_title_slide": False,
        "draw_count": 3,
        "say": "وأخيرا ثلاثة. ثلاثة أشياء معا. عدوا بصوت عالي: واحد، اثنان، ثلاثة!",
    },
    {
        "id": 5,
        "title": "تمرين سريع",
        "subtitle": "Quick Practice",
        "content_lines": [
            "أشر بإصبعك وعدّ:",
            "",
            "• دائرة واحدة → 1",
            "• دائرتان → 2",
            "• ثلاث دوائر → 3",
            "",
            "تحقّق: هل طابقت الكمية مع الرمز؟",
        ],
        "equations": ["1 · 2 · 3"],
        "is_title_slide": False,
        "draw_count": 3,
        "say": "هيا نتمرن. أشر بإصبعك وقل معي واحد، اثنان، ثلاثة. ممتاز!",
    },
    {
        "id": 6,
        "title": "الخلاصة",
        "subtitle": "Summary",
        "content_lines": [
            "✓ تعلّمنا العدّ حتى ثلاثة",
            "✓ 1 = واحد",
            "✓ 2 = اثنان",
            "✓ 3 = ثلاثة",
            "",
            "أحسنت! أكملت الدرس",
            "إلى اللقاء في الدرس القادم",
        ],
        "equations": ["1 → 2 → 3"],
        "is_title_slide": False,
        "say": "أحسنت يا بطل! تعلمت العد حتى ثلاثة. أنا فخورة فيك. إلى اللقاء.",
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
    img = Image.open(PRESENTER_SRC).convert("RGB")
    w, h = img.size
    # Focus upper body
    img = img.crop((0, 0, w, int(h * 0.78)))
    img = ImageOps.fit(img, (180, 180), method=Image.Resampling.LANCZOS)
    return img


def make_logo():
    img = Image.new("RGB", (60, 60), (30, 41, 59))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((4, 4, 56, 56), radius=12, fill=(220, 38, 38))
    d.text((30, 30), "S", font=get_font(28, bold=True), fill=(255, 255, 255), anchor="mm")
    return img


def draw_count_dots(draw, count, cx, cy):
    gap = 46
    total = (count - 1) * gap
    x0 = cx - total / 2
    for i in range(count):
        x = x0 + i * gap
        draw.ellipse((x - 18, cy - 18, x + 18, cy + 18), fill=HIGHLIGHT_COLOR)
        draw.ellipse((x - 18, cy - 18, x + 18, cy + 18), outline=TEXT_COLOR, width=2)


def draw_frame(slide_data, progress_within_slide, current_time, total_duration, presenter_img, logo_img):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    title_font = get_font(28, bold=True)
    subtitle_font = get_font(20)
    content_font = get_font(18)
    equation_font = get_font(20, bold=True)
    small_font = get_font(14)

    # Top bar
    draw.rectangle([(0, 0), (WIDTH, 50)], fill=PANEL)
    progress = min(1.0, current_time / max(0.1, total_duration))
    draw.rectangle([(0, 48), (int(WIDTH * progress), 50)], fill=ACCENT_COLOR)
    draw.text(
        (WIDTH - 120, 15),
        f"Slide {slide_data['id']}/{len(SLIDES)}",
        fill=SUBTITLE_COLOR,
        font=small_font,
    )
    draw.text(
        (10, 15),
        "Jordan G1 Math | العدّ حتى ثلاثة",
        fill=SUBTITLE_COLOR,
        font=small_font,
    )

    # Slide panel
    slide_x, slide_y = 220, 60
    slide_w, slide_h = WIDTH - slide_x - 20, HEIGHT - 120
    draw.rectangle(
        [(slide_x, slide_y), (slide_x + slide_w, slide_y + slide_h)],
        fill=SLIDE_BG,
        outline=(50, 60, 80),
        width=2,
    )

    if slide_data.get("is_title_slide"):
        draw.text(
            (slide_x + 40, slide_y + 50),
            slide_data["title"],
            fill=TEXT_COLOR,
            font=get_font(34, bold=True),
        )
        draw.text(
            (slide_x + 40, slide_y + 100),
            slide_data["subtitle"],
            fill=SUBTITLE_COLOR,
            font=get_font(22),
        )
        y_pos = slide_y + 160
    else:
        draw.text((slide_x + 20, slide_y + 15), slide_data["title"], fill=TEXT_COLOR, font=title_font)
        draw.text(
            (slide_x + 20, slide_y + 48),
            slide_data["subtitle"],
            fill=SUBTITLE_COLOR,
            font=subtitle_font,
        )
        draw.line(
            [(slide_x + 20, slide_y + 75), (slide_x + slide_w - 20, slide_y + 75)],
            fill=(50, 60, 80),
            width=1,
        )
        y_pos = slide_y + 90

    lines = slide_data["content_lines"]
    visible = int(len(lines) * min(1.0, progress_within_slide * 1.5 + 0.35))
    for line in lines[:visible]:
        if not line:
            y_pos += 12
            continue
        color = TEXT_COLOR
        x = slide_x + 30
        if line.startswith("•") or line.startswith("✓"):
            color = TEXT_COLOR
        elif "→" in line or "=" in line:
            color = EQUATION_COLOR
        elif line.startswith("الرمز") or line.startswith("الكلمة") or line.startswith("نعد"):
            color = HIGHLIGHT_COLOR
        draw.text((x, y_pos), line, fill=color, font=content_font)
        y_pos += 28

    # Count visual
    if slide_data.get("draw_count") and progress_within_slide > 0.2:
        n = slide_data["draw_count"]
        cx = slide_x + slide_w - 160
        cy = slide_y + 220
        draw.rounded_rectangle(
            (cx - 70, cy - 90, cx + 70, cy + 70),
            radius=16,
            fill=(20, 30, 50),
            outline=EQUATION_COLOR,
            width=2,
        )
        draw.text((cx, cy - 45), str(n), fill=EQUATION_COLOR, font=get_font(48, bold=True), anchor="mm")
        draw_count_dots(draw, n, cx, cy + 25)

    if slide_data.get("equations"):
        eq_y = slide_y + slide_h - 55
        draw.rectangle(
            [(slide_x + 20, eq_y), (slide_x + slide_w - 20, eq_y + 42)],
            fill=(20, 30, 50),
            outline=EQUATION_COLOR,
            width=1,
        )
        eq_text = "  |  ".join(slide_data["equations"])
        draw.text((slide_x + 36, eq_y + 10), eq_text, fill=EQUATION_COLOR, font=equation_font)

    # Presenter column
    draw.rectangle([(0, 60), (210, HEIGHT - 60)], fill=PANEL)
    presenter_y = 110
    img.paste(presenter_img, (15, presenter_y))
    draw.rectangle([(15, presenter_y), (195, presenter_y + 180)], outline=(50, 60, 80), width=2)
    draw.text((15, presenter_y + 190), "المعلمة سارة", fill=TEXT_COLOR, font=small_font)
    draw.text((15, presenter_y + 210), "SUCCESS OS · G1", fill=SUBTITLE_COLOR, font=small_font)

    # Speaking bars
    if progress_within_slide > 0.04:
        bar_y = presenter_y + 245
        for i in range(5):
            bar_h = int(8 + 16 * abs(math.sin(progress_within_slide * 12 + i * 0.9)))
            bar_color = EQUATION_COLOR if i % 2 == 0 else (34, 197, 94)
            draw.rectangle(
                [(30 + i * 20, bar_y + 22 - bar_h), (42 + i * 20, bar_y + 22)],
                fill=bar_color,
            )

    # Bottom bar
    draw.rectangle([(0, HEIGHT - 50), (WIDTH, HEIGHT)], fill=PANEL)
    img.paste(logo_img.resize((35, 35), Image.Resampling.LANCZOS), (10, HEIGHT - 43))
    draw.text((50, HEIGHT - 38), "Success OS Academy", fill=SUBTITLE_COLOR, font=small_font)
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
    gap = AudioSegment.silent(duration=700)  # transition gap
    full = AudioSegment.silent(duration=400)
    timeline = []
    cursor_ms = 400

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
        # find slide
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
    print("=== G1 Math Pilot Lesson (EST-style) ===")
    BASE.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT.mkdir(parents=True, exist_ok=True)

    presenter_img = load_presenter()
    logo_img = make_logo()
    presenter_img.save(BASE / "presenter.jpg", quality=92)

    print("Building narration…")
    timeline, wav, total_duration = build_audio()
    (BASE / "timeline.json").write_text(
        json.dumps(
            [{"id": s["id"], "start": s["start"], "end": s["end"], "title": s["title"], "say": s["say"]} for s in timeline],
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    render_frames(timeline, total_duration, presenter_img, logo_img)
    compose_video(wav)

    # Poster + mirrors
    first = sorted(FRAMES_DIR.glob("frame_*.jpg"))[0]
    shutil.copy2(first, BASE / "poster.jpg")
    for dest in (PUBLIC_DIR, ARTIFACT):
        shutil.copy2(OUTPUT_VIDEO, dest / OUTPUT_VIDEO.name)
        shutil.copy2(BASE / "poster.jpg", dest / "jordan-g1-math-pilot-poster.jpg")
    shutil.copy2(OUTPUT_VIDEO, ARTIFACT / "jordan-g1-math-pilot-lesson.mp4")

    # GIF preview
    gif = ARTIFACT / "jordan-g1-math-pilot-preview.gif"
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(OUTPUT_VIDEO),
            "-vf", "fps=10,scale=480:-1:flags=lanczos",
            "-t", "8", "-an", str(gif),
        ],
        check=True,
        capture_output=True,
    )

    # Cleanup heavy frames to keep repo light (keep audio + mp4 + poster)
    shutil.rmtree(FRAMES_DIR, ignore_errors=True)

    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", str(OUTPUT_VIDEO)],
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


if __name__ == "__main__":
    main()
