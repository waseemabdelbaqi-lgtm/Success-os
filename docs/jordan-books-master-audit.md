# Jordan Interactive Books — Master Build Audit
**Date:** 2026-07-28  
**Branch:** `cursor/jordan-interactive-books-bca1`  
**Mandate:** Complete interactive Jordanian curriculum books (BOOKS FIRST). AI video frozen.

---

## 1. Existing files & systems related to books

| Area | Path | Notes |
|---|---|---|
| Jordan grade/subject registry | `app/data/jordan-curriculum.js` | G1 & G11 subject lists verified |
| G1 ecosystem doctrine | `app/data/jordan-grade1-learning-ecosystem.js` | Resource checklist; not book CMS |
| Wave1 harvest | `library/jordan-wave1/harvests/latest.json` | Structure harvest only |
| Live Middle East books | `library/middle-east-live-preview/…` | Often empty `books: []` |
| Student books UI | `app/student/books`, `components/student-portal/books/*` | Empty live catalog path |
| Digital library | `app/digital-library/**` | Lesson shells; some stubs |
| **Jordan books (this phase)** | `src/lib/jordan-books/**`, `app/jordan-books/**`, `app/admin/jordan-books-dashboard`, `app/api/jordan-books` | Active BOOKS FIRST stack |
| Video experiments | Other branches / archived notice at `/ai-lessons/g1-math` | Disabled for students |

---

## 2. Existing database schema

- **No production Postgres/MySQL curriculum books DB** in this repo for interactive books.
- Storage today: TypeScript content modules + `data/jordan-books/editorial-state.json` + localStorage annotations.
- Firebase used for auth/admissions — **not** for curriculum book bodies.
- Logical target schema: Region→…→PublishedVersion + student annotation tables (see §11).

---

## 3. Existing Jordanian curriculum records

- 13 stage/grade rows (KG + G1–12) with NCCD catalog URLs.
- G1 subjects (verified): Arabic, English, Math, Science, Islamic, Social Studies, Digital Skills, PE, Arts.
- Semesters: فصل أول / فصل ثاني (KG = عام دراسي).
- Prior pilot had **Unit 1 only** for Math — insufficient under new mandate.

---

## 4. Fake / duplicate / incomplete / placeholders

| Issue | Status |
|---|---|
| Empty live book index | Still empty; Jordan books use new `/jordan-books` path |
| Stub lessons → IB Physics | Legacy digital-library map; not used as Jordan COMPLETE claims |
| Invented AI teacher personas | Video path frozen; not student-facing |
| Claiming COMPLETE after one unit | **Forbidden** — this build expands to full Sem1 Math book scope |
| Edition year without NCCD PDF open | Marked **NEEDS VERIFICATION** |

---

## 5. Verified official Jordanian grade structure

From `jordan-curriculum.js` + NCCD textbook grade pages:

- KG (رياض الأطفال)
- Basic: الصف 1 … الصف 10
- Secondary academic: الصف 11, الصف 12
- G11/G12 pathways: inventory **pending** full official pathway matrix (academic/vocational) — not invented here.

---

## 6. Verified Grade 1 Semester 1 subject list

**Status:** `subject-list-verified`  
اللغة العربية · اللغة الإنجليزية · الرياضيات · العلوم · التربية الإسلامية · الدراسات الاجتماعية · المهارات الرقمية · التربية الرياضية · التربية الفنية والموسيقية والمسرحية

---

## 7. Grade 1 Mathematics book title & edition

| Field | Value | Status |
|---|---|---|
| Official title (type) | الرياضيات — كتاب الطالب — الفصل الدراسي الأول | Catalog-confirmed pattern (NCCD G1) |
| Activity book | كتاب التمارين — فصل أول | Catalog-confirmed pattern |
| Teacher guide | دليل المعلم — فصل أول | Catalog-confirmed pattern |
| Edition / year | — | **NEEDS VERIFICATION** (NCCD page often HTTP 500) |
| Companion TOC source | Minhaji G1 Math lesson index | Titles only — never copy prose |

---

## 8. Official source links

- NCCD textbooks hub: https://nccd.gov.jo/Ar/Pages/textbooks  
- NCCD Grade 1: https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68  
- MOE curricula admin: https://moe.gov.jo/ar/إدارة-المناهج-والكتب-المدرسية  
- MOE editions notice: https://moe.gov.jo/ar/node/79818  
- Minhaji structure companion (titles only): https://minhaji.net/lesson/44/الرياضيات  

---

## 9. Rights status

| Material | Rights |
|---|---|
| Official NCCD/MOE PDFs | `LINK AND DISPLAY ONLY` / `official_link_only` — no republication |
| Success OS interactive companion | `sos_original_aligned` — original explanations/examples/practice |
| Minhaji | Companion title index only — no prose copy |
| Credit “Prepared by Mr Waseem Allabadi” | Original SOS content only — never as official textbook authorship |

