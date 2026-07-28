# Jordan Curriculum Completeness Matrix

- Master inventory: `src/lib/jordan-books/matrix/master-inventory.ts`
- Completeness report: `src/lib/jordan-books/matrix/completeness.ts`
- Production queue: `src/lib/jordan-books/matrix/queue-store.ts` + `data/jordan-books/production-queue.json`
- Processor: `src/lib/jordan-books/production/queue-processor.ts`
- Multi-unit packs: `src/lib/jordan-books/content/subject-packs.ts` (KG1/KG2, G1 Sem2, G2 Sem1, G12 academic)
- Admin UI: `/admin/jordan-curriculum-matrix`
- Student library: `/jordan-books/jordan/national` → grade → semester → all subjects
- Book reader by id: `/jordan-books/book/[bookId]`

## Honest status rules
- `CONTENT_COMPLETE` = authored SOS companion with multi-unit lessons (still draft editorial — **not** platform COMPLETE)
- `STRUCTURED` = foundation stub (2 units / 4 lessons) — **not** COMPLETE
- `NOT_DISCOVERED` = missing official subject list (G11/G12 vocational pathways) — do not invent
- G12 academic subjects: indexed from NCCD catalogue listings; live pages often HTTP 500 — pending human re-verify
- Never display platform COMPLETE until all reviews pass

Video / HeyGen development remains stopped.

## API
- `GET /api/jordan-books?view=matrix|queue|books|book&id=`
- `POST { action: "process_queue", limit }`
- `POST { action: "rebuild_queue", limit }` — merge new inventory cells then process
