#!/usr/bin/env node
/**
 * AI Digital Human Teacher architecture contract tests.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "types/ai-digital-human-teacher.ts",
  "lib/ai-digital-human-teacher/index.ts",
  "lib/ai-digital-human-teacher/presence.ts",
  "lib/ai-digital-human-teacher/providers.ts",
  "lib/ai-digital-human-teacher/stages.ts",
  "lib/ai-digital-human-teacher/profiles.ts",
  "lib/ai-digital-human-teacher/personality.ts",
  "lib/ai-digital-human-teacher/session.ts",
  "app/api/ai-digital-human-teacher/route.ts",
  "app/admin/ai-digital-human-teacher/page.tsx",
  "components/ai-digital-human-teacher/adht-dashboard.tsx",
  "content/demo/generated/ai-digital-human-teacher.example.json",
  "content/demo/generated/adht-session-plan.example.json",
  "docs/cursor/ai-digital-human-teacher.md",
  "docs/cursor/adr/ADR-0055.1-ai-digital-human-teacher.md",
];

for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/ai-digital-human-teacher.example.json"),
    "utf8",
  ),
);
assert.equal(snap.schema, "success-os.ai-digital-human-teacher.v1");
assert.equal(snap.notAChatbot, true);
assert.equal(snap.presence.shipsLiveAvatarVideo, false);
assert.equal(snap.presence.shipsLiveTtsStt, false);
assert.ok(snap.profiles.length >= 4);
assert.ok(snap.providers.length >= 8);
assert.equal(snap.stages.length, 5);
assert.ok(snap.profiles.some((p) => p.countryCode === "JO"));
assert.ok(snap.profiles.some((p) => p.countryCode === "EG"));
assert.ok(snap.profiles.some((p) => p.countryCode === "US"));
assert.ok(snap.profiles.some((p) => p.countryCode === "JP"));
assert.equal(snap.safety.neverInventCurriculumFacts, true);

const plan = JSON.parse(
  fs.readFileSync(
    path.join(root, "content/demo/generated/adht-session-plan.example.json"),
    "utf8",
  ),
);
assert.equal(plan.schema, "success-os.adht-session-plan.v1");
assert.equal(plan.liveProvidersEnabled, false);
assert.equal(plan.inventsCurriculumFacts, false);
assert.equal(plan.groundedByAte, true);
assert.ok(plan.teacherProfileId);

const providersSrc = fs.readFileSync(
  path.join(root, "lib/ai-digital-human-teacher/providers.ts"),
  "utf8",
);
assert.ok(providersSrc.includes("openai"));
assert.ok(providersSrc.includes("google_gemini"));
assert.ok(providersSrc.includes("elevenlabs"));
assert.ok(providersSrc.includes("tavus"));
assert.ok(providersSrc.includes("heygen"));
assert.ok(providersSrc.includes("livekit"));
assert.ok(providersSrc.includes("langgraph"));
assert.ok(providersSrc.includes("No live SDK call"));

const api = fs.readFileSync(
  path.join(root, "app/api/ai-digital-human-teacher/route.ts"),
  "utf8",
);
for (const action of [
  "status",
  "snapshot",
  "profiles",
  "demo",
  "session",
  "providers",
  "profile:upsert",
  "personality:update",
]) {
  assert.ok(api.includes(action), `api missing ${action}`);
}

const adr = fs.readFileSync(
  path.join(root, "docs/cursor/adr/ADR-0055.1-ai-digital-human-teacher.md"),
  "utf8",
);
assert.ok(adr.includes("provider-agnostic") || adr.includes("Provider-agnostic"));
assert.ok(adr.includes("ADR-0055"));

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
assert.ok(pkg.scripts["validate:ai-digital-human-teacher"]);

// Runtime integration via tsx
const runner = path.join(root, "scripts/_adht_runtime_runner.ts");
fs.writeFileSync(
  runner,
  `
import assert from "node:assert/strict";
import {
  invokeProviderPort,
  planDigitalTeacherSession,
  resetTeacherProfilesForTests,
  runAiDigitalHumanTeacherDemo,
  upsertTeacherProfile,
} from "../lib/ai-digital-human-teacher/index.ts";

resetTeacherProfilesForTests();
const demo = runAiDigitalHumanTeacherDemo({ countryCode: "EG", educationalStage: "middle_school" });
assert.equal(demo.ok, true);
assert.equal(demo.plan.liveProvidersEnabled, false);
assert.ok(String(demo.plan.teacherProfileId).includes("eg") || demo.plan.teacherProfileId);

const us = planDigitalTeacherSession({
  studentId: "stu_us",
  countryCode: "US",
  educationalStage: "high_school",
});
assert.ok(us.teacherProfileId);

const custom = upsertTeacherProfile({
  displayName: { en: "Brazil Science Teacher", ar: "معلم برازيلي" },
  countryCode: "BR",
  educationalStages: ["high_school"],
  enabled: true,
});
assert.equal(custom.countryCode, "BR");
assert.equal(custom.adminAssignable, true);

const refused = invokeProviderPort("text_to_speech");
assert.equal(refused.ok, false);
assert.equal(refused.live, false);

console.log("ADHT runtime OK", { eg: demo.plan.teacherProfileId, us: us.teacherProfileId });
`,
);

const runtime = spawnSync("npx", ["--yes", "tsx", runner], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, ATE_DEV_OPEN: "1" },
  stdio: "inherit",
});
try {
  fs.unlinkSync(runner);
} catch {
  // ignore
}
assert.equal(runtime.status, 0, "ADHT runtime checks failed");

console.log("ai-digital-human-teacher.test.mjs: OK");
console.log(
  JSON.stringify(
    {
      schema: snap.schema,
      profiles: snap.counts.profiles,
      providers: snap.counts.providerPorts,
      liveAvatar: snap.presence.shipsLiveAvatarVideo,
    },
    null,
    2,
  ),
);
