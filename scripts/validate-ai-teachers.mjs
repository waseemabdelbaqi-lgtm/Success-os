#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const assert = (c, m) => {
  if (!c) failures.push(m);
};

const doctrinePath = path.join(root, "docs/cursor/platform-teachers-doctrine.md");
assert(fs.existsSync(doctrinePath), "Missing platform-teachers-doctrine.md");
const doctrine = fs.readFileSync(doctrinePath, "utf8");
assert(doctrine.includes("سارة") && doctrine.includes("علي"), "Doctrine must name Sara/Ali in Arabic");
assert(doctrine.includes("Dual acceptance"), "Doctrine must include dual acceptance");
assert(
  fs.existsSync(path.join(root, "docs/cursor/original-human-teachers-policy.md")),
  "Missing original-human-teachers-policy.md",
);
const originality = fs.readFileSync(
  path.join(root, "docs/cursor/original-human-teachers-policy.md"),
  "utf8",
);
assert(
  originality.includes("Success4SureCenter"),
  "Originality policy must reference Success4SureCenter technique only",
);
assert(
  originality.includes("Do NOT reproduce faces") ||
    originality.includes("Do **not** reproduce faces"),
  "Originality policy must forbid face reproduction",
);
assert(
  fs.existsSync(path.join(root, "public/demo/sara-10s/index.html")),
  "Missing public 10s Sara demo",
);
assert(
  fs.existsSync(
    path.join(root, "public/media/ai-teachers/sara/demo/welcome-success-os.mp3"),
  ),
  "Missing Sara welcome-success-os.mp3",
);
assert(
  fs.existsSync(path.join(root, "public/media/ai-teachers/sara/demo/sara-10s.mp4")),
  "Missing Sara 10s MP4 demo video",
);
assert(
  fs.statSync(path.join(root, "public/media/ai-teachers/sara/demo/sara-10s.mp4")).size > 50_000,
  "Sara 10s MP4 too small",
);
assert(
  fs.existsSync(path.join(root, "scripts/render-sara-10s-demo.mjs")),
  "Missing render-sara-10s-demo.mjs",
);
const verdictPath = path.join(
  root,
  "public/media/ai-teachers/sara/demo/QUALITY_VERDICT.json",
);
assert(fs.existsSync(verdictPath), "Missing Sara 10s QUALITY_VERDICT.json");
const verdict = JSON.parse(fs.readFileSync(verdictPath, "utf8"));
assert(verdict.status === "REJECTED", "Current collage demo must stay REJECTED until replaced");
assert(verdict.forbiddenAsEvidence === true, "Rejected demo must be forbidden as evidence");
const demoPage = fs.readFileSync(
  path.join(root, "public/demo/sara-10s/index.html"),
  "utf8",
);
assert(/REJECTED|مرفوض/.test(demoPage), "Public demo page must show REJECTED");
const demoHtml = fs.readFileSync(
  path.join(root, "public/demo/sara-10s/index.html"),
  "utf8",
);
assert(
  demoHtml.includes("Welcome to Success OS"),
  "10s demo must include mandatory closing line",
);
const doctrineTypes = fs.readFileSync(
  path.join(root, "types/platform-teachers.ts"),
  "utf8",
);
assert(
  doctrineTypes.includes("ORIGINAL_HUMAN_TEACHERS_POLICY"),
  "types must export ORIGINAL_HUMAN_TEACHERS_POLICY",
);
assert(
  doctrine.includes("دون الحاجة لإنشاء معلم جديد") || doctrine.includes("without creating a new teacher"),
  "Doctrine must forbid new teachers for subjects",
);
assert(doctrine.includes("world-class") || doctrine.includes("عالمي"), "Doctrine must state world-class phase");
assert(doctrine.includes("Programming") || doctrine.includes("برمجة"), "Doctrine must include multi-subject gate");
assert(doctrine.includes("Purposeful motion") || doctrine.includes("سبب تعليمي"), "Doctrine must require purposeful motion");

const proofSrc = fs.readFileSync(path.join(root, "lib/human-engine/proof-lessons.ts"), "utf8");
for (const id of [
  "chem_water_molecule",
  "bio_cell_model",
  "lang_ar_sentence",
  "prog_loop_trace",
]) {
  assert(proofSrc.includes(id), `Missing acceptance lesson ${id}`);
}

