/**
 * Performance & accessibility helpers for ILE.
 */
export const ILE_A11Y = {
  wcagTarget: "WCAG 2.2 AA",
  keyboardNavigation: true,
  reducedMotionQuery: "(prefers-reduced-motion: reduce)",
  focusRing: "2px solid var(--ile-primary)",
  skipLinkLabel: { en: "Skip to lesson content", ar: "تخطّى إلى محتوى الدرس" },
};

export const ILE_PERFORMANCE = {
  lazyLoadBlocks: true,
  virtualizeSlidesAbove: 8,
  dynamicImports: ["mermaid", "three", "pdfjs", "tiptap"],
  offlineStoreKey: "success-os.ile-workspace.v1",
  mobileBreakpointPx: 900,
};

export function shouldVirtualizeSlides(count: number): boolean {
  return count > ILE_PERFORMANCE.virtualizeSlidesAbove;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(ILE_A11Y.reducedMotionQuery).matches;
}
