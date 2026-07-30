/**
 * VERIFICATION_ENGINE — gates that must pass before publish.
 */
import type {
  DetectedBook,
  GateResult,
  VerificationGateId,
  CompiledIlePackage,
} from "@/types/curriculum-import-engine";
import { VERIFICATION_GATES } from "@/types/curriculum-import-engine";
import type { CurriculumSourceRef } from "@/types/curriculum-import-engine";

export function runVerificationGates(args: {
  source: CurriculumSourceRef;
  book: DetectedBook | null;
  packages: CompiledIlePackage[];
  existingChecksums?: string[];
  rightsPassed: boolean;
}): GateResult[] {
  const { source, book, packages, existingChecksums = [], rightsPassed } = args;
  const results: GateResult[] = [];

  results.push({
    gate: "source_verification",
    passed: Boolean(source.id && source.authority && source.connectorId),
    severity: source.authority ? "info" : "error",
    message: source.authority
      ? { en: "Source authority present", ar: "سلطة المصدر موجودة" }
      : { en: "Source authority missing", ar: "سلطة المصدر مفقودة" },
    details: { sourceId: source.id, connectorId: source.connectorId },
  });

  results.push({
    gate: "rights_verification",
    passed: rightsPassed && source.license !== "rejected",
    severity: rightsPassed ? "info" : "error",
    message: rightsPassed
      ? { en: "Rights verification passed", ar: "اجتاز التحقق من الحقوق" }
      : { en: "Rights verification failed", ar: "فشل التحقق من الحقوق" },
    details: { license: source.license, rightsStatus: book?.metadata.rightsStatus },
  });

  const checksum = book?.checksum || "";
  const dup = Boolean(checksum && existingChecksums.includes(checksum));
  results.push({
    gate: "duplicate_detection",
    passed: !dup,
    severity: dup ? "error" : "info",
    message: dup
      ? { en: "Duplicate checksum detected", ar: "اكتُشف تكرار بالبصمة" }
      : { en: "No duplicate detected", ar: "لا تكرار" },
    details: { checksum },
  });

  const metaOk = Boolean(
    book?.metadata.country &&
      book?.metadata.curriculum &&
      book?.metadata.subject &&
      book?.metadata.grade,
  );
  results.push({
    gate: "metadata_validation",
    passed: metaOk,
    severity: metaOk ? "info" : "error",
    message: metaOk
      ? { en: "Metadata complete", ar: "البيانات الوصفية مكتملة" }
      : { en: "Metadata incomplete", ar: "البيانات الوصفية ناقصة" },
  });

  const structureOk = Boolean(
    book &&
      book.units.length > 0 &&
      book.units.every((u) => u.lessons.length > 0) &&
      book.units.every((u) =>
        u.lessons.every((l) => l.title.en || l.title.ar),
      ),
  );
  results.push({
    gate: "structure_validation",
    passed: structureOk,
    severity: structureOk ? "info" : "error",
    message: structureOk
      ? { en: "Book → Unit → Lesson structure valid", ar: "بنية كتاب←وحدة←درس صالحة" }
      : { en: "Structure invalid", ar: "بنية غير صالحة" },
    details: {
      units: book?.units.length || 0,
      lessons: book?.units.reduce((n, u) => n + u.lessons.length, 0) || 0,
    },
  });

  const pkgOk =
    packages.length > 0 &&
    packages.every(
      (p) =>
        p.schema === "success-os.interactive-lesson-engine.v1" &&
        p.importMeta.verificationStatus !== "rejected" &&
        (p.title.en || p.title.ar) &&
        p.slides.length + Object.values(p.sections).flat().length > 0,
    );
  results.push({
    gate: "package_validation",
    passed: pkgOk,
    severity: pkgOk ? "info" : "error",
    message: pkgOk
      ? { en: "ILE packages valid", ar: "حزم ILE صالحة" }
      : { en: "ILE package validation failed", ar: "فشل التحقق من حزم ILE" },
    details: { packageCount: packages.length },
  });

  return results;
}

export function allGatesPassed(gates: GateResult[]): boolean {
  return VERIFICATION_GATES.every((g) => gates.find((r) => r.gate === g)?.passed);
}

export function failedGates(gates: GateResult[]): VerificationGateId[] {
  return gates.filter((g) => !g.passed).map((g) => g.gate);
}

export { VERIFICATION_GATES };
