# Digital Human Studio Engine

Schema: `success-os.digital-human-studio.v1`

Turns any lesson into a **photoreal teacher studio session** with Sara or Ali:

1. **Analyze** lesson content (topics, equations, 3D, experiments, difficulty)
2. **Cast** Sara or Ali automatically (overridable)
3. **Plan scenes** with camera angles, lighting, transitions
4. **Direct behaviors** dynamically from content (not static loops)
5. **Render** in the Digital Human Studio player

## Routes

| Route | Purpose |
|-------|---------|
| `/ai-teacher/studio` | Full studio player (demo plan) |
| `/ai-teacher/classroom` | Live classroom (G1 neural audio) |
| `/student/books/.../lessons/...` | Auto launcher plans studio on open |
| `GET/POST /api/digital-human-studio` | `status` · `demo` · `plan` · `adapt` |

## Providers

| Provider | Status |
|----------|--------|
| `local_photoreal_studio` | Live (photoreal assets + neural audio + dynamic direction) |
| `heygen` | Port ready — needs `HEYGEN_*` credentials for twin video |
| `tavus` | Port reserved |

## Scalable extension

Add a teacher by:
1. Registering in `lib/ai-teachers/catalog.ts`
2. Adding asset pack under `content/media/ai-teachers/{id}/`
3. Extending `CASTS` in `lib/digital-human-studio/cast-teacher.ts`

Add a studio by using a new `studioId` string — scene planner is studio-agnostic.

## Validate

```bash
npm run validate:digital-human-studio
npm run validate:ai-teachers
```

## Honest production note

True MetaHuman / pixel-perfect lip-sync video requires a cloud digital-human provider (HeyGen/Tavus) or a local GPU realtime stack. The engine ships a **provider port** so that upgrade does not redesign the lesson pipeline.
