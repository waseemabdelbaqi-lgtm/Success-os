#!/usr/bin/env python3
"""High-quality Arabic RTL PDF for Omareyah Executive Blueprint.

Branding: Success 4 Sure logo watermark + burgundy/gold executive frame.
Focus: Visual identity separation (International vs Jordanian National track).
"""


from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "output"
FONTS = ROOT / "fonts"

BURGUNDY = (139 / 255, 30 / 255, 45 / 255)
GOLD = (182 / 255, 138 / 255, 58 / 255)
GREY = (102 / 255, 102 / 255, 102 / 255)
DARK = (35 / 255, 35 / 255, 35 / 255)
LIGHT = (248 / 255, 245 / 255, 242 / 255)

BURGUNDY_RGB = (139, 30, 45)
GOLD_RGB = (182, 138, 58)
GREY_RGB = (102, 102, 102)
DARK_RGB = (35, 35, 35)

AMIRI = str(FONTS / "Amiri-Regular.ttf")
AMIRI_BOLD = str(FONTS / "Amiri-Bold.ttf")
LIB = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
LIB_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"

HEADER = "OMAREYAH INTERNATIONAL DIVISION | EXECUTIVE TRANSFORMATION BLUEPRINT"
FOOTER = "Prepared for the Board — Mr. Waseem Allabadi | Partner: Success 4 Sure"

_FONT_CACHE: dict[str, fitz.Font] = {}


def pdf_font(path: str) -> fitz.Font:
    if path not in _FONT_CACHE:
        _FONT_CACHE[path] = fitz.Font(fontfile=path)
    return _FONT_CACHE[path]


def protect_ltr(text: str) -> str:
    import re

    return re.sub(
        r"([A-Za-z][A-Za-z0-9 .,&|/\-]{0,80})",
        lambda m: "\u200e" + m.group(1).strip() + "\u200e",
        text,
    )


def shape_ar(text: str) -> str:
    import arabic_reshaper
    from bidi.algorithm import get_display

    return get_display(arabic_reshaper.reshape("\u200f" + protect_ltr(text)))


def draw_frame(page: fitz.Page) -> None:
    r = page.rect
    # Outer burgundy
    page.draw_rect(fitz.Rect(16, 16, r.width - 16, r.height - 16), color=BURGUNDY, width=2.4)
    # Inner gold
    page.draw_rect(fitz.Rect(24, 24, r.width - 24, r.height - 24), color=GOLD, width=0.9)
    # Fine inner line
    page.draw_rect(fitz.Rect(30, 30, r.width - 30, r.height - 30), color=BURGUNDY, width=0.35)


def draw_watermark(page: fitz.Page) -> None:
    logo = ASSETS / "success4sure_logo_wm.png"
    if not logo.exists():
        logo = ASSETS / "success4sure_watermark.png"
    if not logo.exists():
        return
    r = page.rect
    # Large centered background logo
    side = min(r.width, r.height) * 0.62
    rect = fitz.Rect(
        (r.width - side) / 2,
        (r.height - side) / 2 - 10,
        (r.width + side) / 2,
        (r.height + side) / 2 - 10,
    )
    page.insert_image(rect, filename=str(logo), keep_proportion=True, overlay=False)


def draw_header_footer(page: fitz.Page, page_no: int, total: int) -> None:
    font = pdf_font(LIB_BOLD)
    tw = fitz.TextWriter(page.rect)
    fs = 8.2
    w = font.text_length(HEADER, fontsize=fs)
    tw.append(((page.rect.width - w) / 2, 44), HEADER, font=font, fontsize=fs)
    tw.write_text(page, color=BURGUNDY)
    font2 = pdf_font(LIB)
    fw = font2.text_length(FOOTER, fontsize=7.5)
    tw2 = fitz.TextWriter(page.rect)
    tw2.append(((page.rect.width - fw) / 2, page.rect.height - 36), FOOTER, font=font2, fontsize=7.5)
    pg = f"{page_no} / {total}"
    pw = font2.text_length(pg, fontsize=7.5)
    tw2.append(((page.rect.width - pw) / 2, page.rect.height - 24), pg, font=font2, fontsize=7.5)
    tw2.write_text(page, color=GREY)
    # gold rule under header
    page.draw_line(fitz.Point(48, 50), fitz.Point(page.rect.width - 48, 50), color=GOLD, width=0.7)


