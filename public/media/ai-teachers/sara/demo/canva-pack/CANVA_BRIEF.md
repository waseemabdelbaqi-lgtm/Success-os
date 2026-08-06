# Canva — Sara 10s (owner import)

Site: https://www.canva.com/

## Goal
10s educational studio video of **original** teacher Sara saying:

> Welcome to Success OS. I'm Sara, and I'll be your teacher.

## Upload these existing assets (no copies in this pack)
From `public/media/ai-teachers/sara/`:
- `flagship/mouth-closed.png` · `mouth-open.png` · `mouth-wide.png` · `gesture.png`
- `classroom/stand.png` · `point.png` · `write.png`
- `alive/blink.png`
- Audio: `demo/canva-pack/welcome-success-os.mp3` (or `demo/welcome-success-os.mp3`)

## Steps in Canva Video
1. Create **Video** → 1920×1080 (or 1280×720)
2. Upload the assets above
3. Timeline (continuous motion, not collage cuts):
   - 0.0–1.5s `stand.png` enter (slow zoom in)
   - 1.5–2.6s `mouth-closed.png` look + smile
   - 2.6–~8.0s animate mouth plates on beat with the MP3 (closed→open→wide)
   - Blink flashes ~3.5s and ~6.4s
   - Mid-line briefly `gesture.png`
   - 8.0–10s `point.png` → `write.png` → `stand.png`
4. Place audio starting at **2.6s**
5. Export **MP4 1080p** → replace `public/media/ai-teachers/sara/demo/sara-10s.mp4`

## API note
Cloud agent has **no Canva OAuth token** / no Canva MCP. To automate: set `CANVA_ACCESS_TOKEN` and use Canva Connect export (`mp4` / `horizontal_1080p`).
