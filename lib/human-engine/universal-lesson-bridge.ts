/**
 * Universal Lesson Bridge — any platform lesson → HumanLessonInput for Sara/Ali.
 * Subject-aware teaching acts: write, draw, solve steps, diagrams, 3D, lab, checks.
 * Doctrine: any future subject/book/course casts sara|ali — no new teacher for a subject.
 * See docs/cursor/platform-teachers-doctrine.md
 */
import type { ContentBlock, InteractiveLessonPackage } from "@/types/interactive-lesson-engine";
import type {
  HumanCharacterId,
  HumanLessonBlock,
  HumanLessonInput,
  LessonBlockKind,
} from "@/types/human-engine";
import type { PlatformTeacherId } from "@/types/platform-teachers";
import { assertPlatformTeacherId } from "@/types/platform-teachers";
import { DEMO_BOOKS } from "@/content/demo/catalog";
import { DEMO_INTERACTIVE_LESSON } from "@/content/demo/interactive-lesson-engine";
import { adaptBookLessonToInteractivePackage } from "@/lib/interactive-lesson-engine/adapt-book-lesson";

export type { PlatformTeacherId };

function ar(text?: { en?: string; ar?: string } | string | null): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text.ar || text.en || "";
}

function subjectFamily(subject: string): "math" | "science" | "language" | "general" {
  const s = subject.toLowerCase();
  if (/math|رياضيات|جبر|هندس|حساب|fraction|عدد/.test(s)) return "math";
  if (/sci|علوم|فيز|كيم|أحياء|physics|chem|bio|تجرب/.test(s)) return "science";
  if (/arab|عربي|english|إنجل|لغة|قراءة/.test(s)) return "language";
  return "general";
}

function blockText(b: ContentBlock): string {
  const parts = [
    ar(b.title),
    ar(b.text),
    b.formula ? `اكتب على السبورة: ${b.formula}` : "",
    b.question ? ar(b.question.prompt) : "",
  ].filter(Boolean);
  return parts.join(" ").trim();
}

function collectTexts(pkg: InteractiveLessonPackage): string[] {
  const out: string[] = [];
  for (const obj of pkg.objectives || []) {
    const t = ar(obj);
    if (t) out.push(t);
  }
  for (const c of pkg.concepts || []) {
    const t = ar(c);
    if (t) out.push(t);
  }
  for (const slide of pkg.slides || []) {
    const title = ar(slide.title);
    if (title) out.push(title);
    for (const b of slide.blocks || []) {
      const t = blockText(b);
      if (t.length > 8) out.push(t);
    }
  }
  for (const section of Object.values(pkg.sections || {})) {
    for (const b of section || []) {
      const t = blockText(b);
      if (t.length > 8) out.push(t);
    }
  }
  const summary = ar(pkg.summary);
  if (summary) out.unshift(summary);
  return [...new Set(out.map((t) => t.replace(/\s+/g, " ").trim()))].slice(0, 24);
}