def new_page(doc: fitz.Document) -> fitz.Page:
    page = doc.new_page(width=595, height=842)  # A4
    draw_watermark(page)
    draw_frame(page)
    return page


def draw_rtl(page, y, text, size, color_rgb, bold=False, right=48, left=48, align="right"):
    ff = AMIRI_BOLD if bold else AMIRI
    shaped = shape_ar(text)
    font = pdf_font(ff)
    tw_w = font.text_length(shaped, fontsize=size)
    usable = page.rect.width - left - right
    if align == "center":
        x = left + (usable - tw_w) / 2
    else:
        x = page.rect.width - right - tw_w
    tw = fitz.TextWriter(page.rect)
    tw.append((x, y), shaped, font=font, fontsize=size)
    tw.write_text(page, color=[c / 255 for c in color_rgb])
    return tw_w


def draw_en(page, y, text, size, color_rgb, bold=False, align="center"):
    ff = LIB_BOLD if bold else LIB
    font = pdf_font(ff)
    w = font.text_length(text, fontsize=size)
    if align == "center":
        x = (page.rect.width - w) / 2
    else:
        x = 48
    tw = fitz.TextWriter(page.rect)
    tw.append((x, y), text, font=font, fontsize=size)
    tw.write_text(page, color=[c / 255 for c in color_rgb])


def wrap_ar(text, size, max_w, bold=False):
    ff = AMIRI_BOLD if bold else AMIRI
    font = pdf_font(ff)
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if font.text_length(shape_ar(trial), fontsize=size) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_wrapped(page, y, text, size, color_rgb, max_w, bold=False, right=48, line_h=None, align="right"):
    line_h = line_h or size * 1.55
    for line in wrap_ar(text, size, max_w, bold):
        draw_rtl(page, y, line, size, color_rgb, bold=bold, right=right, align=align)
        y += line_h
    return y


def draw_bullet(page, y, text, size=10.5, max_w=500, right=48):
    font = pdf_font(AMIRI)
    bullet = "•"
    bw = font.text_length(bullet, fontsize=size)
    bx = page.rect.width - right - bw
    tw = fitz.TextWriter(page.rect)
    tw.append((bx, y), bullet, font=font, fontsize=size)
    tw.write_text(page, color=DARK)
    y2 = draw_wrapped(page, y, text, size, DARK_RGB, max_w - bw - 8, right=right + bw + 7, line_h=size * 1.45)
    return y2


def draw_title(page, y, num, title, size=13.5):
    # number pinned right
    font = pdf_font(AMIRI_BOLD)
    num_s = f"{num}."
    nw = font.text_length(num_s, fontsize=size)
    tw = fitz.TextWriter(page.rect)
    tw.append((page.rect.width - 48 - nw, y), num_s, font=font, fontsize=size)
    tw.write_text(page, color=BURGUNDY)
    y = draw_wrapped(page, y, title, size, BURGUNDY_RGB, 500 - nw - 8, bold=True, right=48 + nw + 8, line_h=size * 1.5)
    page.draw_line(fitz.Point(48, y + 2), fitz.Point(page.rect.width - 48, y + 2), color=GOLD, width=0.9)
    return y + 14


def ensure(doc, page, y, need=70):
    if y > 780 - need:
        page = new_page(doc)
        return page, 62.0
    return page, y


def insert_chart(page, y, path: Path, max_w=500):
    if not path.exists():
        return y
    img = fitz.open(path)
    try:
        aspect = img[0].rect.height / img[0].rect.width
    finally:
        img.close()
    h = max_w * aspect
    x0 = (page.rect.width - max_w) / 2
    page.insert_image(fitz.Rect(x0, y, x0 + max_w, y + h), filename=str(path), keep_proportion=True)
    return y + h + 10


