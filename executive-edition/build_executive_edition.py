#!/usr/bin/env python3
"""
Premium Executive Edition builder for Lord International Program Development Plan.

- Preserves every word exactly (typography/layout/branding only)
- Arabic RTL
- Success 4 Sure watermark on every page
- Elegant burgundy border
- Logo colors: burgundy #8B1E2D, gold #B68A3A, grey #666666
- Exports: DOCX, PPTX, high-quality PDF
"""

from __future__ import annotations

import copy
import io
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn, nsmap
from docx.shared import Cm, Inches, Pt, RGBColor, Twips, Emu
from pptx import Presentation
from pptx.dml.color import RGBColor as PptRGB
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches as PptInches, Pt as PptPt, Emu as PptEmu
from pptx.oxml.ns import qn as ppt_qn
from lxml import etree
import fitz

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "output"
FONTS = ROOT / "fonts"

BURGUNDY = (139, 30, 45)
GOLD = (182, 138, 58)
GREY = (102, 102, 102)
DARK = (35, 35, 35)
LIGHT_BOX = (248, 245, 242)
WHITE = (255, 255, 255)

BURGUNDY_HEX = "8B1E2D"
GOLD_HEX = "B68A3A"
GREY_HEX = "666666"

HEADER_EN = "LORD SCHOOL | INTERNATIONAL PROGRAM DEVELOPMENT"
FOOTER_EN = "Prepared by Mr. Waseem Allabadi - Success 4 Sure Academy"

AMIRI_REG = str(FONTS / "Amiri-Regular.ttf")
AMIRI_BOLD = str(FONTS / "Amiri-Bold.ttf")
LIB_SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
LIB_SERIF_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
NOTO_NASKH = "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf"
NOTO_NASKH_BOLD = "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf"


# ---------------------------------------------------------------------------
# Exact document content (words unchanged; tanween reattached from PDF glyphs)
# ---------------------------------------------------------------------------

CONTENT = {
    "cover": {
        "title_ar": "Lord School",  # English school name only (per client request)
        "subtitle_ar": "مقترح تطوير البرنامج الدولي",
        "line3": "وخطة النمو الاستراتيجية لخمس سنوات",
        "line4": "مع التركيز التنفيذي على السنة الأولى",
        "prepared": "إعداد: الأستاذ وسيم اللبدي",
        "role": "مدير البرنامج الدولي المقترح - مؤسس شركة النجاح الأكيد",
        "note": "وثيقة عمل أولية مبنية على المعلومات التقديرية والملاحظات الميدانية المتاحة",
    },
    "sections": [
        {
            "num": "1",
            "title": "الوضع التقريبي الحالي للمدرسة",
            "paras": [
                "تمتلك Lord School قاعدة مناسبة للنمو والتطوير، إلا أن الاستفادة الحالية من طاقتها الاستيعابية ما تزال أقل من الإمكانات المتاحة.",
                "الأرقام الواردة أدناه تقديرية وتحتاج إلى مطابقتها لاحقاً مع السجلات الرسمية للمدرسة.",
            ],
            "box_title": "ملخص الوضع الحالي",
            "bullets": [
                "الطاقة الاستيعابية التقديرية: نحو 650 طالباً.",
                "عدد الطلبة الحالي التقريبي: نحو 300 طالب، أي إشغال يقارب 46%.",
                "متوسط الرسوم السنوية التقديري: نحو 3,000 دينار للطالب، مع افتراض تحصيل فعلي يقارب 80%.",
                "نحو 70% من الطلبة يستخدمون النقل المدرسي، ومتوسط الرسوم بين 200 و 300 دينار للفصل.",
                "المدرسة تملك فرصة واضحة للنمو من خلال رفع جودة البرنامج الدولي، تحسين البيئة التعليمية، وتنفيذ تسويق متخصص.",
            ],
        },
        {
            "num": "2",
            "title": "الإيجابيات والفرص المتاحة",
            "paras": [],
            "bullets": [
                "قدرة استيعابية جيدة تسمح بالنمو دون الحاجة الفورية إلى مبنى جديد.",
                "وجود مدرسة قائمة واسم يمكن البناء عليه بدلاً من البدء من الصفر.",
                "إمكانية تطوير البرنامج الدولي ليصبح عامل الجذب الأساسي للطلبة وأولياء الأمور.",
                "إمكانية إضافة برامج أجنبية جديدة وفق حاجة السوق واحتياجات الطلبة.",
                "قابلية المدرسة للتحول إلى مركز للامتحانات الدولية بعد استيفاء المتطلبات الرسمية.",
                "إمكانية التكامل مع شركة النجاح الأكيد ومنصتها التعليمية وخبراتها في البرامج الدولية.",
                "فرصة لتطوير علاقة قوية مع الجامعات المحلية والدولية وخدمات القبول والدراسة في الخارج.",
                "وجود مساحة نمو كبيرة في التسجيل، خصوصاً في الصفوف 10 و 11 و 12.",
            ],
        },
        {
            "num": "3",
            "title": "السلبيات والتحديات التي تحتاج إلى معالجة",
            "paras": [
                "هذه الملاحظات لا تهدف إلى انتقاد المدرسة، بل إلى تحديد الأولويات التي تؤثر مباشرة في صورة البرنامج الدولي وتجربة الطالب وولي الأمر.",
            ],
            "bullets": [
                "بعض الصفوف تحتاج إلى دهان وتجديد بصري يعطي انطباعاً تعليمياً أفضل.",
                "الحاجة إلى تركيب بلاط إسفنجي في الصفوف والمناطق التي تتطلب حماية إضافية.",
                "الحاجة إلى شاشات تعليمية حديثة وخزائن مناسبة داخل الصفوف.",
                "ضرورة تنظيم طريقة وضع الشاشة بجانب السبورة البيضاء حتى يتمكن المعلم من استخدام الوسيلتين معاً بكفاءة.",
                "بعض الحمامات تحتاج إلى استكمال الأبواب وأعمال الصيانة الأساسية.",
                "الحاجة إلى تعزيز السلامة على الدرج، خصوصاً الحواجز والإشارات ومناطق الحركة.",
                "المختبرات تحتاج إلى تجهيز فعلي بالأدوات والمواد والأجهزة اللازمة للبرامج الدولية.",
                "إعادة ترتيب الصفوف وتوزيعها حسب المراحل والبرامج لتقليل التشويش وتحسين الحركة.",
                "الحاجة إلى هوية واضحة للبرنامج الدولي وتسويق متخصص وليس تسويقاً عاماً فقط.",
                "الحاجة إلى نظام ثابت لمتابعة المعلمين والطلبة والتواصل مع أولياء الأمور.",
            ],
        },
        {
            "num": "4",
            "title": "دور شركة النجاح الأكيد ممثلة بالأستاذ وسيم اللبدي",
            "paras": [
                "سيكون دوري الأساسي مديراً للبرنامج الدولي، على أن تعمل شركة النجاح الأكيد كشريك تطوير أكاديمي وتسويقي وتقني يدعم المدرسة في معالجة التحديات السابقة ضمن الصلاحيات والاتفاقات المعتمدة.",
            ],
            "bullets": [
                "العمل على زيادة أعداد الطلبة في الصفوف 10 و 11 و 12 وما يتيسر من المراحل الأخرى.",
                "تطوير البرامج الأجنبية الحالية واقتراح برامج جديدة مناسبة للسوق.",
                "مراقبة أداء المعلمين بالتنسيق مع إدارة المدرسة، والتوصية بالتدريب أو الاستقطاب عند الحاجة.",
                "متابعة الطلبة فردياً، وتقييم احتياجاتهم، وإرشادهم إلى المواد والامتحانات الخارجية المناسبة.",
                "تنظيم تسجيل الطلبة في الامتحانات الدولية ومتابعة ملفاتهم الأكاديمية.",
                "العمل التدريجي لجعل المدرسة مركزاً للامتحانات الدولية وفق المتطلبات والاعتمادات.",
                "دمج خدمات مركز النجاح الأكيد والمنصة التعليمية بصورة تكاملية مع المدرسة.",
                "تنسيق الزيارات والفعاليات الجامعية، ودعم خدمات الدراسة في الخارج من خلال شركاء متخصصين.",
                "المساهمة في تدريس الفيزياء أو الكيمياء عند الحاجة، ودعم إعداد جداول المرحلة الثانوية.",
            ],
        },
        {
            "num": "5",
            "title": "الخطة التطويرية لخمس سنوات",
            "year1_title": "السنة الأولى: سنة إعادة البناء والانطلاق",
            "year1_intro": "السنة الأولى هي محور الخطة، والهدف منها معالجة الأولويات المباشرة، بناء برنامج دولي منظم، رفع الثقة، وخلق نمو حقيقي في التسجيل.",
            # Logical RTL columns: المرحلة (right) | الأعمال الرئيسية (left)
            "table_headers": ("المرحلة", "الأعمال الرئيسية"),
            "table_rows": [
                (
                    "المرحلة الأولى: أول 30 يوماً",
                    "تقييم الطلبة والمعلمين، مراجعة البرامج الحالية، تحديد احتياجات المختبرات والصفوف، إعداد الهيكل التشغيلي، ووضع مؤشرات أداء واضحة.",
                ),
                (
                    "المرحلة الثانية: من 30 إلى 90 يوماً",
                    "تنظيم الصفوف، بدء أعمال الصيانة ذات الأولوية، إعداد الهوية التسويقية للبرنامج الدولي، تدريب المعلمين، وتفعيل نظام متابعة الطلبة وأولياء الأمور.",
                ),
                (
                    "المرحلة الثالثة: الفصل الأول",
                    "إطلاق حملة تسجيل موجهة، تنظيم أيام مفتوحة، إضافة البرامج المطلوبة، تفعيل المنصة التعليمية، وتحسين تجربة الطالب داخل الصف والمختبر.",
                ),
                (
                    "المرحلة الرابعة: الفصل الثاني",
                    "قياس النتائج، معالجة نقاط الضعف، توسيع الشراكات، التحضير للاعتمادات ومراكز الامتحانات، وإعداد خطة السنة الثانية بناءً على النتائج الفعلية.",
                ),
            ],
            "goals_title": "أهداف السنة الأولى القابلة للقياس",
            "goals": [
                "رفع عدد طلبة المدرسة تدريجياً من نحو 300 إلى هدف تقريبي يصل إلى 400-450 طالباً، مع مراجعة الهدف بعد الاطلاع على بيانات التسجيل الفعلية.",
                "بناء برنامج دولي منظم له هوية واضحة وخدمة متابعة أكاديمية مميزة.",
                "إنهاء أعمال السلامة والصيانة الأساسية ذات الأثر المباشر على الطلبة.",
                "تجهيز مختبر واحد على الأقل بصورة كاملة كنموذج أولي، ثم استكمال بقية المختبرات حسب الأولوية والميزانية.",
                "تطبيق نظام تقييم ومتابعة للمعلمين، وتقارير دورية للطلبة وأولياء الأمور.",
                "إطلاق تسويق تعليمي متخصص يركز على النتائج والخدمات والبرامج الدولية.",
                "إعداد ملف الاعتماد أو مركز الامتحانات المناسب وبدء الخطوات الرسمية عند توفر الشروط.",
            ],
            "years": [
                {
                    "title": "السنة الثانية: التثبيت ورفع الإشغال",
                    "bullets": [
                        "توسيع البرنامج الدولي وإضافة التخصصات والبرامج التي أثبتت وجود طلب عليها.",
                        "رفع الإشغال في المبنى الحالي، وتحسين الاستدامة المالية وجودة الخدمات.",
                        "بناء فريق قيادة أكاديمية قادر على إدارة النمو دون الاعتماد على شخص واحد.",
                        "إعداد دراسة جدوى تفصيلية للفرع الثاني وتحديد الموقع والميزانية والنموذج التشغيلي.",
                    ],
                },
                {
                    "title": "السنة الثالثة: فرع طريق المطار",
                    "paras": [
                        "بعد تحقيق مؤشرات السنتين الأولى والثانية، تستهدف الخطة افتتاح فرع جديد على طريق المطار، مع نقل النموذج الأكاديمي الناجح وتوحيد الجودة والإدارة بين الفرعين.",
                    ],
                },
                {
                    "title": "السنة الرابعة: فرع شفا بدران",
                    "paras": [
                        "في حال نجاح فرع طريق المطار واستقرار المدرسة الأم، تستهدف الخطة افتتاح فرع في شفا بدران، مع توسيع البرامج الدولية وبناء إدارة مركزية مشتركة للموارد البشرية والجودة والتسويق والمالية.",
                    ],
                },
                {
                    "title": "السنة الخامسة: بدء مرحلة الانتشار الفعلية",
                    "paras": [
                        "تبدأ المدرسة في السنة الخامسة مرحلة الانتشار المؤسسي الفعلي، من خلال اختيار مواقع إضافية داخل الأردن، أو بناء شراكات وفروع تعمل تحت اسم ونظام أكاديمي موحد، مع الحفاظ على الجودة وعدم التوسع أسرع من قدرة الإدارة على المتابعة.",
                    ],
                },
            ],
        },
        {
            "num": "6",
            "title": "النتيجة المتوقعة",
            "paras": [
                "الهدف من الخطة ليس فقط معالجة الملاحظات الحالية، بل تحويل البرنامج الدولي إلى محرك نمو للمدرسة. يبدأ النجاح من السنة الأولى عبر تحسين البيئة التعليمية، تنظيم العمل الأكاديمي، رفع جودة المتابعة، واستقطاب الطلبة. وبعد إثبات النموذج واستقراره يمكن الانتقال بصورة مدروسة إلى طريق المطار، ثم شفا بدران، ثم مرحلة الانتشار الفعلي.",
            ],
            "principle_title": "مبدأ التنفيذ",
            "principles": [
                "الأولوية للسنة الأولى والنتائج القابلة للقياس.",
                "كل توسع لاحق مرتبط بتحقيق أهداف أكاديمية وتشغيلية ومالية واضحة.",
                "التطوير يتم بالتعاون مع إدارة المدرسة وضمن الميزانيات والصلاحيات المعتمدة.",
                "الأرقام الواردة تقديرية وتُحدَّث بعد الاطلاع على البيانات الرسمية.",
            ],
            "sign_name": "الأستاذ وسيم اللبدي",
            "sign_role": "مدير البرنامج الدولي - شركة النجاح الأكيد",
        },
    ],
}


