#!/usr/bin/env python3
"""
Animated Grade 1 Math teaching reel:
Teacher avatar MOVES, TALKS (pose swap + audio), WRITES on the board, and EXPLAINS.
Vertical 9:16 Instagram-style. Jordan National Curriculum — العدّ حتى ثلاثة.
"""
from __future__ import annotations

import json
import math
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from gtts import gTTS

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "content" / "media" / "jordan-g1-math-reel"
PUBLIC_DIR = ROOT / "public" / "media" / "jordan-g1-math-reel"
ARTIFACT_DIR = Path("/opt/cursor/artifacts")
POSES = OUT_DIR / "poses"

W, H, FPS = 1080, 1920, 24
FONT_AR = "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf"
FONT_AR_R = "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf"
FONT_NUM = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

SAGE = (74, 112, 98)
INK = (34, 42, 48)
CHALK = (245, 242, 230)
BOARD = (46, 78, 62)
BOARD_DARK = (32, 56, 45)
ACCENT = (214, 168, 78)
WHITE = (255, 255, 255)


def font(path, size):
    return ImageFont.truetype(path, size=size)


def load_pose(name: str, height: int = 820) -> Image.Image:
    img = Image.open(POSES / f"teacher-{name}.png").convert("RGBA")
    # Soft cut of background: keep character via slight contrast boost
    ratio = height / img.height
    img = img.resize((int(img.width * ratio), height), Image.Resampling.LANCZOS)
    return img


