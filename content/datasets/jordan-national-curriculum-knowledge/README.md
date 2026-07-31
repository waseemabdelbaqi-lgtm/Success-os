# Jordan National Curriculum — in-project dataset

Country: **Jordan (JO)**  
Curriculum: **المنهاج الوطني الأردني**

This folder is the **canonical committed** JO-01 knowledge store used by Success OS
(`knowledgeRoot()`). Rebuild with:

```bash
npm run jo:install-curriculum
```

## Contents

| Path | Purpose |
|------|---------|
| `jordan-national-knowledge-database.json` | Aggregate DB + verification gate |
| `status.json` | Gate / totals snapshot |
| `subjects/*.json` | Every grade×subject knowledge node |
| `grades/*.json` | Per-grade rollups |
| `dashboards/latest.json` | Admin dashboard payload |
| `reports/` | Build reports |

Browseable grade trees (subject→unit→lesson) also live at:

`content/exports/jordan-curriculum/grades/grade-NN-tree.json`

## Last install snapshot

- Knowledge cells: 154
- Units: 616
- Lessons: 2464
- Outcomes: 7392
- Verified completion: 98.09%
- Book generation: ALLOWED
- Export grades 1–12 subjects: 134
- Export lessons: 2144

## Rights

Structure / original Success OS scaffolds only — **never** copies textbook prose.
