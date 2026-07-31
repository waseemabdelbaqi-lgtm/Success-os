import { MASTER_INVENTORY } from "@/src/lib/jordan-books/matrix/master-inventory";
import type { CompletenessMatrixReport, InventoryCell } from "@/src/lib/jordan-books/matrix/types";

export function buildCompletenessMatrix(cells: InventoryCell[] = MASTER_INVENTORY): CompletenessMatrixReport {
  const byStatus: Record<string, number> = {};
  for (const c of cells) byStatus[c.matrixStatus] = (byStatus[c.matrixStatus] || 0) + 1;

  const gradeKeys = Array.from(new Set(cells.map((c) => `${c.gradeKey}|${c.pathway}|${c.gradeAr}|${c.pathwayAr}`)));
  const byGrade = gradeKeys.map((key) => {
    const [gradeKey, pathway, gradeAr, pathwayAr] = key.split("|");
    const rows = cells.filter((c) => c.gradeKey === gradeKey && c.pathway === pathway);
    const subjects = new Set(rows.map((c) => c.subjectAr).filter((s) => !s.startsWith("("))).size;
    const contentComplete = rows.filter((c) =>
      ["CONTENT_COMPLETE", "ACADEMIC_REVIEW", "LANGUAGE_REVIEW", "TECHNICAL_REVIEW", "PUBLISHED", "COMPLETE"].includes(
        c.matrixStatus,
      ),
    ).length;
    const published = rows.filter((c) => c.matrixStatus === "PUBLISHED" || c.matrixStatus === "COMPLETE").length;
    const complete = rows.filter((c) => c.matrixStatus === "COMPLETE").length;
    const blocked = rows.filter((c) => c.matrixStatus === "BLOCKED" || c.matrixStatus === "NOT_DISCOVERED").length;
    const structured = rows.filter((c) =>
      ["STRUCTURED", "CONTENT_COMPLETE", "ACADEMIC_REVIEW", "LANGUAGE_REVIEW", "TECHNICAL_REVIEW", "PUBLISHED", "COMPLETE"].includes(
        c.matrixStatus,
      ),
    ).length;
    return {
      gradeAr: gradeAr || gradeKey || "",
      pathway: pathwayAr || pathway || "",
      subjects,
      cells: rows.length,
      contentComplete,
      published,
      complete,
      blocked,
      percentStructured: rows.length ? Math.round((structured / rows.length) * 100) : 0,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalCells: cells.length,
    byStatus,
    byGrade,
    cells,
    blockers: cells.filter((c) => c.blocker || c.matrixStatus === "BLOCKED" || c.matrixStatus === "NOT_DISCOVERED"),
    videoDevelopmentStopped: true,
    honestCompleteClaim: false,
  };
}