def draw_table(page, y, headers, rows, col_w=None, doc=None):
    """Simple RTL table as stacked cards if many cols; otherwise grid."""
    page_w = page.rect.width
    left, right = 48, 48
    usable = page_w - left - right
    n = len(headers)
    widths = col_w or [usable / n] * n
    row_h_min = 22

    def draw_row(vals, header=False, yy=None):
        nonlocal page, y
        # measure height
        cells_lines = []
        max_lines = 1
        for i, val in enumerate(vals):
            lines = wrap_ar(val, 8.5 if not header else 9, widths[i] - 10, bold=header)
            cells_lines.append(lines)
            max_lines = max(max_lines, len(lines))
        h = max(row_h_min, max_lines * 12 + 10)
        if doc is not None:
            page, yy = ensure(doc, page, yy if yy is not None else y, h + 8)
            y = yy
        fill = BURGUNDY if header else (LIGHT if True else (1, 1, 1))
        # draw from right
        x = page_w - right
        for i in range(n):
            w = widths[i]
            x0 = x - w
            rect = fitz.Rect(x0, y, x, y + h)
            if header:
                page.draw_rect(rect, color=None, fill=BURGUNDY)
            else:
                page.draw_rect(rect, color=None, fill=LIGHT if i % 2 == 0 else (1, 1, 1))
            page.draw_rect(rect, color=GOLD, width=0.5)
            # text
            ty = y + 12
            for line in cells_lines[i]:
                shaped = shape_ar(line)
                font = pdf_font(AMIRI_BOLD if header else AMIRI)
                tw_w = font.text_length(shaped, fontsize=8.5 if not header else 9)
                tx = x - 5 - tw_w
                tw = fitz.TextWriter(page.rect)
                tw.append((tx, ty), shaped, font=font, fontsize=8.5 if not header else 9)
                tw.write_text(page, color=(1, 1, 1) if header else DARK)
                ty += 11
            x = x0
        y += h
        return page, y

    page, y = draw_row(headers, header=True, yy=y)
    for row in rows:
        page, y = draw_row(row, header=False, yy=y)
    return page, y + 8


