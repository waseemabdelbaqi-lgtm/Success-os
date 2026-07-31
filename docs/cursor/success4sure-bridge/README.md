# Success4Sure → Success OS bridge

Bridge notes for bringing the **Success4Sure Academy** AI Teacher / EST Physics pilot patterns into Success OS.

## Source context (uploaded)

- `TODO-success4sure-academy.md` — Success4Sure project TODO (AI Teacher MVP, Kling interactive video, Mr. Waseem–only EST Physics, `SPENDING_LOCKED`).
- Uploaded package/template metadata live under the agent uploads folder (not committed).

## What we ported here

| Success4Sure intent | Success OS offline pilot |
|---|---|
| Mr. Waseem–only EST Physics | `scripts/render-est-physics-pilot-lesson.py` |
| Teacher + slides + synced audio | Left presenter column + progressive slides + gTTS/pydub timeline |
| `SPENDING_LOCKED` (no Kling/HeyGen spend) | Offline Python renderer only — no paid APIs |
| Forces / Newton’s laws pilot | `content/media/est-physics-pilot/` |

## Assets

- Presenter photo: `content/media/est-physics-pilot/assets/mr-waseem-presenter.jpg`
- **Stand-in** until an authorized Mr. Waseem reference photo is provided. Replace that file and re-run `npm run media:est-physics-pilot`.

## Commands

```bash
npm run media:est-physics-pilot
```

Output:

- `content/media/est-physics-pilot/est-physics-pilot-lesson.mp4`
- `public/media/est-physics-pilot/` (web-served copy)
- `/opt/cursor/artifacts/est-physics-pilot-lesson.mp4` (agent playback)
