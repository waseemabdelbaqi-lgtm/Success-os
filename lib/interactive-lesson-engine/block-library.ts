/**
 * Reusable content block library for Interactive Lesson Engine.
 * Blocks are curriculum-agnostic — same types for every country/subject.
 */
import type {
  ContentBlock,
  ContentBlockType,
  LocaleText,
} from "@/types/interactive-lesson-engine";
import { CONTENT_BLOCK_TYPES } from "@/types/interactive-lesson-engine";

export const BLOCK_LIBRARY_META: Record<
  ContentBlockType,
  { label: LocaleText; reusable: true; description: LocaleText }
> = {
  rich_text: {
    label: { en: "Rich text", ar: "نص غني" },
    reusable: true,
    description: { en: "Paragraphs and structured text", ar: "فقرات ونص منظّم" },
  },
  formula: {
    label: { en: "Formula", ar: "معادلة" },
    reusable: true,
    description: { en: "Math / science formula renderer", ar: "عارض معادلات" },
  },
  image: {
    label: { en: "Image", ar: "صورة" },
    reusable: true,
    description: { en: "Static image asset", ar: "أصل صورة ثابتة" },
  },
  svg_diagram: {
    label: { en: "SVG diagram", ar: "مخطط SVG" },
    reusable: true,
    description: { en: "Inline SVG diagram", ar: "مخطط SVG مضمّن" },
  },
  mermaid_diagram: {
    label: { en: "Mermaid diagram", ar: "مخطط Mermaid" },
    reusable: true,
    description: {
      en: "Timelines, flowcharts, sequence diagrams (Mermaid)",
      ar: "جداول زمنية ومخططات تدفق وتسلسل (Mermaid)",
    },
  },
  interactive_chart: {
    label: { en: "Interactive chart", ar: "مخطط تفاعلي" },
    reusable: true,
    description: { en: "Simple chart data", ar: "بيانات مخطط بسيطة" },
  },
  table: {
    label: { en: "Table", ar: "جدول" },
    reusable: true,
    description: { en: "Structured data table", ar: "جدول بيانات منظّم" },
  },
  code: {
    label: { en: "Code block", ar: "كتلة شيفرة" },
    reusable: true,
    description: { en: "Syntax-highlighted code fence", ar: "سياج شيفرة" },
  },
  timeline: {
    label: { en: "Timeline", ar: "خط زمني" },
    reusable: true,
    description: { en: "Sequential timeline items", ar: "عناصر خط زمني متسلسلة" },
  },
  callout: {
    label: { en: "Callout", ar: "تنبيه معلوماتي" },
    reusable: true,
    description: { en: "Highlighted informational callout", ar: "تنبيه معلوماتي بارز" },
  },
  warning: {
    label: { en: "Warning", ar: "تحذير" },
    reusable: true,
    description: { en: "Caution / safety warning block", ar: "كتلة تحذير / سلامة" },
  },
  definition: {
    label: { en: "Definition", ar: "تعريف" },
    reusable: true,
    description: { en: "Term + meaning definition", ar: "مصطلح ومعنى" },
  },
  example: {
    label: { en: "Example", ar: "مثال" },
    reusable: true,
    description: { en: "Worked or illustrative example", ar: "مثال محلول أو توضيحي" },
  },
  accordion: {
    label: { en: "Accordion", ar: "أكورديون" },
    reusable: true,
    description: { en: "Expandable sections", ar: "أقسام قابلة للطي" },
  },
  tabs: {
    label: { en: "Tabs", ar: "تبويبات" },
    reusable: true,
    description: { en: "Tabbed content panels", ar: "لوحات محتوى بتبويبات" },
  },
  embedded_media: {
    label: { en: "Embedded media", ar: "وسائط مضمّنة" },
    reusable: true,
    description: { en: "Generic media embed", ar: "تضمين وسائط عام" },
  },
  audio: {
    label: { en: "Audio", ar: "صوت" },
    reusable: true,
    description: { en: "Audio narration / clip", ar: "مقطع صوتي / سرد" },
  },
  video_placeholder: {
    label: { en: "Video placeholder", ar: "موضع فيديو" },
    reusable: true,
    description: {
      en: "Reserved for teacher / AI video (not produced yet)",
      ar: "محجوز لفيديو المعلم / الذكاء الاصطناعي (غير مُنتَج بعد)",
    },
  },
  simulation_placeholder: {
    label: { en: "Simulation placeholder", ar: "موضع محاكاة" },
    reusable: true,
    description: {
      en: "Reserved for interactive sims / virtual labs",
      ar: "محجوز للمحاكاة / المختبرات الافتراضية",
    },
  },
  scene_3d: {
    label: { en: "3D scene", ar: "مشهد ثلاثي الأبعاد" },
    reusable: true,
    description: {
      en: "Three.js / R3F scene for labs and spatial concepts",
      ar: "مشهد Three.js / R3F للمختبرات والمفاهيم المكانية",
    },
  },
  pdf_document: {
    label: { en: "PDF document", ar: "مستند PDF" },
    reusable: true,
    description: {
      en: "In-browser PDF page via PDF.js",
      ar: "صفحة PDF داخل المتصفح عبر PDF.js",
    },
  },
  downloadable_resource: {
    label: { en: "Downloadable resource", ar: "مورد قابل للتنزيل" },
    reusable: true,
    description: { en: "Worksheet / PDF / file", ar: "ورقة عمل / PDF / ملف" },
  },
  notes: {
    label: { en: "Notes", ar: "ملاحظات" },
    reusable: true,
    description: { en: "Inline lesson notes", ar: "ملاحظات داخل الدرس" },
  },
  ai_explanation: {
    label: { en: "AI explanation", ar: "شرح ذكي" },
    reusable: true,
    description: { en: "AI tutor explanation panel", ar: "لوحة شرح المعلّم الذكي" },
  },
  quick_question: {
    label: { en: "Quick question", ar: "سؤال سريع" },
    reusable: true,
    description: { en: "Inline check-for-understanding", ar: "تحقق سريع من الفهم" },
  },
  internal_nav: {
    label: { en: "Internal navigation", ar: "تنقّل داخلي" },
    reusable: true,
    description: { en: "Jump to section / slide", ar: "انتقال لقسم / شريحة" },
  },
  external_reference: {
    label: { en: "External reference", ar: "مرجع خارجي" },
    reusable: true,
    description: {
      en: "External link where legally permitted",
      ar: "رابط خارجي عند السماح القانوني",
    },
  },
};

