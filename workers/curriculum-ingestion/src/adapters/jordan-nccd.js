/**
 * Jordan NCCD adapter — discovers official catalog metadata only.
 * Does not invent subject matrices for unverified grades.
 * OpenStax is never included here.
 */
import { SourceAdapter, stableBookId } from "./base.js";
import { RIGHTS, BOOK_STATUS } from "../rights/policy.js";
import {
  VERIFIED_SUBJECT_LISTS,
  GRADE_CATALOG_PAGES,
  BOOK_TYPES,
  SEMESTERS,
  KNOWN_OFFICIAL_PDFS,
  isNccdHost,
} from "../jordan/official-source-registry.js";
import { diagnoseJordanUrl } from "../jordan/diagnose-url.js";

export class JordanNccdAdapter extends SourceAdapter {
  constructor() {
    super({
      id: "jo-nccd",
      countryCode: "JO",
      name: "Jordan NCCD Textbooks",
      rightsDefault: RIGHTS.OFFICIAL_REFERENCE_ONLY,
    });
  }

  async discoverCatalog() {
    const catalogUrl = "https://www.nccd.gov.jo/Ar/Pages/textbooks";
    const catalogDiag = await diagnoseJordanUrl(catalogUrl, { timeoutMs: 12000 });
    const books = [];

    for (const [code, grade, stage, url] of GRADE_CATALOG_PAGES) {
      const verified = VERIFIED_SUBJECT_LISTS[String(code)];
      if (!verified) {
        books.push({
          id: stableBookId(["JO", "NCCD", "GRADE_PAGE", code]),
          country_code: "JO",
          source_id: this.id,
          curriculum: "المنهاج الوطني الأردني",
          stage,
          grade,
          grade_code: String(code),
          semester: null,
          subject: null,
          book_type: "grade-catalog-page",
          title: `فهرس كتب ${grade} (NCCD)`,
          title_ar: `فهرس كتب ${grade} (NCCD)`,
          edition: null,
          academic_year: "2025/2026",
          official_url: null,
          catalog_url: url,
          rights_status: RIGHTS.UNKNOWN,
          status: BOOK_STATUS.DISCOVERED,
          language: "ar",
          last_error: null,
          metadata_json: JSON.stringify({
            kind: "grade-catalog-page",
            subjectListStatus: "PENDING_SUBJECT_REVIEW",
            catalogDiag,
          }),
        });
        continue;
      }

      for (const subject of verified.subjects) {
        for (const semester of SEMESTERS) {
          for (const bookType of BOOK_TYPES) {
            const hintKey = `${code}|${subject}|${semester}|${bookType}`;
            const known = KNOWN_OFFICIAL_PDFS[hintKey] || null;
            const officialUrl = known?.url || null;
            if (officialUrl && !isNccdHost(officialUrl)) continue;
            books.push({
              id: stableBookId(["JO", "NCCD", code, subject, semester, bookType]),
              country_code: "JO",
              source_id: this.id,
              curriculum: "المنهاج الوطني الأردني",
              stage,
              grade,
              grade_code: String(code),
              semester,
              subject,
              book_type: bookType,
              title: `${subject} — ${grade} — ${semester} — ${bookType}`,
              title_ar: `${subject} — ${grade} — ${semester} — ${bookType}`,
              edition: known?.editionHint || "edition-pending-live-confirm",
              academic_year: known?.academicYearHint || "2025/2026",
              official_url: officialUrl,
              catalog_url: verified.catalogUrl,
              rights_status: RIGHTS.OFFICIAL_REFERENCE_ONLY,
              status: BOOK_STATUS.DISCOVERED,
              language: subject.includes("الإنجليزية") ? "en" : "ar",
              last_error: null,
              metadata_json: JSON.stringify({
                adapter: "JordanNccdAdapter",
                subjectListConfidence: verified.subjectListConfidence,
                urlConfidence: known?.confidence || "UNVERIFIED",
                rightsEvidence:
                  "Official NCCD textbook slot — copyrighted; metadata/reference only.",
              }),
            });
          }
        }
      }
    }

    return {
      source: {
        id: this.id,
        country_code: "JO",
        adapter: "JordanNccdAdapter",
        name: this.name,
        catalog_url: catalogUrl,
        rights_default: this.rightsDefault,
        status: catalogDiag.reasonType === "OK" ? "reachable" : "SOURCE_ACCESS_BLOCKED",
        last_error: catalogDiag.reasonType === "OK" ? null : `${catalogDiag.reasonType}:${catalogDiag.reason}`,
        last_discovered_at: new Date().toISOString(),
      },
      books,
      catalogDiag,
    };
  }
}
