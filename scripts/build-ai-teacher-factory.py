#!/usr/bin/env python3
"""
AI Teacher Factory — validate & sync professional teacher packs.

Expects packs under content/media/ai-teachers/<id>/:
  portrait.png
  poses/{talk,point,write,idle}.png  (at least one pose)
  meta.json

Syncs to public/media/ai-teachers/ and refreshes catalog.json pose lists.
Does NOT call paid APIs. New portraits/poses are added via Cursor image gen
(or HeyGen later) then dropped into the pack folders.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "content" / "media" / "ai-teachers"
PUB = ROOT / "public" / "media" / "ai-teachers"
CATALOG = SRC / "catalog.json"

REQUIRED_IDS = ("sara", "omar", "layla", "waseem")


def die(msg: str):
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(1)


def pose_files(teacher_dir: Path) -> list[str]:
    poses = teacher_dir / "poses"
    if not poses.is_dir():
        return []
    return sorted(p.name for p in poses.glob("*.png"))


def sync_teacher(teacher_id: str):
    src = SRC / teacher_id
    if not src.is_dir():
        die(f"Missing teacher pack: {src}")
    portrait = src / "portrait.png"
    if not portrait.exists() or portrait.stat().st_size < 20_000:
        die(f"Missing/small portrait: {portrait}")
    poses = pose_files(src)
    if not poses:
        die(f"No poses for {teacher_id}")

    dest = PUB / teacher_id
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "poses").mkdir(parents=True, exist_ok=True)
    shutil.copy2(portrait, dest / "portrait.png")
    for name in poses:
        shutil.copy2(src / "poses" / name, dest / "poses" / name)
    meta_src = src / "meta.json"
    if meta_src.exists():
        shutil.copy2(meta_src, dest / "meta.json")
    print(f"  synced {teacher_id}: portrait + {len(poses)} poses ({', '.join(poses)})")
    return poses


def refresh_catalog():
    if not CATALOG.exists():
        die(f"Missing {CATALOG}")
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    by_id = {t["id"]: t for t in data.get("teachers", [])}
    for tid in REQUIRED_IDS:
        poses = pose_files(SRC / tid)
        if tid not in by_id:
            die(f"catalog missing teacher {tid}")
        by_id[tid]["poses"] = {Path(p).stem: f"/media/ai-teachers/{tid}/poses/{p}" for p in poses}
        by_id[tid]["portrait"] = f"/media/ai-teachers/{tid}/portrait.png"
    data["teachers"] = list(by_id.values())
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    CATALOG.write_text(text, encoding="utf-8")
    shutil.copy2(CATALOG, PUB / "catalog.json")
    print("  catalog.json refreshed")


def main():
    print("=== AI Teacher Factory ===")
    PUB.mkdir(parents=True, exist_ok=True)
    # keep preview HTML if present
    for tid in REQUIRED_IDS:
        sync_teacher(tid)
    refresh_catalog()
    # copy preview index if in public already
    idx = PUB / "index.html"
    if idx.exists():
        print(f"  preview: /media/ai-teachers/index.html")
    print("DONE — run: npm run validate:ai-teachers")


if __name__ == "__main__":
    main()
