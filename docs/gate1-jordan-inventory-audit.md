# GATE 1 AUDIT — Official Inventory
**Status: FAIL — do not proceed to Gate 2/3/4/5 scaling claims**  
**Audit date:** 2026-07-28  
**Branch:** `cursor/jordan-interactive-books-bca1`  
**Validator:** `node scripts/validate-gate1-jordan-inventory.mjs`  
**Evidence sources in repo:** `src/lib/jordan-books/matrix/master-inventory.ts`, `app/data/jordan-curriculum.js`, `data/jordan-books/production-queue.json`

---

## Verdict

Gate 1 **does not pass**.

A Stage × Grade × Semester × Pathway × Subject × Book matrix **exists as a working draft**, but it is **not** a complete officially verified inventory with correct editions. Automated validation must fail until the acceptance criteria below are met.

---

## Acceptance criteria vs evidence

| Criterion | Result | Evidence |
|---|---|---|
| Real official sources | **PARTIAL / BLOCKED** | NCCD grade catalog URLs are recorded for KG–G12. Live fetch from this environment returned **connection failure (HTTP 000 / timeout)** for NCCD and MOE pages on 2026-07-28. Minhaji companion page returned **HTTP 200** (not an official authority for subject-list verification). |
| Correct editions | **FAIL** | Every inventory cell has `curriculumVersion: "NEEDS VERIFICATION"` and `academicYear: "NEEDS VERIFICATION"` (0 of 930 cells have a verified edition/year). |
| No invented subjects | **PASS (with gaps)** | Vocational G11/G12 subject lists are explicitly `NOT_DISCOVERED` (4 placeholder rows). No fabricated vocational subject names. Non-G1/G11 lists are labeled `indexed-pending-nccd` / `minhaji-indexed`, not claimed NCCD-verified. |
| No empty “completed” records | **FAIL for Gate 1 meaning** | 93 cells are marked `CONTENT_COMPLETE` and 185 `STRUCTURED`. These are **Success OS companion production states**, not verified official textbook completion. **0 official student/activity/teacher/support rows have a verified edition or interactive structure.** Treating companion matrix statuses as official-book completion would be false. |
| Clear missing-books report | **PASS (report exists below)** | 652 official book-type rows are incomplete/unverified. Full gap list derived from `production-queue.json`. |

**Automated Gate 1 validation: FAIL**

---

## What is actually verified today

### Authority URLs on record (official intent)
- NCCD textbook hub: `https://www.nccd.gov.jo/Ar/Pages/textbooks`
- NCCD KG publications: `https://nccd.gov.jo/ar/pages/PublicationsKG`
- NCCD grade catalogs: TextBooksGrade `/68` … `/77` (G1–G10), `/117` (G11), `/143` & `/83` (G12)
- MOE editions page (on record, not live-verified here): `https://moe.gov.jo/ar/node/79818`

### Subject lists marked `verified` in code (only)
**Grade 1 (general)** — 9 subjects — `app/data/jordan-curriculum.js` `gradeOne` + `catalogueStatus: subject-list-verified`:
1. اللغة العربية  
2. اللغة الإنجليزية  
3. الرياضيات  
4. العلوم  
5. التربية الإسلامية  
6. الدراسات الاجتماعية  
7. المهارات الرقمية  
8. التربية الرياضية  
9. التربية الفنية والموسيقية والمسرحية  

**Grade 11 (academic)** — 10 subjects — `gradeEleven` + `subject-list-verified`:
1. اللغة العربية  
2. اللغة الإنجليزية  
3. الرياضيات  
4. الفيزياء  
5. الكيمياء  
6. العلوم الحياتية  
7. علوم الأرض والبيئة  
8. المهارات الرقمية  
9. التربية الإسلامية  
10. تاريخ الأردن  

**Verified subject×pathway combos in matrix:** 19 (G1×9 + G11×10).

### Live source probe (this audit run)
| URL | Result |
|---|---|
| NCCD textbooks hub | **FAIL to fetch** (HTTP 000 / timeout) |
| NCCD G1 `/68` | **FAIL to fetch** |
| NCCD G11 `/117` | **FAIL to fetch** |
| NCCD G12 `/143`, `/83` | **FAIL to fetch** |
| NCCD PublicationsKG | **FAIL to fetch** |
| MOE node/79818 | **FAIL to fetch** |
| Minhaji G1 Math companion | **HTTP 200** (companion index only — not NCCD verification) |

