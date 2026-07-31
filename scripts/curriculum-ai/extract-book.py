#!/usr/bin/env python3
"""
Local Jordan curriculum PDF extraction pipeline (Step 2).

Tools (local only):
  - PyMuPDF (fitz): text + page structure
  - pdfplumber: tables
  - Tesseract ara+eng: OCR only when embedded text is unreliable
  - Ollama qwen3:8b on 127.0.0.1:11434: classification only (optional batches)

Does NOT invent units/lessons. Does NOT call external AI APIs.
Does NOT generate explanations/examples/quizzes.
Supports resume via checkpoints/progress.json.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF
import pdfplumber

try:
    import pytesseract
    from PIL import Image
except Exception:  # pragma: no cover
    pytesseract = None
    Image = None

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOOK_DIR = ROOT / "data" / "curriculum-ai" / "jordan" / "g1-s1-math-student"
OLLAMA = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:8b")
QWEN_SYSTEM = (
    "اعتمد فقط على النص والصفحات المرفقة. "
    "لا تخترع وحدات أو دروساً أو معلومات مفقودة. "
    "إذا لم تكن متأكداً ضع NEEDS_REVIEW."
)
MIN_TEXT_CHARS = 40


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def arabic_char_ratio(text: str) -> float:
    if not text:
        return 0.0
    arabic = len(re.findall(r"[\u0600-\u06FF]", text))
    return arabic / max(len(text), 1)


def normalize_text(text: str) -> str:
    # Preserve Arabic order; normalize whitespace only.
    text = text.replace("\u200f", "").replace("\u200e", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_tables(pdf_path: Path, page_index: int) -> list[dict[str, Any]]:
    tables: list[dict[str, Any]] = []
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            if page_index >= len(pdf.pages):
                return tables
            page = pdf.pages[page_index]
            for ti, table in enumerate(page.extract_tables() or []):
                tables.append({"index": ti, "rows": table})
    except Exception as exc:
        tables.append({"index": 0, "error": str(exc)[:200]})
    return tables


def page_needs_ocr(text: str, page: fitz.Page) -> bool:
    clean = normalize_text(text)
    if len(clean) >= MIN_TEXT_CHARS and arabic_char_ratio(clean) >= 0.05:
        return False
    # Image-heavy / empty text pages
    if len(clean) < MIN_TEXT_CHARS:
        return True
    return False


def ocr_page(page: fitz.Page) -> tuple[str, float | None, list[str]]:
    warnings: list[str] = []
    if pytesseract is None or Image is None:
        return "", None, ["tesseract_or_pillow_unavailable"]
    try:
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        data = pytesseract.image_to_data(img, lang="ara+eng", output_type=pytesseract.Output.DICT)
        confs = [float(c) for c in data.get("conf", []) if str(c).lstrip("-").isdigit() and float(c) >= 0]
        text = pytesseract.image_to_string(img, lang="ara+eng")
        avg = sum(confs) / len(confs) if confs else None
        return normalize_text(text), avg, warnings
    except Exception as exc:
        warnings.append(f"ocr_failed:{str(exc)[:160]}")
        return "", None, warnings


def detect_headings(text: str) -> list[str]:
    headings = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if re.search(r"(الوحدة|درس|المحتويات|الفهرس|مقدمة|مراجعة|تمارين|أنشطة)", line):
            headings.append(line)
        elif len(line) <= 60 and arabic_char_ratio(line) > 0.4:
            # Short Arabic lines often headings — mark low confidence later
            if re.match(r"^[\u0600-\u06FF0-9\s\-:]+$", line):
                headings.append(line)
    # unique preserve order
    seen = set()
    out = []
    for h in headings:
        if h not in seen:
            seen.add(h)
            out.append(h)
    return out[:40]


def detect_content_flags(text: str) -> dict[str, bool]:
    return {
        "hasActivity": bool(re.search(r"نشاط|أنشطة|نشاطات", text)),
        "hasExercise": bool(re.search(r"تمرين|تمارين|تدريب|أسئلة", text)),
        "hasFormula": bool(re.search(r"[=+\-×÷]|\\frac|\d\s*[+\-×÷]\s*\d", text)),
    }


def ollama_classify(batch: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Controlled classification only — never invent missing content."""
    compact = []
    for p in batch:
        compact.append(
            {
                "pdfPageIndex": p["pdfPageIndex"],
                "officialPageNumber": p.get("officialPageNumber"),
                "headings": p.get("headings", [])[:12],
                "textPreview": (p.get("text") or "")[:900],
            }
        )
    prompt = (
        "صنّف الصفحات التالية فقط إلى أنواع محتوى وحدود وحدات/دروس إن وُجدت صراحة في النص.\n"
        "أرجع JSON فقط بالشكل:\n"
        '{"pages":[{"pdfPageIndex":0,"contentType":"lesson|unit_start|toc|cover|front_matter|exercises|other","unitTitle":"","lessonTitle":"","confidence":"high|medium|low|NEEDS_REVIEW","notes":""}]}\n'
        f"الصفحات:\n{json.dumps(compact, ensure_ascii=False)}"
    )
    body = {
        "model": MODEL,
        "stream": False,
        "think": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": QWEN_SYSTEM},
            {"role": "user", "content": prompt},
        ],
        "options": {"temperature": 0, "num_predict": 1200},
    }
    try:
        req = urllib.request.Request(
            f"{OLLAMA}/api/chat",
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=300) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        text = (payload.get("message") or {}).get("content") or ""
        return json.loads(text)
    except Exception as exc:
        return {"error": str(exc)[:200], "pages": []}


