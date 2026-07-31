import type { TerminologyMap } from "@/src/lib/global-curriculum/types";

/** Resolve display label from terminology map using canonical key. */
export function termLabel(
  map: TerminologyMap,
  canonicalKey: string,
  locale: "ar" | "en" | "native" = "en",
): string {
  const entry = map[canonicalKey];
  if (!entry) return canonicalKey;
  if (locale === "ar") return entry.labelAr || entry.labelEn;
  if (locale === "native") return entry.labelNative || entry.labelEn;
  return entry.labelEn;
}

export function termDirection(map: TerminologyMap, canonicalKey: string): "rtl" | "ltr" {
  return map[canonicalKey]?.direction || "ltr";
}
