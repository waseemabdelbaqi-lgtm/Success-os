# Jordan Interactive Books — Phase 1 Audit Report
**Date:** 2026-07-28  
**Branch:** `cursor/jordan-interactive-books-bca1`  
**Decision:** BOOKS FIRST — AI video / HeyGen / cinema development STOPPED (no API spend).

---

## 1. Existing Jordan curriculum files & database records

| Location | What exists | Status |
|---|---|---|
| `app/data/jordan-curriculum.js` | Authority + 13 grades + subject lists | Subject lists for G1 & G11 marked verified; all grades `booksCreated:0` |
| `app/data/jordan-minhaji-structure-seed.json` | Grade→subject title index | Companion index only |
| `app/data/jordan-minhaji-deep-grade1-seed.json` | G1 deep titles (~math 8 units) | Structure titles only; `copyBookText:false` |
| `app/data/books/jordan-grade5-science-s1.js` | One authored SOS G5 Science book | Not in live student index |
| `library/jordan-wave1/harvests/latest.json` | 13 grades / ~125 subject cells | Harvest only |
| `library/middle-east-live-preview/MIDDLE-EAST-LIVE-BOOK-INDEX.json` | Live student books | **`books: []` (0)** |
| `src/lib/digital-library/lessons/*` | 3 live Jordan lessons | Lesson shells, not full books |
| Firebase / Supabase | Auth / admissions | **Not used for curriculum books** |
| Primary store today | JSON + filesystem | No real books CMS DB |

---

## 2. Reusable routes & components

**Reuse:**
- `/digital-library/middle-east/jordan/...` browse + `LessonShell`
- `/student/books` + Middle East live book reader/API (empty data)
- `/student-content-library` (NCCD external links)
- Admin Jordan dashboards under `/admin/jordan-*`
- KaTeX / framer-motion already in stack

**Not reuse as product:** cinema/HeyGen/interactive micro lesson as “the class”.

---

## 3. Fake / incomplete / duplicate / video prototypes

| Issue | Path / note |
|---|---|
| Stub lessons → IB Physics | `curriculum-map.ts` `leafLesson()` for most grades |
| Empty live book index | `MIDDLE-EAST-LIVE-BOOK-INDEX.json` |
| Invented AI teacher personas | `seed-elementary-teacher.js` |
| Placeholder tawjihi outlines | `curriculum-os-store.js` |
| Video/cinema prototypes (archive/disable) | `app/ai-lessons/g1-math`, `src/components/cinematic-lesson/*`, `src/components/interactive-lesson/*`, `elementary-studio.js`, `produce-heygen-g1-math.mjs`, `public/ai-lessons`, `public/interactive-lessons/.../cinema` |
| Duplicate helpers | `app/lib/.../ai-assistant-teacher.js` ↔ `src/lib/.../ai-assistant-teacher.ts` |

---

## 4. Proposed database schema (logical model)

```
country → curriculum → academicYear → stage → grade → semester → stream?
→ subject → book → unit → lesson → section → contentBlock
→ activity → question → source → version → rightsStatus → editorialStatus
```

Statuses: `discovered | source_verified | rights_checked | structured | draft | academic_review | language_review | technical_review | approved | published | archived`  
Rights: `official_link_only | sos_original_aligned | rights_review_required | unavailable`

Implementation v1: TypeScript types + versioned JSON under `src/lib/jordan-books/` + API; Firebase/Postgres later without changing schema.

---

## 5. Proposed interactive book architecture

```
Student Portal → School Subjects → Middle East → Jordan → National
→ Grade → Semester → Subject → Book → Unit → Lesson
```

Engine: `InteractiveBookReader` (TOC, search, bookmarks, highlights, notes, handwriting canvas, progress, RTL, font/dyslexia/light-dark).  
Content from JSON CMS shape. Official NCCD PDFs = **linked references only** (no unauthorized republish).

---

## 6–8. Grade 1 Semester 1 — subjects, books, sources, rights

**Official catalog pages (authority):**
- NCCD textbooks hub: https://nccd.gov.jo/Ar/Pages/textbooks  
- NCCD Grade 1 page: https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68  
- MOE curricula admin: https://moe.gov.jo/ar/إدارة-المناهج-والكتب-المدرسية  
- MOE editions notice: https://moe.gov.jo/ar/node/79818  

**G1 subjects (from `jordan-curriculum.js`, catalogueStatus `subject-list-verified`):**  
اللغة العربية · اللغة الإنجليزية · الرياضيات · العلوم · التربية الإسلامية · الدراسات الاجتماعية · المهارات الرقمية · التربية الرياضية · التربية الفنية والموسيقية والمسرحية  

**Expected book types per core subject (NCCD pattern — titles verified as types; exact edition year NEEDS VERIFICATION on live NCCD page):**

| Subject | Expected materials (Sem 1) | Source | Rights |
|---|---|---|---|
| الرياضيات | كتاب الطالب · كتاب التمارين · دليل المعلم | NCCD Grade 1 catalog | `official_link_only` — SOS original lessons aligned to outcomes |
| العلوم | كتاب الطالب · كتاب التمارين · دليل المعلم | NCCD | same |
| اللغة العربية | كتاب الطالب (+ تمارين/دليل إن وُجد) | NCCD | same |
| اللغة الإنجليزية | Student book · Activity/Workbook · Teacher guide | NCCD | same |
| التربية الإسلامية | كتاب الطالب · تمارين/دليل | NCCD | same |
| الدراسات الاجتماعية | كتاب الطالب | NCCD | same |
| المهارات الرقمية / رياضية / فنية | Official materials as listed on NCCD | NCCD | `rights_review_required` until each PDF link recorded |

**Pilot book:**  
`Jordan · National · Grade 1 · Semester 1 · الرياضيات · كتاب الطالب (Success OS interactive aligned edition)`  
Official PDF: **linked reference only** — not republished.  
Unit structure seed (Minhaji titles, pending NCCD unit-order confirmation): **الوحدة الأولى: الجمع** — mark `NEEDS VERIFICATION` for edition year & exact lesson order.

---

## 9. Files to create/modify

**Create:** `src/lib/jordan-books/**`, `src/components/jordan-books/**`, `app/jordan-books/**`, `app/admin/jordan-books-dashboard/**`, `app/api/jordan-books/**`, inventory + G1 Math Unit 1 content.  
**Modify:** disable video entrypoints; wire student/admin navigation to books pilot.  
**Do not delete:** interactive/cinema code (archived/disabled only).

---

## 10. Exact Grade 1 Mathematics pilot route

`/jordan-books/jordan/national/grade-1/semester-1/math/student-book/unit-1`

Also: `/admin/jordan-books-dashboard`

---

## 11. Work for first complete unit (technical scope)

- Schema + inventory records for G1 Sem1 Math books  
- Interactive reader with notes/bookmarks/highlights/handwriting/search/progress  
- Full Unit 1 lessons (outcomes, vocab, explanation, examples, practice, answers)  
- Admin coverage dashboard (dynamic counts)  
- Rights/source metadata on every lesson  
- RTL + mobile/desktop smoke tests  

**Not in pilot:** full KG–12 inventory completion, video, mass AI publish.

---

## Video stop actions
- No HeyGen/ElevenLabs API calls  
- `/ai-lessons/g1-math` redirected to books pilot notice  
- Cinema/interactive players kept in repo but not product path  
