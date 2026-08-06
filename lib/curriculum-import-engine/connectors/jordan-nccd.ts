import type { SourceConnector } from "./types";
import {
  buildJordanGrade5ScienceDetectedBook,
  JORDAN_IMPORT_SOURCE,
} from "@/content/demo/curriculum-import-jordan";

export const jordanNccdConnector: SourceConnector = {
  id: "jordan-nccd",
  type: "curriculum_authority",
  label: {
    en: "Jordan — National Center for Curriculum Development",
    ar: "الأردن — المركز الوطني لتطوير المناهج",
  },
  modular: true,
  countries: ["Jordan", "الأردن"],
  async discover() {
    return [JORDAN_IMPORT_SOURCE];
  },
  async loadBook(source) {
    if (source.id !== JORDAN_IMPORT_SOURCE.id) return null;
    return buildJordanGrade5ScienceDetectedBook();
  },
};
