#!/usr/bin/env node
/**
 * Render mandatory 10s Sara MP4 demo (original teacher — not a real-person likeness).
 * Pure ffmpeg — no per-frame PIL.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sara = path.join(root, "public/media/ai-teachers/sara");
const demo = path.join(sara, "demo");
const work = path.join(demo, "_ffmpeg");
const stand = path.join(sara, "classroom/stand.png");
const point = path.join(sara, "classroom/point.png");
const portrait = path.join(sara, "portrait.png");
const voice = path.join(demo, "welcome-success-os.mp3");
const outMp4 = path.join(demo, "sara-10s.mp4");
const mirror = path.join(root, "content/media/ai-teachers/sara/demo/sara-10s.mp4");

fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(path.dirname(mirror), { recursive: true });

function run(args, label) {
  console.log("·", label);
  const r = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], {
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error(`ffmpeg failed: ${label}`);
  }
}

for (const f of [stand, point, portrait, voice]) {
  if (!fs.existsSync(f)) throw new Error(`missing ${f}`);
}

const font = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const pad =
  "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x0b1220";

// A: enter / look (stand + fade in)
run(
  [
    "-loop", "1", "-framerate", "30", "-t", "3.2", "-i", stand,
    "-vf", `${pad},fade=t=in:st=0:d=0.8`,
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-an",
    path.join(work, "a.mp4"),
  ],
  "clip A enter/look",
);

// B: smile / greet (portrait + caption)
run(
  [
    "-loop", "1", "-framerate", "30", "-t", "3.8", "-i", portrait,
    "-vf",
    `${pad},eq=saturation=1.08:brightness=0.04,drawtext=fontfile=${font}:text='Welcome to Success OS. I\\'m Sara\\, and I\\'ll be your teacher.':fontcolor=0xf4efe6:fontsize=26:x=(w-text_w)/2:y=h-68:box=1:boxcolor=0x00000099:boxborderw=14`,
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-an",
    path.join(work, "b.mp4"),
  ],
  "clip B smile/greet",
);

// C: walk (point then stand)
run(
  [
    "-loop", "1", "-framerate", "30", "-t", "1.5", "-i", point,
    "-vf", pad,
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-an",
    path.join(work, "c1.mp4"),
  ],
  "clip C1 point/walk",
);
run(
  [
    "-loop", "1", "-framerate", "30", "-t", "1.5", "-i", stand,
    "-vf", pad,
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-an",
    path.join(work, "c2.mp4"),
  ],
  "clip C2 stand",
);

const list = path.join(work, "list.txt");
fs.writeFileSync(
  list,
  ["a.mp4", "b.mp4", "c1.mp4", "c2.mp4"].map((f) => `file '${f}'`).join("\n"),
);

const silent = path.join(work, "silent.mp4");
run(
  ["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", silent],
  "concat",
);

run(
  [
    "-i", silent,
    "-i", voice,
    "-filter_complex",
    "[1:a]adelay=3400|3400,apad=whole_dur=10[a]",
    "-map", "0:v", "-map", "[a]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k",
    "-t", "10",
    "-movflags", "+faststart",
    outMp4,
  ],
  "mux voice",
);

fs.copyFileSync(outMp4, mirror);
fs.rmSync(work, { recursive: true, force: true });

const probe = spawnSync(
  "ffprobe",
  ["-v", "error", "-show_entries", "format=duration,size", "-of", "default=nw=1", outMp4],
  { encoding: "utf8" },
);
console.log(probe.stdout.trim());
console.log("OK", outMp4, fs.statSync(outMp4).size);