const entityProfile = path.join(root, "src/ai-teacher/core/TeacherProfile.ts");
assert(fs.existsSync(entityProfile), "Missing Configuration Layer TeacherProfile");
const entitySrc = fs.readFileSync(entityProfile, "utf8");
assert(entitySrc.includes('TeacherID = "sara" | "ali"'), "TeacherID must be sara|ali");
assert(entitySrc.includes("export interface TeacherProfile"), "Missing TeacherProfile interface");
assert(fs.existsSync(path.join(root, "types/ai-teacher-profile.ts")), "Missing API envelope types");
assert(fs.existsSync(path.join(root, "lib/ai-teachers/core-profiles.ts")), "Missing core-profiles");
assert(
  fs.existsSync(path.join(root, "lib/human-engine/lesson-content-analyzer.ts")),
  "Missing lesson-content-analyzer",
);
assert(fs.existsSync(path.join(root, "types/lesson-teaching-plan.ts")), "Missing lesson-teaching-plan");
assert(fs.existsSync(path.join(root, "app/api/ai-teachers/core/route.ts")), "Missing core API");
assert(
  fs.existsSync(path.join(root, "app/api/ai-teachers/teach-plan/route.ts")),
  "Missing teach-plan API",
);

// Configuration Layer — engines must read Sara/Ali from src/ai-teacher
assert(fs.existsSync(path.join(root, "src/ai-teacher/config.ts")), "Missing src/ai-teacher/config.ts");
assert(fs.existsSync(path.join(root, "src/ai-teacher/teachers/sara.ts")), "Missing sara.ts config");
assert(fs.existsSync(path.join(root, "src/ai-teacher/teachers/ali.ts")), "Missing ali.ts config");
assert(
  fs.existsSync(path.join(root, "src/ai-teacher/core/LiveTeacherState.ts")),
  "Missing LiveTeacherState types",
);
const liveStateSrc = fs.readFileSync(
  path.join(root, "src/ai-teacher/core/LiveTeacherState.ts"),
  "utf8",
);
assert(liveStateSrc.includes("export enum TeacherState"), "Missing TeacherState enum");
assert(liveStateSrc.includes("export interface LiveTeacherState"), "Missing LiveTeacherState");
assert(
  fs.existsSync(path.join(root, "lib/human-engine/derive-live-teacher-state.ts")),
  "Missing derive-live-teacher-state bridge",
);
const coreProfilesSrc = fs.readFileSync(path.join(root, "lib/ai-teachers/core-profiles.ts"), "utf8");
assert(
  coreProfilesSrc.includes("@/src/ai-teacher/config"),
  "core-profiles must read Configuration Layer",
);
const mindDefaultsSrc = fs.readFileSync(
  path.join(root, "lib/human-engine/teacher-profiles-defaults.ts"),
  "utf8",
);
assert(
  mindDefaultsSrc.includes("@/src/ai-teacher/config"),
  "Teacher Mind defaults must overlay Configuration Layer",
);
const liveTtsSrc = fs.readFileSync(path.join(root, "lib/ai-teachers/live-tts.ts"), "utf8");
assert(
  liveTtsSrc.includes("resolveTeacherVoice"),
  "Voice engine must resolve voice from Configuration Layer",
);
const catalogSrc = fs.readFileSync(path.join(root, "lib/ai-teachers/catalog.ts"), "utf8");
assert(
  catalogSrc.includes("@/src/ai-teacher/config"),
  "catalog must read Configuration Layer",
);

