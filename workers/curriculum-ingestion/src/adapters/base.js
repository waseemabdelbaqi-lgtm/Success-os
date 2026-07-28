import { createHash } from "node:crypto";

export class SourceAdapter {
  constructor({ id, countryCode, name, rightsDefault }) {
    this.id = id;
    this.countryCode = countryCode;
    this.name = name;
    this.rightsDefault = rightsDefault;
  }

  async discoverCatalog() {
    throw new Error("NOT_IMPLEMENTED");
  }

  async resolveDownload(book) {
    return book.official_url || null;
  }
}

export function stableBookId(parts) {
  const h = createHash("sha1").update(parts.filter(Boolean).join("|")).digest("hex").slice(0, 16);
  return `book_${h}`;
}