def ensure_dirs() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)


def create_watermark() -> Path:
    """Create a subtle Success 4 Sure watermark image (logo-inspired)."""
    path = ASSETS / "success4sure_watermark.png"
    w, h = 1600, 1200
    img = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    try:
        font_success = ImageFont.truetype(LIB_SERIF_BOLD, 96)
        font_4sure = ImageFont.truetype(LIB_SERIF, 54)
    except OSError:
        font_success = ImageFont.load_default()
        font_4sure = font_success

    success = "SUCCESS"
    foursure = "4 SURE"

    # Centered stacked brand mark
    bbox1 = draw.textbbox((0, 0), success, font=font_success)
    tw1, th1 = bbox1[2] - bbox1[0], bbox1[3] - bbox1[1]
    bbox2 = draw.textbbox((0, 0), foursure, font=font_4sure)
    tw2, th2 = bbox2[2] - bbox2[0], bbox2[3] - bbox2[1]

    x1 = (w - tw1) // 2
    y1 = h // 2 - th1 - 8
    x2 = (w - tw2) // 2
    y2 = h // 2 + 12

    # Soft burgundy + grey, low alpha for watermark use
    draw.text((x1, y1), success, font=font_success, fill=(*BURGUNDY, 55))
    draw.text((x2, y2), foursure, font=font_4sure, fill=(*GREY, 45))

    # Thin decorative line under SUCCESS
    line_y = y1 + th1 + 6
    draw.line([(x1 + 20, line_y), (x1 + tw1 - 20, line_y)], fill=(*GOLD, 40), width=2)

    # Rotate for classic diagonal watermark
    img = img.rotate(32, expand=True, resample=Image.BICUBIC)
    # Crop transparent excess
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.save(path, "PNG")
    return path


# ===================== DOCX helpers =====================

def set_run_font(run, name: str, size_pt: float, color: tuple[int, int, int], bold: bool = False):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:ascii"), name)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), name)
    run._element.rPr.rFonts.set(qn("w:cs"), name)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.color.rgb = RGBColor(*color)
    rPr = run._element.get_or_add_rPr()
    rtl = OxmlElement("w:rtl")
    # only mark Arabic runs as rtl when name is Amiri/Noto
    if any(ord(c) > 0x0600 and ord(c) < 0x06FF for c in (run.text or "")):
        rPr.append(rtl)