// Human Teacher Engine — world-class path; Sara.ts/Ali.ts sole identity
assert(
  fs.existsSync(path.join(root, "lib/human-teacher-engine/index.ts")),
  "Missing Human Teacher Engine",
);
assert(
  fs.existsSync(path.join(root, "lib/human-teacher-engine/teach.ts")),
  "Missing HTE teach entry",
);
assert(
  fs.existsSync(path.join(root, "app/api/human-teacher-engine/route.ts")),
  "Missing HTE API",
);
const saraSrc = fs.readFileSync(path.join(root, "src/ai-teacher/teachers/sara.ts"), "utf8");
const aliSrc = fs.readFileSync(path.join(root, "src/ai-teacher/teachers/ali.ts"), "utf8");
assert(saraSrc.includes("personalityLock"), "Sara.ts must define personalityLock");
assert(aliSrc.includes("personalityLock"), "Ali.ts must define personalityLock");
assert(saraSrc.includes("localeVoices"), "Sara.ts must define localeVoices");
assert(aliSrc.includes("localeVoices"), "Ali.ts must define localeVoices");
assert(saraSrc.includes("performance"), "Sara.ts must define performance contract");
assert(aliSrc.includes("performance"), "Ali.ts must define performance contract");
assert(saraSrc.includes("appearance"), "Sara.ts must define appearance");
assert(aliSrc.includes("appearance"), "Ali.ts must define appearance");
const charGenSrc = fs.readFileSync(path.join(root, "lib/human-engine/character-generator.ts"), "utf8");
assert(
  charGenSrc.includes("getTeacherAppearance") && !charGenSrc.includes("olive_blazer_classroom"),
  "character-generator must derive appearance from config (no hardcoded outfit)",
);
const castSrc = fs.readFileSync(path.join(root, "lib/digital-human-studio/cast-teacher.ts"), "utf8");
assert(
  castSrc.includes("@/src/ai-teacher/config") && !castSrc.includes("ar-JO-SanaNeural"),
  "cast-teacher must derive voice from config",
);
const storeSrc = fs.readFileSync(path.join(root, "lib/human-engine/teacher-profile-store.ts"), "utf8");
assert(
  storeSrc.includes("applyConfigLayer"),
  "teacher-profile-store must always apply Configuration Layer",
);
const heIndexSrc = fs.readFileSync(path.join(root, "lib/human-engine/index.ts"), "utf8");
assert(
  heIndexSrc.includes("teachHumanLesson"),
  "Human Engine index must export Human Teacher Engine teachHumanLesson",
);

// Human Teacher Quality Gate — ship blocker
assert(
  fs.existsSync(path.join(root, "src/ai-teacher/runtime/quality-gate.ts")),
  "Missing Human Teacher Quality Gate",
);
assert(
  fs.existsSync(path.join(root, "src/ai-teacher/runtime/bootstrap.ts")),
  "Missing teacher bootstrap (quality-gated)",
);
assert(
  fs.existsSync(path.join(root, "app/api/ai-teachers/quality-gate/route.ts")),
  "Missing quality-gate API",
);
const bootSrc = fs.readFileSync(
  path.join(root, "src/ai-teacher/runtime/bootstrap.ts"),
  "utf8",
);
assert(bootSrc.includes("assertTeacherQuality"), "bootstrap must call assertTeacherQuality");
assert(bootSrc.includes("loadSaraMetrics"), "bootstrap must load Sara metrics");
assert(bootSrc.includes("loadAliMetrics"), "bootstrap must load Ali metrics");
const saraMetricsSrc = fs.readFileSync(
  path.join(root, "src/ai-teacher/teachers/sara.ts"),
  "utf8",
);
const aliMetricsSrc = fs.readFileSync(
  path.join(root, "src/ai-teacher/teachers/ali.ts"),
  "utf8",
);
assert(saraMetricsSrc.includes("export async function loadSaraMetrics"), "Sara loadSaraMetrics");
assert(aliMetricsSrc.includes("export async function loadAliMetrics"), "Ali loadAliMetrics");
assert(
  fs.existsSync(path.join(root, "src/ai-teacher/runtime/final-acceptance-gate.ts")),
  "Missing Final Acceptance Gate",
);
assert(
  fs.existsSync(path.join(root, "src/ai-teacher/runtime/HumanEngine.ts")),
  "Missing quality-gated HumanEngine",
);
assert(
  fs.existsSync(path.join(root, "src/ai-teacher/runtime/bootstrap-teacher.ts")),
  "Missing bootstrap-teacher",
);
assert(
  fs.existsSync(path.join(root, "app/api/ai-teachers/final-acceptance/route.ts")),
  "Missing final-acceptance API",
);
const finalSrc = fs.readFileSync(
  path.join(root, "src/ai-teacher/runtime/final-acceptance-gate.ts"),
  "utf8",
);
assert(finalSrc.includes("finalAcceptanceGate"), "finalAcceptanceGate export");
assert(finalSrc.includes("has15SecondShowcase"), "must require 15s showcase");
const heClass = fs.readFileSync(
  path.join(root, "src/ai-teacher/runtime/HumanEngine.ts"),
  "utf8",
);
assert(heClass.includes("startTeacherSession"), "HumanEngine uses quality bootstrap");
assert(heClass.includes("finalAcceptanceGate"), "HumanEngine uses final acceptance");
assert(
  fs.existsSync(path.join(root, "src/ai-teacher/runtime/recovery-plan.ts")),
  "Missing Automatic Recovery Plan",
);
const recoverySrc = fs.readFileSync(
  path.join(root, "src/ai-teacher/runtime/recovery-plan.ts"),
  "utf8",
);
assert(recoverySrc.includes("buildRecoveryPlan"), "buildRecoveryPlan required");
assert(recoverySrc.includes("Photorealism"), "recovery must cover Photorealism");
assert(recoverySrc.includes("Showcase"), "recovery must cover Showcase");
assert(
  fs.existsSync(path.join(root, "src/ai-teacher/runtime/RecoveryEngine.ts")),
  "Missing runtime RecoveryEngine class",
);
const recoveryClassSrc = fs.readFileSync(
  path.join(root, "src/ai-teacher/runtime/RecoveryEngine.ts"),
  "utf8",
);
assert(recoveryClassSrc.includes("export class RecoveryEngine"), "RecoveryEngine class required");
assert(recoveryClassSrc.includes("nextTask"), "RecoveryEngine.nextTask required");
assert(recoveryClassSrc.includes("isRecovered"), "RecoveryEngine.isRecovered required");
assert(recoveryClassSrc.includes("recoverFromRuntime"), "recoverFromRuntime required");
assert(
  fs.existsSync(path.join(root, "src/lib/ai-teachers/recovery-engine.ts")),
  "Missing recovery-engine.ts",
);
const engineSrc = fs.readFileSync(
  path.join(root, "src/lib/ai-teachers/recovery-engine.ts"),
  "utf8",
);
assert(engineSrc.includes("PRIMARY_TEACHER_IDS"), "PRIMARY_TEACHER_IDS required");
assert(engineSrc.includes('"sara"') && engineSrc.includes('"ali"'), "engine must be Sara+Ali only");
assert(engineSrc.includes("syncTeacherFromAcceptanceRuntime"), "must sync live metrics");
assert(engineSrc.includes("getRecoveryPlanResponse"), "getRecoveryPlanResponse required");
assert(!engineSrc.includes('"omar"') && !engineSrc.includes('"layla"'), "no legacy teachers");

