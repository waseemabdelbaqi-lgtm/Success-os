/**
 * Mathematical answer engine — equivalence-aware (not string-only).
 * Supports Arabic/Western numerals, fractions, decimals, percentages, simple equations.
 */

function westernDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
}

function normalizeMath(raw: string): string {
  return westernDigits(raw)
    .replace(/٫/g, ".")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .trim();
}

function parseFraction(s: string): number | null {
  const m = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (!m) return null;
  const den = Number(m[2]);
  if (!den) return null;
  return Number(m[1]) / den;
}

function parsePercent(s: string): number | null {
  const m = s.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (!m) return null;
  return Number(m[1]) / 100;
}

function toNumber(s: string): number | null {
  const n = Number(s);
  if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  const f = parseFraction(s);
  if (f !== null) return f;
  const p = parsePercent(s);
  if (p !== null) return p;
  return null;
}

/** Safe arithmetic for simple expressions: digits, + - * / ( ) only */
function evalSimple(expr: string): number | null {
  const cleaned = normalizeMath(expr);
  if (!/^[-+*/().0-9]+$/.test(cleaned)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${cleaned});`)();
    return typeof val === "number" && Number.isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

export type MathEvalResult = {
  correct: boolean;
  studentNormalized: string;
  correctNormalized: string;
  studentValue: number | null;
  correctValue: number | null;
  method: "numeric" | "expression" | "string" | "unit";
  messageAr: string;
};

export function evaluateMathAnswer(input: {
  student: string;
  correct: string | string[];
  tolerance?: number;
  unit?: string;
  studentUnit?: string;
}): MathEvalResult {
  const tolerance = input.tolerance ?? 1e-6;
  const studentRaw = normalizeMath(input.student);
  const corrects = (Array.isArray(input.correct) ? input.correct : [input.correct]).map(normalizeMath);

  if (input.unit) {
    const su = normalizeMath(input.studentUnit || "");
    const eu = normalizeMath(input.unit);
    if (su && eu && su !== eu) {
      return {
        correct: false,
        studentNormalized: studentRaw,
        correctNormalized: corrects[0] || "",
        studentValue: toNumber(studentRaw),
        correctValue: toNumber(corrects[0] || ""),
        method: "unit",
        messageAr: `الوحدة غير صحيحة. المطلوب: ${input.unit}`,
      };
    }
  }

  for (const c of corrects) {
    if (studentRaw === c) {
      return {
        correct: true,
        studentNormalized: studentRaw,
        correctNormalized: c,
        studentValue: toNumber(studentRaw),
        correctValue: toNumber(c),
        method: "string",
        messageAr: "إجابة صحيحة.",
      };
    }
  }

  const sv = toNumber(studentRaw) ?? evalSimple(studentRaw);
  for (const c of corrects) {
    const cv = toNumber(c) ?? evalSimple(c);
    if (sv !== null && cv !== null && Math.abs(sv - cv) <= tolerance) {
      return {
        correct: true,
        studentNormalized: studentRaw,
        correctNormalized: c,
        studentValue: sv,
        correctValue: cv,
        method: "numeric",
        messageAr: "إجابة صحيحة (قيمة مكافئة).",
      };
    }
  }

  const se = evalSimple(studentRaw);
  for (const c of corrects) {
    const ce = evalSimple(c);
    if (se !== null && ce !== null && Math.abs(se - ce) <= tolerance) {
      return {
        correct: true,
        studentNormalized: studentRaw,
        correctNormalized: c,
        studentValue: se,
        correctValue: ce,
        method: "expression",
        messageAr: "إجابة صحيحة (تعبير مكافئ).",
      };
    }
  }

  return {
    correct: false,
    studentNormalized: studentRaw,
    correctNormalized: corrects[0] || "",
    studentValue: sv,
    correctValue: toNumber(corrects[0] || ""),
    method: "numeric",
    messageAr: "الإجابة غير صحيحة. راجع الحل خطوة بخطوة.",
  };
}