def load_progress(book_dir: Path) -> dict[str, Any]:
    path = book_dir / "extraction" / "checkpoints" / "progress.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {"lastCompletedPage": 0, "updatedAt": None}


def save_progress(book_dir: Path, last_page: int) -> None:
    path = book_dir / "extraction" / "checkpoints" / "progress.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {"lastCompletedPage": last_page, "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def build_structure_from_pages(pages: list[dict[str, Any]], meta: dict[str, Any]) -> dict[str, Any]:
    """Heuristic structure from headings + Qwen classifications — never invents titles without evidence."""
    special = []
    units: list[dict[str, Any]] = []
    current_unit: dict[str, Any] | None = None
    current_lesson: dict[str, Any] | None = None
    warnings: list[str] = []
    review_pages: list[int] = []

    for p in pages:
        idx = p["pdfPageIndex"]
        official = p.get("officialPageNumber") or (idx + 1)
        headings = p.get("headings") or []
        cls = p.get("classification") or {}
        content_type = cls.get("contentType") or "other"
        conf = cls.get("confidence") or "NEEDS_REVIEW"

        if conf == "NEEDS_REVIEW" or p.get("extractionWarnings"):
            review_pages.append(official)

        joined_head = " | ".join(headings)
        unit_match = re.search(r"(الوحدة\s+[^\n|]+)", joined_head)
        lesson_match = re.search(r"(الدرس\s+[^\n|]+|درس\s+[^\n|]+)", joined_head)

        unit_title = (cls.get("unitTitle") or "").strip()
        lesson_title = (cls.get("lessonTitle") or "").strip()
        if unit_match and not unit_title:
            unit_title = unit_match.group(1).strip()
        if lesson_match and not lesson_title:
            lesson_title = lesson_match.group(1).strip()

        # Reject invented-looking empty promotions
        if unit_title.upper() == "NEEDS_REVIEW":
            unit_title = ""
        if lesson_title.upper() == "NEEDS_REVIEW":
            lesson_title = ""

        if content_type in {"cover", "front_matter", "toc", "introduction", "glossary", "answer_section", "back_matter"}:
            mapped = {
                "toc": "table_of_contents",
                "introduction": "introduction",
                "cover": "cover",
                "front_matter": "front_matter",
                "glossary": "glossary",
                "answer_section": "answer_section",
                "back_matter": "back_matter",
            }.get(content_type, "other")
            title = headings[0] if headings else content_type
            special.append(
                {"type": mapped, "title": title, "startPage": official, "endPage": official}
            )

        if unit_title:
            if current_unit and current_unit["title"] != unit_title:
                if current_lesson:
                    current_unit["lessons"].append(current_lesson)
                    current_lesson = None
                current_unit["endPage"] = max(current_unit["endPage"], official - 1 if official > 1 else official)
                units.append(current_unit)
                current_unit = None
            if not current_unit:
                current_unit = {
                    "title": unit_title,
                    "startPage": official,
                    "endPage": official,
                    "lessons": [],
                    "confidence": conf if conf != "NEEDS_REVIEW" else "NEEDS_REVIEW",
                }
            else:
                current_unit["endPage"] = official

        if lesson_title and current_unit:
            if current_lesson and current_lesson["title"] != lesson_title:
                current_unit["lessons"].append(current_lesson)
                current_lesson = None
            if not current_lesson:
                current_lesson = {
                    "title": lesson_title,
                    "startPage": official,
                    "endPage": official,
                    "sections": [],
                    "confidence": conf if conf != "NEEDS_REVIEW" else "NEEDS_REVIEW",
                }
            else:
                current_lesson["endPage"] = official
        elif current_lesson:
            current_lesson["endPage"] = official
        elif current_unit:
            current_unit["endPage"] = official

    if current_lesson and current_unit:
        current_unit["lessons"].append(current_lesson)
    if current_unit:
        units.append(current_unit)

    if not units:
        warnings.append("No units detected from headings/classification — structure incomplete or NEEDS_REVIEW.")

    parts = []
    if units:
        parts.append(
            {
                "title": "المحتوى الرئيسي",
                "startPage": units[0]["startPage"],
                "endPage": units[-1]["endPage"],
                "units": units,
            }
        )

    text_pages = sum(1 for p in pages if p.get("textSource") == "embedded")
    ocr_pages = sum(1 for p in pages if p.get("textSource") == "ocr")
    extracted = len(pages)
    total = meta.get("pageCount") or extracted
    missing = [i for i in range(1, total + 1) if i not in {p.get("officialPageNumber") or (p["pdfPageIndex"] + 1) for p in pages}]

    return {
        "book": meta,
        "parts": parts,
        "specialSections": special,
        "extractionWarnings": warnings + [w for p in pages for w in (p.get("extractionWarnings") or [])],
        "pagesNeedingReview": sorted(set(review_pages)),
        "pageCoverage": {
            "totalPdfPages": total,
            "extractedPages": extracted,
            "textPages": text_pages,
            "ocrPages": ocr_pages,
            "missingPages": missing,
        },
        "structureComparison": {
            "tocSource": "visible headings + optional Qwen classification",
            "result": "NOT_RUN" if missing or not units else "FAIL",
            "notes": [
                "Automated comparison requires human TOC verification on the admin review page.",
            ],
        },
        "processing": {
            "status": "needs_review" if pages else "blocked_acquisition",
            "lastCompletedPage": extracted,
            "resumable": True,
        },
    }