// Photorealism engine — recovery dependency #1 (honest FAIL until ≥95)
assert(
  fs.existsSync(path.join(root, "src/lib/ai-teachers/photorealism-engine.ts")),
  "Missing photorealism-engine.ts",
);
const photoSrc = fs.readFileSync(
  path.join(root, "src/lib/ai-teachers/photorealism-engine.ts"),
  "utf8",
);
assert(photoSrc.includes("inspectPhotorealism"), "inspectPhotorealism required");
assert(
  photoSrc.includes("inspectCurrentTeacherPhotorealism"),
  "inspectCurrentTeacherPhotorealism required",
);
assert(photoSrc.includes("calculatePhotorealismScore"), "calculatePhotorealismScore required");
assert(photoSrc.includes("updateTeacherScore"), "photorealism must update recovery scores");
assert(photoSrc.includes("facialAnatomy"), "must score facial anatomy");
assert(photoSrc.includes("skinRealism"), "must score skin realism");
assert(
  fs.existsSync(path.join(root, "app/api/ai-teachers/photorealism/route.ts")),
  "Missing photorealism API",
);
const recoveryApiSrc = fs.readFileSync(
  path.join(root, "app/api/ai-teachers/recovery-plan/route.ts"),
  "utf8",
);
assert(
  recoveryApiSrc.includes("inspectCurrentTeacherPhotorealism"),
  "recovery-plan API must run photorealism inspection",
);

// Lip sync engine — recovery dependency #2 (blocked until photorealism ≥95)
assert(
  fs.existsSync(path.join(root, "src/lib/ai-teachers/lipsync-engine.ts")),
  "Missing lipsync-engine.ts",
);
const lipSrc = fs.readFileSync(
  path.join(root, "src/lib/ai-teachers/lipsync-engine.ts"),
  "utf8",
);
assert(lipSrc.includes("inspectLipSync"), "inspectLipSync required");
assert(
  lipSrc.includes("inspectCurrentTeacherLipSync"),
  "inspectCurrentTeacherLipSync required",
);
assert(lipSrc.includes("calculateLipSyncScore"), "calculateLipSyncScore required");
assert(lipSrc.includes("phonemeAccuracy"), "must score phoneme accuracy");
assert(lipSrc.includes("visemeAccuracy"), "must score viseme accuracy");
assert(lipSrc.includes('category: "lipsync"'), "lipsync must update recovery scores");
assert(
  fs.existsSync(path.join(root, "app/api/ai-teachers/lipsync/route.ts")),
  "Missing lipsync API",
);
assert(
  recoveryApiSrc.includes("inspectCurrentTeacherLipSync"),
  "recovery-plan API must run lipsync inspection",
);