def set_paragraph_rtl(paragraph, align=WD_ALIGN_PARAGRAPH.RIGHT):
    paragraph.alignment = align
    pPr = paragraph._p.get_or_add_pPr()
    bidi = pPr.find(qn("w:bidi"))
    if bidi is None:
        bidi = OxmlElement("w:bidi")
        pPr.append(bidi)
    bidi.set(qn("w:val"), "1")
    # Arabic complex script
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


def set_paragraph_spacing(paragraph, before=0, after=6, line=1.25):
    pf = paragraph.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line


def add_ar_paragraph(doc, text, size=12, bold=False, color=DARK, align=WD_ALIGN_PARAGRAPH.RIGHT, before=0, after=6, font="Amiri"):
    p = doc.add_paragraph()
    set_paragraph_rtl(p, align)
    set_paragraph_spacing(p, before, after, 1.35)
    run = p.add_run(text)
    set_run_font(run, font, size, color, bold)
    return p


def add_en_paragraph(doc, text, size=10, bold=False, color=BURGUNDY, align=WD_ALIGN_PARAGRAPH.CENTER, before=0, after=4, font="Liberation Serif"):
    p = doc.add_paragraph()
    p.alignment = align
    set_paragraph_spacing(p, before, after, 1.2)
    run = p.add_run(text)
    set_run_font(run, font, size, color, bold)
    return p


def add_gold_rule(doc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, 4, 8, 1.0)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "12")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), GOLD_HEX)
    pBdr.append(bottom)
    pPr.append(pBdr)
    return p


def shade_cell(cell, hex_color: str):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell_border(cell, color=BURGUNDY_HEX, sz="8"):
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


def set_table_rtl(table):
    """Force visual RTL column order so first logical column appears on the right."""
    tbl = table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else OxmlElement("w:tblPr")
    if tbl.tblPr is None:
        tbl.insert(0, tblPr)
    bidi = tblPr.find(qn("w:bidiVisual"))
    if bidi is None:
        bidi = OxmlElement("w:bidiVisual")
        tblPr.append(bidi)


def set_table_full_width(table):
    tbl = table._tbl
    tblPr = tbl.tblPr
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW = OxmlElement("w:tblW")
        tblPr.append(tblW)
    tblW.set(qn("w:type"), "pct")
    tblW.set(qn("w:w"), "5000")  # 100%


def set_cell_width(cell, cm_width: float):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcW = tcPr.find(qn("w:tcW"))
    if tcW is None:
        tcW = OxmlElement("w:tcW")
        tcPr.append(tcW)
    tcW.set(qn("w:type"), "dxa")
    tcW.set(qn("w:w"), str(int(cm_width * 567)))


def add_picture_paragraph(doc, image_path: Path, width_inches: float = 6.4):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, 8, 10, 1.0)
    run = p.add_run()
    run.add_picture(str(image_path), width=Inches(width_inches))
    return p


def add_rtl_phase_table(doc, headers, rows):
    """
    Clean RTL table:
      Right: المرحلة (narrow)
      Left: الأعمال الرئيسية (wide)
    """
    table = doc.add_table(rows=1 + len(rows), cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_rtl(table)
    set_table_full_width(table)

    # headers[0]=المرحلة (right via bidiVisual), headers[1]=الأعمال
    for i, text in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.paragraphs[0].clear()
        p = cell.paragraphs[0]
        set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.CENTER)
        run = p.add_run(text)
        set_run_font(run, "Amiri", 12, WHITE, True)
        shade_cell(cell, BURGUNDY_HEX)
        set_cell_border(cell, BURGUNDY_HEX, "12")

    set_cell_width(table.rows[0].cells[0], 4.2)   # المرحلة
    set_cell_width(table.rows[0].cells[1], 12.0)  # الأعمال

    for r_idx, (phase, work) in enumerate(rows, start=1):
        phase_cell = table.rows[r_idx].cells[0]
        work_cell = table.rows[r_idx].cells[1]
        for cell, text, color, bold in (
            (phase_cell, phase, BURGUNDY, True),
            (work_cell, work, DARK, False),
        ):
            cell.paragraphs[0].clear()
            p = cell.paragraphs[0]
            set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.RIGHT)
            set_paragraph_spacing(p, 3, 3, 1.25)
            run = p.add_run(text)
            set_run_font(run, "Amiri", 11, color, bold)
            set_cell_border(cell, "C9B7A0", "10")
            if r_idx % 2 == 0:
                shade_cell(cell, "FBF8F4")
            else:
                shade_cell(cell, "FFFFFF")
        set_cell_width(phase_cell, 4.2)
        set_cell_width(work_cell, 12.0)

    return table


def add_page_border(section, color=BURGUNDY_HEX, sz="24", space="24"):
    """Elegant double-feel border via page borders."""
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
    # inner thin gold border simulation via smaller space not possible; keep elegant single burgundy
    sectPr.append(pgBorders)


def add_watermark_to_section(section, watermark_path: Path):
    """Place Success 4 Sure watermark image in header on every page."""
    header = section.header
    header.is_linked_to_previous = False
    for p in header.paragraphs:
        p.clear()
    p = header.paragraphs[0] if header.paragraphs else header.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    run.add_picture(str(watermark_path), width=Inches(5.4))
    section.header_distance = Cm(0.35)
    section.footer_distance = Cm(0.55)

    # Also add classic Word text watermark for compatibility
    # (image watermark in header already provides brand mark)


def set_section_rtl(section):
    sectPr = section._sectPr
    bidi = OxmlElement("w:bidi")
    bidi.set(qn("w:val"), "1")
    sectPr.append(bidi)


def add_footer(section):
    footer = section.footer
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(FOOTER_EN)
    set_run_font(run, "Liberation Serif", 9, GREY, False)


