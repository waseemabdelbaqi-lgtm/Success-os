#!/usr/bin/env python3
"""
Sara 10s Demo — continuous speech-synced render (NOT Ken-Burns collage).

Pipeline:
1) Fresh edge-tts for the mandatory English closing line
2) Per-frame mouth energy from audio RMS → blend closed/open/wide
3) Continuous body/camera beats: enter → look → smile → speak → walk → hold
4) Blink + breath + micro head motion locked to the same clock as audio

Output: public/media/ai-teachers/sara/demo/sara-10s.mp4
"""
from __future__ import annotations

import asyncio
import json
import math
import os
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
SARA = ROOT / "public/media/ai-teachers/sara"
DEMO = SARA / "demo"
WORK = DEMO / "_render_work"
OUT_MP4 = DEMO / "sara-10s.mp4"
OUT_MP3 = DEMO / "welcome-success-os.mp3"
VERDICT = DEMO / "QUALITY_VERDICT.json"

LINE = "Welcome to Success OS. I'm Sara, and I'll be your teacher."
VOICE = "en-US-JennyNeural"  # original Sara English voice (not a real teacher likeness)
FPS = 30
WIDTH, HEIGHT = 1280, 720
DURATION_S = 10.0
TOTAL_FRAMES = int(DURATION_S * FPS)
SPEECH_START_S = 2.6  # enter/look/smile first, then speak


def load_rgb(path: Path) -> Image.Image:
    return Image.open(path).convert("RGB")