const doctrineTs = path.join(root, "types/platform-teachers.ts");
assert(fs.existsSync(doctrineTs), "Missing types/platform-teachers.ts");
const doctrineSrc = fs.readFileSync(doctrineTs, "utf8");
assert(doctrineSrc.includes('PLATFORM_TEACHER_IDS'), "Missing PLATFORM_TEACHER_IDS");
assert(doctrineSrc.includes("ownerLiveDemoRequired"), "Missing dual-acceptance policy in types");

const catalogPath = path.join(root, "content/media/ai-teachers/catalog.json");
assert(fs.existsSync(catalogPath), "Missing catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
assert(catalog.schema === "success-os.ai-teachers.v1", "Bad schema");
assert(catalog.teachers.length === 2, "Must have exactly 2 teachers (Sara + Ali)");
assert(catalog.role === "platform_official_primary", "Catalog role must be platform_official_primary");

const ids = catalog.teachers.map((t) => t.id).sort();
assert(ids.join(",") === "ali,sara", `Expected ali,sara got ${ids}`);
for (const t of catalog.teachers) {
  assert(t.role === "platform_official_primary", `Teacher ${t.id} missing platform role`);
}

for (const tid of ["sara", "ali"]) {
  const base = path.join(root, "content/media/ai-teachers", tid);
  assert(fs.existsSync(path.join(base, "portrait.png")), `Missing portrait ${tid}`);
  for (const pose of ["talk.png", "point.png", "write.png", "idle.png"]) {
    assert(fs.existsSync(path.join(base, "poses", pose)), `Missing pose ${tid}/${pose}`);
  }
  for (const f of ["mouth-closed.png", "mouth-open.png", "mouth-wide.png", "gesture.png"]) {
    assert(fs.existsSync(path.join(base, "flagship", f)), `Missing flagship ${tid}/${f}`);
  }
  assert(fs.existsSync(path.join(base, "alive", "blink.png")), `Missing alive blink ${tid}`);
  assert(fs.existsSync(path.join(base, "alive", "listen.png")), `Missing alive listen ${tid}`);
  assert(fs.existsSync(path.join(root, "public/media/ai-teachers", tid, "portrait.png")), `Missing public ${tid}`);
  for (const clip of ["welcome", "one", "two", "three", "practice", "bye", "intro"]) {
    const mp3 = path.join(base, "audio", `${clip}.mp3`);
    assert(fs.existsSync(mp3) && fs.statSync(mp3).size > 5000, `Missing/small audio ${tid}/${clip}.mp3`);
    assert(
      fs.existsSync(path.join(root, "public/media/ai-teachers", tid, "audio", `${clip}.mp3`)),
      `Missing public audio ${tid}/${clip}`,
    );
  }
  for (const pose of ["stand.png", "point.png", "write.png"]) {
    assert(
      fs.existsSync(path.join(base, "classroom", pose)),
      `Missing classroom pose ${tid}/${pose}`,
    );
    assert(
      fs.existsSync(path.join(root, "public/media/ai-teachers", tid, "classroom", pose)),
      `Missing public classroom pose ${tid}/${pose}`,
    );
  }
}

for (const legacy of ["omar", "layla", "waseem"]) {
  assert(!fs.existsSync(path.join(root, "content/media/ai-teachers", legacy)), `Legacy teacher still present: ${legacy}`);
}

const ts = fs.readFileSync(path.join(root, "lib/ai-teachers/catalog.ts"), "utf8");
assert(
  (ts.includes('"sara"') || ts.includes("'sara'")) &&
    (ts.includes('"ali"') || ts.includes("'ali'")),
  "catalog.ts missing sara/ali",
);
assert(!ts.includes('id: "omar"') && !ts.includes('id: "layla"'), "catalog.ts still has legacy teachers");
assert(fs.existsSync(path.join(root, "app/ai-teacher/page.tsx")), "Missing platform teacher page /ai-teacher");
assert(fs.existsSync(path.join(root, "components/ai-teachers/platform-teacher-studio.tsx")), "Missing platform teacher studio");
assert(fs.existsSync(path.join(root, "lib/human-engine/universal-lesson-bridge.ts")), "Missing universal lesson bridge");
assert(fs.existsSync(path.join(root, "app/ai-teacher/classroom/page.tsx")), "Missing interactive classroom page");
assert(fs.existsSync(path.join(root, "lib/ai-teachers/master-coach.ts")), "Missing master-coach layer");
assert(fs.existsSync(path.join(root, "components/ai-teachers/interactive-classroom.tsx")), "Missing classroom UI");
assert(fs.existsSync(path.join(root, "components/ai-teachers/living-board.tsx")), "Missing living board");
assert(fs.existsSync(path.join(root, "lib/digital-human-studio/index.ts")), "Missing digital-human-studio engine");
assert(fs.existsSync(path.join(root, "lib/human-engine/index.ts")), "Missing human-engine");
assert(fs.existsSync(path.join(root, "lib/human-engine/semantic-sentence.ts")), "Missing semantic-sentence director");
assert(fs.existsSync(path.join(root, "app/ai-teacher/human-engine-preview/page.tsx")), "Missing human-engine preview page");
assert(fs.existsSync(path.join(root, "app/ai-teacher/live/page.tsx")), "Missing human-engine live studio page");
assert(fs.existsSync(path.join(root, "app/ai-teacher/proof/page.tsx")), "Missing human-engine proof page");
assert(fs.existsSync(path.join(root, "lib/human-engine/teacher-persona.ts")), "Missing teacher personas");
assert(fs.existsSync(path.join(root, "lib/human-engine/proof-lessons.ts")), "Missing proof lessons");
assert(fs.existsSync(path.join(root, "public/media/ai-teachers/sara/humanoid/teacher.glb")), "Missing Sara humanoid GLB");
assert(fs.existsSync(path.join(root, "public/media/ai-teachers/ali/humanoid/teacher.glb")), "Missing Ali humanoid GLB");
assert(fs.existsSync(path.join(root, "components/ai-teachers/skinned-digital-human.tsx")), "Missing skinned digital human");
const studio3dSrc = fs.readFileSync(
  path.join(root, "components/ai-teachers/teaching-studio-3d.tsx"),
  "utf8",
);
assert(
  studio3dSrc.includes("SkinnedDigitalHuman"),
  "TeachingStudio3D must mount SkinnedDigitalHuman on live HE frames",
);
assert(
  fs.existsSync(path.join(root, "lib/human-engine/teacher-skin.ts")),
  "Missing teacher-skin photorealism materials helper",
);
const skinSrc = fs.readFileSync(
  path.join(root, "lib/human-engine/teacher-skin.ts"),
  "utf8",
);
assert(skinSrc.includes("buildSkinMaterial"), "buildSkinMaterial required");
assert(skinSrc.includes("buildEyeMaterial"), "buildEyeMaterial required");
assert(skinSrc.includes("buildHairMaterial"), "buildHairMaterial required");
const skinnedSrc = fs.readFileSync(
  path.join(root, "components/ai-teachers/skinned-digital-human.tsx"),
  "utf8",
);
assert(skinnedSrc.includes("buildSkinMaterial"), "skinned human must use skin materials");
assert(skinnedSrc.includes("catchlights"), "skinned human must render corneal catchlights");
assert(
  studio3dSrc.includes("useSkinnedHuman"),
  "TeachingStudio3D must prefer skinned GLB over PNG billboard when frame exists",
);
const adaptersSrc = fs.readFileSync(
  path.join(root, "lib/human-engine/adapters/index.ts"),
  "utf8",
);
assert(
  adaptersSrc.includes("createHumanoidWebGLAdapter"),
  "adapters index must export createHumanoidWebGLAdapter",
);
assert(fs.existsSync(path.join(root, "app/ai-teacher/studio/page.tsx")), "Missing digital human studio page");
const lesson = fs.readFileSync(path.join(root, "lib/ai-teachers/g1-count-lesson.ts"), "utf8");
assert(lesson.includes("check:"), "Lesson must include micro-checks");
assert(lesson.includes("challenge"), "Lesson commands must include challenge");
const classroom = fs.readFileSync(
  path.join(root, "components/ai-teachers/interactive-classroom.tsx"),
  "utf8",
);
assert(classroom.includes("/audio/"), "Classroom must play baked neural audio");

if (failures.length) {
  console.error("validate-ai-teachers FAILED:");
  failures.forEach((f) => console.error(" -", f));
  process.exit(1);
}
console.log("validate-ai-teachers OK — Sara + Ali official platform teachers (doctrine locked)");