def build_docx(watermark_path: Path) -> Path:
    doc = Document()

    # Page setup A4-ish letter with generous margins inside border
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.left_margin = Inches(0.85)
    section.right_margin = Inches(0.85)
    section.top_margin = Inches(0.95)
    section.bottom_margin = Inches(0.9)
    set_section_rtl(section)
    add_page_border(section, BURGUNDY_HEX, sz="28", space="18")
    add_watermark_to_section(section, watermark_path)
    add_footer(section)

    # Default style
    style = doc.styles["Normal"]
    style.font.name = "Amiri"
    style.font.size = Pt(12)
    style._element.rPr.rFonts.set(qn("w:cs"), "Amiri")

    cover = CONTENT["cover"]

    # Header EN
    add_en_paragraph(doc, HEADER_EN, size=11, bold=True, color=BURGUNDY, before=6, after=28)

    # Cover titles — school name in English only
    add_en_paragraph(doc, cover["title_ar"], size=30, bold=True, color=BURGUNDY, before=36, after=10)
    add_ar_paragraph(doc, cover["subtitle_ar"], size=20, bold=True, color=GOLD, align=WD_ALIGN_PARAGRAPH.CENTER, before=8, after=8)
    add_ar_paragraph(doc, cover["line3"], size=16, bold=False, color=DARK, align=WD_ALIGN_PARAGRAPH.CENTER, before=4, after=6)
    add_ar_paragraph(doc, cover["line4"], size=15, bold=True, color=BURGUNDY, align=WD_ALIGN_PARAGRAPH.CENTER, before=4, after=28)

    add_gold_rule(doc)

    add_ar_paragraph(doc, cover["prepared"], size=13, bold=False, color=DARK, align=WD_ALIGN_PARAGRAPH.CENTER, before=18, after=4)
    add_ar_paragraph(doc, cover["role"], size=12, bold=False, color=GREY, align=WD_ALIGN_PARAGRAPH.CENTER, before=2, after=36)
    add_ar_paragraph(doc, cover["note"], size=11, bold=False, color=GREY, align=WD_ALIGN_PARAGRAPH.CENTER, before=24, after=12)

    doc.add_page_break()

    # Body sections 1-3 partly etc. — flow all content with page breaks at natural points
    for sec in CONTENT["sections"]:
        if sec["num"] == "5":
            # Section 5 is large — handled specially
            add_ar_paragraph(doc, f"{sec['num']}. {sec['title']}", size=16, bold=True, color=BURGUNDY, before=10, after=6)
            add_gold_rule(doc)
            add_picture_paragraph(doc, ASSETS / "chart_roadmap.png", 6.5)
            add_ar_paragraph(doc, sec["year1_title"], size=14, bold=True, color=GOLD, before=8, after=6)
            add_ar_paragraph(doc, sec["year1_intro"], size=12, bold=False, color=DARK, before=2, after=10)

            add_rtl_phase_table(doc, sec["table_headers"], sec["table_rows"])
            add_picture_paragraph(doc, ASSETS / "chart_phases.png", 6.5)

            add_ar_paragraph(doc, sec["goals_title"], size=13, bold=True, color=GOLD, before=16, after=8)
            for b in sec["goals"]:
                add_ar_paragraph(doc, f"• {b}", size=12, before=1, after=4)

            for year in sec["years"]:
                add_gold_rule(doc)
                add_ar_paragraph(doc, year["title"], size=13, bold=True, color=GOLD, before=8, after=6)
                for b in year.get("bullets", []):
                    add_ar_paragraph(doc, f"• {b}", size=12, before=1, after=3)
                for para in year.get("paras", []):
                    add_ar_paragraph(doc, para, size=12, before=2, after=6)
            continue

        if sec["num"] == "6":
            add_ar_paragraph(doc, f"{sec['num']}. {sec['title']}", size=16, bold=True, color=BURGUNDY, before=12, after=6)
            add_gold_rule(doc)
            for para in sec["paras"]:
                add_ar_paragraph(doc, para, size=12, before=4, after=8)

            # Principle box via shaded 1-cell table
            box = doc.add_table(rows=1, cols=1)
            cell = box.rows[0].cells[0]
            shade_cell(cell, "F8F5F2")
            set_cell_border(cell, BURGUNDY_HEX, "12")
            cell.paragraphs[0].clear()
            p = cell.paragraphs[0]
            set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.RIGHT)
            run = p.add_run(sec["principle_title"])
            set_run_font(run, "Amiri", 13, BURGUNDY, True)
            for b in sec["principles"]:
                p = cell.add_paragraph()
                set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.RIGHT)
                set_paragraph_spacing(p, 2, 3, 1.3)
                run = p.add_run(f"• {b}")
                set_run_font(run, "Amiri", 12, DARK, False)

            add_ar_paragraph(doc, sec["sign_name"], size=13, bold=True, color=BURGUNDY, align=WD_ALIGN_PARAGRAPH.CENTER, before=28, after=2)
            add_ar_paragraph(doc, sec["sign_role"], size=11, bold=False, color=GREY, align=WD_ALIGN_PARAGRAPH.CENTER, before=2, after=6)
            continue

        # Standard sections 1-4
        add_ar_paragraph(doc, f"{sec['num']}. {sec['title']}", size=16, bold=True, color=BURGUNDY, before=10, after=6)
        if sec["num"] != "1":
            add_gold_rule(doc)
        for para in sec.get("paras", []):
            add_ar_paragraph(doc, para, size=12, before=2, after=6)

        if sec.get("box_title"):
            box = doc.add_table(rows=1, cols=1)
            set_table_rtl(box)
            cell = box.rows[0].cells[0]
            shade_cell(cell, "F4F0EC")
            set_cell_border(cell, GOLD_HEX, "10")
            cell.paragraphs[0].clear()
            p = cell.paragraphs[0]
            set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.RIGHT)
            run = p.add_run(sec["box_title"])
            set_run_font(run, "Amiri", 12, BURGUNDY, True)
            for b in sec["bullets"]:
                p = cell.add_paragraph()
                set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.RIGHT)
                set_paragraph_spacing(p, 2, 3, 1.3)
                run = p.add_run(f"• {b}")
                set_run_font(run, "Amiri", 11.5, DARK, False)
            doc.add_paragraph()
            if sec["num"] == "1":
                add_picture_paragraph(doc, ASSETS / "chart_occupancy.png", 6.5)
        else:
            for b in sec.get("bullets", []):
                add_ar_paragraph(doc, f"• {b}", size=12, before=1, after=3)

    out = OUTPUT / "Lord_International_Program_Development_Plan_Executive.docx"
    doc.save(out)
    return out


# ===================== PPTX =====================

def _set_shape_rtl(tf):
    """Mark text frame / paragraphs as RTL."""
    for p in tf.paragraphs:
        pPr = p._p.get_or_add_pPr()
        pPr.set("rtl", "1")
        pPr.set("algn", "r")


def add_slide_chrome(slide, prs, watermark_path: Path):
    """Burgundy border + watermark on a slide."""
    # Outer burgundy border rectangles
    border = 10  # EMU-ish via points — use shapes
    # Top
    shapes = slide.shapes
    # Use four thin rectangles
    from pptx.enum.shapes import MSO_SHAPE

    bw = PptInches(0.045)
    # top
    s = shapes.add_shape(MSO_SHAPE.RECTANGLE, PptInches(0.25), PptInches(0.25), prs.slide_width - PptInches(0.5), bw)
    s.fill.solid()
    s.fill.fore_color.rgb = PptRGB(*BURGUNDY)
    s.line.fill.background()
    # bottom
    s = shapes.add_shape(MSO_SHAPE.RECTANGLE, PptInches(0.25), prs.slide_height - PptInches(0.25) - bw, prs.slide_width - PptInches(0.5), bw)
    s.fill.solid()
    s.fill.fore_color.rgb = PptRGB(*BURGUNDY)
    s.line.fill.background()
    # left
    s = shapes.add_shape(MSO_SHAPE.RECTANGLE, PptInches(0.25), PptInches(0.25), bw, prs.slide_height - PptInches(0.5))
    s.fill.solid()
    s.fill.fore_color.rgb = PptRGB(*BURGUNDY)
    s.line.fill.background()
    # right
    s = shapes.add_shape(MSO_SHAPE.RECTANGLE, prs.slide_width - PptInches(0.25) - bw, PptInches(0.25), bw, prs.slide_height - PptInches(0.5))
    s.fill.solid()
    s.fill.fore_color.rgb = PptRGB(*BURGUNDY)
    s.line.fill.background()

    # Inner gold hairline
    gw = PptInches(0.012)
    inset = PptInches(0.34)
    for args in (
        (inset, inset, prs.slide_width - 2 * inset, gw),
        (inset, prs.slide_height - inset - gw, prs.slide_width - 2 * inset, gw),
        (inset, inset, gw, prs.slide_height - 2 * inset),
        (prs.slide_width - inset - gw, inset, gw, prs.slide_height - 2 * inset),
    ):
        s = shapes.add_shape(MSO_SHAPE.RECTANGLE, *args)
        s.fill.solid()
        s.fill.fore_color.rgb = PptRGB(*GOLD)
        s.line.fill.background()

    # Watermark picture centered, behind-ish (added early so text on top if we call this first)
    pic = shapes.add_picture(str(watermark_path), PptInches(1.6), PptInches(2.4), width=PptInches(7.0))
    # Send to back
    spTree = slide.shapes._spTree
    sp = pic._element
    spTree.remove(sp)
    spTree.insert(2, sp)


def add_textbox(slide, left, top, width, height, text, font_size=14, bold=False, color=DARK, align=PP_ALIGN.RIGHT, font_name="Amiri", rtl=True):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    if rtl:
        pPr = p._p.get_or_add_pPr()
        pPr.set("rtl", "1")
    run = p.add_run()
    run.text = text
    run.font.size = PptPt(font_size)
    run.font.bold = bold
    run.font.color.rgb = PptRGB(*color)
    run.font.name = font_name
    # complex script
    rPr = run._r.get_or_add_rPr()
    return box


