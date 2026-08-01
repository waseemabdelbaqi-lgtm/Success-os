#!/usr/bin/env python3
"""AI Teacher Factory — Sara & Ali only. Sync packs + refresh catalog."""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "content" / "media" / "ai-teachers"
PUB = ROOT / "public" / "media" / "ai-teachers"
CATALOG = SRC / "catalog.json"
REQUIRED_IDS = ("sara", "ali")


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
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)
    print(f"  synced {teacher_id}: portrait + {len(poses)} poses + extras")
    return poses


def refresh_catalog():
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    by_id = {t["id"]: t for t in data.get("teachers", [])}
    # drop anyone who is not sara/ali
    data["teachers"] = []
    for tid in REQUIRED_IDS:
        if tid not in by_id:
            die(f"catalog missing {tid}")
        t = by_id[tid]
        poses = pose_files(SRC / tid)
        t["poses"] = {Path(p).stem: f"/media/ai-teachers/{tid}/poses/{p}" for p in poses}
        t["portrait"] = f"/media/ai-teachers/{tid}/portrait.png"
        data["teachers"].append(t)
    data["version"] = "2.0.0"
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    CATALOG.write_text(text, encoding="utf-8")
    shutil.copy2(CATALOG, PUB / "catalog.json")
    print("  catalog.json → Sara + Ali only")


def main():
    print("=== AI Teacher Factory (Sara + Ali) ===")
    PUB.mkdir(parents=True, exist_ok=True)
    # remove legacy teacher public folders
    for legacy in ("omar", "layla", "waseem"):
        p = PUB / legacy
        if p.exists():
            shutil.rmtree(p)
            print(f"  removed public/{legacy}")
    for tid in REQUIRED_IDS:
        sync_teacher(tid)
    refresh_catalog()
    print("DONE")


if __name__ == "__main__":
    main()
