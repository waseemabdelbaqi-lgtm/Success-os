/**
 * Lip Sync — phoneme-based mouth drive from speech text.
 * Coarse Arabic/Latin grapheme→phoneme; adapters map to MetaHuman visemes later.
 */
import type { PhonemeId, PhonemeKeyframe } from "@/types/human-engine";
import type { BlendShapeId } from "@/types/human-engine";

const ARABIC_MAP: Record<string, PhonemeId> = {
  ا: "AA",
  أ: "AA",
  إ: "IH",
  آ: "AA",
  ى: "IY",
  ي: "IY",
  و: "UW",
  وّ: "W",
  ب: "B",
  م: "M",
  ف: "F",
  ث: "TH",
  ت: "T",
  ط: "AR_TAA",
  د: "D",
  ض: "AR_DAD",
  س: "S",
  ص: "AR_SAD",
  ز: "Z",
  ش: "SH",
  ج: "JH",
  ك: "K",
  ق: "AR_QAF",
  خ: "AR_KHA",
  غ: "AR_GHAIN",
  ع: "AR_AIN",
  ح: "AR_HAA",
  ه: "HH",
  ة: "AH",
  ل: "L",
  ن: "N",
  ر: "R",
  " ": "sil",
  "،": "sil",
  ".": "sil",
  "؟": "sil",
  "!": "sil",
};

const LATIN_VOWEL: Record<string, PhonemeId> = {
  a: "AA",
  e: "EH",
  i: "IY",
  o: "OW",
  u: "UW",
};

export function graphemeToPhoneme(ch: string): PhonemeId {
  if (ARABIC_MAP[ch]) return ARABIC_MAP[ch]!;
  const lower = ch.toLowerCase();
  if (LATIN_VOWEL[lower]) return LATIN_VOWEL[lower]!;
  if (/[b]/.test(lower)) return "B";
  if (/[m]/.test(lower)) return "M";
  if (/[p]/.test(lower)) return "P";
  if (/[f]/.test(lower)) return "F";
  if (/[fv]/.test(lower)) return "V";
  if (/[dt]/.test(lower)) return "T";
  if (/[kgc]/.test(lower)) return "K";
  if (/[s]/.test(lower)) return "S";
  if (/[z]/.test(lower)) return "Z";
  if (/[lr]/.test(lower)) return "L";
  if (/[n]/.test(lower)) return "N";
  if (/[wy]/.test(lower)) return "W";
  if (/\s|[.,!?;:]/.test(ch)) return "sil";
  return "AH";
}

export function textToPhonemeTrack(
  text: string,
  startMs: number,
  endMs: number,
): PhonemeKeyframe[] {
  const chars = [...text].filter((c) => c.trim() || c === " ");
  const span = Math.max(80, endMs - startMs);
  if (!chars.length) {
    return [
      { tMs: startMs, phoneme: "sil", weight: 1 },
      { tMs: endMs, phoneme: "sil", weight: 1 },
    ];
  }
  const step = span / chars.length;
  const keys: PhonemeKeyframe[] = [{ tMs: startMs, phoneme: "sil", weight: 1 }];
  chars.forEach((ch, i) => {
    keys.push({
      tMs: Math.round(startMs + i * step),
      phoneme: graphemeToPhoneme(ch),
      weight: ch.trim() ? 1 : 0.2,
    });
  });
  keys.push({ tMs: endMs, phoneme: "sil", weight: 1 });
  return keys;
}

export function phonemeToMouth(phoneme: PhonemeId): Partial<Record<BlendShapeId, number>> {
  switch (phoneme) {
    case "sil":
      return { jawOpen: 0.02, mouthClose: 0.7 };
    case "AA":
    case "AE":
    case "AH":
      return { jawOpen: 0.55, mouthClose: 0.05 };
    case "EH":
    case "IH":
      return { jawOpen: 0.28, mouthClose: 0.15 };
    case "IY":
      return { jawOpen: 0.18, mouthSmileLeft: 0.25, mouthSmileRight: 0.25 };
    case "OW":
    case "UH":
    case "UW":
      return { jawOpen: 0.32, mouthFunnel: 0.55, mouthPucker: 0.35 };
    case "B":
    case "M":
    case "P":
      return { jawOpen: 0.02, mouthClose: 0.95 };
    case "F":
    case "V":
      return { jawOpen: 0.12, mouthClose: 0.4 };
    case "SH":
    case "CH":
    case "S":
    case "Z":
      return { jawOpen: 0.14, mouthFunnel: 0.2 };
    case "AR_AIN":
    case "AR_GHAIN":
    case "AR_HAA":
    case "AR_QAF":
      return { jawOpen: 0.4, mouthFunnel: 0.25 };
    default:
      return { jawOpen: 0.22, mouthClose: 0.2 };
  }
}

export function samplePhoneme(keys: PhonemeKeyframe[], tMs: number): PhonemeId {
  let cur: PhonemeId = "sil";
  for (const k of keys) {
    if (k.tMs <= tMs) cur = k.phoneme;
    else break;
  }
  return cur;
}

export function jawFromPhoneme(phoneme: PhonemeId): number {
  return phonemeToMouth(phoneme).jawOpen || 0;
}
