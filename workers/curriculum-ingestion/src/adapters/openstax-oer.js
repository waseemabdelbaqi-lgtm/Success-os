/**
 * OpenStax OER adapter — OPEN_LICENSE sources for pipeline verification.
 */
import { SourceAdapter, stableBookId } from "./base.js";
import { RIGHTS, BOOK_STATUS } from "../rights/policy.js";

const API = "https://openstax.org/apps/cms/api/v2/pages/?type=books.Book&fields=*&limit=80";

export class OpenStaxOerAdapter extends SourceAdapter {
  constructor() {
    super({
      id: "openstax-oer",
      countryCode: "OER",
      name: "OpenStax Open Educational Resources",
      rightsDefault: RIGHTS.OPEN_LICENSE,
    });
  }

  async discoverCatalog() {
    const res = await fetch(API, {
      headers: { Accept: "application/json", "User-Agent": "SUCCESS-OS-CurriculumWorker/1.0" },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`OPENSTAX_API_${res.status}`);
    const data = await res.json();
    const preferredTitles = [
      "Business Law I Essentials",
      "Introduction to Python Programming",
      "College Success Concise",
      "Introductory Statistics 2e",
      "Elementary Algebra 2e",
    ];
    const books = [];
    const byTitle = new Map((data.items || []).map((item) => [item.title, item]));
    // Prefer compact open PDFs for reliable cloud verification; keep math book for structure demo.
    for (const title of preferredTitles) {
      const item = byTitle.get(title);
      if (!item) continue;
      const pdf = item.high_resolution_pdf_url || item.pdf_url;
      if (!pdf) continue;
      books.push({
        id: stableBookId(["OER", "OpenStax", item.id, item.title]),
        country_code: "OER",
        source_id: this.id,
        curriculum: "OpenStax OER",
        stage: "Open Education",
        grade: item.is_ap ? "AP" : "Higher Ed / K12",
        grade_code: "OER",
        semester: "Full book",
        subject: /algebra|math|statistics|python/i.test(title) ? "Mathematics / STEM" : "Open Education",
        book_type: "Student Book",
        title: item.title,
        title_ar: item.title,
        edition: item.license_name || "OpenStax",
        academic_year: (item.publish_date || "").slice(0, 4) || null,
        official_url: pdf,
        catalog_url: item.webview_rex_link || `https://openstax.org/details/books/${item.meta?.slug || ""}`,
        rights_status: RIGHTS.OPEN_LICENSE,
        status: BOOK_STATUS.DISCOVERED,
        language: "en",
        last_error: null,
        metadata_json: JSON.stringify({
          adapter: "OpenStaxOerAdapter",
          license_url: item.license_url,
          license_name: item.license_name,
          openstax_id: item.id,
        }),
      });
    }
    return {
      source: {
        id: this.id,
        country_code: "OER",
        adapter: "OpenStaxOerAdapter",
        name: this.name,
        catalog_url: "https://openstax.org/",
        rights_default: this.rightsDefault,
        status: "reachable",
        last_error: null,
        last_discovered_at: new Date().toISOString(),
      },
      books,
    };
  }
}
