/**
 * Navigation / hierarchy engine — Book → Unit → Lesson → Slide
 * Curriculum-agnostic tree helpers (no country logic).
 */
import type {
  InteractiveLessonPackage,
  LessonOutlineNode,
  LessonSectionId,
} from "@/types/interactive-lesson-engine";
import { LESSON_SECTION_LABELS, LESSON_SECTION_ORDER } from "@/types/interactive-lesson-engine";

export type HierarchyNode = {
  type: "book" | "unit" | "lesson" | "slide" | "section";
  id: string;
  title: { en: string; ar: string };
  href?: string;
  children?: HierarchyNode[];
};

export type BreadcrumbItem = {
  type: HierarchyNode["type"];
  id: string;
  title: { en: string; ar: string };
  href?: string;
};

export function buildLessonSectionOutline(pkg: InteractiveLessonPackage): HierarchyNode[] {
  return LESSON_SECTION_ORDER.filter((id) => (pkg.sections[id] || []).length > 0 || id === "interactive_slides").map(
    (id) => ({
      type: "section" as const,
      id,
      title: LESSON_SECTION_LABELS[id],
    }),
  );
}

export function buildSlideOutline(pkg: InteractiveLessonPackage): HierarchyNode[] {
  return [...(pkg.slides || [])]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      type: "slide" as const,
      id: s.id,
      title: s.title,
    }));
}

export function buildBreadcrumbs(args: {
  book?: { id: string; title: { en: string; ar: string }; href?: string };
  unit?: { id: string; title: { en: string; ar: string }; href?: string };
  lesson: { id: string; title: { en: string; ar: string }; href?: string };
  section?: { id: LessonSectionId; title: { en: string; ar: string } };
}): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  if (args.book) items.push({ type: "book", ...args.book });
  if (args.unit) items.push({ type: "unit", ...args.unit });
  items.push({ type: "lesson", ...args.lesson });
  if (args.section) items.push({ type: "section", ...args.section });
  return items;
}

export function adjacentIndex(total: number, index: number): { prev: number | null; next: number | null } {
  return {
    prev: index > 0 ? index - 1 : null,
    next: index < total - 1 ? index + 1 : null,
  };
}

export function searchPackage(
  pkg: InteractiveLessonPackage,
  query: string,
  locale: "en" | "ar" = "en",
): { kind: "section" | "slide" | "block"; id: string; snippet: string }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: { kind: "section" | "slide" | "block"; id: string; snippet: string }[] = [];

  for (const sectionId of LESSON_SECTION_ORDER) {
    const blocks = pkg.sections[sectionId] || [];
    for (const b of blocks) {
      const hay = `${b.title?.[locale] || ""} ${b.text?.[locale] || ""} ${b.formula || ""} ${b.mermaidSource || ""}`.toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          kind: "block",
          id: b.id,
          snippet: (b.text?.[locale] || b.title?.[locale] || b.id).slice(0, 120),
        });
      }
    }
  }
  for (const slide of pkg.slides || []) {
    const title = slide.title?.[locale] || "";
    if (title.toLowerCase().includes(q)) {
      hits.push({ kind: "slide", id: slide.id, snippet: title });
    }
  }
  return hits.slice(0, 50);
}

export function toLessonOutlineNodes(nodes: HierarchyNode[]): LessonOutlineNode[] {
  return nodes.map((n) => ({
    type: n.type === "section" || n.type === "slide" ? n.type : n.type === "book" ? "book" : n.type === "unit" ? "unit" : "lesson",
    id: n.id,
    title: n.title,
    href: n.href,
    children: n.children ? toLessonOutlineNodes(n.children) : undefined,
  }));
}
