import type { SourceConnector } from "./types";
import { jordanNccdConnector } from "./jordan-nccd";
import {
  curriculumAuthorityConnector,
  internalSuccessOsConnector,
  licensedPublisherConnector,
  ministryEducationConnector,
  oerConnector,
  openTextbookConnector,
} from "./stubs";

export const SOURCE_CONNECTORS: SourceConnector[] = [
  jordanNccdConnector,
  ministryEducationConnector,
  curriculumAuthorityConnector,
  oerConnector,
  licensedPublisherConnector,
  openTextbookConnector,
  internalSuccessOsConnector,
];

export function listSourceConnectors(): SourceConnector[] {
  return SOURCE_CONNECTORS;
}

export function getSourceConnector(id: string): SourceConnector | null {
  return SOURCE_CONNECTORS.find((c) => c.id === id) || null;
}

export type { SourceConnector };
export { jordanNccdConnector };
