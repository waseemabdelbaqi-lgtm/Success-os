# AI Teachers Catalog — معلمون ومعلمات بالذكاء الاصطناعي

Professional teacher identities for Success OS lessons (offline media + future HeyGen).

## Teachers (v1)

| ID | Name | Gender | Focus |
|----|------|--------|--------|
| `sara` | المعلمة سارة | female | Elementary math |
| `omar` | المعلم عمر | male | Elementary math |
| `layla` | المعلمة ليلى | female | Science |
| `waseem` | الأستاذ وسيم | male | Physics |

## Paths

- Assets: `content/media/ai-teachers/<id>/`
- Public: `public/media/ai-teachers/`
- Preview HTML: `/media/ai-teachers/index.html`
- App page: `/ai-teachers`
- API: `GET /api/ai-teachers` · `GET /api/ai-teachers?id=sara`
- Types: `types/ai-teachers.ts`
- Catalog module: `lib/ai-teachers/catalog.ts`

## Commands

```bash
npm run validate:ai-teachers
npm run ai-teachers:factory          # sync content → public + refresh catalog poses
npm run media:g1-sara                # G1 colorful board with Teacher Sara (AI pack)
npm run media:g1-omar                # G1 colorful board with Teacher Omar (AI pack)
npm run media:g1-colorful-board      # default AI_TEACHER_ID=sara
npm run dev
# then open http://127.0.0.1:3000/ai-teachers
# or http://127.0.0.1:3000/media/ai-teachers/index.html
```

### Pose packs

| Teacher | talk | point | write | idle |
|---------|------|-------|-------|------|
| sara | ✓ | ✓ | ✓ | ✓ |
| omar | ✓ | ✓ | ✓ | ✓ |
| layla | — | ✓ | — | — |
| waseem | — | — | ✓ | — |

## HeyGen (talking video)

Per-teacher env keys (optional):

```
HEYGEN_AVATAR_ID_SARA=
HEYGEN_VOICE_ID_SARA=
HEYGEN_AVATAR_ID_OMAR=
...
```

Fallback: shared `HEYGEN_AVATAR_ID` / `HEYGEN_VOICE_ID` (used by الأستاذ وسيم).

## Generation notes

Portraits and poses in v1 were produced with Cursor image generation (photoreal educational avatars). Re-generate by prompting for the same identity + pose, then drop files into the teacher folder and re-run `validate:ai-teachers`.