---

## 10. Exact expected units & lessons (pilot book scope)

**Companion TOC (Minhaji) — year map.** Semester split for units 4–7 vs 0–3: **NEEDS VERIFICATION** against current NCCD Sem1 PDF.

### Included in this Sem1 pilot book (defensible Sem1 core; teacher-guide Sem1 covers intro→unit2; place-value commonly Sem1)

| Unit | Title | Lessons |
|---|---|---|
| 0 | الوحدة التمهيدية: الأعداد حتى 20 | 7: 1–3؛ 4–5؛ صفر؛ 6–8؛ 9–10؛ 11–20؛ الموقع والاتجاه |
| 1 | الوحدة الأولى: الجمع | 5: خط الأعداد؛ الجمع بخط الأعداد؛ الضعف؛ الإكمال إلى 10؛ خصائص الجمع |
| 2 | الوحدة الثانية: الطرح | 6: طرح بخط الأعداد؛ الضعف؛ إيجاد عشرة؛ علاقة الجمع/الطرح؛ حقائق مترابطة؛ العدد المفقود |
| 3 | الوحدة الثالثة: الأعداد ضمن منزلتين | 4: العشرات؛ الآحاد والعشرات؛ تمثيل؛ القيمة المنزلية |

**Total lessons in Sem1 pilot:** 22  

### Reserved (semester assignment NEEDS VERIFICATION — not claimed COMPLETE for Sem1)

Units 4–7: ترتيب ومقارنة؛ معالجة بيانات؛ جمع ضمن منزلتين؛ طرح ضمن منزلتين — outline recorded in inventory only until NCCD Sem1 PDF confirms inclusion.

---

## 11. Proposed database changes

Normalized entities (v1 file-backed → later SQL/Firebase):

Countries, Curricula, CurriculumVersions, AcademicYears, Stages, Grades, Semesters, Pathways, SubjectFamilies, Subjects, BookSeries, Books, BookVersions, BookSources, BookRights, Units, Lessons, LessonSections, Pages, ContentBlocks, Assets, Vocabulary, LearningOutcomes, Skills, Activities, Questions, Answers, Hints, Rubrics, Sources, ReviewTasks, Approvals, PublishedVersions, Student* progress/annotation tables, ImportJobs, ValidationReports, CurriculumCoverage.

v1 implementation: TypeScript schema + JSON editorial store + localStorage student layer (stable IDs).

---

## 12. Proposed book-engine components

`InteractiveBookReader`, `ContentBlockView`, `HandwritingPad`, `DrawingLayer`, question runners with hints/retry, page map, TOC, search, bookmarks, highlights, notes, mastery, RTL/LTR, accessibility toolbar, answer bank panel (after submit).

---

## 13. Proposed admin CMS pages

- `/admin/jordan-books-dashboard` — coverage + validation + editorial workflow  
- Future: book editor, source/rights, import jobs, reviewer queue  

---

## 14. Files to create/modify

Create/expand: `docs/jordan-books-master-audit.md`, `src/lib/jordan-books/content/g1-math-s1/**`, schema, validation, answer-bank, inventory, reader upgrades, book home route, admin validation UI.  
Modify: registry, API, prior unit-1 page → full book entry.  
Do not resume video APIs.

---

## 15. Exact pilot route

**Book:** `/jordan-books/jordan/national/grade-1/semester-1/math/student-book`  
**Deep unit:** `…/student-book/unit-0` … `unit-3`  
**Admin:** `/admin/jordan-books-dashboard`

---

## 16. Risks & blockers

| Risk | Mitigation |
|---|---|
| NCCD page HTTP 500 / no live PDF TOC | Mark edition & Sem1 boundary NEEDS VERIFICATION; link official catalog |
| Cannot legally republish official PDF | SOS original companion + official link only |
| Minhaji is companion not authority | Titles only; never copy exercises/prose |
| G11/G12 pathway matrix incomplete | Inventory-only until official docs verified |
| Math answer checking | Prefer numeric equivalence helpers; not string-only for typed answers |

---

## 17. What can be implemented immediately

- Expanded schema + validation reports  
- Full Sem1 Math companion (units 0–3, 22 lessons) with original content  
- Reader upgrades (pages, hints, mastery, drawing)  
- Admin coverage/validation  
- Freeze video student path  

---

## 18. What requires academic / rights review

- Exact NCCD edition year & Sem1 unit boundary (units 4–7)  
- Final academic/language approval before `published`  
- Any future official PDF import  
- Sacred-text subjects (Islamic) — not in this math pilot  
- Pathway matrix for G11/G12  

**Honest status after this build:** Sem1 Math SOS companion structured for units 0–3 with draft lessons — **not** platform-wide COMPLETE; **not** official textbook republication; editorialStatus remains draft until human approval.
