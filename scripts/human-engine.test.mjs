#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "types/human-engine.ts",
  "lib/human-engine/index.ts",
  "lib/human-engine/character-generator.ts",
  "lib/human-engine/skeleton-animation.ts",
  "lib/human-engine/facial-rig.ts",
  "lib/human-engine/blend-shapes.ts",
  "lib/human-engine/lip-sync.ts",
  "lib/human-engine/eye-tracking.ts",
  "lib/human-engine/head-tracking.ts",
  "lib/human-engine/emotion-system.ts",
  "lib/human-engine/gesture-engine.ts",
  "lib/human-engine/ai-behaviour-engine.ts",
  "lib/human-engine/camera-director.ts",
  "lib/human-engine/lighting-director.ts",
  "lib/human-engine/animation-timeline.ts",
  "lib/human-engine/lesson-director.ts",
  "lib/human-engine/sampler.ts",
  "lib/human-engine/runtime.ts",
  "lib/human-engine/semantic-sentence.ts",
  "lib/human-engine/showcase-lesson.ts",
  "lib/human-engine/teacher-persona.ts",
  "lib/human-engine/teacher-mind.ts",
  "lib/human-engine/teacher-profile-store.ts",
  "lib/human-engine/teacher-profiles-defaults.ts",
  "lib/human-engine/universal-lesson-bridge.ts",
  "lib/human-engine/performance-variety.ts",
  "lib/human-engine/session-memory.ts",
  "app/ai-teacher/page.tsx",
  "components/ai-teachers/platform-teacher-studio.tsx",
  "lib/human-engine/behaviour-tree.ts",
  "lib/human-engine/proof-lessons.ts",
  "lib/human-engine/adapt.ts",
  "lib/human-engine/adapters/index.ts",
  "lib/human-engine/adapters/local-photoreal.ts",
  "lib/human-engine/adapters/metahuman.ts",
  "lib/human-engine/adapters/heygen.ts",
  "types/teacher-mind.ts",
  "content/ai-teachers/profiles/sara.json",
  "content/ai-teachers/profiles/ali.json",
  "app/api/human-engine/route.ts",
  "app/api/teacher-mind/route.ts",
  "app/admin/ai-teachers/page.tsx",
  "app/ai-teacher/human-engine-preview/page.tsx",
  "app/ai-teacher/live/page.tsx",
  "app/ai-teacher/proof/page.tsx",
  "components/ai-teachers/human-engine-preview.tsx",
  "components/ai-teachers/human-engine-studio.tsx",
  "components/ai-teachers/human-engine-proof-studio.tsx",
  "components/ai-teachers/teacher-mind-admin.tsx",
  "components/ai-teachers/skinned-digital-human.tsx",
  "components/ai-teachers/teaching-studio-3d.tsx",
  "lib/human-engine/humanoid-rig.ts",
  "public/media/ai-teachers/sara/humanoid/teacher.glb",
  "public/media/ai-teachers/ali/humanoid/teacher.glb",
  "app/ai-teacher/demo/page.tsx",
  "docs/cursor/human-engine.md",
  "scripts/_human_engine_runner.ts",
  "scripts/build-teacher-humanoids.mjs",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const runner = path.join(root, "scripts/_human_engine_runner.ts");
const result = spawnSync(process.execPath, ["--import", "tsx", runner], {
  cwd: root,
  encoding: "utf8",
});

if (result.status !== 0) {
  const npx = spawnSync("npx", ["--yes", "tsx", runner], {
    cwd: root,
    encoding: "utf8",
  });
  if (npx.status !== 0) {
    console.error(result.stderr || result.stdout);
    console.error(npx.stderr || npx.stdout);
    process.exit(1);
  }
  console.log(npx.stdout.trim());
} else {
  console.log(result.stdout.trim());
}

console.log("human-engine OK");
