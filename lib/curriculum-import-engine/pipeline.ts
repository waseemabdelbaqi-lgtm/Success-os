/**
 * Curriculum Import Engine — pipeline stage definitions.
 * Compiler pipeline only (ADR-0050). Never renders.
 */
import type { ImportPipelineStageId } from "@/types/curriculum-import-engine";
import { IMPORT_PIPELINE_STAGES } from "@/types/curriculum-import-engine";

export type PipelineStageDef = {
  id: ImportPipelineStageId;
  order: number;
  label: { en: string; ar: string };
  required: true;
  rendersLessons: false;
};

export const IMPORT_PIPELINE: PipelineStageDef[] = IMPORT_PIPELINE_STAGES.map((id, order) => ({
  id,
  order,
  required: true as const,
  rendersLessons: false as const,
  label: STAGE_LABELS[id],
}));

const STAGE_LABELS: Record<ImportPipelineStageId, { en: string; ar: string }> = {
  source_discovery: { en: "Source Discovery", ar: "اكتشاف المصدر" },
  source_verification: { en: "Source Verification", ar: "التحقق من المصدر" },
  rights_verification: { en: "Rights Verification", ar: "التحقق من الحقوق" },
  metadata_extraction: { en: "Metadata Extraction", ar: "استخراج البيانات الوصفية" },
  book_detection: { en: "Book Detection", ar: "اكتشاف الكتاب" },
  unit_detection: { en: "Unit Detection", ar: "اكتشاف الوحدة" },
  lesson_detection: { en: "Lesson Detection", ar: "اكتشاف الدرس" },
  content_normalization: { en: "Content Normalization", ar: "تطبيع المحتوى" },
  asset_extraction: { en: "Asset Extraction", ar: "استخراج الأصول" },
  ile_package_builder: { en: "ILE Package Builder", ar: "بناء حزمة ILE" },
  validation: { en: "Validation", ar: "التحقق من الحزمة" },
  publishing_queue: { en: "Publishing Queue", ar: "طابور النشر" },
};

export function nextStage(
  current: ImportPipelineStageId | null,
): ImportPipelineStageId | null {
  if (!current) return IMPORT_PIPELINE_STAGES[0] || null;
  const idx = IMPORT_PIPELINE_STAGES.indexOf(current);
  if (idx < 0 || idx >= IMPORT_PIPELINE_STAGES.length - 1) return null;
  return IMPORT_PIPELINE_STAGES[idx + 1] || null;
}

export { IMPORT_PIPELINE_STAGES };