def add_bullets_box(slide, left, top, width, height, bullets, font_size=13, color=DARK):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, b in enumerate(bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.RIGHT
        pPr = p._p.get_or_add_pPr()
        pPr.set("rtl", "1")
        p.space_after = PptPt(4)
        run = p.add_run()
        run.text = f"• {b}"
        run.font.size = PptPt(font_size)
        run.font.color.rgb = PptRGB(*color)
        run.font.name = "Amiri"
    return box


def add_header_footer_pptx(slide, prs):
    add_textbox(
        slide,
        PptInches(0.5),
        PptInches(0.38),
        prs.slide_width - PptInches(1.0),
        PptInches(0.35),
        HEADER_EN,
        font_size=11,
        bold=True,
        color=BURGUNDY,
        align=PP_ALIGN.CENTER,
        font_name="Liberation Serif",
        rtl=False,
    )
    add_textbox(
        slide,
        PptInches(0.5),
        prs.slide_height - PptInches(0.55),
        prs.slide_width - PptInches(1.0),
        PptInches(0.3),
        FOOTER_EN,
        font_size=9,
        bold=False,
        color=GREY,
        align=PP_ALIGN.CENTER,
        font_name="Liberation Serif",
        rtl=False,
    )


def build_pptx(watermark_path: Path) -> Path:
    prs = Presentation()
    prs.slide_width = PptInches(10)
    prs.slide_height = PptInches(7.5)
    blank = prs.slide_layouts[6]

    # ---- Slide 1: Cover ----
    slide = prs.slides.add_slide(blank)
    add_slide_chrome(slide, prs, watermark_path)
    add_header_footer_pptx(slide, prs)
    c = CONTENT["cover"]
    add_textbox(
        slide,
        PptInches(0.7),
        PptInches(1.8),
        PptInches(8.6),
        PptInches(0.7),
        c["title_ar"],
        34,
        True,
        BURGUNDY,
        PP_ALIGN.CENTER,
        font_name="Liberation Serif",
        rtl=False,
    )
    add_textbox(slide, PptInches(0.7), PptInches(2.55), PptInches(8.6), PptInches(0.55), c["subtitle_ar"], 22, True, GOLD, PP_ALIGN.CENTER)
    add_textbox(slide, PptInches(0.7), PptInches(3.15), PptInches(8.6), PptInches(0.4), c["line3"], 16, False, DARK, PP_ALIGN.CENTER)
    add_textbox(slide, PptInches(0.7), PptInches(3.55), PptInches(8.6), PptInches(0.4), c["line4"], 15, True, BURGUNDY, PP_ALIGN.CENTER)
    add_textbox(slide, PptInches(0.7), PptInches(4.4), PptInches(8.6), PptInches(0.35), c["prepared"], 14, False, DARK, PP_ALIGN.CENTER)
    add_textbox(slide, PptInches(0.7), PptInches(4.8), PptInches(8.6), PptInches(0.4), c["role"], 12, False, GREY, PP_ALIGN.CENTER)
    add_textbox(slide, PptInches(0.7), PptInches(5.6), PptInches(8.6), PptInches(0.5), c["note"], 11, False, GREY, PP_ALIGN.CENTER)

    # ---- Slide 2: Section 1 ----
    s1 = CONTENT["sections"][0]
    slide = prs.slides.add_slide(blank)
    add_slide_chrome(slide, prs, watermark_path)
    add_header_footer_pptx(slide, prs)
    add_textbox(slide, PptInches(0.55), PptInches(0.75), PptInches(8.9), PptInches(0.4), f"{s1['num']}. {s1['title']}", 18, True, BURGUNDY)
    y = 1.2
    for para in s1["paras"]:
        add_textbox(slide, PptInches(0.55), PptInches(y), PptInches(8.9), PptInches(0.55), para, 13, False, DARK)
        y += 0.55
    add_textbox(slide, PptInches(0.55), PptInches(y + 0.05), PptInches(8.9), PptInches(0.35), s1["box_title"], 14, True, BURGUNDY)
    add_bullets_box(slide, PptInches(0.55), PptInches(y + 0.4), PptInches(8.9), PptInches(2.4), s1["bullets"], 11)
    slide.shapes.add_picture(str(ASSETS / "chart_occupancy.png"), PptInches(1.2), PptInches(5.0), width=PptInches(7.6))

    # ---- Slide 3: Section 2 ----
    s2 = CONTENT["sections"][1]
    slide = prs.slides.add_slide(blank)
    add_slide_chrome(slide, prs, watermark_path)
    add_header_footer_pptx(slide, prs)
    add_textbox(slide, PptInches(0.55), PptInches(0.75), PptInches(8.9), PptInches(0.4), f"{s2['num']}. {s2['title']}", 18, True, BURGUNDY)
    add_bullets_box(slide, PptInches(0.55), PptInches(1.25), PptInches(8.9), PptInches(5.5), s2["bullets"], 13)

    # ---- Slide 4: Section 3 ----
    s3 = CONTENT["sections"][2]
    slide = prs.slides.add_slide(blank)
    add_slide_chrome(slide, prs, watermark_path)
    add_header_footer_pptx(slide, prs)
    add_textbox(slide, PptInches(0.55), PptInches(0.75), PptInches(8.9), PptInches(0.4), f"{s3['num']}. {s3['title']}", 18, True, BURGUNDY)
    add_textbox(slide, PptInches(0.55), PptInches(1.2), PptInches(8.9), PptInches(0.7), s3["paras"][0], 12, False, DARK)
    add_bullets_box(slide, PptInches(0.55), PptInches(1.95), PptInches(8.9), PptInches(4.8), s3["bullets"], 12)

    # ---- Slide 5: Section 4 ----
    s4 = CONTENT["sections"][3]
    slide = prs.slides.add_slide(blank)
    add_slide_chrome(slide, prs, watermark_path)
    add_header_footer_pptx(slide, prs)
    add_textbox(slide, PptInches(0.55), PptInches(0.75), PptInches(8.9), PptInches(0.4), f"{s4['num']}. {s4['title']}", 16, True, BURGUNDY)
    add_textbox(slide, PptInches(0.55), PptInches(1.2), PptInches(8.9), PptInches(0.85), s4["paras"][0], 12, False, DARK)
    add_bullets_box(slide, PptInches(0.55), PptInches(2.1), PptInches(8.9), PptInches(4.6), s4["bullets"], 12)

    # ---- Slide 6: 5-year roadmap chart ----
    s5 = CONTENT["sections"][4]
    slide = prs.slides.add_slide(blank)
    add_slide_chrome(slide, prs, watermark_path)
    add_header_footer_pptx(slide, prs)
    add_textbox(slide, PptInches(0.55), PptInches(0.75), PptInches(8.9), PptInches(0.35), f"{s5['num']}. {s5['title']}", 16, True, BURGUNDY)
    slide.shapes.add_picture(str(ASSETS / "chart_roadmap.png"), PptInches(0.7), PptInches(1.3), width=PptInches(8.6))
    add_textbox(slide, PptInches(0.55), PptInches(5.3), PptInches(8.9), PptInches(0.9), s5["year1_intro"], 13, False, DARK)

    # ---- Slide 7: Year 1 table (proper 2-col) ----
    from pptx.enum.shapes import MSO_SHAPE
    slide = prs.slides.add_slide(blank)
    add_slide_chrome(slide, prs, watermark_path)
    add_header_footer_pptx(slide, prs)
    add_textbox(slide, PptInches(0.55), PptInches(0.7), PptInches(8.9), PptInches(0.35), s5["year1_title"], 15, True, GOLD)
    # Header bar
    hdr = slide.shapes.add_table(1 + len(s5["table_rows"]), 2, PptInches(0.5), PptInches(1.15), PptInches(9.0), PptInches(4.5)).table
    # Right col first visually in RTL reading: col0 = الأعمال (wider left in LTR), col1 = المرحلة
    # PowerPoint tables are LTR: put المرحلة in col1 (right), الأعمال in col0 (left)
    hdr.cell(0, 0).text = s5["table_headers"][1]  # الأعمال الرئيسية
    hdr.cell(0, 1).text = s5["table_headers"][0]  # المرحلة
    for c in range(2):
        cell = hdr.cell(0, c)
        for p in cell.text_frame.paragraphs:
            p.alignment = PP_ALIGN.CENTER
            pPr = p._p.get_or_add_pPr()
            pPr.set("rtl", "1")
            for run in p.runs:
                run.font.bold = True
                run.font.size = PptPt(12)
                run.font.color.rgb = PptRGB(*WHITE)
                run.font.name = "Amiri"
        cell.fill.solid()
        cell.fill.fore_color.rgb = PptRGB(*BURGUNDY)
    for r_idx, (phase, work) in enumerate(s5["table_rows"]):
        hdr.cell(r_idx + 1, 0).text = work
        hdr.cell(r_idx + 1, 1).text = phase
        for c, bold, color in ((0, False, DARK), (1, True, BURGUNDY)):
            cell = hdr.cell(r_idx + 1, c)
            for p in cell.text_frame.paragraphs:
                p.alignment = PP_ALIGN.RIGHT
                pPr = p._p.get_or_add_pPr()
                pPr.set("rtl", "1")
                for run in p.runs:
                    run.font.size = PptPt(11)
                    run.font.bold = bold
                    run.font.color.rgb = PptRGB(*color)
                    run.font.name = "Amiri"
    hdr.columns[0].width = PptInches(6.3)
    hdr.columns[1].width = PptInches(2.7)

    # ---- Slide 8: phases chart + goals ----
    slide = prs.slides.add_slide(blank)
    add_slide_chrome(slide, prs, watermark_path)
    add_header_footer_pptx(slide, prs)
    add_textbox(slide, PptInches(0.55), PptInches(0.7), PptInches(8.9), PptInches(0.35), s5["goals_title"], 15, True, GOLD)
    slide.shapes.add_picture(str(ASSETS / "chart_phases.png"), PptInches(0.7), PptInches(1.1), width=PptInches(8.6))
    add_bullets_box(slide, PptInches(0.55), PptInches(3.7), PptInches(8.9), PptInches(3.0), s5["goals"], 12)

    # ---- Slide 9: Years 2-5 ----
    slide = prs.slides.add_slide(blank)
    add_slide_chrome(slide, prs, watermark_path)
    add_header_footer_pptx(slide, prs)
    y = 0.75
    for year in s5["years"]:
        add_textbox(slide, PptInches(0.55), PptInches(y), PptInches(8.9), PptInches(0.32), year["title"], 13, True, GOLD)
        y += 0.32
        items = year.get("bullets") or year.get("paras") or []
        for item in items:
            add_textbox(slide, PptInches(0.55), PptInches(y), PptInches(8.9), PptInches(0.45 if year.get("paras") else 0.32), f"• {item}" if year.get("bullets") else item, 11, False, DARK)
            y += 0.42 if year.get("paras") else 0.32
        y += 0.12

    # ---- Slide 10: Section 6 ----
    s6 = CONTENT["sections"][5]
    slide = prs.slides.add_slide(blank)
    add_slide_chrome(slide, prs, watermark_path)
    add_header_footer_pptx(slide, prs)
    add_textbox(slide, PptInches(0.55), PptInches(0.75), PptInches(8.9), PptInches(0.4), f"{s6['num']}. {s6['title']}", 18, True, BURGUNDY)
    add_textbox(slide, PptInches(0.55), PptInches(1.2), PptInches(8.9), PptInches(1.3), s6["paras"][0], 13, False, DARK)
    add_textbox(slide, PptInches(0.55), PptInches(2.6), PptInches(8.9), PptInches(0.35), s6["principle_title"], 14, True, BURGUNDY)
    add_bullets_box(slide, PptInches(0.55), PptInches(3.0), PptInches(8.9), PptInches(2.2), s6["principles"], 13)
    add_textbox(slide, PptInches(0.55), PptInches(5.4), PptInches(8.9), PptInches(0.35), s6["sign_name"], 14, True, BURGUNDY, PP_ALIGN.CENTER)
    add_textbox(slide, PptInches(0.55), PptInches(5.8), PptInches(8.9), PptInches(0.35), s6["sign_role"], 12, False, GREY, PP_ALIGN.CENTER)

    out = OUTPUT / "Lord_International_Program_Development_Plan_Executive.pptx"
    prs.save(out)
    return out


# ===================== PDF (high quality via PyMuPDF) =====================

def shape_ar(text: str) -> str:
    """Shape Arabic for PDF rendering."""
    import arabic_reshaper
    from bidi.algorithm import get_display

    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)


