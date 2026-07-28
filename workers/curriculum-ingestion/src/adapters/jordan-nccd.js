/**
 * Jordan NCCD adapter — discovers official catalog metadata.
 * Does not bypass login/CAPTCHA. On TLS/network block → SOURCE_ACCESS_BLOCKED.
 */
import { SourceAdapter, stableBookId } from "./base.js";
import { RIGHTS, BOOK_STATUS } from "../rights/policy.js";

const GRADE_PAGES = [
  [1, "الصف 1", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68"],
  [2, "الصف 2", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/69"],
  [3, "الصف 3", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/70"],
  [4, "الصف 4", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/71"],
  [5, "الصف 5", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/72"],
  [6, "الصف 6", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/73"],
  [7, "الصف 7", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/74"],
  [8, "الصف 8", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/75"],
  [9, "الصف 9", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/76"],
  [10, "الصف 10", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/77"],
  [11, "الصف 11", "التعليم الثانوي — المسار الأكاديمي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/117"],
  [12, "الصف 12", "التعليم الثانوي — المسار الأكاديمي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/83"],
];

const GRADE1_SUBJECTS = [
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "العلوم",
  "التربية الإسلامية",
  "الدراسات الاجتماعية",
  "المهارات الرقمية",
  "التربية الرياضية",
  "التربية الفنية والموسيقية والمسرحية",
];

const LOWER_PRIMARY_SUBJECTS = [
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "العلوم",
  "التربية الإسلامية",
  "الدراسات الاجتماعية",
  "المهارات الرقمية",
  "التربية الرياضية",
  "التربية الفنية والموسيقية والمسرحية",
];

const UPPER_PRIMARY_SUBJECTS = [
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "العلوم",
  "التربية الإسلامية",
  "الدراسات الاجتماعية",
  "المهارات الرقمية",
  "التربية الرياضية",
  "التربية الفنية والموسيقية والمسرحية",
  "التربية المهنية",
];

const LOWER_SECONDARY_SUBJECTS = [
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "العلوم",
  "الفيزياء",
  "الكيمياء",
  "علوم الأرض والبيئة",
  "العلوم الحياتية",
  "التربية الإسلامية",
  "التاريخ",
  "الجغرافيا",
  "الوطنية والمدنية",
  "المهارات الرقمية",
  "التربية المهنية",
];

const UPPER_SECONDARY_SUBJECTS = [
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "الفيزياء",
  "الكيمياء",
  "العلوم الحياتية",
  "علوم الأرض والبيئة",
  "المهارات الرقمية",
  "التربية الإسلامية",
  "تاريخ الأردن",
  "الثقافة المالية",
  "الثقافة العامة",
];

function subjectsForGrade(code) {
  if (code === 1) return GRADE1_SUBJECTS;
  if (code >= 2 && code <= 6) return LOWER_PRIMARY_SUBJECTS;
  if (code >= 7 && code <= 10) return LOWER_SECONDARY_SUBJECTS;
  return UPPER_SECONDARY_SUBJECTS;
}

const BOOK_TYPES = ["كتاب الطالب", "كتاب التمارين", "دليل المعلم"];
const SEMESTERS = ["الفصل الدراسي الأول", "الفصل الدراسي الثاني"];

const KNOWN_PDF_HINTS = {
  // Verified earlier from official NCCD grade-1 catalogue HTML structure (live download may block).
  "1|الرياضيات|الفصل الدراسي الأول|كتاب الطالب":
    "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf",
  "1|الرياضيات|الفصل الدراسي الثاني|كتاب الطالب":
    "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/2/MT01/SE/MA.01.ST2.pdf",
};

export class JordanNccdAdapter extends SourceAdapter {
  constructor() {
    super({
      id: "jo-nccd",
      countryCode: "JO",
      name: "Jordan NCCD Textbooks",
      rightsDefault: RIGHTS.OFFICIAL_REFERENCE_ONLY,
    });
  }

  async probe(url, timeoutMs = 12000) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "SUCCESS-OS-CurriculumWorker/1.0",
          Accept: "text/html,application/pdf,*/*",
        },
      });
      return { ok: res.ok, status: res.status, error: null };
    } catch (err) {
      return { ok: false, status: 0, error: String(err?.message || err) };
    } finally {
      clearTimeout(t);
    }
  }

  async discoverCatalog() {
    const catalogUrl = "https://www.nccd.gov.jo/Ar/Pages/textbooks";
    const catalogProbe = await this.probe(catalogUrl);
    const books = [];
    let liveHtmlBooks = 0;

  // Attempt live scrape; optional Playwright fallback for public pages only.
  // If blocked, fall back to deterministic official subject matrix (DISCOVERED metadata).
  for (const [code, grade, stage, url] of GRADE_PAGES) {
      const pageProbe = await this.probe(url, 10000);
      let subjects = subjectsForGrade(code);

      if (pageProbe.ok) {
        try {
          const html = await fetch(url, {
            headers: { "User-Agent": "SUCCESS-OS-CurriculumWorker/1.0" },
            signal: AbortSignal.timeout(15000),
          }).then((r) => r.text());
          const found = this.parseResources(html, { code, grade, stage, url });
          if (found.length) {
            liveHtmlBooks += found.length;
            books.push(...found);
            continue;
          }
        } catch {
          /* fall through */
        }
      } else if (!catalogProbe.ok && process.env.PLAYWRIGHT_ENABLED === "1") {
        // Browser fallback only when explicitly enabled; never bypass auth/captcha.
        try {
          const { fetchPublicHtmlWithBrowser } = await import("./playwright-fallback.js");
          const browserResult = await fetchPublicHtmlWithBrowser(url, { timeoutMs: 20000 });
          if (browserResult.ok && browserResult.html) {
            const found = this.parseResources(browserResult.html, { code, grade, stage, url });
            if (found.length) {
              liveHtmlBooks += found.length;
              books.push(...found);
              continue;
            }
          }
        } catch {
          /* matrix fallback */
        }
      }

      for (const subject of subjects) {
        for (const semester of SEMESTERS) {
          for (const bookType of BOOK_TYPES) {
            // Teacher guides often annual; still discover as catalog rows.
            const hintKey = `${code}|${subject}|${semester}|${bookType}`;
            const officialUrl = KNOWN_PDF_HINTS[hintKey] || null;
            const accessBlocked = !catalogProbe.ok; // NCCD currently unreachable from worker network
            books.push({
              id: stableBookId(["JO", "NCCD", code, subject, semester, bookType]),
              country_code: "JO",
              source_id: this.id,
              curriculum: "Jordanian National Curriculum",
              stage,
              grade,
              grade_code: String(code),
              semester,
              subject,
              book_type: bookType,
              title: `${subject} — ${grade} — ${semester} — ${bookType}`,
              title_ar: `${subject} — ${grade} — ${semester} — ${bookType}`,
              edition: "current-official-pending-live-edition-confirm",
              academic_year: "2025/2026",
              official_url: officialUrl,
              catalog_url: url,
              rights_status: RIGHTS.OFFICIAL_REFERENCE_ONLY,
              status: accessBlocked
                ? BOOK_STATUS.SOURCE_ACCESS_BLOCKED
                : BOOK_STATUS.DISCOVERED,
              language: subject.includes("English") || subject.includes("الإنجليزية") ? "en" : "ar",
              last_error: accessBlocked
                ? `SOURCE_ACCESS_BLOCKED: NCCD unreachable (${catalogProbe.error || catalogProbe.status})`
                : null,
              metadata_json: JSON.stringify({
                adapter: "JordanNccdAdapter",
                discoveryMode: pageProbe.ok ? "live-page-fallback-matrix" : "official-matrix",
                pageProbe,
                catalogProbe,
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
        status: catalogProbe.ok ? "reachable" : "SOURCE_ACCESS_BLOCKED",
        last_error: catalogProbe.ok ? null : catalogProbe.error || `HTTP_${catalogProbe.status}`,
        last_discovered_at: new Date().toISOString(),
      },
      books,
      liveHtmlBooks,
      catalogProbe,
    };
  }

  parseResources(html, ctx) {
    const out = [];
    const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = re.exec(html))) {
      const href = m[1];
      if (!/\.pdf($|\?)/i.test(href) && !/Root_Storage/i.test(href)) continue;
      const ctxText = html.slice(Math.max(0, m.index - 700), Math.min(html.length, m.index + 200));
      const subject = GRADE1_SUBJECTS.find((s) => ctxText.includes(s));
      if (!subject) continue;
      const bookType = BOOK_TYPES.find((t) => ctxText.includes(t)) || "كتاب الطالب";
      const semester = ctxText.includes("الفصل الدراسي الثاني")
        ? "الفصل الدراسي الثاني"
        : "الفصل الدراسي الأول";
      let absolute = href;
      try {
        absolute = new URL(href, ctx.url).toString();
      } catch {
        continue;
      }
      out.push({
        id: stableBookId(["JO", "NCCD", ctx.code, subject, semester, bookType, absolute]),
        country_code: "JO",
        source_id: this.id,
        curriculum: "Jordanian National Curriculum",
        stage: ctx.stage,
        grade: ctx.grade,
        grade_code: String(ctx.code),
        semester,
        subject,
        book_type: bookType,
        title: `${subject} — ${ctx.grade} — ${semester} — ${bookType}`,
        title_ar: `${subject} — ${ctx.grade} — ${semester} — ${bookType}`,
        edition: "from-live-catalog",
        academic_year: "2025/2026",
        official_url: absolute,
        catalog_url: ctx.url,
        rights_status: RIGHTS.OFFICIAL_REFERENCE_ONLY,
        status: BOOK_STATUS.DISCOVERED,
        language: "ar",
        last_error: null,
        metadata_json: JSON.stringify({ adapter: "JordanNccdAdapter", discoveryMode: "live-html" }),
      });
    }
    // dedupe
    const map = new Map(out.map((b) => [b.id, b]));
    return [...map.values()];
  }
}
