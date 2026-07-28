# GATE 4 — Curriculum Production Factory Report

**Date:** 2026-07-28  
**Branch:** `cursor/gate4-curriculum-factory-bca1`  
**Verdict:** Factory operational. Jordan **not** CONTENT COMPLETE.  
**Next-country readiness:** **NOT READY**

---

## 1. Git checkpoint

See latest commit on `cursor/gate4-curriculum-factory-bca1` after push.

## 2. Migrations

- `db/migrations/003_curriculum_production_factory.sql`
  - `factory_jobs`, `factory_job_events`, `import_artifacts`, `ocr_page_results`
  - `factory_alerts`, `factory_dead_letters`, `content_completeness_scores`
  - `factory_worker_heartbeats`, `curriculum_change_events`, `ai_generation_records`

## 3. New services

| Service | Path |
|---|---|
| Factory queue | `src/lib/curriculum-factory/queue/factory-queue.ts` |
| Worker | `src/lib/curriculum-factory/workers/factory-worker.ts` |
| Import / ingest | `src/lib/curriculum-factory/import/ingest.ts` |
| OCR interface | `src/lib/curriculum-factory/ocr/ocr-service.ts` |
| Validation | `src/lib/curriculum-factory/validation/validate-book.ts` |
| Completeness scoring | `src/lib/curriculum-factory/completeness/score.ts` |
| Review workbench | `src/lib/curriculum-factory/review/workbench.ts` |
| Monitoring | `src/lib/curriculum-factory/monitoring/snapshot.ts` |
| API | `app/api/curriculum-factory/route.ts` |

## 4. Workers

- `gate4-factory-worker` — claims QUEUED/RETRYING jobs, advances companion pipeline to `SUBJECT_REVIEW`
- Idempotent transitions + event log + lock/heartbeat
- Dead-letter after `max_attempts`
- Does **not** auto-approve educational content

## 5. Queue configuration

- 930 Jordan inventory cells → factory jobs (unique per cell + book_type)
- Priority by grade order (KG → G12)
- Statuses include full Gate 4 machine (NOT_READY … COMPLETE / BLOCKED_*)
- Persists in SQLite; survives restart
- Blocked jobs remain visible

## 6. Import formats supported

`pdf`, `docx`, `html`, `json`, `xml`, `epub`, `image`, `scanned`, `structured`

Official download only when rights permit. Companions use `structured` registration (no official PDF republish).

## 7. OCR method

Heuristic Arabic/English confidence + review flags (`heuristic-arabic-english-v1`), provider-pluggable.  
Low-confidence pages → `needs_manual_review=1`. Raw OCR never published.

## 8. Validation rules

Critical blockers: missing title/units/lessons, empty lessons, questions without answers, placeholders, missing rights.  
Warnings: unverified edition. Publication fails on critical errors.

## 9. Review routes

- `/admin/review-workbench`
- API: `GET /api/curriculum-factory?view=reviews`
- API: `POST { action: "review_decide" }`

## 10. Publication routes

- API: `POST { action: "publish" | "publish_first_ready" }`
- Writes `published_versions` + approvals; claim stays `published_companion_pending_official_edition` (never silent `complete`)

## 11. Monitoring routes

- `/admin/production-factory`
- `/admin/production-monitor`
- `GET /api/curriculum-factory?view=monitor|queue|blocked|status`

## 12. Recovery mechanisms

- Job event history
- Checkpoints on each transition
- Retry → RETRYING until max_attempts → FAILED + dead_letter
- Locks expire / clear after processing
- Rebuild queue preserves advanced review/publish statuses
- Approved content not deleted on later failures

## 13–17. Jordan jobs (from DB)

| Metric | Value |
|---|---:|
| Jobs created | **930** |
| BLOCKED_BY_SOURCE | **652** |
| SUBJECT_REVIEW | **275** (varies as publishes proceed) |
| PUBLISHED | **≥1** (proof path exercised; count live in monitor) |
| COMPLETE | **0** |
| Import artifacts | **278** |
| OCR page rows | **278** |
| Job events | **5000+** |

### Blocker codes (exact)

| blocker_code | count | meaning |
|---|---:|---|
| `edition_unverified_nccd_unreachable` | 648 | Official edition/year unverified; NCCD/MoE unreachable — no official import |
| `subject_list_not_discovered` | 4 | G11/G12 vocational subject lists not discovered |

Blocked jobs remain listed via `GET /api/curriculum-factory?view=blocked`.

## 18–19. Published / complete

- Books published (companion publication path): live DB `published_versions` count  
- Books with `completeness_claim='complete'`: **0**  
- Inventory cells `COMPLETE`: **0**

## 20–21. Tests

`npm run gate4:test` → **17/17 PASS**

Covered: bootstrap, worker batch, blocked visibility, companion processing, no fake COMPLETE, import formats, OCR docs, publication, global readiness, monitor, blocked listing, admin/student routes.

## 22. Known limitations

1. Official PDF ingest cannot complete while NCCD/MoE unreachable + rights unresolved.  
2. OCR is interface + heuristics — not a commercial OCR vendor integration yet.  
3. Companion drafts await human subject/language/technical review (275+ open review tasks).  
4. Weighted completeness caps below 100% while blockers/edition gaps exist.  
5. Background worker is API/batch-invoked (no separate long-running daemon process in this environment).

## 23. Global readiness

- Country-agnostic factory tables/services: **PASS**  
- Global configuration test (ZZ country cleaned up): **PASS**  
- Jordan curriculum-production cycle complete for **eligible companions through review queue**: **PASS**  
- Jordan official books complete: **FAIL** (652 blocked)  
- **Next-country readiness: NOT READY**

## 24. Working admin URL

- http://127.0.0.1:3000/admin/production-factory  
- http://127.0.0.1:3000/admin/production-monitor  
- http://127.0.0.1:3000/admin/review-workbench  

## 25. Working student URL

- http://127.0.0.1:3000/interactive-books  
- http://127.0.0.1:3000/student/countries  
- Gate 2 reader: http://127.0.0.1:3000/interactive-books/reader/book-jo-g1-s1-math  

---

## Material blockers requiring your action

1. Restore/verify access to NCCD/MoE official textbook catalogues for edition verification.  
2. Rights classification decisions for 648 official book rows.  
3. Discover official G11/G12 vocational subject lists (4 placeholders).  
4. Human subject/language/technical review backlog for companion drafts.

**Do not start another country until official blockers clear and Jordan final audit reaches a genuine completion state.**
