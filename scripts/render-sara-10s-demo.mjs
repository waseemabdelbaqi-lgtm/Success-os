#!/usr/bin/env node
/**
 * Sara 10s Demo entrypoint — delegates to speech-synced Python renderer.
 * Replaces the rejected Ken-Burns / PNG collage ffmpeg slideshow.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts/render_sara_10s_synced.py");

const r = spawnSync("python3", [script], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
});

if (r.status !== 0) {
  process.exit(r.status || 1);
}
