import type { SourceConnector } from "./types";
import {
  buildJordanGrade1MathPart1Book,
  JORDAN_G1_MATH_SOURCE,
} from "@/content/demo/jordan-grade1-math-reference";

export const jordanG1MathConnector: SourceConnector = {
  id: "jordan-g1-math",
  type: "curriculum_authority",
  label: {
    en: "Jordan — Grade 1 Mathematics (reference connector)",
    ar: "الأردن — رياضيات الصف الأول (موصل مرجعي)",
  },
  modular: true,
  countries: ["Jordan", "الأردن"],
  async discover() {
    return [JORDAN_G1_MATH_SOURCE];
  },
  async loadBook(source) {
    if (source.id !== JORDAN_G1_MATH_SOURCE.id) return null;
    return buildJordanGrade1MathPart1Book();
  },
};
