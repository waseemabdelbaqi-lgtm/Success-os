/**
 * Modular source connectors — never render; only discover/read curriculum sources.
 */
import type {
  CurriculumSourceRef,
  DetectedBook,
  ImportSourceType,
} from "@/types/curriculum-import-engine";

export type SourceConnector = {
  id: string;
  type: ImportSourceType;
  label: { en: string; ar: string };
  modular: true;
  countries: string[];
  discover: () => Promise<CurriculumSourceRef[]>;
  loadBook: (source: CurriculumSourceRef) => Promise<DetectedBook | null>;
};

export type { SourceConnector as CurriculumSourceConnector };