def build_pdf(charts: dict[str, Path]) -> Path:
    doc = fitz.open()
    pages_meta: list[fitz.Page] = []

    def track(p):
        pages_meta.append(p)
        return p

    # ---- Cover ----
    page = track(new_page(doc))
    logo = ASSETS / "success4sure_logo.png"
    if logo.exists():
        page.insert_image(fitz.Rect(210, 70, 385, 245), filename=str(logo), keep_proportion=True)
    draw_en(page, 270, "SUCCESS 4 SURE", 11, GREY_RGB, bold=True)
    draw_en(page, 286, "Strategic Implementation Partner", 9, GOLD_RGB)
    page.draw_line(fitz.Point(120, 300), fitz.Point(475, 300), color=GOLD, width=1.0)
    draw_en(page, 330, "OMAREYAH INTERNATIONAL DIVISION", 16, BURGUNDY_RGB, bold=True)
    y = draw_wrapped(page, 365, "مخطط التحول التعليمي التنفيذي", 20, BURGUNDY_RGB, 460, bold=True, align="center", line_h=28)
    y = draw_wrapped(page, y + 6, "وثيقة استراتيجية لمجلس الإدارة", 13, DARK_RGB, 460, bold=True, align="center")
    y = draw_wrapped(
        page,
        y + 14,
        "لماذا تعيين الأستاذ وسيم اللبدي مديراً للبرامج الدولية وقائداً للتحول التعليمي؟",
        11,
        GREY_RGB,
        460,
        align="center",
    )
    y = draw_wrapped(
        page,
        y + 24,
        "محور مركزي: فصل الهوية البصرية والتشغيلية لقسم الإنترناشونال عن هوية المنهاج الوطني الأردني داخل المدرسة — بفصل تقريبي مرحلي ومنضبط.",
        11,
        BURGUNDY_RGB,
        460,
        bold=True,
        align="center",
    )
    draw_wrapped(page, 720, "إعداد: الأستاذ وسيم اللبدي — سري لمجلس الإدارة", 11, GREY_RGB, 460, align="center")

    # ---- Identity focus (priority pages) ----
    page = track(new_page(doc))
    y = 62
    y = draw_title(page, y, "A", "فصل الهوية البصرية: الإنترناشونال عن المنهاج الوطني")
    y = draw_wrapped(
        page,
        y,
        "من أكثر نقاط الضعف الشائعة في المدارس متعددة المسارات اختلاط الهوية البصرية والتشغيلية بين البرنامج الدولي والمنهاج الوطني. "
        "النتيجة: تشويش على ولي الأمر، ضعف تموضع القسم الدولي، وصعوبة بناء تجربة مميزة قابلة للتسويق والجودة.",
        10.8,
        DARK_RGB,
        500,
    )
    y = draw_wrapped(
        page,
        y + 4,
        "المطلوب ليس قطيعة إدارية حادة بين المسارين بين ليلة وضحاها، بل «فصل تقريبي مرحلي» واضح في الهوية والتجربة، مع إبقاء العمريّة كمؤسسة جامعة.",
        10.8,
        DARK_RGB,
        500,
    )
    page, y = ensure(doc, page, y, 120)
    if page not in pages_meta:
        track(page)
    y = insert_chart(page, y + 4, charts.get("identity", Path()), 500)

    page, y = ensure(doc, page, y, 80)
    if page not in pages_meta:
        track(page)
    y = draw_wrapped(page, y, "أبعاد الفصل التقريبي (كل بُعد له حد أدنى قابل للتنفيذ خلال السنة الأولى):", 11.5, BURGUNDY_RGB, 500, bold=True)
    dims = [
        "الهوية والشعار والألوان: نظام بصري مستقل لقسم الإنترناشونال (مع بقاء اسم المدرسة المؤسسي).",
        "المطبوعات والمراسلات: ترويسة وشهادات ونماذج قبول مختلفة عن مسار المنهاج الوطني.",
        "اللافتات والممرات: مناطق تعريف بصرية للقسم الدولي تقلل الاختلاط البصري مع المسار الوطني.",
        "الزي/الشارات (إن وُجد): تمييز بسيط وآمن للمسار دون إقصاء أو تضارب مع سياسات المدرسة.",
        "المنصات الرقمية: مساحات/بوابات/قوالب تواصل منفصلة لرحلة ولي أمر البرنامج الدولي.",
        "الفصول ومواد العرض: معايير عرض صفّي للبرنامج الدولي مختلفة عن صفوف المنهاج الوطني.",
        "الفعاليات والتسويق: فعاليات ورسائل باسم Omareyah International Division لا تُخلط مع حملات المسار الوطني.",
        "التشغيل اليومي: جداول تواصل، نماذج إرشاد، ومسارات قبول منفصلة قدر الإمكان.",
    ]
    for d in dims:
        page, y = ensure(doc, page, y, 36)
        if page not in pages_meta:
            track(page)
        y = draw_bullet(page, y + 2, d)

    page, y = ensure(doc, page, y, 100)
    if page not in pages_meta:
        track(page)
    y = draw_wrapped(page, y + 6, "خطة الفصل المرحلي (تقريبية)", 12, GOLD_RGB, 500, bold=True)
    page, y = draw_table(
        page,
        y + 4,
        ["المرحلة", "النطاق", "مخرج"],
        [
            ["0–30 يوماً", "تدقيق الاختلاط البصري الحالي", "خريطة فجوات الهوية"],
            ["31–100 يوماً", "إطلاق الحد الأدنى للهوية الدولية", "دليل هوية مختصر + قوالب"],
            ["الشهور 4–8", "تطبيق على القبول والتواصل واللافتات", "توحيد 80% من نقاط التماس الأسرية"],
            ["نهاية السنة 1", "مراجعة أثر الفصل على وضوح التموضع", "تقرير هوية للمجلس"],
        ],
        col_w=[90, 200, 210],
        doc=doc,
    )

    # Helper to add a standard content page block
    def section(num, title, paras, bullets=None, table=None, chart_key=None, new=True):
        nonlocal page, y
        if new:
            page = track(new_page(doc))
            y = 62.0
        else:
            page, y = ensure(doc, page, y, 90)
            if page not in pages_meta:
                track(page)
        y = draw_title(page, y, num, title)
        for para in paras:
            page, y = ensure(doc, page, y, 50)
            if page not in pages_meta:
                track(page)
            y = draw_wrapped(page, y, para, 10.8, DARK_RGB, 500)
            y += 3
        if bullets:
            for b in bullets:
                page, y = ensure(doc, page, y, 40)
                if page not in pages_meta:
                    track(page)
                y = draw_bullet(page, y + 1, b)
        if table:
            page, y = ensure(doc, page, y, 80)
            if page not in pages_meta:
                track(page)
            page, y = draw_table(page, y + 4, table[0], table[1], table[2] if len(table) > 2 else None, doc=doc)
            for p in doc:
                if p not in pages_meta:
                    track(p)
        if chart_key and charts.get(chart_key):
            page, y = ensure(doc, page, y, 160)
            if page not in pages_meta:
                track(page)
            y = insert_chart(page, y + 2, charts[chart_key], 490)
        y += 8

    section(
        "1",
        "الملخص التنفيذي",
        [
            "يحتاج قسم العمريّة الدولي إلى قيادة تجمع الجودة الأكاديمية والانضباط التشغيلي والتموضع السوقي وبناء الأنظمة.",
            "تقترح الوثيقة تعيين الأستاذ وسيم اللبدي قائداً للبرامج الدولية والتحول، مع Success 4 Sure كشريك تنفيذ فقط — والعمريّة هي العلامة.",
            "أولوية استراتيجية إضافية: فصل تقريبي للهوية البصرية والتشغيلية للإنترناشونال عن هوية المنهاج الوطني داخل المدرسة.",
            "التعيين التقليدي قد يحسّن التشغيل اليومي، لكنه نادراً ما يبني منظومة تربط الجودة والقبول والأسرة والبيانات والهوية البصرية معاً.",
        ],
        table=[
            ["البُعد", "قيمة التعيين المقترح"],
            [["الجودة", "إطار قابل للقياس"], ["القبول", "رسالة مبنية على تجربة"], ["الهوية", "تموضع دولي أوضح"], ["الاستدامة", "منظومة لا فرد فقط"]],
            [250, 250],
        ],
    )

    section(
        "2",
        "تحليل الوضع الحالي",
        [
            "تشمل التحديات النموذجية: تفاوت الجودة، توقعات أسرية عالية، منافسة سوقية، وضعف الفصل البصري بين المسارات.",
            "الفرصة: بناء تموضع برنامج دولي منضبط وواضح الهوية داخل مؤسسة العمريّة دون إضعاف المسار الوطني.",
        ],
        bullets=[
            "اختلاط بصري بين مسار دولي ومسار وطني يضعف وضوح العرض الأسري.",
            "فرصة بناء تموضع «برنامج دولي منضبط وواضح الهوية» داخل مؤسسة العمريّة.",
            "اتجاهات السوق في الأردن تدفع نحو الشفافية وجودة المعلمين والمسارات الجامعية.",
            "فجوات تكامل بين الأكاديميا والقبول والتسويق وشؤون الطلبة.",
        ],
    )

    section(
        "3",
        "لماذا التحول ضروري؟",
        [
            "بدون تحول منظم تبقى السمعة عرضة للتذبذب، ويصعب تسعير القيمة، ويستمر الاعتماد على مبادرات فردية.",
            "فصل الهوية جزء من التحول: لا يكفي تحسين الصف إن بقيت رسالة القسم مختلطة بصرياً وتشغيلياً مع المسار الوطني.",
            "المجلس يحتاج نظام رقابة مبكر بمؤشرات، لا تقارير متأخرة بعد وقوع الأثر.",
        ],
    )

    section(
        "4",
        "من هو الأستاذ وسيم اللبدي؟",
        [
            "يُقدَّم كمرشح لقيادة البرامج الدولية والتحول التعليمي بمنطق الصلاحية القيادية: رؤية، منهجية، بناء أنظمة، واستفادة رشيدة من شريك تنفيذ.",
            "فلسفة القيادة: معايير واضحة، معلمون مدعومون، بيانات بسيطة، ومحاسبة عادلة — والمجلس يراقب النتائج.",
            "الرؤية: قسم دولي موثوق، متسق أكاديمياً، واضح الهوية، ويُعدّ الطالب للمرحلة الجامعية بجدية.",
        ],
        chart_key="method",
    )

    section(
        "5",
        "لماذا وسيم مختلف؟",
        [
            "الفرق في نموذج القيادة: ربط الجودة بالقبول والأسرة والبيانات والهوية البصرية للقسم الدولي، لا الاكتفاء بإدارة اليومي.",
        ],
        table=[
            ["البُعد", "تقليدي", "النموذج المقترح"],
            [
                ["القيادة", "إدارة أزمات", "إيقاع استراتيجي"],
                ["الهوية", "خلط مسارات", "فصل تقريبي واضح"],
                ["الأنظمة", "اعتماد أشخاص", "سياسات ولجان"],
                ["التخطيط", "سنوي عام", "100 يوم + سنة + 2–5"],
                ["التسويق", "حملات موسمية", "رسالة مبنية على إثبات"],
            ],
            [140, 170, 190],
        ],
    )

    section(
        "6",
        "كيف سيُحدث التحول؟",
        [
            "ثمانية مسارات أساسية: أكاديمي، تشغيلي، رقمي، قبول، معلمون، أسرة، تجربة طالب، ضمان جودة — إضافةً لمسار الهوية البصرية.",
            "السنة الأولى تثبّت الحد الأدنى التشغيلي؛ السنوات التالية توسّع الأثر بعد الدليل.",
        ],
        table=[
            ["المسار", "مؤشر أولي"],
            [
                ["أكاديمي", "اكتمال خطط التحسين"],
                ["قبول", "معدل التحويل"],
                ["معلمون", "تحسن بنود الملاحظة"],
                ["هوية بصرية", "% نقاط التماس المنفصلة"],
                ["جودة", "إغلاق التوصيات"],
            ],
            [250, 250],
        ],
    )

    section(
        "7",
        "دعم Success 4 Sure كشريك تنفيذ",
        [
            "الشريك يوفّر قدرات تدريب وتطوير مهني وإرشاد جامعي وتعلم رقمي وتحليلات وبرامج إثراء/STEM/AI وتسويق تربوي ودعم تصميم الهوية التشغيلية.",
            "كل ذلك تحت حوكمة مدير البرامج الدولية وباسم العمريّة — لا باسم الشريك في الواجهة الأسرية.",
        ],
        bullets=[
            "مركز تدريب المعلمين والتطوير المهني",
            "إعداد الاختبارات الدولية والدعم الأكاديمي",
            "التكنولوجيا والتعلم الرقمي والتعلم المسجّل",
            "الإرشاد الجامعي والإثراء وSTEM والذكاء الاصطناعي",
            "البرامج الصيفية والفعاليات والتسويق التربوي",
            "تحليلات التعلم لدعم القرار",
        ],
    )

    section(
        "8",
        "المنظومة التعليمية",
        [
            "التعيين الفردي محدود بطاقة الشخص؛ المنظومة تمنح شبكة قدرات مع استمرارية مؤسسية.",
            "المدرسة في المركز؛ الشريك حلقة تنفيذ محيطة لا بديل عن العلامة.",
        ],
        chart_key="ecosystem",
    )

    section(
        "9",
        "خطة المائة يوم",
        [
            "مرحلة تشخيص وحوكمة، ثم تشغيل سريع، ثم تثبيت أثر — مع مسار هوية بصرية موازٍ.",
        ],
        chart_key="days100",
        table=[
            ["الفترة", "تركيز"],
            [["1–30", "صلاحيات + بيانات + خريطة اختلاط الهوية"], ["31–65", "جودة صفية + قبول + قوالب هوية"], ["66–100", "قياس أولي + تقرير مجلس"]],
            [120, 380],
        ],
    )

    section(
        "10",
        "السنة الأولى",
        [
            "تنفيذ شهري من الحوكمة والتشخيص إلى إقفال سنوي وخارطة السنة الثانية، مع تثبيت الحد الأدنى للهوية الدولية.",
            "المؤشرات أدناه إرشادية وتُضبط بعد اعتماد خط الأساس الرسمي.",
        ],
        chart_key="kpi",
    )

    section(
        "11",
        "السنوات 2–5",
        [
            "تميز أكاديمي، تموضع علامة، استدامة مالية، ونضج رقمي — مع نضج فصل الهوية كجزء من التموضع.",
        ],
        chart_key="roadmap",
    )

    section(
        "12",
        "النتائج المتوقعة",
        [
            "نمو قبول، جودة، رضا أسري، استبقاء، سمعة، وأثر مالي عبر تقليل الفقد — إضافةً لوضوح أعلى لهوية الإنترناشونال.",
        ],
        table=[
            ["النتيجة", "إشارة 12 شهراً"],
            [
                ["القبول", "تحسن التحويل"],
                ["الجودة", "دورات ملاحظة مكتملة"],
                ["الأسرة", "تحسن وضوح البرنامج"],
                ["الهوية", "≥80% نقاط تماس مفصولة"],
                ["الاستبقاء", "انخفاض أسباب التسرب القابلة للمعالجة"],
            ],
            [220, 280],
        ],
    )

    section(
        "13",
        "تحليل المخاطر",
        ["كل خطر مربوط بمعالجة عملية قابلة للرقابة من المجلس."],
        table=[
            ["المخاطر", "المعالجة"],
            [
                ["غموض الصلاحيات", "ميثاق دور مبكر"],
                ["مقاومة التغيير", "تواصل + دعم لا عقاب فقط"],
                ["خلط هوية الشريك/المدرسة", "دليل تواصل إلزامي"],
                ["فشل فصل الهوية", "خطة مرحلية + قياس نقاط التماس"],
                ["اتساع المبادرات", "سقف أولويات المائة يوم"],
            ],
            [240, 260],
        ],
    )

    section(
        "14",
        "نموذج الحوكمة",
        [
            "مجلس ← مدير برامج دولية ← أقسام ولجان جودة/قبول/رقمي/هوية.",
            "تقارير ربع سنوية للمجلس، وإيقاع أسبوعي داخلي للقيادة.",
        ],
        chart_key="governance",
    )

    section(
        "15",
        "التوصية النهائية",
        [
            "يُوصى بتعيين الأستاذ وسيم اللبدي قائداً للبرامج الدولية والتحول التعليمي بصلاحيات ومؤشرات واضحة، مع Success 4 Sure كشريك تنفيذ.",
            "هذا القرار يبني أنظمة وهوية أوضح للإنترناشونال منفصلة تقريباً عن المسار الوطني، لا مجرد إدارة يومية إضافية.",
        ],
        bullets=[
            "اعتماد الدور والصلاحيات.",
            "اعتماد خطة المائة يوم ومسار فصل الهوية.",
            "اعتماد سياسة: العمريّة أولاً، والشريك للتنفيذ فقط.",
            "مراجعة ربع سنوية ملزمة أمام المجلس.",
        ],
    )

    # Finalize headers/footers with total pages
    total = len(doc)
    for i, p in enumerate(doc):
        draw_header_footer(p, i + 1, total)

    out = OUTPUT / "Omareyah_International_Executive_Transformation_Blueprint.pdf"
    doc.save(out, deflate=True, garbage=4)
    doc.close()
    return out
