#!/usr/bin/env python3
"""
Composite a HeyGen talking-teacher clip onto the colorful board lesson.

Expects:
  content/media/jordan-g1-colorful-board/jordan-g1-colorful-board-lesson.mp4
  content/media/jordan-g1-colorful-board/heygen/heygen-teacher.mp4

Places the HeyGen teacher in the left stage area (approx x=40..390),
keeps the colorful board + audio from the board lesson (or HeyGen audio).
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "content" / "media" / "jordan-g1-colorful-board"
BOARD = BASE / "jordan-g1-colorful-board-lesson.mp4"
TEACHER = BASE / "heygen" / "heygen-teacher.mp4"
OUT = BASE / "jordan-g1-heygen-board-lesson.mp4"
PUBLIC = ROOT / "public" / "media" / "jordan-g1-colorful-board"
ARTIFACT = Path("/opt/cursor/artifacts")


def die(msg: str):
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(1)


def main():
    if not BOARD.exists():
        die(f"Missing board lesson. Run: npm run media:g1-colorful-board\n  ({BOARD})")
    if not TEACHER.exists():
        die(
            f"Missing HeyGen teacher clip.\n"
            f"Set HEYGEN_* secrets and run: npm run media:heygen-g1-teacher\n"
            f"  ({TEACHER})"
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    ARTIFACT.mkdir(parents=True, exist_ok=True)

    # Scale HeyGen teacher into left stage; chromakey green if present; overlay.
    # Use board audio as master timeline (speech already matches board cues).
    filter_complex = (
        "[1:v]scale=360:-1,chromakey=0x00FF00:0.25:0.08[tg];"
        "[0:v][tg]overlay=x=40:y=140:shortest=1[v]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-i", str(BOARD),
        "-i", str(TEACHER),
        "-filter_complex", filter_complex,
        "-map", "[v]",
        "-map", "0:a?",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        str(OUT),
    ]
    print("Compositing…")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-1200:])
        die("ffmpeg compose failed")

    for dest in (PUBLIC, ARTIFACT):
        dest.mkdir(parents=True, exist_ok=True)
        subprocess.run(["cp", str(OUT), str(dest / OUT.name)], check=True)

    probe = subprocess.run(
        [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", str(OUT),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    info = json.loads(probe.stdout)
    print("=== COMPOSE OK ===")
    print(f"Output: {OUT}")
    print(f"Duration: {float(info['format']['duration']):.1f}s")


if __name__ == "__main__":
    main()