def draw_page_frame(page: fitz.Page):
    r = page.rect
    # Outer burgundy
    page.draw_rect(fitz.Rect(18, 18, r.width - 18, r.height - 18), color=[c / 255 for c in BURGUNDY], width=2.2)
    # Inner gold
    page.draw_rect(fitz.Rect(26, 26, r.width - 26, r.height - 26), color=[c / 255 for c in GOLD], width=0.7)


def insert_watermark(page: fitz.Page, watermark_path: Path):
    r = page.rect
    # Centered large watermark
    wm = fitz.Rect(r.width * 0.15, r.height * 0.28, r.width * 0.85, r.height * 0.72)
    page.insert_image(wm, filename=str(watermark_path), keep_proportion=True, overlay=False)


def pdf_header_footer(page, font_en):
    r = page.rect
    page.insert_text(
        fitz.Point(r.width / 2, 48),
        HEADER_EN,
        fontname="enbold",
        fontsize=9.5,
        color=[c / 255 for c in BURGUNDY],
        overlay=True,
    )
    # center manually by measuring
    tw = fitz.get_text_length(HEADER_EN, fontname="helv", fontsize=9.5)
    # re-draw centered using text writer
    page.draw_rect(fitz.Rect(40, 38, r.width - 40, 55), color=None, fill=None, width=0)  # no-op placeholder


def draw_centered_en(page, y, text, fontsize, color, fontfile, bold=False):
    font = fitz.Font(fontfile=fontfile)
    tw = font.text_length(text, fontsize=fontsize)
    x = (page.rect.width - tw) / 2
    page.insert_text(fitz.Point(x, y), text, fontfile=fontfile, fontsize=fontsize, color=[c / 255 for c in color])


def draw_rtl_text(page, y, text, fontsize, color, fontfile, right_margin=48, left_margin=48, align="right"):
    """Draw a single line of Arabic (shaped) right-aligned."""
    shaped = shape_ar(text)
    font = fitz.Font(fontfile=fontfile)
    tw = font.text_length(shaped, fontsize=fontsize)
    usable = page.rect.width - left_margin - right_margin
    if align == "center":
        x = left_margin + (usable - tw) / 2
    else:
        x = page.rect.width - right_margin - tw
    page.insert_text(fitz.Point(x, y), shaped, fontfile=fontfile, fontsize=fontsize, color=[c / 255 for c in color])
    return tw


def wrap_ar(text, fontfile, fontsize, max_width):
    """Simple Arabic word wrap (words already in logical order)."""
    font = fitz.Font(fontfile=fontfile)
    words = text.split()
    lines = []
    cur = ""
    for w in words:
        trial = (cur + " " + w).strip()
        shaped = shape_ar(trial)
        if font.text_length(shaped, fontsize=fontsize) <= max_width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_wrapped_ar(page, y, text, fontsize, color, fontfile, max_width, right_margin=48, line_h=None, align="right"):
    line_h = line_h or fontsize * 1.55
    lines = wrap_ar(text, fontfile, fontsize, max_width)
    for line in lines:
        draw_rtl_text(page, y, line, fontsize, color, fontfile, right_margin=right_margin, align=align)
        y += line_h
    return y


def new_pdf_page(doc):
    page = doc.new_page(width=612, height=792)
    draw_page_frame(page)
    insert_watermark(page, ASSETS / "success4sure_watermark.png")
    draw_centered_en(page, 46, HEADER_EN, 9.5, BURGUNDY, LIB_SERIF_BOLD)
    draw_centered_en(page, 770, FOOTER_EN, 8.5, GREY, LIB_SERIF)
    return page