export function listBlockLibrary() {
  return CONTENT_BLOCK_TYPES.map((type) => ({
    type,
    ...BLOCK_LIBRARY_META[type],
  }));
}

export function createBlock(
  type: ContentBlockType,
  partial: Partial<ContentBlock> & { id?: string } = {},
): ContentBlock {
  return {
    id: partial.id || `blk_${type}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    title: partial.title,
    text: partial.text,
    formula: partial.formula,
    mermaidSource: partial.mermaidSource,
    stemDomain: partial.stemDomain,
    src: partial.src ?? null,
    alt: partial.alt,
    svgMarkup: partial.svgMarkup,
    chart: partial.chart,
    table: partial.table,
    code: partial.code,
    items: partial.items,
    mediaUrl: partial.mediaUrl ?? null,
    downloadUrl: partial.downloadUrl ?? null,
    protected: partial.protected,
    question: partial.question,
    href: partial.href,
    external: partial.external,
    legalNote: partial.legalNote,
    placeholderStatus: partial.placeholderStatus,
    meta: partial.meta,
  };
}

export function isPlaceholderBlock(block: ContentBlock): boolean {
  return (
    block.type === "video_placeholder" ||
    block.type === "simulation_placeholder" ||
    block.placeholderStatus === "planned" ||
    block.placeholderStatus === "not-produced"
  );
}