**Blocker:** Official edition/title/PDF inventory cannot be closed while NCCD/MOE pages are unreachable or unverified in-environment. Do not guess editions.

---

## Matrix draft snapshot (not a completion claim)

From `data/jordan-books/production-queue.json` (930 cells):

| Dimension | Count / note |
|---|---|
| Total cells | 930 |
| Grades/path keys present | kg1, kg2, 1–10, 11 academic, 11-vocational, 12 academic, 12-vocational |
| `subjectListStatus=verified` | 128 cells |
| `subjectListStatus=indexed-pending-nccd` | 798 cells |
| `subjectListStatus=not_discovered` | 4 cells |
| `matrixStatus` CONTENT_COMPLETE | 93 (**SOS companions only — not Gate 1 pass**) |
| STRUCTURED | 185 (foundation stubs — not complete books) |
| SOURCE_VERIFIED | 90 |
| DISCOVERED | 558 |
| NOT_DISCOVERED | 4 |
| Official book-type rows | 652 |
| Official rows with verified edition | **0** |
| Official rows missing verification/structure | **652** |

Book types present: `student` 280 · `sos_companion` 278 · `teacher_guide` 278 · `activity` 92 · `support` 2.

---

## Missing-books report (Gate 1)

### A. Official books missing verified edition + structure
**All 652** official `student` / `activity` / `teacher_guide` / `support` rows:
- `edition` / academic year / curriculum version = **NEEDS VERIFICATION**
- no `structuredBookId` for an official interactive book
- rights: `official_link_only` or `needs_verification`
- status typically `DISCOVERED` or `SOURCE_VERIFIED` (catalog URL known), **not** edition-complete

### B. Subject lists not NCCD-verified (must not be treated as complete inventory)
| Grade / pathway | Status | Subjects in draft |
|---|---|---|
| KG1, KG2 | indexed-pending-nccd | 4 each (منهج تطوري، رياضيات، عربية، علوم) |
| G2–G10 | indexed-pending-nccd | 9–16 per grade (Minhaji-indexed titles) |
| G12 academic | indexed-pending-nccd | 15 (catalog-harvest pending live re-verify) |
| G11 vocational | **NOT_DISCOVERED** | subjects unknown — placeholders only |
| G12 vocational | **NOT_DISCOVERED** | subjects unknown — placeholders only |

### C. Pathways / materials not yet inventoried from official sources
- Full vocational pathway subject×book matrices (G11/G12)
- Christian Religious Education (if applicable by school) — **not listed; not invented**
- French / other approved languages — **not listed; not invented**
- Per-book exact official titles, ISBN/edition year, semester PDF page ranges — **missing**
- Activity books / workbooks / teacher guides as discrete official editions — **URLs at grade level only, not per-title verified**

### D. Records that must NOT be counted as Gate 1 complete
- Any `sos_companion` row marked `CONTENT_COMPLETE` or `STRUCTURED`
- Any PDF deep-link without edition metadata
- Any empty shell or scaffold counted as a finished official book

---

## Required fixes before Gate 1 can pass

1. Successfully retrieve and archive official NCCD/MOE catalog evidence (HTML/PDF snapshots) for every grade/pathway.  
2. Fill **edition + academic year + exact official title** for every student/activity/teacher book cell from those sources.  
3. Promote subject lists from `indexed-pending-nccd` to `verified` only after NCCD confirmation (or leave gaps explicit).  
4. Resolve vocational pathway subject lists from official sources — or keep `NOT_DISCOVERED` (no invention).  
5. Separate matrix statuses so **official inventory completeness** cannot be confused with SOS companion production status.  
6. Re-run `scripts/validate-gate1-jordan-inventory.mjs` until exit code 0.

---

## Gate decision

**GATE 1: FAIL**  
**Next action:** Fix inventory verification blockers. Do **not** claim Gate 2–5 passed. Do **not** claim the Jordanian curriculum library is complete.