def classroom_bg() -> Image.Image:
    """Soft classroom with big chalkboard."""
    img = Image.new("RGB", (W, H), (232, 226, 214))
    d = ImageDraw.Draw(img)
    # wall gradient
    for y in range(H):
        t = y / H
        col = (
            int(232 - 18 * t),
            int(226 - 10 * t),
            int(214 - 8 * t),
        )
        d.line([(0, y), (W, y)], fill=col)

    # chalkboard frame
    d.rounded_rectangle((60, 160, W - 60, 980), radius=28, fill=(90, 68, 48))
    d.rounded_rectangle((84, 184, W - 84, 956), radius=18, fill=BOARD_DARK)
    d.rounded_rectangle((96, 196, W - 96, 944), radius=14, fill=BOARD)

    # chalk tray
    d.rounded_rectangle((120, 960, W - 120, 990), radius=8, fill=(120, 92, 64))
    d.ellipse((160, 968, 210, 985), fill=CHALK)
    d.ellipse((230, 970, 265, 986), fill=(255, 220, 180))

    # floor band
    d.rectangle((0, 1500, W, H), fill=(198, 186, 168))
    d.rectangle((0, 1485, W, 1505), fill=(170, 155, 135))

    # brand
    d.rounded_rectangle((70, 48, W - 70, 130), radius=24, fill=(255, 255, 255))
    d.text((W // 2, 74), "SUCCESS OS", font=font(FONT_NUM, 28), fill=SAGE, anchor="mm")
    d.text(
        (W // 2, 108),
        "الصف 1 · الرياضيات · العدّ حتى ثلاثة",
        font=font(FONT_AR_R, 30),
        fill=INK,
        anchor="mm",
    )
    return img


def draw_board_text(base: Image.Image, title: str, subtitle: str = ""):
    d = ImageDraw.Draw(base)
    d.text((W // 2, 250), title, font=font(FONT_AR, 54), fill=CHALK, anchor="mm")
    if subtitle:
        d.text((W // 2, 320), subtitle, font=font(FONT_AR_R, 34), fill=(210, 220, 200), anchor="mm")


def chalk_number_mask(numeral: str, size: int = 420) -> Image.Image:
    """White numeral on black used as reveal mask for writing animation."""
    img = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(img)
    d.text((size // 2, size // 2 + 10), numeral, font=font(FONT_NUM, 340), fill=255, anchor="mm")
    return img.filter(ImageFilter.GaussianBlur(1.2))


def draw_partial_number(base: Image.Image, numeral: str, progress: float, cx=540, cy=560):
    """Reveal number top-to-bottom like chalk writing."""
    progress = max(0.0, min(1.0, progress))
    if progress <= 0.01:
        return
    mask = chalk_number_mask(numeral)
    size = mask.size[0]
    chalk_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # chalky fill
    fill = Image.new("RGBA", (size, size), (*CHALK, 0))
    # paint only glyph
    alpha = mask.point(lambda p: int(p * 0.95))
    fill.putalpha(alpha)
    # progressive wipe from top
    wipe = Image.new("L", (size, size), 0)
    wd = ImageDraw.Draw(wipe)
    h = int(size * (0.08 + 0.92 * progress))
    wd.rectangle((0, 0, size, h), fill=255)
    # slight diagonal for hand-writing feel
    for i in range(8):
        y = int(h * (i / 8))
        wd.rectangle((0, y, size, min(size, y + 6)), fill=max(0, 255 - i * 12))
    fill_a = fill.split()[-1]
    fill.putalpha(Image.fromarray(
        (np.asarray(fill_a).astype(np.float32) * (np.asarray(wipe).astype(np.float32) / 255.0)).astype(np.uint8)
    ))
    # dots under number for counting
    chalk_layer = Image.alpha_composite(chalk_layer, fill)
    base.paste(chalk_layer, (cx - size // 2, cy - size // 2), chalk_layer)

    if progress > 0.55:
        d = ImageDraw.Draw(base, "RGBA")
        count = int(numeral) if numeral.isdigit() else 1
        gap = 95
        total = (count - 1) * gap
        x0 = cx - total / 2
        fade = min(1.0, (progress - 0.55) / 0.45)
        for i in range(count):
            x = x0 + i * gap
            r = 28
            col = (*ACCENT, int(230 * fade))
            d.ellipse((x - r, 780 - r, x + r, 780 + r), fill=col)


def paste_teacher(base: Image.Image, pose: Image.Image, x: float, y: float, bob=0.0, scale=1.0):
    if abs(scale - 1.0) > 0.01:
        nw = max(1, int(pose.width * scale))
        nh = max(1, int(pose.height * scale))
        pose = pose.resize((nw, nh), Image.Resampling.LANCZOS)
    px = int(x - pose.width / 2)
    py = int(y - pose.height + bob)
    # soft shadow
    shadow = Image.new("RGBA", (pose.width, 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((10, 0, pose.width - 10, 36), fill=(0, 0, 0, 55))
    base.paste(shadow, (px, py + pose.height - 28), shadow)
    base.paste(pose, (px, py), pose)


def nameplate(base: Image.Image, text_main="المعلمة سارة", text_sub="تشرح · تكتب · تفهّم"):
    d = ImageDraw.Draw(base, "RGBA")
    d.rounded_rectangle((250, 1785, W - 250, 1885), radius=28, fill=(255, 255, 255, 235))
    d.text((W // 2, 1815), text_main, font=font(FONT_AR, 36), fill=INK, anchor="mm")
    d.text((W // 2, 1858), text_sub, font=font(FONT_AR_R, 26), fill=SAGE, anchor="mm")


def synthesize(text: str, path: Path):
    gTTS(text=text, lang="ar", slow=False).save(str(path))


def mp3_to_wav(mp3: Path, wav: Path):
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(mp3), "-ac", "1", "-ar", "24000", str(wav)],
        check=True,
        capture_output=True,
    )


def audio_envelope(wav_path: Path, fps=FPS):
    with wave.open(str(wav_path), "rb") as wf:
        sr = wf.getframerate()
        n = wf.getnframes()
        raw = wf.readframes(n)
    data = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
    if data.size == 0:
        return np.zeros(1)
    samples_per = max(1, int(sr / fps))
    pad = (-len(data)) % samples_per
    if pad:
        data = np.concatenate([data, np.zeros(pad, dtype=np.float32)])
    frames = data.reshape(-1, samples_per)
    env = np.sqrt((frames ** 2).mean(axis=1))
    if env.max() > 0:
        env = env / env.max()
    return env


SCENES = [
    {
        "id": "hook",
        "mode": "talk",
        "board_title": "هيا نتعلّم معًا",
        "board_sub": "العدّ حتى ثلاثة",
        "say": "مرحبا أصدقائي! أنا المعلمة سارة. اليوم راح أشرح لكم العد حتى ثلاثة، وأكتب على اللوح قدامكم.",
        "numeral": None,
    },
    {
        "id": "one-write",
        "mode": "write",
        "board_title": "هذا واحد",
        "board_sub": "أكتب الرقم واحد",
        "say": "شوفوا معي على اللوح. بكتب الرقم واحد. واحد يعني شيء واحد فقط.",
        "numeral": "1",
    },
    {
        "id": "one-explain",
        "mode": "point",
        "board_title": "واحد",
        "board_sub": "نعدّ: واحد",
        "say": "الآن عدوا معي: واحد. ممتاز!",
        "numeral": "1",
        "full_number": True,
    },
    {
        "id": "two-write",
        "mode": "write",
        "board_title": "هذا اثنان",
        "board_sub": "أكتب الرقم اثنان",
        "say": "والآن بكتب الرقم اثنين. اثنان يعني شيئين.",
        "numeral": "2",
    },
    {
        "id": "two-explain",
        "mode": "point",
        "board_title": "اثنان",
        "board_sub": "نعدّ: واحد، اثنان",
        "say": "عدوا معي: واحد، اثنان. أحسنتم!",
        "numeral": "2",
        "full_number": True,
    },
    {
        "id": "three-write",
        "mode": "write",
        "board_title": "هذا ثلاثة",
        "board_sub": "أكتب الرقم ثلاثة",
        "say": "وأخيرا بكتب الرقم ثلاثة. ثلاثة أشياء معا.",
        "numeral": "3",
    },
    {
        "id": "three-explain",
        "mode": "point",
        "board_title": "ثلاثة",
        "board_sub": "واحد، اثنان، ثلاثة",
        "say": "عدوا معي بصوت عالي: واحد، اثنان، ثلاثة!",
        "numeral": "3",
        "full_number": True,
    },
    {
        "id": "practice",
        "mode": "talk",
        "board_title": "تمرين",
        "board_sub": "أشر وعدّ حتى ثلاثة",
        "say": "هيا نتمرن. أشر بإصبعك وقل معي: واحد، اثنان، ثلاثة.",
        "numeral": "3",
        "full_number": True,
    },
    {
        "id": "outro",
        "mode": "talk",
        "board_title": "أحسنت!",
        "board_sub": "تعلّمت العدّ حتى ثلاثة",
        "say": "أحسنت يا بطل! تعلمت العد حتى ثلاثة. أنا فخورة فيك. إلى اللقاء.",
        "numeral": "3",
        "full_number": True,
    },
]


def render_scene_frames(scene, poses, env, out_dir: Path):
    n_frames = max(len(env), int(2.5 * FPS))
    # pad envelope
    if len(env) < n_frames:
        env = np.pad(env, (0, n_frames - len(env)))
    else:
        env = env[:n_frames]

    mode = scene["mode"]
    frames = []
    for i in range(n_frames):
        t = i / FPS
        progress = i / max(1, n_frames - 1)
        base = classroom_bg().convert("RGBA")
        draw_board_text(base, scene["board_title"], scene.get("board_sub", ""))

        # Writing animation
        if scene.get("numeral"):
            if mode == "write":
                draw_partial_number(base, scene["numeral"], progress)
            else:
                draw_partial_number(base, scene["numeral"], 1.0 if scene.get("full_number") else progress)

        # Teacher placement + pose
        talk_level = float(env[i])
        bob = math.sin(t * 6.0) * 6 + talk_level * 4

        if mode == "write":
            pose = poses["write"]
            # move from center-right toward board while writing
            x = 780 - 40 * math.sin(progress * math.pi)
            y = 1680
            scale = 0.92
        elif mode == "point":
            pose = poses["point"] if talk_level < 0.35 else poses["talk"]
            x = 720
            y = 1680
            scale = 0.95
            # slight lean toward board
            x += math.sin(t * 2) * 8
        else:
            # talking: swap idle/talk by audio energy
            pose = poses["talk"] if talk_level > 0.18 else poses["idle"]
            x = 540 + math.sin(t * 1.4) * 18
            y = 1700
            scale = 1.0 + talk_level * 0.02

        paste_teacher(base, pose, x=x, y=y, bob=bob, scale=scale)
        nameplate(base)
        # speech bubble when talking loud
        if talk_level > 0.45 and mode in ("talk", "point"):
            d = ImageDraw.Draw(base, "RGBA")
            d.ellipse((x + 120, y - 780, x + 190, y - 720), fill=(255, 255, 255, 200))
            d.ellipse((x + 150, y - 710, x + 175, y - 688), fill=(255, 255, 255, 180))

        frame_path = out_dir / f"f{i:04d}.png"
        base.convert("RGB").save(frame_path, optimize=True)
        frames.append(frame_path)
    return frames, n_frames / FPS


def render():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    poses = {
        "idle": load_pose("idle"),
        "talk": load_pose("talk"),
        "write": load_pose("write"),
        "point": load_pose("point"),
    }

    work = Path(tempfile.mkdtemp(prefix="g1anim_"))
    clips = []

    for scene in SCENES:
        print(f"▶ animating {scene['id']} ({scene['mode']})…")
        scene_dir = work / scene["id"]
        scene_dir.mkdir()
        mp3 = scene_dir / "vo.mp3"
        wav = scene_dir / "vo.wav"
        synthesize(scene["say"], mp3)
        mp3_to_wav(mp3, wav)
        env = audio_envelope(wav)
        frames_dir = scene_dir / "frames"
        frames_dir.mkdir()
        _, dur = render_scene_frames(scene, poses, env, frames_dir)

        clip = scene_dir / "clip.mp4"
        # encode image sequence + audio
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-framerate", str(FPS),
                "-i", str(frames_dir / "f%04d.png"),
                "-i", str(mp3),
                "-c:v", "libx264", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k",
                "-shortest",
                "-movflags", "+faststart",
                str(clip),
            ],
            check=True,
            capture_output=True,
        )
        clips.append(clip)
        print(f"  done {dur:.1f}s")

    concat = work / "list.txt"
    concat.write_text("".join(f"file '{c}'\n" for c in clips), encoding="utf-8")
    out_mp4 = OUT_DIR / "jordan-g1-math-count-to-three-reel.mp4"
    subprocess.run(
        [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
            "-c:v", "libx264", "-c:a", "aac", "-movflags", "+faststart",
            str(out_mp4),
        ],
        check=True,
        capture_output=True,
    )

    # poster from first frame of first scene
    first = sorted((work / SCENES[0]["id"] / "frames").glob("f*.png"))[0]
    shutil.copy2(first, OUT_DIR / "poster.jpg")
    Image.open(first).convert("RGB").save(OUT_DIR / "poster.jpg", quality=92)

    manifest = {
        "schema": "success-os.jordan-g1-math-avatar-reel.v2",
        "animated": True,
        "features": ["moving-avatar", "talking-poses", "board-writing", "arabic-voiceover"],
        "lesson": {
            "grade": "الصف 1",
            "subject": "الرياضيات",
            "titleAr": "العدّ حتى ثلاثة",
        },
        "teacher": "المعلمة سارة",
        "scenes": [{"id": s["id"], "mode": s["mode"], "say": s["say"]} for s in SCENES],
        "file": str(out_mp4.relative_to(ROOT)),
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT_DIR / "script.ar.md").write_text(
        "# سكربت متحرّك — المعلمة سارة تشرح وتكتب\n\n"
        + "\n\n".join(f"## {s['id']} ({s['mode']})\n{s['say']}" for s in SCENES)
        + "\n",
        encoding="utf-8",
    )

    for name in [
        "jordan-g1-math-count-to-three-reel.mp4",
        "poster.jpg",
        "manifest.json",
        "script.ar.md",
    ]:
        shutil.copy2(OUT_DIR / name, PUBLIC_DIR / name)
        shutil.copy2(OUT_DIR / name, ARTIFACT_DIR / name)

    # convenience aliases at artifacts root
    shutil.copy2(out_mp4, ARTIFACT_DIR / "jordan-g1-math-count-to-three-reel.mp4")
    shutil.copy2(OUT_DIR / "poster.jpg", ARTIFACT_DIR / "jordan-g1-math-poster.jpg")

    # short gif preview
    gif = ARTIFACT_DIR / "jordan-g1-math-reel-preview.gif"
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(out_mp4),
            "-vf", "fps=10,scale=360:-1:flags=lanczos",
            "-t", "10", "-an", str(gif),
        ],
        check=True,
        capture_output=True,
    )

    shutil.rmtree(work, ignore_errors=True)
    print(f"OK animated reel → {out_mp4} ({out_mp4.stat().st_size} bytes)")
    return out_mp4


if __name__ == "__main__":
    render()