function enrichLine(
  raw: string,
  family: ReturnType<typeof subjectFamily>,
  index: number,
  teacherId: PlatformTeacherId,
): { kind: LessonBlockKind; text: string } {
  const warm = teacherId === "sara";
  // Inject teaching acts so semantic director drives board/draw/3D/lab — not plain talk.
  if (index === 0) {
    return {
      kind: "hook",
      text: warm
        ? `مرحبا يا أحلى صف. اليوم: ${raw.slice(0, 80)}. جاهزين نبدأ بهدوء؟`
        : `أهلاً. موضوعنا: ${raw.slice(0, 80)}. نرتّب الفكرة بدقة من البداية.`,
    };
  }

  if (/[=≈]|قانون|معادل|صيغة|F\s*=|مساحة|محيط/.test(raw) || (family === "math" && index % 4 === 1)) {
    return {
      kind: "explain",
      text: `اكتب القانون أو الصيغة على السبورة: ${raw.slice(0, 100)}. نثبتها خطوة خطوة.`,
    };
  }

  if (
    /رسم|مخطط|شكل|دائرة|مثلث|منحنى|بياني|diagram|chart/i.test(raw) ||
    (family !== "language" && index % 5 === 2)
  ) {
    return {
      kind: "example",
      text: `الآن أرسم مخططاً على السبورة يوضح: ${raw.slice(0, 90)}. لاحظوا الاتجاه والعلاقات.`,
    };
  }

  if (family === "science" && (index % 5 === 3 || /تجرب|محاك|مختبر|لاحظ/.test(raw))) {
    return {
      kind: "practice",
      text: `نجرب في المختبر ونلاحظ التغير: ${raw.slice(0, 90)}. اربطوا الملاحظة بالقاعدة.`,
    };
  }

  if (
    family === "science" &&
    (index % 6 === 4 || /نموذج|ثلاثي|مجسم|3d|3D/i.test(raw))
  ) {
    return {
      kind: "example",
      text: `هذا نموذج ثلاثي الأبعاد لـ«${raw.slice(0, 60)}». أمسكه وأديره ثم أكبّره لنشوف التفاصيل.`,
    };
  }

  if (family === "math" && index % 3 === 0) {
    return {
      kind: "practice",
      text: `نحل المسألة خطوة بخطوة على السبورة: ${raw.slice(0, 90)}. اكتبوا معي كل خطوة.`,
    };
  }

  if (index % 4 === 3) {
    return {
      kind: "check",
      text: `سؤال سريع للتأكد: ما الفكرة الأساسية في «${raw.slice(0, 50)}»؟ فكروا ثم جاوبوا.`,
    };
  }

  if (/صورة|شاهد|انظر|لاحظ|صورة/.test(raw) || index % 7 === 5) {
    return {
      kind: "explain",
      text: `شوفوا الصورة/الرسم البياني على الشاشة: ${raw.slice(0, 90)}. أشرح العناصر واحداً واحداً.`,
    };
  }

  return {
    kind: index % 2 === 0 ? "explain" : "example",
    text:
      family === "math"
        ? `نوضح الفكرة ثم نكتب الناتج: ${raw.slice(0, 110)}.`
        : family === "science"
          ? `نربط الظاهرة بالملاحظة: ${raw.slice(0, 110)}.`
          : `${raw.slice(0, 120)}.`,
  };
}

/**
 * Build a full Human Engine lesson input from any Interactive Lesson package.
 */
export function bridgeInteractiveLessonToHuman(opts: {
  pkg: InteractiveLessonPackage;
  teacherId: PlatformTeacherId | HumanCharacterId;
  studentLevel?: "below" | "on" | "above";
  maxDurationMs?: number;
}): HumanLessonInput {
  const teacherId = assertPlatformTeacherId(
    opts.teacherId === "ali" || opts.teacherId === "sara" ? opts.teacherId : "sara",
  );
  const subject = opts.pkg.filters?.subject || "general";
  const grade = opts.pkg.filters?.grade || "g1";
  const family = subjectFamily(subject);
  const titleAr = ar(opts.pkg.title) || opts.pkg.id;
  const texts = collectTexts(opts.pkg);

  const pace =
    opts.studentLevel === "below" ? 0.85 : opts.studentLevel === "above" ? 1.15 : 1;
  const durationMs = Math.round(
    Math.min(
      180_000,
      Math.max(65_000, (opts.maxDurationMs || opts.pkg.estimatedMinutes * 60_000 * 0.35) * pace),
    ),
  );

  const blocks: HumanLessonBlock[] = [];
  const source = texts.length
    ? texts
    : [titleAr, ar(opts.pkg.summary) || "نبدأ شرح الدرس."];

  source.forEach((raw, i) => {
    const enriched = enrichLine(raw, family, i, teacherId);
    blocks.push({
      id: `b_${i}_${enriched.kind}`,
      kind: enriched.kind,
      text: enriched.text,
      textAr: enriched.text,
    });
  });

  // Always close with assessment + summary acts
  blocks.push({
    id: "b_check_final",
    kind: "check",
    text: `قبل ما نخلص: لخّصوا بجملة واحدة أهم فكرة في «${titleAr}».`,
    textAr: `قبل ما نخلص: لخّصوا بجملة واحدة أهم فكرة في «${titleAr}».`,
  });
  blocks.push({
    id: "b_close",
    kind: "close",
    text:
      teacherId === "sara"
        ? `أحسنتوا. لخّصنا ${titleAr}. إلى اللقاء يا أحلى صف.`
        : `ممتاز. ضبطنا مفهوم ${titleAr}. إلى اللقاء.`,
    textAr:
      teacherId === "sara"
        ? `أحسنتوا. لخّصنا ${titleAr}. إلى اللقاء يا أحلى صف.`
        : `ممتاز. ضبطنا مفهوم ${titleAr}. إلى اللقاء.`,
  });

  // Ensure science/math get at least one rich act if content was thin
  if (family === "science" && !blocks.some((b) => /تجرب|نموذج ثلاثي/.test(b.text))) {
    blocks.splice(Math.min(2, blocks.length), 0, {
      id: "b_lab_ensure",
      kind: "practice",
      text: `نجرب محاكاة بسيطة لـ«${titleAr}» ونلاحظ التغير خطوة بخطوة.`,
      textAr: `نجرب محاكاة بسيطة لـ«${titleAr}» ونلاحظ التغير خطوة بخطوة.`,
    });
  }
  if (family === "math" && !blocks.some((b) => /اكتب|خطوة/.test(b.text))) {
    blocks.splice(Math.min(2, blocks.length), 0, {
      id: "b_board_ensure",
      kind: "explain",
      text: `اكتبوا معي على السبورة الخطوات الأساسية لـ«${titleAr}».`,
      textAr: `اكتبوا معي على السبورة الخطوات الأساسية لـ«${titleAr}».`,
    });
  }

  return {
    lessonId: `platform_${pkgId(opts.pkg)}_${teacherId}`,
    title: ar(opts.pkg.title) || opts.pkg.id,
    titleAr,
    preferredCharacterId: teacherId,
    language: "ar",
    subject,
    grade,
    durationMs,
    blocks,
  };
}

