# Original Human Teachers Policy — Sara & Ali

Status: **Binding**  
Schema: `success-os.original-human-teachers.v1`

## Mission

Study **only** the educational *style* of Success OS official educational videos:

https://www.youtube.com/@Success4SureCenter

### Forbidden (identity)

Do **not** copy or recreate any teacher appearing in those videos.

- Do **not** reproduce faces  
- Do **not** reproduce voices  
- Do **not** reproduce hairstyles  
- Do **not** reproduce clothing  
- Do **not** reproduce body proportions  
- Do **not** reproduce identities  

### Allowed (technique only)

Learn **only** educational techniques — never identities:

- Teaching rhythm  
- Camera movement  
- Classroom organization  
- Board usage  
- Explanation flow  
- Gesture timing  
- Lesson pacing  
- Eye contact strategy  
- Student engagement techniques  
- Transition between concepts  
- Professional educational atmosphere  

## Sara

Create a completely **ORIGINAL** digital teacher:

- Unique face · voice · personality · body · smile · appearance · clothing  
- She must **never** resemble any real teacher  

## Ali

Create a completely **ORIGINAL** digital teacher:

- Unique face · voice · personality · body · appearance · teaching presence  
- He must **never** resemble any real teacher  

## Mandatory public Demo test (10s — Sara)

Generate a **direct public URL to a VIDEO file** (MP4) — not localhost, not an HTML-only mock, not an internal developer preview.

| Requirement | Spec |
|-------------|------|
| Format | MP4 video (direct link anyone can open/play) |
| Duration | 10 seconds |
| Teacher | Sara (original identity only) |
| Scene | Premium educational studio |
| Beats | Enter → look at camera → smile → greet → introduce → walk → natural breath/blink/expression/body |
| Lighting / camera | Professional educational studio |
| Closing line | “Welcome to Success OS. I'm Sara, and I'll be your teacher.” |
| Asset path | `public/media/ai-teachers/sara/demo/sara-10s.mp4` |
| Render script | `scripts/render-sara-10s-demo.mjs` |
| Verdict file | `public/media/ai-teachers/sara/demo/QUALITY_VERDICT.json` |

## Current verdict (honest)

**REJECTED** for Final Acceptance — but the collage is gone.

`sara-10s.mp4` was **rebuilt from scratch** as a continuous 30fps speech-synced render (audio RMS → mouth ROI plates + enter/look/smile/walk beats). It is **not** a Ken-Burns PNG slideshow.

- Still **must not** unlock dual-acceptance until the owner live Demo passes and photorealism/lipsync gates hit target.  
- Canva Connect was requested (`https://www.canva.com/`) but **no OAuth token / MCP** exists in the agent environment — see `public/media/ai-teachers/sara/demo/canva-pack/CANVA_BRIEF.md`.  
- Render entrypoints: `scripts/render-sara-10s-demo.mjs` → `scripts/render_sara_10s_synced.py`.

## Quality bar

If a viewer thinks “This is obviously AI,” the implementation **FAILS**.

If a viewer finds the Demo repulsive or cheap, the implementation **FAILS**.

Continue improving until the experience feels like watching an **original** professional teacher recorded in a premium educational studio.

**Do not copy real people. Create new ones.**

## Related

- `docs/cursor/platform-teachers-doctrine.md`  
- `types/platform-teachers.ts` (`ORIGINAL_HUMAN_TEACHERS_POLICY`)  
- Public demo: `/demo/sara-10s/` · app route `/ai-teacher/sara-10s`  
