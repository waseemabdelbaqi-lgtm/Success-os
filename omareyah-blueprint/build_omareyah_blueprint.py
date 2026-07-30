#!/usr/bin/env python3
"""
Omareyah International Division — Master Strategic Consulting Blueprint
Premium Arabic executive DOCX for the Board of Directors.

Brand focus: Omareyah International Division
Strategic partner: Success 4 Sure (implementation support only)
Proposed leader: Mr. Waseem Allabadi

Colors: burgundy #8B1E2D | gold #B68A3A | grey #666666
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor, Twips
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import patches
from matplotlib.patches import FancyBboxPatch
import numpy as np

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "output"
FONTS = ROOT / "fonts"
PUBLIC = Path(__file__).resolve().parents[1] / "public" / "omareyah-blueprint"
ARTIFACTS = Path("/opt/cursor/artifacts")

BURGUNDY = (139, 30, 45)
GOLD = (182, 138, 58)
GREY = (102, 102, 102)
DARK = (35, 35, 35)
LIGHT = (248, 245, 242)
WHITE = (255, 255, 255)
SOFT = (244, 240, 236)

BURGUNDY_HEX = "8B1E2D"
GOLD_HEX = "B68A3A"
GREY_HEX = "666666"
LIGHT_HEX = "F8F5F2"
SOFT_HEX = "F4F0EC"

HEADER_EN = "OMAREYAH INTERNATIONAL DIVISION | EXECUTIVE TRANSFORMATION BLUEPRINT"
FOOTER_EN = "Prepared for the Board — Mr. Waseem Allabadi | Strategic Partner: Success 4 Sure"

AMIRI = "Amiri"
LIB = "Liberation Serif"


def ensure_dirs() -> None:
    for p in (ASSETS, OUTPUT, PUBLIC, ARTIFACTS):
        p.mkdir(parents=True, exist_ok=True)


# ===================== Visual assets =====================

def create_watermark() -> Path:
    """Build soft background watermark from the official Success 4 Sure logo (JPEG with world-map)."""
    import numpy as np

    path = ASSETS / "success4sure_watermark.png"
    brand = Path(__file__).resolve().parents[1] / "public" / "brand"
    # Prefer full official logo (world-map background) then premium webp
    candidates = [
        brand / "success4sure-logo.jpeg",
        brand / "success4sure-logo-premium.webp",
        brand / "success4sure-logo-navy.webp",
    ]
    src = next((p for p in candidates if p.exists()), None)
    if src is None:
        w, h = 1200, 700
        img = Image.new("RGBA", (w, h), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)
        font_big = ImageFont.truetype(str(FONTS / "Amiri-Bold.ttf"), 72)
        draw.text((200, 280), "SUCCESS 4 SURE", font=font_big, fill=(*BURGUNDY, 40))
        img.save(path)
        return path

    im = Image.open(src).convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.int16)

    # Cover logo: only punch pure/near-white paper; KEEP grey world-map dots + brand ink
    paper = (rgb[:, :, 0] >= 248) & (rgb[:, :, 1] >= 248) & (rgb[:, :, 2] >= 245)
    cover = arr.copy()
    cover[paper, 3] = 0
    Image.fromarray(cover).save(ASSETS / "success4sure_logo.png")

    # Page watermark: soft-fade all non-paper pixels (logo + map)
    wm = arr.copy()
    wm[paper, 3] = 0
    ink = ~paper
    # Map dots softer than wordmark
    brightness = rgb.mean(axis=2)
    is_map = ink & (brightness > 170)
    is_mark = ink & (brightness <= 170)
    wm[is_map, 3] = 28
    wm[is_mark, 3] = 46
    Image.fromarray(wm).save(ASSETS / "success4sure_logo_wm.png")

    # Wide canvas for DOCX header / legacy watermark path
    canvas = Image.new("RGBA", (1400, 900), (255, 255, 255, 0))
    lw = 720
    logo_r = Image.fromarray(wm).resize((lw, lw), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo_r, ((1400 - lw) // 2, (900 - lw) // 2 - 20))
    canvas.save(path)
    print(f"  logo source: {src.name}")
    return path


def _ar_font_prop():
    from matplotlib import font_manager

    path = str(FONTS / "Amiri-Regular.ttf")
    font_manager.fontManager.addfont(path)
    return font_manager.FontProperties(fname=path)


def create_charts() -> dict[str, Path]:
    """Generate executive diagrams used inside the DOCX."""
    fp = _ar_font_prop()
    paths: dict[str, Path] = {}

    # 1) KPI dashboard (illustrative Year-1 targets)
    fig, ax = plt.subplots(figsize=(10.2, 3.6), dpi=180)
    fig.patch.set_facecolor("white")
    labels = [
        "نمو القبول",
        "جودة أكاديمية",
        "رضا أولياء الأمور",
        "استبقاء الطلبة",
        "تطوير المعلمين",
        "تحول رقمي",
    ]
    baseline = [55, 62, 68, 78, 45, 40]
    target = [72, 80, 85, 88, 75, 70]
    x = np.arange(len(labels))
    w = 0.36
    ax.bar(x - w / 2, baseline, w, color="#C9B7A0", label="خط الأساس (تقديري)")
    ax.bar(x + w / 2, target, w, color=f"#{BURGUNDY_HEX}", label="هدف السنة الأولى")
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontproperties=fp, fontsize=10)
    ax.set_ylim(0, 100)
    ax.set_ylabel("%", fontsize=10)
    ax.legend(prop=fp, loc="upper left", frameon=False)
    ax.set_title("لوحة مؤشرات الأداء — أهداف السنة الأولى (إرشادية)", fontproperties=fp, fontsize=13, color=f"#{BURGUNDY_HEX}", pad=12)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#AAAAAA")
    ax.spines["bottom"].set_color("#AAAAAA")
    ax.grid(axis="y", linestyle=":", alpha=0.35)
    fig.tight_layout()
    paths["kpi"] = ASSETS / "chart_kpi_dashboard.png"
    fig.savefig(paths["kpi"], bbox_inches="tight", facecolor="white")
    plt.close(fig)

    # 2) 100-day phases
    fig, ax = plt.subplots(figsize=(10.2, 2.8), dpi=180)
    fig.patch.set_facecolor("white")
    phases = [
        (0, 30, "الأيام 1–30\nتشخيص وحوكمة", f"#{BURGUNDY_HEX}"),
        (30, 35, "الأيام 31–65\nتشغيل سريع", f"#{GOLD_HEX}"),
        (65, 35, "الأيام 66–100\nتثبيت الأثر", "#666666"),
    ]
    y = 0.35
    for start, width, label, color in phases:
        ax.barh([y], [width], left=start, height=0.35, color=color, edgecolor="white")
        ax.text(start + width / 2, y, label, ha="center", va="center", color="white", fontproperties=fp, fontsize=10)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title("إطار المائة يوم — مراحل التنفيذ", fontproperties=fp, fontsize=13, color=f"#{BURGUNDY_HEX}", pad=8)
    fig.tight_layout()
    paths["days100"] = ASSETS / "chart_100_days.png"
    fig.savefig(paths["days100"], bbox_inches="tight", facecolor="white")
    plt.close(fig)

    # 3) Years 2–5 roadmap
    fig, ax = plt.subplots(figsize=(10.2, 3.4), dpi=180)
    fig.patch.set_facecolor("white")
    years = ["السنة 2", "السنة 3", "السنة 4", "السنة 5"]
    tracks = {
        "تميز أكاديمي": [70, 78, 85, 90],
        "تموضع العلامة": [60, 72, 82, 88],
        "استدامة مالية": [65, 74, 82, 89],
        "نضج رقمي": [55, 68, 80, 88],
    }
    colors = [f"#{BURGUNDY_HEX}", f"#{GOLD_HEX}", "#666666", "#8A6A4A"]
    for (name, vals), c in zip(tracks.items(), colors):
        ax.plot(years, vals, marker="o", linewidth=2.2, color=c, label=name)
    ax.set_ylim(40, 100)
    ax.set_title("خارطة الطريق الاستراتيجية — السنوات 2 إلى 5", fontproperties=fp, fontsize=13, color=f"#{BURGUNDY_HEX}")
    ax.legend(prop=fp, ncol=2, frameon=False, loc="lower right")
    ax.grid(True, linestyle=":", alpha=0.35)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    for label in ax.get_xticklabels():
        label.set_fontproperties(fp)
    fig.tight_layout()
    paths["roadmap"] = ASSETS / "chart_years_2_5.png"
    fig.savefig(paths["roadmap"], bbox_inches="tight", facecolor="white")
    plt.close(fig)

    # 4) Ecosystem diagram
    fig, ax = plt.subplots(figsize=(10.2, 5.2), dpi=180)
    fig.patch.set_facecolor("white")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis("off")
    ax.set_title("منظومة التنفيذ التعليمية — المدرسة في المركز", fontproperties=fp, fontsize=13, color=f"#{BURGUNDY_HEX}", pad=10)

    center = FancyBboxPatch((3.2, 4.0), 3.6, 2.0, boxstyle="round,pad=0.05,rounding_size=0.25",
                            facecolor=f"#{BURGUNDY_HEX}", edgecolor=f"#{GOLD_HEX}", linewidth=2)
    ax.add_patch(center)
    ax.text(5, 5.2, "قسم العمريّة الدولي", ha="center", va="center", color="white", fontproperties=fp, fontsize=12, fontweight="bold")
    ax.text(5, 4.55, "Omareyah International Division", ha="center", va="center", color="white", fontsize=8)

    nodes = [
        (0.4, 7.6, "تدريب المعلمين\nوالتطوير المهني"),
        (3.6, 8.2, "إعداد الاختبارات\nالدولية"),
        (6.8, 7.6, "الإرشاد الجامعي\nوالمسارات"),
        (0.4, 1.4, "التكنولوجيا\nوالتعلم الرقمي"),
        (3.6, 0.7, "البرامج الإثرائية\nوSTEM وAI"),
        (6.8, 1.4, "التسويق التربوي\nوبرامج الصيف"),
        (8.2, 4.6, "تحليلات التعلم\nوالتعلّم المسجّل"),
        (0.3, 4.6, "ضمان الجودة\nوتجربة الطالب"),
    ]
    for x0, y0, txt in nodes:
        box = FancyBboxPatch((x0, y0), 1.8, 1.35, boxstyle="round,pad=0.04,rounding_size=0.18",
                             facecolor=f"#{LIGHT_HEX}", edgecolor=f"#{GOLD_HEX}", linewidth=1.2)
        ax.add_patch(box)
        ax.text(x0 + 0.9, y0 + 0.68, txt, ha="center", va="center", fontproperties=fp, fontsize=8, color=f"#{DARK[0]:02x}{DARK[1]:02x}{DARK[2]:02x}")
        ax.plot([x0 + 0.9, 5], [y0 + 0.65, 5], color=f"#{GOLD_HEX}", alpha=0.45, linewidth=1)

    ax.text(5, 0.25, "Success 4 Sure — شريك تنفيذ استراتيجي (ليست العلامة المدرسية)", ha="center", fontproperties=fp, fontsize=9, color=f"#{GREY_HEX}")
    fig.tight_layout()
    paths["ecosystem"] = ASSETS / "chart_ecosystem.png"
    fig.savefig(paths["ecosystem"], bbox_inches="tight", facecolor="white")
    plt.close(fig)

    # 5) Transformation framework
    fig, ax = plt.subplots(figsize=(10.2, 3.0), dpi=180)
    fig.patch.set_facecolor("white")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3)
    ax.axis("off")
    layers = [
        (7.9, "تشخيص", "بيانات · زيارات · مقابلات"),
        (6.0, "تصميم", "أولويات · حوكمة · خطة"),
        (4.1, "تنفيذ", "برامج · فرق · إيقاع"),
        (2.2, "قياس", "مؤشرات · مراجعات"),
        (0.3, "تحسين", "دورة مستمرة"),
    ]
    for i, (x0, title, sub) in enumerate(layers):
        color = f"#{BURGUNDY_HEX}" if i % 2 == 0 else f"#{GOLD_HEX}"
        box = FancyBboxPatch((x0, 0.7), 1.7, 1.5, boxstyle="round,pad=0.03,rounding_size=0.15",
                             facecolor=color, edgecolor="white", linewidth=1)
        ax.add_patch(box)
        ax.text(x0 + 0.85, 1.7, title, ha="center", va="center", color="white", fontproperties=fp, fontsize=12)
        ax.text(x0 + 0.85, 1.15, sub, ha="center", va="center", color="white", fontproperties=fp, fontsize=7.5)
        if i < len(layers) - 1:
            ax.text(x0 - 0.08, 1.45, "<", ha="center", va="center", color="#888888", fontsize=14, fontweight="bold")
    ax.set_title(
        "منهجية التحول (من اليمين): تشخيص ثم تصميم ثم تنفيذ ثم قياس ثم تحسين",
        fontproperties=fp,
        fontsize=11,
        color=f"#{BURGUNDY_HEX}",
    )
    fig.tight_layout()
    paths["method"] = ASSETS / "chart_methodology.png"
    fig.savefig(paths["method"], bbox_inches="tight", facecolor="white")
    plt.close(fig)

    # 6) Governance structure
    fig, ax = plt.subplots(figsize=(10.2, 4.4), dpi=180)
    fig.patch.set_facecolor("white")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis("off")
    ax.set_title("نموذج الحوكمة المقترح", fontproperties=fp, fontsize=13, color=f"#{BURGUNDY_HEX}")

    def node(x, y, w, h, text, fill, fs=10):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.12",
                             facecolor=fill, edgecolor=f"#{GOLD_HEX}", linewidth=1.1)
        ax.add_patch(box)
        ax.text(
            x + w / 2,
            y + h / 2,
            text,
            ha="center",
            va="center",
            color="white" if fill in (f"#{BURGUNDY_HEX}", f"#{GOLD_HEX}", "#5A5A5A", "#8A6A4A") else "#232323",
            fontproperties=fp,
            fontsize=fs,
        )

    node(3.2, 8.2, 3.6, 1.0, "مجلس الإدارة / مجلس الأمناء", f"#{BURGUNDY_HEX}", 11)
    node(3.2, 6.2, 3.6, 1.0, "مدير البرامج الدولية\n(الأستاذ وسيم اللبدي — مقترح)", f"#{GOLD_HEX}", 9)
    deps = [
        (0.4, 3.8, "الشؤون الأكاديمية"),
        (2.7, 3.8, "القبول والتسويق"),
        (5.0, 3.8, "التطوير المهني"),
        (7.3, 3.8, "الجودة والبيانات"),
    ]
    for x, y, t in deps:
        node(x, y, 2.1, 1.2, t, "#5A5A5A", 9)
        ax.plot([5, x + 1.05], [6.2, y + 1.2], color="#B68A3A", alpha=0.5)
    ax.plot([5, 5], [8.2, 7.2], color="#B68A3A", alpha=0.7)
    committees = [(1.2, 1.2, "لجنة الجودة"), (4.0, 1.2, "لجنة القبول"), (6.8, 1.2, "لجنة التحول الرقمي")]
    for x, y, t in committees:
        node(x, y, 2.2, 0.9, t, "#8A6A4A", 9)
    fig.tight_layout()
    paths["governance"] = ASSETS / "chart_governance.png"
    fig.savefig(paths["governance"], bbox_inches="tight", facecolor="white")
    plt.close(fig)

    # 7) Visual identity separation — International vs National
    fig, ax = plt.subplots(figsize=(10.2, 4.8), dpi=180)
    fig.patch.set_facecolor("white")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis("off")
    ax.set_title(
        "فصل الهوية البصرية: قسم الإنترناشونال × المنهاج الوطني",
        fontproperties=fp,
        fontsize=13,
        color=f"#{BURGUNDY_HEX}",
        pad=8,
    )
    # two columns
    left = FancyBboxPatch((0.4, 1.2), 4.2, 7.2, boxstyle="round,pad=0.05,rounding_size=0.2",
                          facecolor=f"#{BURGUNDY_HEX}", edgecolor=f"#{GOLD_HEX}", linewidth=1.5)
    right = FancyBboxPatch((5.4, 1.2), 4.2, 7.2, boxstyle="round,pad=0.05,rounding_size=0.2",
                           facecolor="#5A5A5A", edgecolor=f"#{GOLD_HEX}", linewidth=1.5)
    ax.add_patch(left)
    ax.add_patch(right)
    ax.text(2.5, 7.7, "Omareyah International", ha="center", color="white", fontsize=11, fontweight="bold")
    ax.text(2.5, 7.15, "قسم الإنترناشونال", ha="center", color="white", fontproperties=fp, fontsize=12)
    ax.text(7.5, 7.7, "National Track", ha="center", color="white", fontsize=11, fontweight="bold")
    ax.text(7.5, 7.15, "المنهاج الوطني الأردني", ha="center", color="white", fontproperties=fp, fontsize=12)
    left_items = [
        "نظام ألوان وشعار فرعي للقسم",
        "ترويسة ونماذج قبول خاصة",
        "لافتات وممرات معرّفة",
        "قوالب تواصل أسري مستقلة",
        "فعاليات وتسويق باسم القسم",
        "معايير عرض صفّي دولية",
    ]
    right_items = [
        "هوية المسار الوطني كما هي",
        "نماذج ووزارة/مدرسة وطنية",
        "لافتات ومساحات المسار الوطني",
        "تواصل مرتبط بالمسار الوطني",
        "فعاليات المسار الوطني منفصلة",
        "معايير عرض صفّي وطنية",
    ]
    for i, (a, b) in enumerate(zip(left_items, right_items)):
        yy = 6.3 - i * 0.85
        ax.text(2.5, yy, a, ha="center", color="white", fontproperties=fp, fontsize=9)
        ax.text(7.5, yy, b, ha="center", color="white", fontproperties=fp, fontsize=9)
    ax.text(5, 0.55, "فصل تقريبي مرحلي — مؤسسة واحدة بهويتين مساريتين واضحتين", ha="center", fontproperties=fp, fontsize=10, color=f"#{GREY_HEX}")
    # divider arrow concept
    ax.annotate("", xy=(5.3, 5), xytext=(4.7, 5), arrowprops=dict(arrowstyle="<->", color=f"#{GOLD_HEX}", lw=2))
    fig.tight_layout()
    paths["identity"] = ASSETS / "chart_identity_separation.png"
    fig.savefig(paths["identity"], bbox_inches="tight", facecolor="white")
    plt.close(fig)

    return paths


# ===================== DOCX helpers =====================

def set_run_font(run, name: str, size_pt: float, color=DARK, bold: bool = False) -> None:
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:ascii"), name)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), name)
    run._element.rPr.rFonts.set(qn("w:cs"), name)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.color.rgb = RGBColor(*color)
    rPr = run._element.get_or_add_rPr()
    text = run.text or ""
    if any("\u0600" <= c <= "\u06FF" for c in text) or name == AMIRI:
        for child in list(rPr):
            if child.tag == qn("w:rtl"):
                rPr.remove(child)
        rtl = OxmlElement("w:rtl")
        rtl.set(qn("w:val"), "1")
        rPr.append(rtl)


def set_paragraph_rtl(paragraph, align=WD_ALIGN_PARAGRAPH.RIGHT) -> None:
    paragraph.alignment = align
    pPr = paragraph._p.get_or_add_pPr()
    bidi = pPr.find(qn("w:bidi"))
    if bidi is None:
        bidi = OxmlElement("w:bidi")
        pPr.append(bidi)
    bidi.set(qn("w:val"), "1")
    text_dir = pPr.find(qn("w:textDirection"))
    if text_dir is None:
        text_dir = OxmlElement("w:textDirection")
        pPr.append(text_dir)
    text_dir.set(qn("w:val"), "rl")
    jc = pPr.find(qn("w:jc"))
    if jc is None:
        jc = OxmlElement("w:jc")
        pPr.append(jc)
    if align == WD_ALIGN_PARAGRAPH.RIGHT:
        jc.set(qn("w:val"), "right")
    elif align == WD_ALIGN_PARAGRAPH.CENTER:
        jc.set(qn("w:val"), "center")
    elif align == WD_ALIGN_PARAGRAPH.LEFT:
        jc.set(qn("w:val"), "left")


def set_spacing(paragraph, before=0, after=6, line=1.28) -> None:
    pf = paragraph.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line


def add_ar(doc, text, size=11.5, bold=False, color=DARK, align=WD_ALIGN_PARAGRAPH.RIGHT, before=0, after=6):
    p = doc.add_paragraph()
    set_paragraph_rtl(p, align)
    set_spacing(p, before, after, 1.35)
    run = p.add_run("\u200f" + text if text and not text.startswith("\u200f") else text)
    set_run_font(run, AMIRI, size, color, bold)
    return p


def add_en(doc, text, size=10, bold=False, color=BURGUNDY, align=WD_ALIGN_PARAGRAPH.CENTER, before=0, after=4):
    p = doc.add_paragraph()
    p.alignment = align
    set_spacing(p, before, after, 1.2)
    run = p.add_run(text)
    set_run_font(run, LIB, size, color, bold)
    return p


def add_bullet(doc, text, size=11.5, color=DARK, before=0, after=3):
    p = doc.add_paragraph()
    set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.RIGHT)
    set_spacing(p, before, after, 1.3)
    run = p.add_run("\u200f• " + text)
    set_run_font(run, AMIRI, size, color, False)
    return p


def add_gold_rule(doc) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_spacing(p, 2, 8, 1.0)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "12")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), GOLD_HEX)
    pBdr.append(bottom)
    pPr.append(pBdr)


def add_section_title(doc, num: str, title: str) -> None:
    add_ar(doc, f"{num}. {title}", size=15, bold=True, color=BURGUNDY, before=14, after=4)
    add_gold_rule(doc)


def add_subtitle(doc, text: str) -> None:
    add_ar(doc, text, size=12.5, bold=True, color=GOLD, before=10, after=4)


def shade_cell(cell, hex_color: str) -> None:
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell_border(cell, color=BURGUNDY_HEX, sz="8") -> None:
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), sz)
        el.set(qn("w:color"), color)
        el.set(qn("w:space"), "0")
        tcBorders.append(el)
    tcPr.append(tcBorders)


def set_table_rtl(table) -> None:
    tbl = table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else OxmlElement("w:tblPr")
    bidi = tblPr.find(qn("w:bidiVisual"))
    if bidi is None:
        bidi = OxmlElement("w:bidiVisual")
        tblPr.append(bidi)
    bidi.set(qn("w:val"), "1")


def fill_cell(cell, text, size=10.5, bold=False, color=DARK, fill=None, align=WD_ALIGN_PARAGRAPH.RIGHT):
    cell.text = ""
    p = cell.paragraphs[0]
    set_paragraph_rtl(p, align)
    set_spacing(p, 2, 2, 1.2)
    run = p.add_run("\u200f" + text if text else "")
    set_run_font(run, AMIRI, size, color, bold)
    if fill:
        shade_cell(cell, fill)
    set_cell_border(cell, GOLD_HEX if fill != BURGUNDY_HEX else BURGUNDY_HEX, "8")


def add_table(doc, headers, rows, col_widths=None, header_fill=BURGUNDY_HEX, header_color=WHITE):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_rtl(table)
    for i, h in enumerate(headers):
        fill_cell(table.rows[0].cells[i], h, size=10.5, bold=True, color=header_color, fill=header_fill)
    for r_i, row in enumerate(rows):
        fill = LIGHT_HEX if r_i % 2 == 0 else "FFFFFF"
        for c_i, val in enumerate(row):
            fill_cell(table.rows[r_i + 1].cells[c_i], val, size=10, bold=False, color=DARK, fill=fill)
    if col_widths:
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Cm(w)
    doc.add_paragraph()
    return table


def add_callout(doc, title: str, bullets: list[str], border=GOLD_HEX, fill=SOFT_HEX) -> None:
    table = doc.add_table(rows=1, cols=1)
    set_table_rtl(table)
    cell = table.rows[0].cells[0]
    shade_cell(cell, fill)
    set_cell_border(cell, border, "12")
    cell.text = ""
    p = cell.paragraphs[0]
    set_paragraph_rtl(p)
    set_spacing(p, 4, 4, 1.25)
    run = p.add_run("\u200f" + title)
    set_run_font(run, AMIRI, 11.5, BURGUNDY, True)
    for b in bullets:
        p2 = cell.add_paragraph()
        set_paragraph_rtl(p2)
        set_spacing(p2, 1, 2, 1.25)
        run2 = p2.add_run("\u200f• " + b)
        set_run_font(run2, AMIRI, 10.5, DARK, False)
    doc.add_paragraph()


def add_image(doc, path: Path, width_in=6.4) -> None:
    if not path.exists():
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_spacing(p, 6, 8, 1.0)
    run = p.add_run()
    run.add_picture(str(path), width=Inches(width_in))


def add_page_border(section, color=BURGUNDY_HEX, sz="24", space="18") -> None:
    sectPr = section._sectPr
    pgBorders = OxmlElement("w:pgBorders")
    pgBorders.set(qn("w:offsetFrom"), "page")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), sz)
        el.set(qn("w:space"), space)
        el.set(qn("w:color"), color)
        pgBorders.append(el)
    sectPr.append(pgBorders)


def add_watermark_header(section, watermark_path: Path) -> None:
    """Place Success 4 Sure logo watermark in the header of every page."""
    header = section.header
    header.is_linked_to_previous = False
    for p in header.paragraphs:
        p.clear()
    p = header.paragraphs[0] if header.paragraphs else header.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_spacing(p, 0, 0, 1.0)
    run = p.add_run()
    logo = ASSETS / "success4sure_logo_wm.png"
    img = logo if logo.exists() else watermark_path
    if img.exists():
        run.add_picture(str(img), width=Inches(1.35))
    # EN header line
    p2 = header.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_spacing(p2, 0, 2, 1.0)
    r2 = p2.add_run(HEADER_EN)
    set_run_font(r2, LIB, 8, BURGUNDY, True)


def configure_section(section) -> None:
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(1.8)
    section.right_margin = Cm(1.8)
    # section bidi
    sectPr = section._sectPr
    bidi = OxmlElement("w:bidi")
    bidi.set(qn("w:val"), "1")
    sectPr.append(bidi)
    add_page_border(section, BURGUNDY_HEX, "26", "16")


def add_footer(section) -> None:
    footer = section.footer
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(FOOTER_EN)
    set_run_font(run, LIB, 8, GREY, False)
    # page number field
    p2 = footer.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run2 = p2.add_run("Page ")
    set_run_font(run2, LIB, 8, GREY, False)
    fldChar1 = OxmlElement("w:fldChar")
    fldChar1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fldChar2 = OxmlElement("w:fldChar")
    fldChar2.set(qn("w:fldCharType"), "end")
    run3 = p2.add_run()
    run3._r.append(fldChar1)
    run3._r.append(instr)
    run3._r.append(fldChar2)
    set_run_font(run3, LIB, 8, GREY, False)


# ===================== Document body =====================

def build_docx(charts: dict[str, Path], watermark: Path) -> Path:
    doc = Document()
    section = doc.sections[0]
    configure_section(section)
    add_watermark_header(section, watermark)
    add_footer(section)
    # more top margin for header logo
    section.top_margin = Cm(2.6)

    style = doc.styles["Normal"]
    style.font.name = AMIRI
    style.font.size = Pt(11)
    style._element.rPr.rFonts.set(qn("w:cs"), AMIRI)

    # ---- Cover ----
    add_en(doc, HEADER_EN, size=10, bold=True, color=BURGUNDY, before=4, after=10)
    add_gold_rule(doc)
    logo_path = ASSETS / "success4sure_logo.png"
    if logo_path.exists():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_spacing(p, 8, 4, 1.0)
        run = p.add_run()
        run.add_picture(str(logo_path), width=Inches(1.7))
        add_en(doc, "Strategic Implementation Partner", size=9, bold=False, color=GOLD, before=0, after=10)
    add_en(doc, "OMAREYAH INTERNATIONAL DIVISION", size=20, bold=True, color=BURGUNDY, before=12, after=6)
    add_ar(doc, "مخطط التحول التعليمي التنفيذي", size=20, bold=True, color=BURGUNDY, align=WD_ALIGN_PARAGRAPH.CENTER, before=6, after=4)
    add_ar(doc, "Master Strategic Consulting Project", size=12, bold=False, color=GOLD, align=WD_ALIGN_PARAGRAPH.CENTER, before=2, after=8)
    add_gold_rule(doc)
    add_ar(doc, "وثيقة استراتيجية موجهة إلى مجلس الإدارة", size=13, bold=True, color=DARK, align=WD_ALIGN_PARAGRAPH.CENTER, before=12, after=4)
    add_ar(
        doc,
        "الإجابة المهنية على سؤال المجلس: لماذا تعيين الأستاذ وسيم اللبدي مديراً للبرامج الدولية وقائداً للتحول التعليمي؟",
        size=12,
        bold=False,
        color=GREY,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        before=4,
        after=10,
    )
    add_callout(
        doc,
        "محور مركزي في هذه النسخة",
        [
            "تغيير/فصل الهوية البصرية والتشغيلية لقسم الإنترناشونال عن هوية المنهاج الوطني الأردني داخل المدرسة.",
            "الفصل تقريبي ومرحلي — ليس قطيعة فورية — مع إبقاء العمريّة مؤسسة جامعة بهويتين مساريتين واضحتين.",
            "Success 4 Sure شريك تنفيذ فقط؛ العلامة الأمامية للأسرة تبقى Omareyah International Division.",
        ],
    )
    add_callout(
        doc,
        "مبادئ هذه الوثيقة",
        [
            "العلامة الأساسية هي قسم العمريّة الدولي — وليست Success 4 Sure.",
            "لا مبالغة في الإنجازات الشخصية؛ التوصيات مبنية على ممارسات إدارة تعليمية دولية قابلة للقياس.",
            "كل توصية مرتبطة بهدف تشغيلي ومؤشر أداء وآلية متابعة.",
        ],
    )
    add_ar(doc, "إعداد: الأستاذ وسيم اللبدي", size=12, bold=True, color=BURGUNDY, align=WD_ALIGN_PARAGRAPH.CENTER, before=10, after=2)
    add_ar(doc, "الأدوار المقترحة: مدير البرامج الدولية · قائد التحول التعليمي · مدير الاستراتيجية الأكاديمية", size=11, color=GREY, align=WD_ALIGN_PARAGRAPH.CENTER, before=0, after=2)
    add_en(doc, "Confidential — Board Use Only", size=9, bold=False, color=GREY, before=14, after=4)

    doc.add_page_break()

    # ---- TOC style overview ----
    add_section_title(doc, "0", "هيكل الوثيقة ونطاق القرار")
    add_ar(
        doc,
        "صُممت هذه الوثيقة كـ«مخطط تحول تعليمي تنفيذي» بمستوى وثائق مجالس الإدارات في مؤسسات الاستشارات الدولية. "
        "الغرض ليس عرضاً تسويقياً، بل تمكين المجلس من اتخاذ قرار تعيين قيادي مبني على منطق التشخيص، المنهجية، الحوكمة، وخارطة التنفيذ — "
        "مع تركيز خاص على فصل هوية القسم الدولي عن هوية المنهاج الوطني.",
    )
    add_table(
        doc,
        ["القسم", "الغرض لمجلس الإدارة"],
        [
            ["1. الملخص التنفيذي", "الخلاصة القرارِية في صفحة واحدة"],
            ["2. تحليل الوضع الحالي", "فهم التحديات والفرص وتموضع السوق"],
            ["3. لماذا التحول ضروري؟", "تبرير استراتيجي للتغيير"],
            ["4–5. من هو وسيم؟ ولماذا مختلف؟", "معيار الاختيار القيادي"],
            ["6. كيف سيُحدث التحول؟", "مسارات التنفيذ"],
            ["6أ. فصل الهوية البصرية", "إنترناشونال × المنهاج الوطني"],
            ["7–8. الشريك والمنظومة", "قدرات التنفيذ دون خلط العلامة"],
            ["9–11. خطط التنفيذ", "100 يوم · سنة · 2–5 سنوات"],
            ["12–14. النتائج والمخاطر والحوكمة", "قابلية القياس والرقابة"],
            ["15. التوصية النهائية", "قرار المجلس"],
        ],
    )

    # ========== 1 Executive Summary ==========
    add_section_title(doc, "1", "الملخص التنفيذي")
    add_ar(
        doc,
        "يحتاج قسم العمريّة الدولي إلى قيادة تجمع بين الجودة الأكاديمية، والانضباط التشغيلي، والتموضع السوقي، والقدرة على بناء أنظمة مستدامة. "
        "التعيين التقليدي لـ«مدير أكاديمي» قد يحسّن جزءاً من العمليات اليومية، لكنه غالباً لا يبني منظومة تحول متكاملة تربط التعلم، والمعلمين، والقبول، وتجربة ولي الأمر، والبيانات.",
    )
    add_ar(
        doc,
        "تقترح هذه الوثيقة تعيين الأستاذ وسيم اللبدي في موقع قيادي يجمع إدارة البرامج الدولية مع قيادة التحول التعليمي، مع الاستفادة المنظمة من قدرات Success 4 Sure كشريك تنفيذ — دون نقل هوية المدرسة إلى الشريك. "
        "ويشمل التحول أولوية واضحة: فصل الهوية البصرية والتشغيلية لقسم الإنترناشونال عن هوية المنهاج الوطني الأردني داخل المدرسة بفصل تقريبي مرحلي.",
    )
    add_subtitle(doc, "الخلاصة القرارِية")
    add_table(
        doc,
        ["البُعد", "ما يقدمه التعيين المقترح", "ما لا يفعله التعيين التقليدي وحده"],
        [
            ["الأكاديميا", "إطار جودة قابل للقياس ومسارات تطوير معلّم", "تحسين جزئي بلا نظام مؤشرات"],
            ["التشغيل", "إيقاع حوكمة أسبوعي/شهري وتقارير للمجلس", "إدارة مهام بلا ربط استراتيجي"],
            ["القبول", "رواية قيمة للبرنامج الدولي مبنية على تجربة حقيقية", "حملات موسمية بلا تثبيت جودة"],
            ["الرقمنة", "تعلم رقمي وتحليلات تدعم القرار", "أدوات متفرقة بلا تكامل"],
            ["الاستدامة", "منظومة شريك تنفيذ تقلل الاعتماد على فرد واحد", "اعتماد عالٍ على خبرة المدير فقط"],
        ],
    )
    add_callout(
        doc,
        "نطاق الواقعية",
        [
            "الأرقام المستهدفة في هذه الوثيقة إرشادية لأغراض التخطيط، وتُحدَّث بعد تدقيق بيانات المدرسة الرسمية.",
            "النجاح مشروط بدعم المجلس، ووضوح الصلاحيات، وتمويل معقول لمبادرات السنة الأولى.",
        ],
    )

    # ========== 2 Current Status ==========
    add_section_title(doc, "2", "تحليل الوضع الحالي")
    add_subtitle(doc, "2.1 التحديات الحالية (نمطية في أقسام البرامج الدولية)")
    for t in [
        "تفاوت جودة التجربة الصفية بين المراحل والمعلمين دون نظام ملاحظة وتطوير موحّد.",
        "ضغط توقعات أولياء الأمور تجاه النتائج الدولية والمسارات الجامعية دون منظومة إرشاد واضحة.",
        "منافسة متزايدة من مدارس تقدم برامج دولية مع رسائل تسويقية أقوى أحياناً من الواقع التشغيلي.",
        "فجوات في التكامل بين الأكاديميا، والقبول، والتسويق، وشؤون الطلبة.",
        "محدودية استخدام البيانات لاتخاذ قرارات حول التعثر الدراسي، والاستبقاء، ورضا الأسرة.",
        "خطر الاعتماد على مبادرات فردية بدل أنظمة قابلة للانتقال والاستمرار.",
    ]:
        add_bullet(doc, t)

    add_subtitle(doc, "2.2 الفرص الحالية")
    for t in [
        "وجود علامة مدرسية قائمة يمكن البناء عليها بدلاً من إطلاق كيان جديد.",
        "طلب أسري متزايد على مسارات دولية منضبطة وشفافة في الأردن.",
        "إمكانية تمييز القسم عبر جودة المعلمين، وتجربة الطالب، والإرشاد الجامعي المبكر.",
        "فرصة بناء شراكة تنفيذ تضيف عمقاً تدريبياً وتقنياً دون تشتيت هوية المدرسة.",
        "قابلية تحويل التحسينات الأكاديمية إلى أثر ملموس على القبول والاستبقاء خلال 12–24 شهراً.",
    ]:
        add_bullet(doc, t)

    add_subtitle(doc, "2.3 تموضع السوق")
    add_ar(
        doc,
        "في سوق التعليم الدولي بالأردن، لم يعد «وجود برنامج دولي» بحد ذاته ميزة كافية. الميزة التنافسية تنتقل إلى: اتساق الجودة، شفافية النتائج، جاهزية المعلمين، وضوح المسار الجامعي، وتجربة التواصل مع الأسرة. "
        "التموضع المقترح لقسم العمريّة: برنامج دولي منضبط أكاديمياً، موثوق تشغيلياً، وقابل للقياس أمام المجلس والأسرة.",
    )

    add_subtitle(doc, "2.4 اتجاهات التعليم الدولي في الأردن")
    add_table(
        doc,
        ["الاتجاه", "الأثر على القسم", "الاستجابة المقترحة"],
        [
            ["ارتفاع توقعات الجودة والشفافية", "ضغط على النتائج والتواصل", "لوحة مؤشرات أسرية داخلية + تقارير فصلية"],
            ["المنافسة على المعلمين المؤهلين", "صعوبة الاستقطاب والاستبقاء", "مسار تطوير مهني واضح وحوافز مرتبطة بالجودة"],
            ["التحول الرقمي الجزئي", "فجوة بين أدوات وتعلّم فعّال", "تكامل منصة تعلم + تحليلات بسيطة قابلة للتنفيذ"],
            ["الاهتمام بالمسارات الجامعية المبكرة", "طلب إرشاد متخصص", "برنامج إرشاد جامعي مرحلي من الصفوف العليا"],
            ["حساسية الرسوم مقابل القيمة", "ضغط تسعير ورضا", "ربط القيمة بتجربة قابلة للإثبات لا بوعود عامة"],
        ],
    )

    # ========== 3 Why transformation ==========
    add_section_title(doc, "3", "لماذا التحول ضروري؟")
    add_ar(
        doc,
        "التحول ليس هدفاً لغوياً؛ هو استجابة لثلاث حقائق إدارية: (1) جودة البرنامج الدولي أصبحت معيار اختيار الأسرة الأول، "
        "(2) التحسينات المبعثرة لا تصمد أمام دوران الموظفين، (3) المجلس يحتاج نظام رقابة مبكر لا تقارير متأخرة. "
        "بدون تحول منظم، يبقى القسم عرضة لتذبذب السمعة، وتسرب الطلبة، وضعف القدرة على تسعير القيمة.",
    )
    add_callout(
        doc,
        "كلفة عدم الفعل (نوعياً)",
        [
            "استمرار فجوات الجودة يضعف الثقة الأسرية حتى مع جهود تسويقية.",
            "غياب نظام تطوير المعلمين يرفع الاعتماد على التوظيف الطارئ.",
            "ضعف الربط بين القبول والأكاديميا يرفع كلفة الاستحواذ ويخفض الاستبقاء.",
        ],
    )

    # ========== 4 Who is Waseem ==========
    add_section_title(doc, "4", "من هو الأستاذ وسيم اللبدي؟")
    add_ar(
        doc,
        "يُقدَّم الأستاذ وسيم اللبدي إلى المجلس بوصفه مرشحاً لقيادة البرامج الدولية والتحول التعليمي، مع قدرة على ربط القرار الأكاديمي بالتشغيل وبالقيمة المقدَّمة للأسرة. "
        "لا تعتمد هذه الوثيقة على سرد إنجازات مبالغ فيها؛ بل على منطق الصلاحية القيادية: رؤية، منهجية، قدرة على بناء أنظمة، والاستفادة الرشيدة من منظومة شريك تنفيذ.",
    )
    add_subtitle(doc, "4.1 الخلفية المهنية (إطار الطرح للمجلس)")
    for t in [
        "خبرة عملية في تصميم وتنفيذ مبادرات تعليمية مرتبطة بالجودة والتطوير المهني وتجربة المتعلم.",
        "توجه إداري يربط بين النتائج الأكاديمية والاستدامة التشغيلية.",
        "قدرة على العمل مع مجالس الإدارات عبر تقارير واضحة ومؤشرات قابلة للمتابعة.",
        "إلمام بمتطلبات البيئة التعليمية في الأردن وبسلوك الأسرة تجاه البرامج الدولية.",
    ]:
        add_bullet(doc, t)

    add_subtitle(doc, "4.2 فلسفة القيادة")
    add_ar(
        doc,
        "القيادة التعليمية الفاعلة — وفق هذه الفلسفة — ليست مركزية فردية، بل بناء قدرة مؤسسية: معايير واضحة، معلمون مدعومون، بيانات بسيطة ودقيقة، ومحاسبة عادلة. "
        "المدير يقود الإيقاع ويحمي الجودة، والفرق تنفّذ، والمجلس يراقب النتائج لا التفاصيل التشغيلية اليومية.",
    )

    add_subtitle(doc, "4.3 الرؤية التعليمية")
    add_ar(
        doc,
        "أن يصبح قسم العمريّة الدولي مرجعاً موثوقاً لأسرة تبحث عن برنامج دولي متسق، يُعدّ الطالب للمرحلة الجامعية بجدية أكاديمية، ويُظهر احتراماً لكرامة المعلم وتجربة ولي الأمر.",
    )

    add_subtitle(doc, "4.4 منهجية التحول")
    add_image(doc, charts["method"], 6.3)
    add_ar(
        doc,
        "المنهجية المقترحة دورة خماسية: تشخيص مبني على أدلة، تصميم أولويات محدودة، تنفيذ بإيقاع أسبوعي، قياس بمؤشرات متفق عليها مع المجلس، وتحسين مستمر. "
        "تُرفض المبادرات الواسعة غير الممولة أو غير القابلة للقياس في السنة الأولى.",
        size=11,
    )

    add_subtitle(doc, "4.5 الخبرة الدولية (منهجياً)")
    add_ar(
        doc,
        "المقصود بالخبرة الدولية هنا ليس شعاراً، بل القدرة على مواءمة ممارسات معتمدة عالمياً — مثل أطر ضمان الجودة، التطوير المهني القائم على الملاحظة الصفية، "
        "ومسارات الإرشاد الجامعي — مع واقع المدرسة الأردنية وقيود الموارد والصلاحيات.",
    )

    # ========== 5 Why different ==========
    add_section_title(doc, "5", "لماذا وسيم مختلف؟")
    add_ar(
        doc,
        "الفرق الجوهري ليس في «النشاط» بل في نموذج القيادة: مدير أكاديمي تقليدي يُحسّن التشغيل داخل الصندوق القائم؛ "
        "القائد المقترح يبني نظاماً يربط الجودة بالقبول وبالبيانات وبالمنظومة الداعمة — مع إبقاء هوية العمريّة في الواجهة.",
    )
    add_table(
        doc,
        ["البُعد", "المدير الأكاديمي التقليدي", "نموذج وسيم المقترح"],
        [
            ["القيادة", "إدارة اليومي وحل الأزمات", "إيقاع استراتيجي + تمكين فرق + تقارير مجلس"],
            ["الجودة الأكاديمية", "متابعة جزئية للمناهج", "معايير ملاحظة، خطط تحسين، مؤشرات فصلية"],
            ["التسويق", "دعم محدود للحملات", "ربط الرسالة التسويقية بتجربة حقيقية قابلة للإثبات"],
            ["العقل التجاري", "تركيز تعليمي صرف", "قيمة مقابل رسوم، استبقاء، كفاءة تشغيل"],
            ["الابتكار", "مبادرات متفرقة", "ابتكار منضبط بمقاييس أثر"],
            ["الذكاء الاصطناعي", "استخدام فردي غير منظم", "استخدام حذر في الدعم التعليمي والتحليلات مع ضوابط"],
            ["التعليم الدولي", "تشغيل البرنامج كما هو", "رفع اتساق المعايير وتجربة الطالب والأسرة"],
            ["بناء الأنظمة", "اعتماد على الأشخاص", "سياسات، أدلة إجراءات، لجان، لوحات متابعة"],
            ["التخطيط طويل الأمد", "خطة سنوية عامة", "100 يوم + سنة 1 + خارطة 2–5 مربوطة بمؤشرات"],
        ],
    )

    # ========== 6 How he will transform ==========
    add_section_title(doc, "6", "كيف سيُحدث وسيم التحول في المدرسة؟")
    add_ar(
        doc,
        "التحول يُنفَّذ عبر ثمانية مسارات مترابطة. كل مسار له تدخل عملي، ومالك داخلي، ومؤشر. الهدف في السنة الأولى ليس «تغيير كل شيء»، "
        "بل تثبيت الحد الأدنى التشغيلي للجودة والقبول والبيانات بحيث يمكن البناء عليه في السنوات التالية.",
    )
    add_table(
        doc,
        ["مجال التحول", "التدخل العملي", "مؤشر قياس أولي"],
        [
            ["أكاديمي", "إطار جودة صفية، مواءمة تقويم، دعم المتعثرين", "% اكتمال خطط التحسين · نتائج داخلية"],
            ["تشغيلي", "تقويم اجتماعات، مصفوفة مسؤوليات، تقارير شهرية", "التزام الإيقاع · إغلاق التوصيات"],
            ["رقمي", "منصة تعلم أساسية + سياسات استخدام", "نسبة تفعيل · اكتمال المحتوى الأولوي"],
            ["القبول", "رحلة ولي أمر واضحة من الاستفسار إلى الالتحاق", "معدل التحويل · جودة الملفات"],
            ["المعلمون", "مسار تطوير مهني مرتبط بالملاحظة الصفية", "ساعات تطوير · تحسن بنود الملاحظة"],
            ["إشراك الأسرة", "تقويم تواصل فصلي وقنوات استجابة", "رضا التواصل · زمن الرد"],
            ["تجربة الطالب", "معايير سلوك تعلم ودعم إرشادي", "الاستبقاء · مؤشرات المشاركة"],
            ["ضمان الجودة", "لجنة جودة ومراجعات داخلية فصلية", "عدد المراجعات · نسبة الإغلاق"],
            ["الهوية البصرية", "فصل تقريبي لهوية الإنترناشونال عن المنهاج الوطني", "% نقاط التماس المفصولة"],
        ],
    )
    add_subtitle(doc, "تفصيل تشغيلي مختصر للمسارات ذات الأولوية")
    add_ar(doc, "أكاديمياً: توحيد أداة ملاحظة صفية، وتحديد مواد حرجة للدعم، ومراجعة عيّنة من أدوات التقويم لضمان الاتساق بين الشعب.", size=11)
    add_ar(doc, "تشغيلياً: تثبيت اجتماع قيادة أسبوعي قصير بأجندة قرارات، لا اجتماعات مطوّلة بلا إغلاق.", size=11)
    add_ar(doc, "في القبول: تحويل الاستفسار إلى مسار واضح (رد أولي، جولة، مقابلة، عرض قيمة، متابعة) مع قياس زمن كل مرحلة.", size=11)
    add_ar(doc, "مع المعلمين: ربط التطوير المهني بما يُلاحظ في الصف، لا بحضور ورش منفصلة عن التطبيق.", size=11)
    add_ar(doc, "مع الأسرة: قناة استجابة بزمن مستهدف، ورسالة فصلية موجزة عما تحقق أكاديمياً وتشغيلياً.", size=11)

    # ========== 6أ Visual identity separation ==========
    add_section_title(doc, "6أ", "فصل الهوية البصرية: الإنترناشونال عن المنهاج الوطني")
    add_ar(
        doc,
        "في مدرسة تضم مساراً دولياً ومنهاجاً وطنياً أردنياً، يُعد اختلاط الهوية البصرية والتشغيلية من أسرع مصادر التشويش على ولي الأمر وعلى تموضع القسم الدولي. "
        "الهدف هنا ليس تقسيم المدرسة إلى كيانين متعاديين، بل بناء «فصل تقريبي مرحلي» يجعل تجربة Omareyah International Division واضحة ومستقلة بصرياً وتشغيلياً عن مسار المنهاج الوطني، مع بقاء العمريّة مؤسسة جامعة.",
    )
    add_image(doc, charts.get("identity", Path()), 6.35)
    add_subtitle(doc, "لماذا الفصل ضروري؟")
    for t in [
        "ولي الأمر يحتاج أن يميّز عرض القيمة الدولي عن المسار الوطني دون ارتباك في الألوان واللافتات والنماذج.",
        "التسويق التربوي يضعف إذا بقيت صور ومواد القسم الدولي تبدو كامتداد غير متمايز للمسار الوطني.",
        "الجودة والقبول والإرشاد تعمل بكفاءة أعلى عندما تكون نقاط التماس (نماذج، رسائل، بوابات) مفصولة تقريباً.",
        "الكوادر تقلّ لديها حالات «خلط الإجراءات» بين المسارين.",
    ]:
        add_bullet(doc, t)

    add_subtitle(doc, "أبعاد الفصل التقريبي (لكل شيء تقريباً)")
    add_table(
        doc,
        ["البُعد", "مسار الإنترناشونال", "مسار المنهاج الوطني", "حد أدنى للسنة 1"],
        [
            ["الشعار/الألوان", "نظام بصري فرعي للقسم الدولي", "هوية المسار الوطني كما هي", "دليل ألوان وقوالب معتمدة"],
            ["الترويسة والشهادات", "قوالب International Division", "قوالب المسار الوطني", "فصل 100% للمخرجات الرسمية"],
            ["القبول والتواصل", "رحلة ولي أمر مستقلة", "قناة المسار الوطني", "نماذج وردود منفصلة"],
            ["اللافتات والممرات", "مناطق تعريف بصرية للقسم", "لافتات المسار الوطني", "لافتات أساسية في مداخل القسم"],
            ["الفصول والعرض", "معايير عرض دولية", "معايير عرض وطنية", "checklist صفّي مختلف"],
            ["الرقمي", "مساحة/قوالب للقسم الدولي", "قنوات المسار الوطني", "فصل القوالب والبريد"],
            ["الفعاليات والتسويق", "باسم Omareyah International", "فعاليات المسار الوطني", "تقويم حملات غير مختلط"],
            ["الزي/الشارات (إن وُجد)", "تمييز بسيط وآمن", "سياسة المسار الوطني", "قرار مجلس قبل التطبيق"],
        ],
    )
    add_subtitle(doc, "خطة التنفيذ المرحلية للفصل")
    add_table(
        doc,
        ["المرحلة", "الأعمال", "المخرج", "مؤشر"],
        [
            ["الأيام 1–30", "تدقيق اختلاط الهوية الحالي (مطبوعات، لافتات، رقمي، قبول)", "خريطة فجوات", "اكتمال التدقيق"],
            ["الأيام 31–100", "إطلاق الحد الأدنى: دليل هوية مختصر + قوالب ترويسة/قبول/رسائل", "دليل + حزمة قوالب", "% القوالب المفعّلة"],
            ["الشهور 4–8", "تطبيق على اللافتات ونقاط التماس الأسرية والمنصات", "بيئة بصرية أوضح", "≥80% نقاط تماس مفصولة"],
            ["نهاية السنة 1", "مراجعة أثر الفصل على وضوح التموضع ورضا الفهم الأسري", "تقرير هوية للمجلس", "تحسن بند «وضوح البرنامج»"],
        ],
    )
    add_callout(
        doc,
        "ضوابط مهمة",
        [
            "الفصل تقريبي ومرحلي — لا يُطلب هدم كامل للهوية المشتركة للمؤسسة الأم دفعة واحدة.",
            "أي تمييز بالزي أو الرموز يخضع لقرار إداري/مجلس ويُنفَّذ بحساسية اجتماعية.",
            "Success 4 Sure قد تدعم التنفيذ التصميمي والتشغيلي، لكن الواجهة الأسرية تبقى باسم العمريّة الدولية.",
        ],
    )

    # ========== 7 S4S Support ==========
    add_section_title(doc, "7", "الدعم الاستراتيجي من Success 4 Sure")
    add_ar(
        doc,
        "Success 4 Sure ليست بديلاً عن إدارة المدرسة، ولا واجهة العلامة. دورها: توفير قدرات تنفيذ متخصصة يصعب بناؤها داخلياً بسرعة مماثلة، "
        "تحت قيادة مدير البرامج الدولية وبما يخدم أولويات قسم العمريّة.",
    )
    add_table(
        doc,
        ["القدرة / الخدمة", "القيمة لقسم العمريّة", "شكل الاستفادة"],
        [
            ["مركز تدريب المعلمين", "رفع جاهزية الصف", "مسارات تدريب مخصصة حسب الاحتياج"],
            ["التطوير المهني", "استمرار نمو الهيئة التعليمية", "ورش + متابعة تطبيق صفّي"],
            ["إعداد الاختبارات الدولية", "جاهزية أعلى للطلبة", "برامج تحضير منضبطة زمنياً"],
            ["برامج الدعم الأكاديمي", "تقليل التعثر", "دعم موجّه للمواد الحرجة"],
            ["تكنولوجيا التعليم", "توحيد الأدوات", "اختيار وتشغيل بأقل تشتيت"],
            ["التعلم الرقمي", "مرونة ومراجعة", "محتوى داعم خارج الحصص"],
            ["الإرشاد الجامعي", "مسارات أوضح للأسرة", "جلسات وخطط فردية/جماعية"],
            ["إثراء الطلبة", "تميز غير صفّي منضبط", "أندية ومسارات اختيارية"],
            ["الفعاليات التربوية", "حضور مجتمعي للعلامة المدرسية", "فعاليات باسم العمريّة"],
            ["دعم التسويق التربوي", "رسالة قيمة صادقة", "محتوى مبني على إثبات الجودة"],
            ["البرامج الصيفية", "استمرار التعلم وجذب", "مدارس صيفية تحت هوية القسم"],
            ["برامج STEM", "مهارات القرن 21", "وحدات عملية قابلة للقياس"],
            ["برامج الذكاء الاصطناعي", "وعي تقني مسؤول", "محتوى عمري مناسب وضوابط"],
            ["التعلم المسجّل", "مراجعة وتقوية", "مكتبة دروس داعمة"],
            ["تحليلات التعلم", "قرارات مبنية على بيانات", "لوحات بسيطة للإدارة"],
        ],
    )

    # ========== 8 Ecosystem ==========
    add_section_title(doc, "8", "المنظومة التعليمية")
    add_ar(
        doc,
        "تعيين موظف واحد — مهما كانت كفاءته — يظل محدوداً بطاقته الفردية. المنظومة تعني أن المدرسة تحصل على شبكة قدرات: تدريب، محتوى، إرشاد، تحليلات، وبرامج إثراء، "
        "تحت حوكمة المدير وباسم العمريّة. هذا يقلل مخاطر الانقطاع، ويسرّع التنفيذ، ويحافظ على استمرارية المعرفة المؤسسية.",
    )
    add_image(doc, charts["ecosystem"], 6.35)
    add_callout(
        doc,
        "قاعدة الهوية",
        [
            "كل تواصل أسري وفعاليات عامة تُقدَّم تحت علامة Omareyah International Division.",
            "يُذكر الشريك عند الحاجة للشفافية التعاقدية أمام المجلس، لا كبديل عن العلامة المدرسية.",
        ],
    )

    # ========== 9 100-day plan ==========
    add_section_title(doc, "9", "خطة المائة يوم")
    add_image(doc, charts["days100"], 6.3)
    add_subtitle(doc, "الأيام 1–30: التشخيص والحوكمة")
    add_table(
        doc,
        ["الأسبوع", "الأهداف", "المخرجات", "مؤشرات"],
        [
            ["1", "تأكيد الصلاحيات ولقاء المجلس/الإدارة", "ميثاق دور مختصَر · جدول حوكمة", "اعتماد الميثاق"],
            ["2", "مسح سريع للبيانات الأكاديمية والقبول", "قائمة فجوات البيانات", "% اكتمال البيانات الحرجة"],
            ["3", "مقابلات عينة معلمين/أسر/طلبة", "ملخص أدلة نوعية", "عدد المقابلات المكتملة"],
            ["4", "تحديد 5 أولويات فقط للمائة يوم", "وثيقة أولويات معتمدة", "موافقة الإدارة العليا"],
        ],
    )
    add_subtitle(doc, "الأيام 31–65: التشغيل السريع")
    add_table(
        doc,
        ["الأسبوع", "الأهداف", "المخرجات", "مؤشرات"],
        [
            ["5–6", "إطلاق إطار الملاحظة الصفية والتطوير المهني", "أداة ملاحظة + جدول زيارات", "عدد الزيارات المنفذة"],
            ["7–8", "تحسين رحلة القبول والتواصل الأسري", "دليل رحلة ولي الأمر", "زمن الاستجابة للاستفسار"],
            ["9", "تفعيل لجنة الجودة وإيقاع التقارير", "محضر لجنة + قالب تقرير", "انعقاد اللجنة في موعدها"],
            ["10", "بدء حزمة دعم أكاديمي للمواد الحرجة", "قوائم الطلبة المستهدفين", "نسبة التحاق بجلسات الدعم"],
        ],
    )
    add_subtitle(doc, "الأيام 66–100: تثبيت الأثر")
    add_table(
        doc,
        ["الأسبوع", "الأهداف", "المخرجات", "مؤشرات"],
        [
            ["11–12", "قياس أولي لرضا الأسرة والمعلمين", "استبيان مختصر + تحليل", "معدل الاستجابة"],
            ["13", "مراجعة رقمية: ما يُبقى وما يُوقف", "قرار أدوات معتمد", "عدد الأدوات الموحّدة"],
            ["14", "تقرير المائة يوم للمجلس", "تقرير نتائج + طلبات السنة 1", "اعتماد التوصيات"],
        ],
    )

    # ========== 10 Year One ==========
    add_section_title(doc, "10", "السنة الأولى — التنفيذ الشهري")
    add_table(
        doc,
        ["الشهر", "التركيز", "مخرج أساسي"],
        [
            ["1–2", "حوكمة + تشخيص + أولويات", "تقرير تشخيص وميثاق دور"],
            ["3", "جودة صفية وتطوير مهني", "دورة ملاحظة أولى مكتملة"],
            ["4", "قبول وتجربة أسرة", "دليل رحلة القبول مفعّل"],
            ["5", "دعم أكاديمي وإرشاد أولي", "برنامج دعم للمواد الحرجة"],
            ["6", "مراجعة منتصف العام", "تقرير نصف سنوي للمجلس"],
            ["7", "رقمنة منضبطة", "حد أدنى تشغيلي للمنصة"],
            ["8", "إثراء وSTEM/فعاليات باسم العمريّة", "تقويم فعاليات مع أثر"],
            ["9", "إعداد اختبارات/مسارات عليا", "خطة تحضير زمنية"],
            ["10", "استبقاء وتخطيط القبول للعام التالي", "توقعات التحاق مبنية على بيانات"],
            ["11", "تقييم معلنين ومسارات PD", "خطط تطوير فردية"],
            ["12", "إقفال سنوي وخارطة السنة 2", "تقرير سنوي + موازنة مبادرات"],
        ],
    )
    add_image(doc, charts["kpi"], 6.35)
    add_ar(
        doc,
        "لوحة المؤشرات أعلاه إرشادية لوضع أهداف قابلة للنقاش مع المجلس بعد اعتماد خط الأساس الحقيقي من بيانات المدرسة.",
        size=10,
        color=GREY,
    )

    # ========== 11 Years 2-5 ==========
    add_section_title(doc, "11", "السنوات 2–5 — خارطة الطريق الاستراتيجية")
    add_image(doc, charts["roadmap"], 6.35)
    add_table(
        doc,
        ["المحور", "السنة 2", "السنة 3", "السنوات 4–5"],
        [
            ["التميز الأكاديمي", "تثبيت إطار الجودة", "رفع اتساق النتائج", "مرجعية داخلية للجودة"],
            ["التوسع الحصيف", "تحسين الإشغال", "برامج إثراء أوسع", "خيارات مسارات متقدمة عند الجاهزية"],
            ["تموضع العلامة", "رواية قيمة مثبتة", "سمعة أسرية أقوى", "تموضع «موثوقية دولية»"],
            ["الاستدامة المالية", "ربط القيمة بالاستبقاء", "كفاءة تشغيل أعلى", "موازنة مبادرات ذات عائد واضح"],
            ["النضج الرقمي", "توحيد المنصة", "تحليلات قرار", "تحسين مستمر مبني على بيانات"],
        ],
    )

    # ========== 12 Outcomes ==========
    add_section_title(doc, "12", "النتائج المتوقعة")
    add_table(
        doc,
        ["النتيجة", "إشارة نجاح خلال 12 شهراً", "إشارة نجاح خلال 24–36 شهراً"],
        [
            ["نمو القبول", "تحسن التحويل من استفسار إلى التحاق", "نمو مستقر غير موسمي فقط"],
            ["الجودة الأكاديمية", "اكتمال دورات ملاحظة وتحسين", "اتساق أعلى بين الشعب"],
            ["جودة المعلمين", "التزام مسار PD وقياس تطبيق", "انخفاض الاعتماد على التوظيف الطارئ"],
            ["رضا الأسرة", "تحسن درجات التواصل والاستجابة", "توصية أسرية أعلى"],
            ["استبقاء الطلبة", "انخفاض أسباب التسرب القابلة للمعالجة", "استقرار الفوج عبر المراحل"],
            ["السمعة الدولية", "أدلة عملية (فعاليات/إرشاد/نتائج داخلية)", "تموضع أوضح في السوق المحلي"],
            ["النمو المالي", "تحسن الاستبقاء يقلل كلفة الفقد", "قدرة أفضل على تخطيط الإيراد"],
        ],
    )

    # ========== 13 Risks ==========
    add_section_title(doc, "13", "تحليل المخاطر")
    add_table(
        doc,
        ["المخاطر", "الأثر", "الاحتمال", "المعالجة"],
        [
            ["غموض الصلاحيات", "تعطيل التنفيذ", "متوسط", "ميثاق دور معتمد من المجلس خلال أول أسبوعين"],
            ["مقاومة التغيير لدى بعض الفرق", "بطء تبنّي الجودة", "متوسط–مرتفع", "تواصل شفاف + PD مرتبط بالدعم لا بالعقاب فقط"],
            ["بيانات غير مكتملة", "مؤشرات ضعيفة", "مرتفع بدايةً", "خطة بيانات حد أدنى خلال 30 يوماً"],
            ["خلط هوية الشريك بالمدرسة", "تشويش العلامة", "متوسط", "دليل تواصل وهوية إلزامي"],
            ["اتساع المبادرات فوق القدرة", "فشل التنفيذ", "مرتفع إن لم يُضبط", "سقف 5 أولويات في المائة يوم"],
            ["قيود مالية", "تأجيل أثر", "متوسط", "مبادرات مرحلية بعائد واضح وموازنة ربعية"],
            ["فشل فصل الهوية عن المسار الوطني", "تشويش أسري وتموضع ضعيف", "متوسط–مرتفع", "خطة هوية مرحلية + قياس نقاط التماس"],
        ],
    )

    # ========== Implementation framework detail ==========
    add_section_title(doc, "14", "نموذج الحوكمة")
    add_image(doc, charts["governance"], 6.35)
    add_subtitle(doc, "إيقاع التقارير")
    add_table(
        doc,
        ["المستوى", "التكرار", "المحتوى"],
        [
            ["المجلس", "ربع سنوي (+ طارئ عند الحاجة)", "مؤشرات، مخاطر، قرارات مطلوبة"],
            ["مدير البرامج الدولية", "أسبوعي داخلي / شهري إداري", "تقدم الأولويات وإغلاق التوصيات"],
            ["اللجان (جودة/قبول/رقمي)", "شهري", "مراجعات تشغيلية وتوصيات"],
            ["رؤساء الأقسام", "أسبوعي", "تنفيذ الصف والدعم والتواصل"],
        ],
    )

    add_subtitle(doc, "إطار التنفيذ التفصيلي (RACI مبسّط)")
    add_ar(
        doc,
        "حتى لا تتحول الخطة إلى نوايا عامة، يُقترح توزيع واضح للمسؤوليات. الرموز: م = مسؤول تنفيذ، ح = يُحاسب/يعتمد، ش = يُستشار، ع = يُعلم.",
        size=11,
    )
    add_table(
        doc,
        ["المبادرة", "المجلس", "مدير البرامج الدولية", "رؤساء الأقسام", "الشريك التنفيذي"],
        [
            ["اعتماد الاستراتيجية والموازنة", "ح", "ش", "ع", "ع"],
            ["خطة المائة يوم", "ع", "ح/م", "ش", "ش"],
            ["الملاحظة الصفية وPD", "ع", "ح", "م", "ش"],
            ["رحلة القبول والتواصل", "ع", "ح", "م", "ش"],
            ["لوحة المؤشرات الربعية", "ح", "م", "ش", "ش"],
            ["البرامج الإثرائية/الصيفية", "ع", "ح", "ش", "م/ش"],
            ["سياسة الهوية والعلامة", "ح", "م", "ع", "ع"],
        ],
    )

    add_subtitle(doc, "مبادئ تمويل السنة الأولى (بدون أرقام مصطنعة)")
    for t in [
        "تُموَّل أولاً المبادرات ذات أثر مباشر على الجودة الصفية واستبقاء الطلبة وتجربة الأسرة.",
        "كل مبادرة خارج التشغيل الاعتيادي تُعرض ببطاقة: الهدف، الكلفة التقديرية، المؤشر، موعد المراجعة.",
        "يُفضَّل الإنفاق المرحلي على الإطلاق الواسع؛ التجريب الصغير ثم التوسع بعد الدليل.",
        "أي خدمة من الشريك التنفيذي تُربط بملحق تعاقدي ونطاق عمل ومخرجات قابلة للاستلام.",
    ]:
        add_bullet(doc, t)

    add_subtitle(doc, "تعريفات مؤشرات الأداء الأساسية")
    add_table(
        doc,
        ["المؤشر", "التعريف التشغيلي", "مصدر البيانات", "تكرار القياس"],
        [
            ["معدل التحويل في القبول", "الملتحقون ÷ الاستفسارات المؤهلة", "سجل القبول", "شهري"],
            ["الاستبقاء", "الطلبة المستمرون ÷ بداية الفترة", "شؤون الطلبة", "فصلي"],
            ["اكتمال الملاحظة الصفية", "الزيارات المنفذة ÷ المخطط", "لجنة الجودة", "شهري"],
            ["رضا التواصل الأسري", "متوسط تقييم بند التواصل", "استبيان مختصر", "فصلي"],
            ["تفعيل التعلم الرقمي", "حسابات نشطة وفق تعريف متفق", "المنصة", "شهري"],
            ["إغلاق توصيات الجودة", "المغلقة في الموعد ÷ الصادرة", "محاضر اللجنة", "شهري"],
        ],
    )

    doc.add_page_break()

    # ========== 15 Recommendation ==========
    add_section_title(doc, "15", "التوصية النهائية لمجلس الإدارة")
    add_ar(
        doc,
        "يُوصى بتعيين الأستاذ وسيم اللبدي قائداً للبرامج الدولية والتحول التعليمي في قسم العمريّة الدولي، بصلاحيات واضحة، وربط أدائه بمؤشرات متفق عليها، "
        "مع تفعيل Success 4 Sure كشريك تنفيذ استراتيجي يخضع لحوكمة المدرسة.",
    )
    add_ar(
        doc,
        "هذا التعيين لا يُقدَّم بوصفه استبدالاً لـ«مدير أكاديمي كفء»، بل بوصفه اختياراً لنموذج مختلف: بناء أنظمة، ربط الجودة بالقبول والأسرة والبيانات، "
        "والاستفادة من منظومة قدرات أوسع من طاقة فرد واحد — مع إبقاء العمريّة هي العلامة، والنتائج هي معيار المحاسبة.",
    )
    add_subtitle(doc, "لماذا هذا القرار يخلق تحولاً مستداماً وليس مجرد تعيين إداري؟")
    for t in [
        "لأنه يربط الدور القيادي بإطار زمني (100 يوم) ومؤشرات، لا بوصف وظيفي عام.",
        "لأنه يبني لجاناً وإيقاعاً تقاريرياً يقلل الاعتماد على ذاكرة شخص واحد.",
        "لأنه يستفيد من منظومة خدمات متخصصة مع إبقاء الهوية المدرسية في الواجهة.",
        "لأنه يضع سياسة هوية واضحة تمنع تشويش العلامة أمام الأسرة والسوق.",
        "لأنه يُخضِع التوسع في السنوات 2–5 لنضج الجودة والاستدامة، لا لضغط النمو فقط.",
    ]:
        add_bullet(doc, t)

    add_callout(
        doc,
        "قرار مقترح للمجلس",
        [
            "اعتماد الدور القيادي المقترح وصلاحياته.",
            "اعتماد إطار المائة يوم ومؤشرات السنة الأولى بعد ضبط خط الأساس.",
            "اعتماد سياسة الهوية: العمريّة أولاً، والشريك للتنفيذ فقط.",
            "اعتماد مسار فصل الهوية البصرية للإنترناشونال عن المنهاج الوطني (مرحلي/تقريبي).",
            "مراجعة ربع سنوية ملزمة أمام المجلس.",
        ],
    )

    add_subtitle(doc, "ملحق أ: معايير مساءلة القائد المقترح خلال السنة الأولى")
    add_table(
        doc,
        ["المعيار", "حد أدنى للنجاح", "مراجعة المجلس"],
        [
            ["وضوح الحوكمة", "ميثاق دور + إيقاع لجان مفعّل", "نهاية اليوم 30"],
            ["جودة التنفيذ", "إنجاز ≥80% من أولويات المائة يوم المتفق عليها", "اليوم 100"],
            ["الشفافية", "تقريران ربع سنويان في موعدهما", "مستمر"],
            ["الهوية", "صفر مخالفات جوهرية لسياسة العلامة", "مستمر"],
            ["الأثر التشغيلي", "تحسن قابل للقياس في مؤشرين على الأقل من: التحويل، الاستبقاء، رضا التواصل، إغلاق توصيات الجودة", "نهاية السنة 1"],
        ],
    )

    add_subtitle(doc, "ملحق ب: ما الذي لن تفعله هذه الخطة؟")
    for t in [
        "لن تقدّم وعوداً رقمية نهائية قبل تدقيق بيانات المدرسة الرسمية.",
        "لن تستبدل هوية العمريّة بهوية الشريك التنفيذي.",
        "لن تطلق عشرات المبادرات المتزامنة في المائة يوم الأولى.",
        "لن تستخدم الذكاء الاصطناعي أو الأدوات الرقمية دون ضوابط تربوية وخصوصية.",
    ]:
        add_bullet(doc, t)

    add_ar(doc, "الأستاذ وسيم اللبدي", size=12, bold=True, color=BURGUNDY, align=WD_ALIGN_PARAGRAPH.CENTER, before=18, after=2)
    add_ar(doc, "مقترح: مدير البرامج الدولية وقائد التحول التعليمي", size=11, color=GREY, align=WD_ALIGN_PARAGRAPH.CENTER, before=0, after=2)
    add_en(doc, "Omareyah International Division — Board Decision Document", size=9, color=GREY, before=10, after=2)

    out = OUTPUT / "Omareyah_International_Executive_Transformation_Blueprint.docx"
    doc.save(out)
    return out


def package(docx_path: Path, pdf_path: Path | None = None) -> Path:
    import shutil
    import zipfile

    PUBLIC.mkdir(parents=True, exist_ok=True)
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    shutil.copy2(docx_path, PUBLIC / docx_path.name)
    shutil.copy2(docx_path, ARTIFACTS / docx_path.name)
    if pdf_path and pdf_path.exists():
        shutil.copy2(pdf_path, PUBLIC / pdf_path.name)
        shutil.copy2(pdf_path, ARTIFACTS / pdf_path.name)
    zip_path = ARTIFACTS / "Omareyah_Executive_Blueprint.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(docx_path, docx_path.name)
        if pdf_path and pdf_path.exists():
            zf.write(pdf_path, pdf_path.name)
        for p in sorted(ASSETS.glob("chart_*.png")):
            zf.write(p, f"assets/{p.name}")
        logo = ASSETS / "success4sure_logo.png"
        if logo.exists():
            zf.write(logo, "assets/success4sure_logo.png")
    shutil.copy2(zip_path, PUBLIC / zip_path.name)
    return zip_path


def main() -> None:
    ensure_dirs()
    print("Creating Success 4 Sure logo watermark...")
    wm = create_watermark()
    print("  ->", wm)
    print("Creating executive charts...")
    charts = create_charts()
    for k, v in charts.items():
        print(f"  {k}: {v.name} ({v.stat().st_size:,} bytes)")
    print("Building premium Arabic DOCX...")
    docx_path = build_docx(charts, wm)
    print(f"  -> {docx_path} ({docx_path.stat().st_size:,} bytes)")
    print("Building high-quality framed PDF...")
    from pdf_engine import build_pdf

    pdf_path = build_pdf(charts)
    print(f"  -> {pdf_path} ({pdf_path.stat().st_size:,} bytes)")
    zip_path = package(docx_path, pdf_path)
    print(f"Packaged: {zip_path}")
    print("DONE")


if __name__ == "__main__":
    main()
