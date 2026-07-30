/**
 * ILE localization — locale-agnostic helpers (no country logic).
 */
export type IleLocale = "en" | "ar";

export type IleLocalized<T = string> = { en: T; ar: T };

const ENGINE_STRINGS: Record<IleLocale, Record<string, string>> = {
  en: {
    previous: "Previous",
    next: "Next",
    outline: "Outline",
    search: "Search lesson…",
    progress: "Progress",
    notes: "Notes",
    bookmark: "Bookmark",
    highlight: "Highlight",
    draw: "Drawing",
    continue: "Continue learning",
    publish: "Publish",
    unpublish: "Unpublish",
    preview: "Preview",
    addBlock: "Add block",
    version: "Version",
    loading: "Loading…",
    empty: "No content yet",
  },
  ar: {
    previous: "السابق",
    next: "التالي",
    outline: "المخطط",
    search: "بحث في الدرس…",
    progress: "التقدّم",
    notes: "ملاحظات",
    bookmark: "إشارة",
    highlight: "تمييز",
    draw: "رسم",
    continue: "متابعة التعلّم",
    publish: "نشر",
    unpublish: "إلغاء النشر",
    preview: "معاينة",
    addBlock: "إضافة كتلة",
    version: "الإصدار",
    loading: "جارٍ التحميل…",
    empty: "لا محتوى بعد",
  },
};

export function t(locale: IleLocale, key: string): string {
  return ENGINE_STRINGS[locale]?.[key] || ENGINE_STRINGS.en[key] || key;
}

export function locText(
  value: IleLocalized | string | undefined,
  locale: IleLocale = "en",
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.ar || "";
}

export function dirForLocale(locale: IleLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function listEngineLocales(): IleLocale[] {
  return ["en", "ar"];
}