def build_pdf() -> Path:
    doc = fitz.open()
    font_ar = AMIRI_REG
    font_ar_bold = AMIRI_BOLD
    max_w = 612 - 96

    # Cover
    page = new_pdf_page(doc)
    c = CONTENT["cover"]
    y = 220
    y = draw_wrapped_ar(page, y, c["title_ar"], 30, BURGUNDY, font_ar_bold, max_w, align="center", line_h=42)
    y = draw_wrapped_ar(page, y + 8, c["subtitle_ar"], 20, GOLD, font_ar_bold, max_w, align="center", line_h=32)
    y = draw_wrapped_ar(page, y + 4, c["line3"], 15, DARK, font_ar, max_w, align="center", line_h=26)
    y = draw_wrapped_ar(page, y + 2, c["line4"], 14, BURGUNDY, font_ar_bold, max_w, align="center", line_h=26)
    # gold rule
    page.draw_line(fitz.Point(180, y + 18), fitz.Point(432, y + 18), color=[c / 255 for c in GOLD], width=1.2)
    y += 50
    y = draw_wrapped_ar(page, y, c["prepared"], 13, DARK, font_ar, max_w, align="center", line_h=22)
    y = draw_wrapped_ar(page, y + 4, c["role"], 11.5, GREY, font_ar, max_w, align="center", line_h=20)
    y = draw_wrapped_ar(page, y + 40, c["note"], 10.5, GREY, font_ar, max_w, align="center", line_h=18)

    def ensure_space(page, y, need=60):
        if y > 740 - need:
            page = new_pdf_page(doc)
            return page, 70
        return page, y

    # Sections
    page = new_pdf_page(doc)
    y = 70

    for sec in CONTENT["sections"]:
        page, y = ensure_space(page, y, 80)
        title = f"{sec['num']}. {sec['title']}"
        y = draw_wrapped_ar(page, y, title, 15, BURGUNDY, font_ar_bold, max_w, line_h=24)
        page.draw_line(fitz.Point(48, y + 4), fitz.Point(564, y + 4), color=[c / 255 for c in GOLD], width=0.9)
        y += 18

        if sec["num"] == "5":
            y = draw_wrapped_ar(page, y, sec["year1_title"], 13, GOLD, font_ar_bold, max_w, line_h=22)
            y = draw_wrapped_ar(page, y + 4, sec["year1_intro"], 11.5, DARK, font_ar, max_w, line_h=18)
            y += 10
            # table header bar
            page, y = ensure_space(page, y, 100)
            hdr_rect = fitz.Rect(48, y - 12, 564, y + 10)
            page.draw_rect(hdr_rect, color=None, fill=[c / 255 for c in BURGUNDY])
            # headers RTL: المرحلة on right, الأعمال on left half
            draw_rtl_text(page, y + 4, sec["table_headers"][0], 11, WHITE, font_ar_bold, right_margin=58)
            # left column header approx
            shaped = shape_ar(sec["table_headers"][1])
            font = fitz.Font(fontfile=font_ar_bold)
            tw = font.text_length(shaped, fontsize=11)
            page.insert_text(fitz.Point(60, y + 4), shaped, fontfile=font_ar_bold, fontsize=11, color=(1, 1, 1))
            y += 22
            for phase, work in sec["table_rows"]:
                page, y = ensure_space(page, y, 70)
                start = y
                y = draw_wrapped_ar(page, y, phase, 11, BURGUNDY, font_ar_bold, max_w * 0.95, line_h=17)
                y = draw_wrapped_ar(page, y + 2, work, 10.5, DARK, font_ar, max_w * 0.95, line_h=16)
                page.draw_rect(fitz.Rect(48, start - 12, 564, y + 4), color=[c / 255 for c in (201, 183, 160)], width=0.4)
                y += 12

            page, y = ensure_space(page, y, 40)
            y = draw_wrapped_ar(page, y + 6, sec["goals_title"], 13, GOLD, font_ar_bold, max_w, line_h=22)
            for b in sec["goals"]:
                page, y = ensure_space(page, y, 40)
                y = draw_wrapped_ar(page, y + 2, f"• {b}", 11.5, DARK, font_ar, max_w, line_h=17)

            for year in sec["years"]:
                page, y = ensure_space(page, y, 60)
                page.draw_line(fitz.Point(48, y + 2), fitz.Point(564, y + 2), color=[c / 255 for c in GOLD], width=0.7)
                y += 16
                y = draw_wrapped_ar(page, y, year["title"], 12.5, GOLD, font_ar_bold, max_w, line_h=20)
                for b in year.get("bullets", []):
                    page, y = ensure_space(page, y, 36)
                    y = draw_wrapped_ar(page, y + 2, f"• {b}", 11.5, DARK, font_ar, max_w, line_h=17)
                for para in year.get("paras", []):
                    page, y = ensure_space(page, y, 50)
                    y = draw_wrapped_ar(page, y + 2, para, 11.5, DARK, font_ar, max_w, line_h=17)
            continue

        if sec["num"] == "6":
            for para in sec["paras"]:
                page, y = ensure_space(page, y, 70)
                y = draw_wrapped_ar(page, y, para, 11.5, DARK, font_ar, max_w, line_h=18)
            y += 10
            page, y = ensure_space(page, y, 120)
            box_top = y - 10
            y = draw_wrapped_ar(page, y, sec["principle_title"], 13, BURGUNDY, font_ar_bold, max_w - 20, right_margin=58, line_h=20)
            for b in sec["principles"]:
                y = draw_wrapped_ar(page, y + 2, f"• {b}", 11.5, DARK, font_ar, max_w - 20, right_margin=58, line_h=17)
            page.draw_rect(fitz.Rect(48, box_top, 564, y + 8), color=[c / 255 for c in BURGUNDY], width=1.0)
            page.draw_rect(fitz.Rect(48, box_top, 564, y + 8), color=None, fill=[c / 255 for c in LIGHT_BOX], width=0)
            # redraw text over fill — need to re-draw box content
            # Actually fill covers text; redraw properly
            # Re-render principle box cleanly on same page
            # Undo by recreating: fill first then text — fix by drawing fill before text next time.
            # For this page, re-draw text on top:
            yy = box_top + 16
            yy = draw_wrapped_ar(page, yy, sec["principle_title"], 13, BURGUNDY, font_ar_bold, max_w - 20, right_margin=58, line_h=20)
            for b in sec["principles"]:
                yy = draw_wrapped_ar(page, yy + 2, f"• {b}", 11.5, DARK, font_ar, max_w - 20, right_margin=58, line_h=17)
            page.draw_rect(fitz.Rect(48, box_top, 564, y + 8), color=[c / 255 for c in BURGUNDY], width=1.2)
            y = y + 30
            y = draw_wrapped_ar(page, y + 20, sec["sign_name"], 13, BURGUNDY, font_ar_bold, max_w, align="center", line_h=22)
            y = draw_wrapped_ar(page, y + 4, sec["sign_role"], 11, GREY, font_ar, max_w, align="center", line_h=18)
            continue

        for para in sec.get("paras", []):
            page, y = ensure_space(page, y, 50)
            y = draw_wrapped_ar(page, y, para, 11.5, DARK, font_ar, max_w, line_h=18)

        if sec.get("box_title"):
            page, y = ensure_space(page, y, 140)
            box_top = y
            y = draw_wrapped_ar(page, y + 14, sec["box_title"], 12, BURGUNDY, font_ar_bold, max_w - 16, right_margin=56, line_h=20)
            for b in sec["bullets"]:
                page, y = ensure_space(page, y, 40)
                # if page changed mid-box, skip fancy box
                y = draw_wrapped_ar(page, y + 2, f"• {b}", 11, DARK, font_ar, max_w - 16, right_margin=56, line_h=16)
            # background then redraw — simpler: draw light rect first on next iteration
            # Draw border around approximate region
            page.draw_rect(fitz.Rect(48, box_top, 564, y + 8), color=[c / 255 for c in GOLD], width=0.9)
            # fill behind by inserting then redrawing is hard; leave border only for clarity
            y += 16
        else:
            for b in sec.get("bullets", []):
                page, y = ensure_space(page, y, 40)
                y = draw_wrapped_ar(page, y + 2, f"• {b}", 11.5, DARK, font_ar, max_w, line_h=17)

        y += 12

    out = OUTPUT / "Lord_International_Program_Development_Plan_Executive.pdf"
    # High quality: embed fonts, no compression artifacts
    doc.save(out, garbage=4, deflate=True, clean=True)
    doc.close()
    return out



