# Jordan Curriculum Completeness Matrix

- Master inventory: `src/lib/jordan-books/matrix/master-inventory.ts`
- Completeness report: `src/lib/jordan-books/matrix/completeness.ts`
- Production queue: `src/lib/jordan-books/matrix/queue-store.ts` + `data/jordan-books/production-queue.json`
- Processor: `src/lib/jordan-books/production/queue-processor.ts`
- Admin UI: `/admin/jordan-curriculum-matrix`
- Student G1 Sem1 all subjects: `/jordan-books/jordan/national/grade-1/semester-1`
- Book reader by id: `/jordan-books/book/[bookId]`

## Honest status rules
- `CONTENT_COMPLETE` = authored SOS companion with full lessons (still draft editorial)
- `STRUCTURED` = foundation stub (1 unit / 3 lessons) — **not** COMPLETE
- `NOT_DISCOVERED` = missing official subject list (e.g. G12 / vocational pathways) — do not invent
- Never display platform COMPLETE until all reviews pass

Video / HeyGen development remains stopped.