def fit_cover(im: Image.Image, tw: int, th: int, zoom: float = 1.0, pan_x: float = 0.0, pan_y: float = 0.0) -> Image.Image:
    """Cover-fit with optional zoom (>1) and pan offsets in [-1,1]."""
    zoom = max(1.0, zoom)
    src_w, src_h = im.size
    scale = max(tw / src_w, th / src_h) * zoom
    nw, nh = max(1, int(src_w * scale)), max(1, int(src_h * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    max_x = max(0, nw - tw)
    max_y = max(0, nh - th)
    cx = max_x / 2 + pan_x * (max_x / 2)
    cy = max_y / 2 + pan_y * (max_y / 2)
    left = int(np.clip(cx, 0, max_x))
    top = int(np.clip(cy, 0, max_y))
    return resized.crop((left, top, left + tw, top + th))


def blend(a: Image.Image, b: Image.Image, t: float) -> Image.Image:
    t = float(np.clip(t, 0.0, 1.0))
    if t <= 0:
        return a
    if t >= 1:
        return b
    return Image.blend(a, b, t)


def ease_in_out(t: float) -> float:
    t = float(np.clip(t, 0.0, 1.0))
    return t * t * (3 - 2 * t)


async def synthesize_voice(out_mp3: Path) -> None:
    import edge_tts

    # Slightly paced for classroom greeting clarity
    communicate = edge_tts.Communicate(LINE, VOICE, rate="-8%", pitch="+1Hz")
    await communicate.save(str(out_mp3))
    if not out_mp3.exists() or out_mp3.stat().st_size < 1000:
        raise RuntimeError("edge-tts produced empty audio")


def mp3_to_wav(mp3: Path, wav: Path) -> None:
    r = subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(mp3),
            "-ac", "1", "-ar", "24000",
            str(wav),
        ],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        raise RuntimeError(r.stderr or "ffmpeg mp3→wav failed")


def audio_envelope(wav_path: Path, fps: int, speech_start_s: float, total_frames: int) -> np.ndarray:
    """RMS energy per output frame (0..1), aligned to full 10s timeline."""
    with wave.open(str(wav_path), "rb") as w:
        rate = w.getframerate()
        n = w.getnframes()
        raw = w.readframes(n)
        samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

    hop = max(1, int(rate / fps))
    speech_frames = int(math.ceil(len(samples) / hop))
    env = np.zeros(speech_frames, dtype=np.float32)
    for i in range(speech_frames):
        chunk = samples[i * hop : (i + 1) * hop]
        if chunk.size:
            env[i] = float(np.sqrt(np.mean(chunk * chunk)))

    if env.max() > 1e-6:
        # Soft normalize + slight compression so consonants pop
        env = env / (np.percentile(env, 92) + 1e-6)
        env = np.clip(env, 0, 1) ** 0.85

    # Place on full timeline
    full = np.zeros(total_frames, dtype=np.float32)
    start = int(speech_start_s * fps)
    end = min(total_frames, start + len(env))
    full[start:end] = env[: end - start]
    # Light temporal smooth so lips don't chatter
    kernel = np.array([0.15, 0.2, 0.3, 0.2, 0.15], dtype=np.float32)
    padded = np.pad(full, (2, 2), mode="edge")
    smooth = np.convolve(padded, kernel, mode="valid")
    return smooth.astype(np.float32)


def _feather_mouth_mask(h: int, w: int) -> np.ndarray:
    """Soft elliptical mask over the lower face (mouth/jaw) — avoids full-frame ghosting."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cy, cx = h * 0.66, w * 0.50
    ry, rx = h * 0.14, w * 0.18
    dist = ((yy - cy) / ry) ** 2 + ((xx - cx) / rx) ** 2
    mask = np.clip(1.0 - (dist - 0.55) / 0.55, 0.0, 1.0)
    mask = np.where(dist <= 0.55, 1.0, mask)
    mask = np.where(dist >= 1.1, 0.0, mask)
    # blur-ish by box average
    k = 21
    pad = k // 2
    padded = np.pad(mask, pad, mode="edge")
    acc = np.zeros_like(mask)
    for dy in range(k):
        for dx in range(k):
            acc += padded[dy : dy + h, dx : dx + w]
    return (acc / (k * k)).astype(np.float32)


_MOUTH_MASK: np.ndarray | None = None


def mouth_from_energy(
    closed: Image.Image,
    opened: Image.Image,
    wide: Image.Image,
    energy: float,
) -> Image.Image:
    """Composite visemes only in the mouth ROI so the rest of the face stays sharp."""
    global _MOUTH_MASK
    e = float(np.clip(energy, 0.0, 1.0))
    # Discrete-ish plate choice with small local blend — reduces ghost lips
    if e < 0.14:
        base, alt, t = closed, opened, e / 0.14 * 0.45
    elif e < 0.48:
        base, alt, t = opened, closed, 0.15 * (1.0 - (e - 0.14) / 0.34)
    else:
        base, alt, t = (wide if e > 0.72 else opened), wide, min(1.0, (e - 0.48) / 0.35)

    if t <= 0.02:
        return base

    a = np.asarray(base, dtype=np.float32)
    b = np.asarray(alt, dtype=np.float32)
    h, w, _ = a.shape
    if _MOUTH_MASK is None or _MOUTH_MASK.shape != (h, w):
        _MOUTH_MASK = _feather_mouth_mask(h, w)
    m = _MOUTH_MASK[..., None] * float(t)
    out = a * (1.0 - m) + b * m
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def pick_body_base(
    t: float,
    stand: Image.Image,
    point: Image.Image,
    gesture: Image.Image,
    write: Image.Image,
    closed: Image.Image,
) -> tuple[Image.Image, float, float, float]:
    """
    Returns (image, zoom, pan_x, pan_y) for body/camera beat at time t seconds.
    Uses DISTINCT plates only (stand/point/write/gesture/closed) — idle/talk were duplicates.
    """
    # Enter: classroom wide → push in
    if t < 1.5:
        k = ease_in_out(t / 1.5)
        return stand, 1.14 - 0.10 * k, -0.22 + 0.22 * k, 0.12 - 0.10 * k
    # Look at camera: blend stand → mouth-closed (flagship eye contact)
    if t < 2.35:
        k = ease_in_out((t - 1.5) / 0.85)
        img = blend(stand, closed, k)
        return img, 1.04 + 0.06 * k, 0.0, -0.04 * k
    # Smile / pre-speech hold on closed plate
    if t < SPEECH_START_S:
        return closed, 1.10, 0.0, -0.06
    speech_end = SPEECH_START_S + 5.2
    if t < speech_end:
        # Mid-line gesture beat ("I'm Sara")
        mid = SPEECH_START_S + 2.15
        if abs(t - mid) < 0.75:
            k = 1.0 - abs(t - mid) / 0.75
            img = blend(closed, gesture, 0.65 * ease_in_out(k))
            return img, 1.11 + 0.03 * k, 0.05 * k, -0.05
        return closed, 1.11, 0.0, -0.05
    # Walk / board point
    if t < 8.5:
        k = ease_in_out((t - speech_end) / max(0.01, 8.5 - speech_end))
        img = blend(closed, point, k)
        return img, 1.08 - 0.04 * k, 0.10 * k, 0.02
    # Settle write → stand
    if t < 9.3:
        k = ease_in_out((t - 8.5) / 0.8)
        img = blend(point, write, k)
        return img, 1.04, 0.08 - 0.04 * k, 0.02
    k = ease_in_out((t - 9.3) / 0.7)
    img = blend(write, stand, k)
    return img, 1.03 - 0.01 * k, 0.02 - 0.02 * k, 0.0


def maybe_blink(base: Image.Image, blink: Image.Image, half: Image.Image, t: float) -> Image.Image:
    # Natural blinks around 1.1s, 4.8s, 7.9s
    centers = (1.15, 4.85, 7.95)
    for c in centers:
        d = abs(t - c)
        if d < 0.08:
            # closing
            return blend(base, half, 1.0 - d / 0.08)
        if 0.08 <= d < 0.14:
            return blend(half, blink, (d - 0.08) / 0.06)
        if 0.14 <= d < 0.22:
            return blend(blink, half, (d - 0.14) / 0.08)
    return base


def render_frames(env: np.ndarray) -> Path:
    frames_dir = WORK / "frames"
    if frames_dir.exists():
        shutil.rmtree(frames_dir)
    frames_dir.mkdir(parents=True)

    closed = load_rgb(SARA / "flagship/mouth-closed.png")
    opened = load_rgb(SARA / "flagship/mouth-open.png")
    wide = load_rgb(SARA / "flagship/mouth-wide.png")
    gesture = load_rgb(SARA / "flagship/gesture.png")
    stand = load_rgb(SARA / "classroom/stand.png")
    point = load_rgb(SARA / "classroom/point.png")
    write = load_rgb(SARA / "classroom/write.png")
    blink = load_rgb(SARA / "alive/blink.png")
    half = load_rgb(SARA / "alive/half.png")

    # Same crop for all flagship mouth plates (must match for ROI composite)
    MZ, MY = 1.14, -0.10
    mouth_closed = fit_cover(closed, WIDTH, HEIGHT, zoom=MZ, pan_y=MY)
    mouth_open = fit_cover(opened, WIDTH, HEIGHT, zoom=MZ, pan_y=MY)
    mouth_wide = fit_cover(wide, WIDTH, HEIGHT, zoom=MZ, pan_y=MY)

    for i in range(TOTAL_FRAMES):
        t = i / FPS
        energy = float(env[i]) if i < len(env) else 0.0

        body, zoom, pan_x, pan_y = pick_body_base(
            t, stand, point, gesture, write, closed
        )

        # During speech: flagship mouth plates driven by audio energy
        if SPEECH_START_S <= t <= SPEECH_START_S + 5.4:
            breath = 0.01 * math.sin(t * 2.1 * math.pi)
            bob_x = 0.012 * math.sin(t * 1.55 * math.pi) * (0.3 + energy)
            bob_y = -0.008 * energy + breath
            frame = mouth_from_energy(mouth_closed, mouth_open, mouth_wide, energy)
            pulse = 1.0 + 0.01 * energy
            w2, h2 = int(WIDTH * pulse), int(HEIGHT * pulse)
            frame = frame.resize((w2, h2), Image.Resampling.BILINEAR)
            left = max(0, (w2 - WIDTH) // 2 + int(bob_x * 14))
            top = max(0, (h2 - HEIGHT) // 2 + int(bob_y * 14))
            frame = frame.crop((left, top, left + WIDTH, top + HEIGHT))
            if frame.size != (WIDTH, HEIGHT):
                frame = frame.resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
            if t < SPEECH_START_S + 0.7:
                frame = ImageEnhance.Brightness(frame).enhance(1.025)
            for c in (3.55, 6.35):
                d = abs(t - c)
                if d < 0.10:
                    # eyelid-only hint: slight darken via half plate ROI
                    bimg = fit_cover(half, WIDTH, HEIGHT, zoom=MZ, pan_y=MY)
                    frame = blend(frame, bimg, 0.35 * (1.0 - d / 0.10))
        else:
            z = zoom + 0.008 * math.sin(t * 1.25)
            frame = fit_cover(body, WIDTH, HEIGHT, zoom=z, pan_x=pan_x, pan_y=pan_y)
            frame = maybe_blink(
                frame,
                fit_cover(blink, WIDTH, HEIGHT, zoom=z, pan_x=pan_x, pan_y=pan_y),
                fit_cover(half, WIDTH, HEIGHT, zoom=z, pan_x=pan_x, pan_y=pan_y),
                t,
            )

        if t < 0.5:
            frame = blend(
                Image.new("RGB", (WIDTH, HEIGHT), (8, 12, 22)),
                frame,
                ease_in_out(t / 0.5),
            )
        if t > DURATION_S - 0.4:
            frame = blend(
                frame,
                Image.new("RGB", (WIDTH, HEIGHT), (8, 12, 22)),
                ease_in_out((t - (DURATION_S - 0.4)) / 0.4),
            )

        frame.save(frames_dir / f"f{i:04d}.png", optimize=False)
        if i % 30 == 0:
            print(f"  frame {i}/{TOTAL_FRAMES} t={t:.2f}s e={energy:.2f}", flush=True)

    return frames_dir


def mux(frames_dir: Path, mp3: Path, out_mp4: Path) -> None:
    # Build silent video from frames, then mux audio delayed to SPEECH_START_S
    silent = WORK / "silent.mp4"
    r = subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-framerate", str(FPS),
            "-i", str(frames_dir / "f%04d.png"),
            "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-t", str(DURATION_S),
            str(silent),
        ],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        raise RuntimeError(r.stderr or "ffmpeg frames failed")

    delay_ms = int(SPEECH_START_S * 1000)
    r = subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(silent),
            "-i", str(mp3),
            "-filter_complex",
            f"[1:a]adelay={delay_ms}|{delay_ms},apad=whole_dur={DURATION_S}[a]",
            "-map", "0:v", "-map", "[a]",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            "-t", str(DURATION_S),
            "-movflags", "+faststart",
            str(out_mp4),
        ],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        raise RuntimeError(r.stderr or "ffmpeg mux failed")


def write_verdict(method: str, bytes_size: int, duration: float) -> None:
    payload = {
        "schema": "success-os.sara-10s-demo-verdict.v1",
        "artifact": "/media/ai-teachers/sara/demo/sara-10s.mp4",
        "status": "REJECTED",
        "passed": False,
        "reason": (
            "Rebuilt from scratch as continuous 30fps speech-synced frames "
            "(audio RMS → mouth closed/open/wide + enter/look/smile/walk beats). "
            "NOT Ken-Burns collage. Still NOT Final Acceptance — owner live Demo "
            "and photorealism/lipsync gates must pass; Canva Connect API unavailable "
            "in this environment (no OAuth token)."
        ),
        "forbiddenAsEvidence": True,
        "cannotUnlockAcceptance": True,
        "replacedCollage": True,
        "method": method,
        "bytes": bytes_size,
        "durationSec": duration,
        "speechLine": LINE,
        "speechStartSec": SPEECH_START_S,
        "fps": FPS,
        "canva": {
            "requested": True,
            "available": False,
            "reason": "No CANVA_ACCESS_TOKEN / Canva MCP in cloud agent. Brief + assets packed under demo/canva-pack/",
            "site": "https://www.canva.com/",
        },
        "requiredNext": [
            "Owner review of continuous speech-synced MP4 (not collage)",
            "Optional: import canva-pack into Canva Video and re-export Pro MP4",
            "Photorealism ≥95 and lipsync ≥95 before Final Acceptance",
            "Public URL must remain a direct MP4 link",
        ],
        "updatedAt": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
    }
    VERDICT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def pack_canva_assets() -> None:
    """Brief only — do NOT duplicate large PNGs (use existing Sara asset paths)."""
    pack = DEMO / "canva-pack"
    pack.mkdir(parents=True, exist_ok=True)
    # Remove any previously copied duplicate PNGs
    for p in pack.glob("*.png"):
        p.unlink()
    if OUT_MP3.exists():
        shutil.copy2(OUT_MP3, pack / "welcome-success-os.mp3")
    brief = pack / "CANVA_BRIEF.md"
    brief.write_text(
        f"""# Canva — Sara 10s (owner import)

Site: https://www.canva.com/

## Goal
10s educational studio video of **original** teacher Sara saying:

> {LINE}

## Upload these existing assets (no copies in this pack)
From `public/media/ai-teachers/sara/`:
- `flagship/mouth-closed.png` · `mouth-open.png` · `mouth-wide.png` · `gesture.png`
- `classroom/stand.png` · `point.png` · `write.png`
- `alive/blink.png`
- Audio: `demo/canva-pack/welcome-success-os.mp3` (or `demo/welcome-success-os.mp3`)

## Steps in Canva Video
1. Create **Video** → 1920×1080 (or 1280×720)
2. Upload the assets above
3. Timeline (continuous motion, not collage cuts):
   - 0.0–1.5s `stand.png` enter (slow zoom in)
   - 1.5–2.6s `mouth-closed.png` look + smile
   - 2.6–~8.0s animate mouth plates on beat with the MP3 (closed→open→wide)
   - Blink flashes ~3.5s and ~6.4s
   - Mid-line briefly `gesture.png`
   - 8.0–10s `point.png` → `write.png` → `stand.png`
4. Place audio starting at **2.6s**
5. Export **MP4 1080p** → replace `public/media/ai-teachers/sara/demo/sara-10s.mp4`

## API note
Cloud agent has **no Canva OAuth token** / no Canva MCP. To automate: set `CANVA_ACCESS_TOKEN` and use Canva Connect export (`mp4` / `horizontal_1080p`).
""",
        encoding="utf-8",
    )


def cleanup_duplicates() -> None:
    """Remove rejected/duplicate demo mirrors and temp dirs."""
    mirror = ROOT / "content/media/ai-teachers/sara/demo/sara-10s.mp4"
    if mirror.exists():
        mirror.unlink()
        print("removed duplicate", mirror)
    mirror_dir = ROOT / "content/media/ai-teachers/sara/demo"
    if mirror_dir.exists() and not any(mirror_dir.iterdir()):
        mirror_dir.rmdir()
    old_ffmpeg = DEMO / "_ffmpeg"
    if old_ffmpeg.exists():
        shutil.rmtree(old_ffmpeg, ignore_errors=True)


def main() -> int:
    DEMO.mkdir(parents=True, exist_ok=True)
    if WORK.exists():
        shutil.rmtree(WORK)
    WORK.mkdir(parents=True)

    print("1) TTS…", flush=True)
    asyncio.run(synthesize_voice(OUT_MP3))

    wav = WORK / "voice.wav"
    print("2) WAV + envelope…", flush=True)
    mp3_to_wav(OUT_MP3, wav)
    env = audio_envelope(wav, FPS, SPEECH_START_S, TOTAL_FRAMES)

    print("3) Frames (speech-synced)…", flush=True)
    frames_dir = render_frames(env)

    print("4) Mux MP4…", flush=True)
    if OUT_MP4.exists():
        OUT_MP4.unlink()
    mux(frames_dir, OUT_MP3, OUT_MP4)

    print("5) Canva pack + cleanup…", flush=True)
    pack_canva_assets()
    cleanup_duplicates()

    # probe
    probe = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration,size",
            "-of", "default=nw=1",
            str(OUT_MP4),
        ],
        capture_output=True,
        text=True,
    )
    print(probe.stdout.strip())
    size = OUT_MP4.stat().st_size
    write_verdict(
        method="frame-blend-lipsync-v1 (flagship mouth plates + RMS envelope + body beats)",
        bytes_size=size,
        duration=DURATION_S,
    )

    # drop heavy frame PNGs but keep script reproducible
    shutil.rmtree(WORK, ignore_errors=True)
    print("OK", OUT_MP4, size)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print("FAIL:", e, file=sys.stderr)
        raise