function pkgId(pkg: InteractiveLessonPackage): string {
  return (
    pkg.source?.lessonId ||
    pkg.id ||
    "lesson"
  ).replace(/[^a-zA-Z0-9_-]/g, "_");
}

function buildPackageFromBookPath(
  bookId: string,
  unitId: string,
  lessonId: string,
): InteractiveLessonPackage | null {
  const book = DEMO_BOOKS.find((b) => b.id === bookId || b.slug === bookId);
  if (!book) return null;
  const unit = book.units.find((u) => u.id === unitId);
  if (!unit) return null;
  const lesson = unit.lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;
  return adaptBookLessonToInteractivePackage(book, unit, lesson, { next: null });
}

/** List catalog entries suitable for the platform teacher studio. */
export function listTeachableCatalog(limit = 40): Array<{
  packageId: string;
  titleAr: string;
  subject: string;
  grade: string;
  bookId?: string;
  unitId?: string;
  lessonId?: string;
  estimatedMinutes: number;
}> {
  const packages: InteractiveLessonPackage[] = [DEMO_INTERACTIVE_LESSON];
  for (const book of DEMO_BOOKS) {
    for (const unit of book.units) {
      for (const lesson of unit.lessons) {
        const pkg = buildPackageFromBookPath(book.id, unit.id, lesson.id);
        if (pkg) packages.push(pkg);
      }
    }
  }
  return packages.slice(0, limit).map((pkg) => ({
    packageId: pkg.id,
    titleAr: ar(pkg.title) || pkg.id,
    subject: pkg.filters?.subject || "general",
    grade: pkg.filters?.grade || "g1",
    bookId: pkg.source?.bookId,
    unitId: pkg.source?.unitId,
    lessonId: pkg.source?.lessonId,
    estimatedMinutes: pkg.estimatedMinutes || 10,
  }));
}

export function resolveTeachablePackage(query: {
  packageId?: string | null;
  bookId?: string | null;
  unitId?: string | null;
  lessonId?: string | null;
}): InteractiveLessonPackage {
  if (
    query.packageId === "demo" ||
    query.packageId === DEMO_INTERACTIVE_LESSON.id
  ) {
    return DEMO_INTERACTIVE_LESSON;
  }
  if (query.bookId && query.unitId && query.lessonId) {
    const pkg = buildPackageFromBookPath(query.bookId, query.unitId, query.lessonId);
    if (pkg) return pkg;
  }
  if (query.packageId) {
    const hit = listTeachableCatalog(200).find((c) => c.packageId === query.packageId);
    if (hit?.bookId && hit.unitId && hit.lessonId) {
      const pkg = buildPackageFromBookPath(hit.bookId, hit.unitId, hit.lessonId);
      if (pkg) return pkg;
    }
    if (hit?.packageId === DEMO_INTERACTIVE_LESSON.id) return DEMO_INTERACTIVE_LESSON;
  }
  return DEMO_INTERACTIVE_LESSON;
}
