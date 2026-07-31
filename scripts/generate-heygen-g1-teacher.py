#!/usr/bin/env python3
"""
Generate a talking HeyGen teacher clip for the G1 colorful board lesson.

Requires secrets (do NOT commit):
  HEYGEN_API_KEY
  HEYGEN_AVATAR_ID   # digital twin look id OR public avatar id
  HEYGEN_VOICE_ID    # Arabic female voice preferred

Optional:
  HEYGEN_ENGINE=avatar_iv|avatar_v   (default avatar_iv)
  HEYGEN_REMOVE_BG=1                 (default 1 — easier to composite)
  HEYGEN_ASPECT=16:9
  HEYGEN_RESOLUTION=720p

Usage:
  npm run media:heygen-g1-teacher

Then compose onto the board lesson:
  npm run media:compose-heygen-g1
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "content" / "media" / "jordan-g1-colorful-board"
SCRIPT_FILE = BASE / "heygen-script.txt"
OUT_DIR = BASE / "heygen"
ARTIFACT = Path("/opt/cursor/artifacts")
API = "https://api.heygen.com"


def die(msg: str, code: int = 1):
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)


def req(method: str, path: str, payload: dict | None = None):
    key = os.environ.get("HEYGEN_API_KEY", "").strip()
    if not key:
        die(
            "HEYGEN_API_KEY is not set.\n"
            "Add it to Cursor Cloud environment secrets / .env.local, with:\n"
            "  HEYGEN_API_KEY=...\n"
            "  HEYGEN_AVATAR_ID=...\n"
            "  HEYGEN_VOICE_ID=...\n"
            "Get avatar/voice IDs from HeyGen dashboard or:\n"
            "  GET /v3/avatars/looks  and  GET /v3/voices"
        )
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "x-api-key": key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        die(f"HeyGen HTTP {e.code}: {err[:800]}")


def load_script() -> str:
    if SCRIPT_FILE.exists():
        text = SCRIPT_FILE.read_text(encoding="utf-8").strip()
        if text:
            return text
    # fallback inline
    return (
        "مرحبا أصدقائي! أنا المعلمة سارة. اليوم نحكي قصة العد حتى ثلاثة. "
        "هذا واحد. هذا اثنان. وهذا ثلاثة. هيا نعد معا: واحد، اثنان، ثلاثة. أحسنت!"
    )


def require_secrets():
    missing = [
        name
        for name in ("HEYGEN_API_KEY", "HEYGEN_AVATAR_ID", "HEYGEN_VOICE_ID")
        if not os.environ.get(name, "").strip()
    ]
    if missing:
        die(
            "Missing HeyGen secrets: "
            + ", ".join(missing)
            + "\n\nأضفها في Cursor Cloud Secrets أو .env.local ثم أعد تشغيل الأمر:\n"
            "  HEYGEN_API_KEY=...\n"
            "  HEYGEN_AVATAR_ID=...   # من HeyGen → Avatars / Digital Twin look id\n"
            "  HEYGEN_VOICE_ID=...    # صوت عربي نسائي إن أمكن\n\n"
            "بعدها:\n"
            "  npm run media:heygen-g1-teacher\n"
            "  npm run media:compose-heygen-g1"
        )


def create_video(script: str) -> str:
    require_secrets()
    avatar = os.environ.get("HEYGEN_AVATAR_ID", "").strip()
    voice = os.environ.get("HEYGEN_VOICE_ID", "").strip()

    engine = os.environ.get("HEYGEN_ENGINE", "avatar_iv").strip()
    remove_bg = os.environ.get("HEYGEN_REMOVE_BG", "1") not in ("0", "false", "False")
    payload = {
        "type": "avatar",
        "avatar_id": avatar,
        "script": script,
        "voice_id": voice,
        "title": "Success OS — G1 Math Teacher (سارة)",
        "resolution": os.environ.get("HEYGEN_RESOLUTION", "720p"),
        "aspect_ratio": os.environ.get("HEYGEN_ASPECT", "16:9"),
        "remove_background": remove_bg,
        "background": {"value": "#00FF00"},
        "motion_prompt": (
            "Friendly elementary school teacher, clear Arabic teaching gestures, "
            "points toward the board on her left, warm eye contact, natural pauses "
            "after each number example."
        ),
        "voice_settings": {"speed": 1.0, "pitch": 0, "locale": "ar-JO"},
        "output_format": "mp4",
        "engine": {"type": engine},
    }
    print("Creating HeyGen video…")
    print(json.dumps({k: v for k, v in payload.items() if k != "script"}, ensure_ascii=False, indent=2))
    data = req("POST", "/v3/videos", payload)
    video_id = data.get("data", {}).get("video_id") or data.get("data", {}).get("id") or data.get("id")
    if not video_id:
        die(f"No video_id in response: {json.dumps(data)[:500]}")
    print(f"video_id={video_id}")
    return video_id


def poll(video_id: str) -> dict:
    print("Polling HeyGen status…")
    for i in range(120):  # up to ~20 min
        data = req("GET", f"/v3/videos/{video_id}")
        info = data.get("data") or data
        status = info.get("status")
        print(f"  [{i}] status={status}")
        if status == "completed":
            return info
        if status == "failed":
            die(f"HeyGen failed: {info.get('failure_message') or info}")
        time.sleep(10)
    die("Timed out waiting for HeyGen video")


def download(url: str, dest: Path):
    print(f"Downloading → {dest}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, dest)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT.mkdir(parents=True, exist_ok=True)
    script = load_script()
    (OUT_DIR / "request-script.txt").write_text(script + "\n", encoding="utf-8")

    # Dry discovery helpers
    if "--list-voices" in sys.argv:
        data = req("GET", "/v3/voices")
        print(json.dumps(data, ensure_ascii=False, indent=2)[:8000])
        return
    if "--list-avatars" in sys.argv:
        data = req("GET", "/v3/avatars/looks?ownership=private")
        print(json.dumps(data, ensure_ascii=False, indent=2)[:8000])
        return

    video_id = create_video(script)
    info = poll(video_id)
    url = info.get("video_url")
    if not url:
        die(f"completed but no video_url: {json.dumps(info)[:500]}")

    dest = OUT_DIR / "heygen-teacher.mp4"
    download(url, dest)
    meta = {
        "video_id": video_id,
        "duration": info.get("duration"),
        "thumbnail_url": info.get("thumbnail_url"),
        "gif_url": info.get("gif_url"),
        "provider": "heygen",
        "local_path": str(dest.relative_to(ROOT)),
    }
    (OUT_DIR / "heygen-meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
    download(url, ARTIFACT / "heygen-g1-teacher.mp4")
    print("=== DONE ===")
    print(json.dumps(meta, ensure_ascii=False, indent=2))
    print("Compose onto board with: npm run media:compose-heygen-g1")


if __name__ == "__main__":
    main()