def extract_book(pdf_path: Path, book_dir: Path, batch_size: int = 4, use_qwen: bool = True) -> dict[str, Any]:
    started = time.time()
    pages_dir = book_dir / "extraction" / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    progress = load_progress(book_dir)
    start_from = int(progress.get("lastCompletedPage") or 0)

    doc = fitz.open(str(pdf_path))
    page_count = doc.page_count
    meta = {
        "officialTitle": "",
        "country": "Jordan",
        "curriculum": "Jordanian National Curriculum",
        "grade": "1",
        "semester": "1",
        "subject": "Mathematics",
        "bookType": "Student Book",
        "edition": "",
        "academicYear": "",
        "authority": "المركز الوطني لتطوير المناهج (NCCD)",
        "officialSourceUrl": "",
        "rightsStatus": "",
        "fileSizeBytes": pdf_path.stat().st_size,
        "pageCount": page_count,
        "sha256": sha256_file(pdf_path),
        "language": "ar",
        "verificationStatus": "pending",
    }

    acquisition = book_dir / "acquisition.json"
    if acquisition.exists():
        acq = json.loads(acquisition.read_text(encoding="utf-8"))
        meta["officialTitle"] = acq.get("officialTitleAr") or meta["officialTitle"]
        meta["officialSourceUrl"] = acq.get("officialSourceUrl") or ""
        meta["rightsStatus"] = acq.get("rightsStatus") or ""
        meta["edition"] = acq.get("editionHint") or ""
        meta["catalogUrl"] = acq.get("catalogUrl")
        meta["authority"] = acq.get("authority") or meta["authority"]

    # Reject incomplete PDF (no %%EOF)
    raw = pdf_path.read_bytes()
    if b"%%EOF" not in raw[-4096:]:
        raise SystemExit("PDF_INCOMPLETE_REJECTED: missing %%EOF trailer — do not extract truncated captures.")

    print(f"Extracting pages {start_from + 1}..{page_count} from {pdf_path.name}", flush=True)

    pending_batch: list[dict[str, Any]] = []
    all_pages: list[dict[str, Any]] = []

    # Load already completed pages for resume without duplication
    for i in range(start_from):
        existing = pages_dir / f"page-{i + 1:04d}.json"
        if existing.exists():
            all_pages.append(json.loads(existing.read_text(encoding="utf-8")))

    for i in range(start_from, page_count):
        page = doc[i]
        embedded = normalize_text(page.get_text("text"))
        warnings: list[str] = []
        text_source = "embedded"
        ocr_confidence = None
        text = embedded

        if page_needs_ocr(embedded, page):
            ocr_text, ocr_confidence, ocr_warnings = ocr_page(page)
            warnings.extend(ocr_warnings)
            if ocr_text and len(ocr_text) > len(embedded):
                text = ocr_text
                text_source = "ocr"
            elif not embedded:
                text = ocr_text
                text_source = "ocr" if ocr_text else "empty"
                if not ocr_text:
                    warnings.append("no_usable_text")
        else:
            # Do not OCR when embedded text is reliable
            pass

        images = []
        for img_i, img in enumerate(page.get_images(full=True) or []):
            images.append({"index": img_i, "xref": img[0]})

        drawings = page.get_drawings()
        tables = extract_tables(pdf_path, i)
        headings = detect_headings(text)
        flags = detect_content_flags(text)

        # Official page number heuristic: look for trailing digits in text
        official = i + 1
        m = re.findall(r"(?m)^\s*(\d{1,3})\s*$", text)
        if m:
            try:
                candidate = int(m[-1])
                if 1 <= candidate <= page_count + 50:
                    official = candidate
            except ValueError:
                pass

        record = {
            "pdfPageIndex": i,
            "officialPageNumber": official,
            "text": text,
            "headings": headings,
            "tables": tables,
            "images": images,
            "diagrams": [{"count": len(drawings)}] if drawings else [],
            "graphs": [],
            "formulas": [],
            "activities": flags["hasActivity"],
            "exercises": flags["hasExercise"],
            "detectedUnit": None,
            "detectedLesson": None,
            "ocrConfidence": ocr_confidence,
            "textSource": text_source,
            "extractionWarnings": warnings,
            "flags": flags,
        }
        pending_batch.append(record)

        if use_qwen and (len(pending_batch) >= batch_size or i == page_count - 1):
            classified = ollama_classify(pending_batch) or {"pages": []}
            by_idx = {c.get("pdfPageIndex"): c for c in classified.get("pages") or [] if isinstance(c, dict)}
            for item in pending_batch:
                item["classification"] = by_idx.get(item["pdfPageIndex"]) or {
                    "contentType": "other",
                    "unitTitle": "",
                    "lessonTitle": "",
                    "confidence": "NEEDS_REVIEW",
                    "notes": classified.get("error") or "unclassified",
                }
                if item["classification"].get("unitTitle"):
                    item["detectedUnit"] = item["classification"]["unitTitle"]
                if item["classification"].get("lessonTitle"):
                    item["detectedLesson"] = item["classification"]["lessonTitle"]
                out = pages_dir / f"page-{item['pdfPageIndex'] + 1:04d}.json"
                out.write_text(json.dumps(item, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                all_pages.append(item)
            save_progress(book_dir, i + 1)
            pending_batch = []
            print(f"checkpoint page {i + 1}/{page_count}", flush=True)
        elif not use_qwen:
            item = record
            item["classification"] = {
                "contentType": "other",
                "unitTitle": "",
                "lessonTitle": "",
                "confidence": "NEEDS_REVIEW",
                "notes": "qwen_disabled",
            }
            out = pages_dir / f"page-{item['pdfPageIndex'] + 1:04d}.json"
            out.write_text(json.dumps(item, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            all_pages.append(item)
            save_progress(book_dir, i + 1)
            pending_batch = []

    doc.close()
    structure = build_structure_from_pages(all_pages, meta)
    structure["processing"]["startedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(started))
    structure["processing"]["finishedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    structure["processing"]["processingTimeMs"] = int((time.time() - started) * 1000)
    structure["processing"]["status"] = "needs_review"

    out_path = book_dir / "extraction" / "structure.json"
    out_path.write_text(json.dumps(structure, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return structure


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract Jordan curriculum book structure (local only)")
    parser.add_argument("--pdf", required=True, help="Path to verified complete official PDF")
    parser.add_argument("--book-dir", default=str(DEFAULT_BOOK_DIR))
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--no-qwen", action="store_true")
    args = parser.parse_args()
    pdf = Path(args.pdf)
    book_dir = Path(args.book_dir)
    if not pdf.exists():
        raise SystemExit(f"PDF_NOT_FOUND:{pdf}")
    structure = extract_book(pdf, book_dir, batch_size=args.batch_size, use_qwen=not args.no_qwen)
    print(json.dumps({"status": structure["processing"]["status"], "pages": structure["pageCoverage"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
