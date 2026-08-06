/**
 * Studio Director — pick a professional filming studio from subject / age / curriculum.
 * Serves Human Teacher Engine requirement #7.
 */
import type { StudioTheme, StudioThemeId } from "./types";

const THEMES: Record<StudioThemeId, StudioTheme> = {
  primary_classroom: {
    id: "primary_classroom",
    labelAr: "صف ابتدائي دافئ",
    labelEn: "Warm primary classroom",
    wallColor: "#1a3348",
    accent: "#e7c77a",
    boardStyle: "whiteboard",
    lighting: "warm_encourage",
    propKit: ["board", "table", "diagram"],
  },
  math_studio: {
    id: "math_studio",
    labelAr: "استوديو الرياضيات",
    labelEn: "Mathematics studio",
    wallColor: "#0f2438",
    accent: "#7ec8ff",
    boardStyle: "chalkboard_digital",
    lighting: "cool_focus",
    propKit: ["board", "table", "diagram", "model_3d"],
  },
  physics_lab: {
    id: "physics_lab",
    labelAr: "مختبر الفيزياء",
    labelEn: "Physics laboratory",
    wallColor: "#0b1a33",
    accent: "#6ec8ff",
    boardStyle: "glass_lab",
    lighting: "cool_precision",
    propKit: ["board", "table", "model_3d", "experiment"],
  },
  chemistry_lab: {
    id: "chemistry_lab",
    labelAr: "مختبر الكيمياء",
    labelEn: "Chemistry laboratory",
    wallColor: "#122018",
    accent: "#9adfd6",
    boardStyle: "glass_lab",
    lighting: "experiment_practical",
    propKit: ["board", "table", "model_3d", "experiment"],
  },
  biology_lab: {
    id: "biology_lab",
    labelAr: "مختبر الأحياء",
    labelEn: "Biology laboratory",
    wallColor: "#14241c",
    accent: "#8fd9a8",
    boardStyle: "glass_lab",
    lighting: "soft_daylight",
    propKit: ["board", "table", "model_3d", "diagram"],
  },
  language_salon: {
    id: "language_salon",
    labelAr: "صالون اللغات",
    labelEn: "Language salon",
    wallColor: "#241810",
    accent: "#e7c77a",
    boardStyle: "whiteboard",
    lighting: "warm_encourage",
    propKit: ["board", "table", "diagram"],
  },
  programming_lab: {
    id: "programming_lab",
    labelAr: "مختبر البرمجة",
    labelEn: "Programming lab",
    wallColor: "#101820",
    accent: "#7aa6ff",
    boardStyle: "chalkboard_digital",
    lighting: "cool_focus",
    propKit: ["board", "table", "model_3d", "diagram"],
  },
  exam_prep_studio: {
    id: "exam_prep_studio",
    labelAr: "استوديو التحضير للامتحان",
    labelEn: "Exam preparation studio",
    wallColor: "#1a1420",
    accent: "#d8c4a0",
    boardStyle: "whiteboard",
    lighting: "focus_spot",
    propKit: ["board", "table", "diagram"],
  },
  success_studio: {
    id: "success_studio",
    labelAr: "استوديو Success",
    labelEn: "Success Studio",
    wallColor: "#0b1a33",
    accent: "#c9a259",
    boardStyle: "chalkboard_digital",
    lighting: "key_fill_rim",
    propKit: ["board", "table", "model_3d", "diagram", "experiment"],
  },
};

function earlyGrade(grade: string): boolean {
  return /kg|روضة|g[1-4]|grade\s*[1-4]|صف\s*[١٢١-٤1-4]|elementary|early|ابتدائي/i.test(
    grade,
  );
}

export function resolveStudioTheme(input: {
  subject?: string;
  grade?: string;
  curriculum?: string;
  title?: string;
}): StudioTheme {
  const subject = `${input.subject || ""} ${input.title || ""}`.toLowerCase();
  const grade = input.grade || "";
  const curriculum = `${input.curriculum || ""}`.toLowerCase();

  if (/sat|act|est|ap\b|igcse|a\s*level|ib\b|امتحان|تحضير/.test(`${subject} ${curriculum}`)) {
    return THEMES.exam_prep_studio;
  }
  if (/chem|كيم/.test(subject)) return THEMES.chemistry_lab;
  if (/phys|فيز|force|قوّة|قوة/.test(subject)) return THEMES.physics_lab;
  if (/bio|أحياء|خلية|cell/.test(subject)) return THEMES.biology_lab;
  if (/prog|code|برمج|loop|خوارزم/.test(subject)) return THEMES.programming_lab;
  if (/math|رياض|fraction|نصف|عدد/.test(subject)) {
    return earlyGrade(grade) ? THEMES.primary_classroom : THEMES.math_studio;
  }
  if (/lang|arab|engl|لغ|جملة|sentence|french|spanish/.test(subject)) {
    return THEMES.language_salon;
  }
  if (earlyGrade(grade)) return THEMES.primary_classroom;
  return THEMES.success_studio;
}

export function listStudioThemes(): StudioTheme[] {
  return Object.values(THEMES);
}