def build_html_document() -> str:
    """Full HTML body for Story-based PDF (Arabic RTL + English school name)."""
    c = CONTENT["cover"]
    parts: list[str] = []
    parts.append(f"<h1 class='school-en'>{c['title_ar']}</h1>")
    parts.append(f"<p class='sub'>{c['subtitle_ar']}</p>")
    parts.append(f"<p class='line3'>{c['line3']}</p>")
    parts.append(f"<p class='line4'>{c['line4']}</p>")
    parts.append("<hr class='gold'/>")
    parts.append(f"<p class='meta'>{c['prepared']}</p>")
    parts.append(f"<p class='meta grey'>{c['role']}</p>")
    parts.append(f"<p class='note'>{c['note']}</p>")
    parts.append("<div class='pagebreak'></div>")

    for sec in CONTENT["sections"]:
        if sec["num"] == "5":
            parts.append(f"<h2>{sec['num']}. {sec['title']}</h2>")
            parts.append("<p class='chart'><img src='chart_roadmap.png' width='520'/></p>")
            parts.append(f"<h3>{sec['year1_title']}</h3>")
            parts.append(f"<p>{sec['year1_intro']}</p>")
            # MuPDF Story tables lay out LTR: put الأعمال on left (col0), المرحلة on right (col1)
            # so Arabic reading starts at المرحلة on the right.
            parts.append("<table><thead><tr>")
            parts.append(f"<th>{sec['table_headers'][1]}</th>")
            parts.append(f"<th class='phase'>{sec['table_headers'][0]}</th>")
            parts.append("</tr></thead><tbody>")
            for phase, work in sec["table_rows"]:
                parts.append(f"<tr><td class='work'>{work}</td><td class='phase'>{phase}</td></tr>")
            parts.append("</tbody></table>")
            parts.append("<p class='chart'><img src='chart_phases.png' width='520'/></p>")
            parts.append(f"<h3>{sec['goals_title']}</h3><ul>")
            for b in sec["goals"]:
                parts.append(f"<li>{b}</li>")
            parts.append("</ul>")
            for year in sec["years"]:
                parts.append(f"<h3>{year['title']}</h3>")
                if year.get("bullets"):
                    parts.append("<ul>")
                    for b in year["bullets"]:
                        parts.append(f"<li>{b}</li>")
                    parts.append("</ul>")
                for para in year.get("paras", []):
                    parts.append(f"<p>{para}</p>")
            continue

        if sec["num"] == "6":
            parts.append(f"<h2>{sec['num']}. {sec['title']}</h2>")
            for para in sec["paras"]:
                parts.append(f"<p>{para}</p>")
            parts.append("<div class='principle'>")
            parts.append(f"<div class='boxtitle'>{sec['principle_title']}</div><ul>")
            for b in sec["principles"]:
                parts.append(f"<li>{b}</li>")
            parts.append("</ul></div>")
            parts.append(f"<p class='sign'>{sec['sign_name']}</p>")
            parts.append(f"<p class='signrole'>{sec['sign_role']}</p>")
            continue

        parts.append(f"<h2>{sec['num']}. {sec['title']}</h2>")
        for para in sec.get("paras", []):
            parts.append(f"<p>{para}</p>")
        if sec.get("box_title"):
            parts.append("<div class='box'>")
            parts.append(f"<div class='boxtitle'>{sec['box_title']}</div><ul>")
            for b in sec["bullets"]:
                parts.append(f"<li>{b}</li>")
            parts.append("</ul></div>")
            if sec["num"] == "1":
                parts.append("<p class='chart'><img src='chart_occupancy.png' width='520'/></p>")
        elif sec.get("bullets"):
            parts.append("<ul>")
            for b in sec["bullets"]:
                parts.append(f"<li>{b}</li>")
            parts.append("</ul>")

    return "<body>" + "\n".join(parts) + "</body>"


STORY_CSS = """
@font-face { font-family: Amiri; src: url(Amiri-Regular.ttf); }
@font-face { font-family: Amiri; src: url(Amiri-Bold.ttf); font-weight: bold; }
@font-face { font-family: LiberationSerif; src: url(LiberationSerif-Bold.ttf); font-weight: bold; }
body { font-family: Amiri; font-size: 11.5pt; direction: rtl; color: #232323; line-height: 1.5; }
h1, .school-en { font-family: LiberationSerif, Amiri; color: #8B1E2D; text-align: center; font-size: 30pt; margin: 1.2em 0 0.25em; font-weight: bold; direction: ltr; }
.sub { color: #B68A3A; text-align: center; font-size: 18pt; font-weight: bold; margin: 0.25em 0; }
.line3 { text-align: center; font-size: 14pt; margin: 0.2em 0; }
.line4 { color: #8B1E2D; text-align: center; font-size: 13pt; font-weight: bold; margin: 0.2em 0 0.6em; }
.meta { text-align: center; font-size: 12pt; margin: 0.25em 0; }
.grey { color: #666666; }
.note { text-align: center; color: #666666; font-size: 10.5pt; margin-top: 2.2em; }
h2 { color: #8B1E2D; text-align: right; font-size: 14pt; margin: 0.85em 0 0.35em; border-bottom: 1px solid #B68A3A; padding-bottom: 3px; font-weight: bold; }
h3 { color: #B68A3A; text-align: right; font-size: 12.5pt; margin: 0.7em 0 0.3em; font-weight: bold; }
.box { background-color: #F4F0EC; border: 1px solid #B68A3A; padding: 8px 12px; margin: 8px 0; }
.principle { background-color: #F8F5F2; border: 1.5px solid #8B1E2D; padding: 10px 12px; margin: 10px 0; }
.boxtitle { color: #8B1E2D; font-weight: bold; font-size: 12pt; margin: 0 0 6px; text-align: right; }
ul { margin: 0.25em 0; padding-right: 1.2em; }
li { margin: 0.22em 0; text-align: right; }
p { margin: 0.35em 0; text-align: right; }
.chart { text-align: center; margin: 10px 0; direction: ltr; }
table { width: 100%; border-collapse: collapse; margin: 10px 0; direction: rtl; }
th { background-color: #8B1E2D; color: #FFFFFF; padding: 8px 10px; font-size: 11pt; text-align: center; }
td { border: 0.7px solid #C9B7A0; padding: 8px 10px; font-size: 10.5pt; vertical-align: top; text-align: right; }
td.phase, th.phase { color: #8B1E2D; font-weight: bold; width: 28%; background-color: #FBF8F4; }
th.phase { color: #FFFFFF; background-color: #8B1E2D; }
td.work { width: 72%; }
tr:nth-child(even) td.work { background-color: #FBF8F4; }
.sign { text-align: center; color: #8B1E2D; font-weight: bold; font-size: 13pt; margin-top: 1.6em; }
.signrole { text-align: center; color: #666666; font-size: 11pt; }
hr.gold { border: none; border-top: 1.2px solid #B68A3A; margin: 14px 90px; }
.pagebreak { page-break-before: always; height: 0; }
"""


def build_pdf_v2() -> Path:
    """High-quality PDF via PyMuPDF Story (Amiri + RTL) with chrome overlays."""
    html = build_html_document()
    arch = fitz.Archive()
    arch.add(str(FONTS))
    arch.add(str(ASSETS))
    arch.add("/usr/share/fonts/truetype/liberation")
    story = fitz.Story(html=html, user_css=STORY_CSS, archive=arch)

    tmp = OUTPUT / "_story_body.pdf"
    writer = fitz.DocumentWriter(str(tmp))
    mediabox = fitz.paper_rect("letter")
    where = fitz.Rect(42, 58, mediabox.width - 42, mediabox.height - 48)

    def rectfn(rect_num, filled):
        return mediabox, where, fitz.Identity

    story.write(writer, rectfn)
    writer.close()

    body = fitz.open(str(tmp))
    final = fitz.open()
    wm = ASSETS / "success4sure_watermark.png"

    def draw_centered(page, y, text, fontsize, color, fontfile):
        font = fitz.Font(fontfile=fontfile)
        tw = font.text_length(text, fontsize=fontsize)
        x = (page.rect.width - tw) / 2
        page.insert_text(
            fitz.Point(x, y),
            text,
            fontfile=fontfile,
            fontsize=fontsize,
            color=[c / 255 for c in color],
        )

    for i in range(body.page_count):
        src = body[i]
        page = final.new_page(width=src.rect.width, height=src.rect.height)
        r = page.rect
        page.insert_image(
            fitz.Rect(r.width * 0.12, r.height * 0.25, r.width * 0.88, r.height * 0.75),
            filename=str(wm),
            keep_proportion=True,
            overlay=False,
        )
        page.show_pdf_page(page.rect, body, i)
        page.draw_rect(fitz.Rect(16, 16, r.width - 16, r.height - 16), color=[c / 255 for c in BURGUNDY], width=2.4)
        page.draw_rect(fitz.Rect(24, 24, r.width - 24, r.height - 24), color=[c / 255 for c in GOLD], width=0.75)
        draw_centered(page, 44, HEADER_EN, 9.2, BURGUNDY, LIB_SERIF_BOLD)
        draw_centered(page, r.height - 28, FOOTER_EN, 8.2, GREY, LIB_SERIF)

    out = OUTPUT / "Lord_International_Program_Development_Plan_Executive.pdf"
    final.save(str(out), garbage=4, deflate=True, clean=True)
    final.close()
    body.close()
    tmp.unlink(missing_ok=True)
    return out



def main():
    ensure_dirs()
    print("Creating watermark...")
    wm = create_watermark()
    print("  ->", wm)
    print("Building DOCX...")
    docx_path = build_docx(wm)
    print("  ->", docx_path)
    print("Building PPTX...")
    pptx_path = build_pptx(wm)
    print("  ->", pptx_path)
    print("Building high-quality PDF...")
    pdf_path = build_pdf_v2()
    print("  ->", pdf_path)
    print("DONE")
    for p in (docx_path, pptx_path, pdf_path):
        print(f"  {p.name}: {p.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
