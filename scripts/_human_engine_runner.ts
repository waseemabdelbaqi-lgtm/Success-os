/**
 * Runtime assertions for Human Engine (invoked by validate:human-engine).
 */
import fs from "node:fs";
import path from "node:path";
import {
  adaptLiveTeacher,
  assertTimelineIntegrity,
  buildDemoPlans,
  buildProofLessonInput,
  buildShowcasePlan,
  createAdapter,
  createSessionMemory,
  describeTeacherMindTree,
  detectContentAct,
  directLesson,
  directSentence,
  analyzeScriptedLesson,
  bridgeInteractiveLessonToHuman,
  getDefaultTeacherProfile,
  getTeacherPersona,
  listDefaultTeacherProfiles,
  listTeachableCatalog,
  planLessonForTeacher,
  resolveTeachablePackage,
  sampleFrame,
  textToPhonemeTrack,
} from "../lib/human-engine/index";
import { buildCoreTeacherCatalog, getCoreTeacherProfile } from "../lib/ai-teachers/core-profiles";

const demos = buildDemoPlans();

for (const [name, plan] of Object.entries(demos)) {
  if (plan.schema !== "success-os.human-engine.v1") {
    throw new Error(`${name}: bad schema`);
  }
  if (plan.timeline.durationMs > 10000) {
    throw new Error(`${name}: preview duration must be ≤ 10000ms`);
  }
  const issues = assertTimelineIntegrity(plan.timeline);
  if (issues.length) throw new Error(`${name}: ${issues.join("; ")}`);

  const tracks = [
    "skeleton",
    "facial",
    "lipSync",
    "eyes",
    "head",
    "emotion",
    "gesture",
    "locomotion",
    "camera",
    "lighting",
    "behaviour",
    "screen",
  ] as const;
  for (const t of tracks) {
    if (!plan.timeline[t].keys.length) throw new Error(`${name}: empty ${t}`);
  }

  if (!plan.sentences?.length) throw new Error(`${name}: missing sentences[]`);

  const a = plan.timeline.gesture.keys.map((k) => k.intent).join(",");
  const mid = sampleFrame(plan, Math.floor(plan.timeline.durationMs / 2));
  if (!mid.characterId) throw new Error(`${name}: sample missing character`);
  if (mid.jawOpen < 0 || mid.jawOpen > 1.01) throw new Error(`${name}: jaw out of range`);
  if (!mid.contentAct) throw new Error(`${name}: mid frame missing contentAct`);

  const adapter = createAdapter(plan.adapter.id);
  adapter.load(plan);
  adapter.applyFrame(mid);
  adapter.dispose?.();

  const ph = textToPhonemeTrack("مرحبا سارة", 0, 1000);
  if (ph.length < 3) throw new Error("phoneme track too short");

  console.log(
    `${name}: ok duration=${plan.timeline.durationMs}ms acts=${plan.sentences.map((s) => s.contentAct).join(">")} adapter=${plan.adapter.id}`,
  );
  void a;
}

// Semantic meaning → distinct acts
const actLaw = detectContentAct("اكتب القانون F = m × a على السبورة", "explain");
const actDraw = detectContentAct("الآن أرسم مخطط القوة على السبورة", "example");
const actModel = detectContentAct("أمسك النموذج ثلاثي الأبعاد وأديره ثم أكبّره", "example");
const actExp = detectContentAct("نجرب في المختبر ونلاحظ التغير", "practice");
if (actLaw !== "write_law") throw new Error(`expected write_law got ${actLaw}`);
if (actDraw !== "draw_diagram") throw new Error(`expected draw_diagram got ${actDraw}`);
if (actModel !== "hold_model" && actModel !== "rotate_model" && actModel !== "zoom_in_model" && actModel !== "show_model") {
  throw new Error(`expected model act got ${actModel}`);
}
if (actExp !== "run_experiment") throw new Error(`expected run_experiment got ${actExp}`);

// Same text → same sentence performance
const s1 = directSentence("اكتب القانون F = m a", {
  lessonId: "x",
  blockId: "b",
  blockKind: "explain",
  lineIndex: 0,
});
const s2 = directSentence("اكتب القانون F = m a", {
  lessonId: "x",
  blockId: "b",
  blockKind: "explain",
  lineIndex: 0,
});
if (s1.gesture !== s2.gesture || s1.camera !== s2.camera || s1.contentAct !== s2.contentAct) {
  throw new Error("sentence direction not deterministic");
}

// Showcase must include rich content acts
const show = buildShowcasePlan("ali");
const acts = new Set(show.sentences.map((s) => s.contentAct));
for (const need of ["write_law", "draw_diagram", "run_experiment"] as const) {
  if (![...acts].some((a) => a === need || (need === "write_law" && a === "write_board"))) {
    // write_law preferred; allow write_board only if law missed — fail hard for showcase
    if (!acts.has(need)) throw new Error(`showcase missing act ${need}; have ${[...acts].join(",")}`);
  }
}
if (![...acts].some((a) => a.includes("model") || a === "hold_model" || a === "rotate_model" || a === "show_model" || a === "zoom_in_model")) {
  throw new Error(`showcase missing model acts; have ${[...acts].join(",")}`);
}
if (show.timeline.screen.keys.length < 3) throw new Error("showcase screen track too thin");

// MetaHuman stub still accepts plan
const mh = createAdapter("metahuman");
mh.load(demos.sara);
mh.applyFrame(sampleFrame(demos.sara, 500));
if (mh.status !== "stub") throw new Error("metahuman should be stub");

const input = {
  lessonId: "det_test",
  title: "Test",
  preferredCharacterId: "sara" as const,
  blocks: [{ id: "b1", kind: "explain" as const, text: "شوف السبورة واكتب واحد ثم اثنين." }],
  durationMs: 5000,
};
const p1 = directLesson({ input, maxDurationMs: 5000 });
const p2 = directLesson({ input, maxDurationMs: 5000 });
const g1 = p1.timeline.gesture.keys.map((k) => k.intent).join("|");
const g2 = p2.timeline.gesture.keys.map((k) => k.intent).join("|");
if (g1 !== g2) throw new Error("gesture generation not deterministic");

if (demos.sara.character.id === demos.ali.character.id) {
  throw new Error("sara/ali character collision");
}

// Persona differentiation: same lesson text seed path differs by teacher
const saraLine = directSentence("اكتب القانون F = m a على السبورة", {
  lessonId: "persona_diff",
  blockId: "b",
  blockKind: "explain",
  lineIndex: 0,
  teacherId: "sara",
});
const aliLine = directSentence("اكتب القانون F = m a على السبورة", {
  lessonId: "persona_diff",
  blockId: "b",
  blockKind: "explain",
  lineIndex: 0,
  teacherId: "ali",
});
if (saraLine.reason === aliLine.reason) {
  throw new Error("sara/ali sentence reasons should include teacher id");
}
if (getTeacherPersona("sara").voiceId === getTeacherPersona("ali").voiceId) {
  throw new Error("sara/ali must have different voices");
}
if (getTeacherPersona("sara").style === getTeacherPersona("ali").style) {
  throw new Error("sara/ali must have different styles");
}

// Proof lesson ≥ 60s
// Multi-subject acceptance suite — both teachers, every gate subject
const acceptanceIds = [
  "fractions_half",
  "forces_law_lab",
  "chem_water_molecule",
  "bio_cell_model",
  "lang_ar_sentence",
  "prog_loop_trace",
] as const;
for (const lid of acceptanceIds) {
  for (const tid of ["sara", "ali"] as const) {
    const input = buildProofLessonInput(lid, tid);
    const plan = directLesson({
      input,
      maxDurationMs: Math.max(65_000, input.durationMs),
    });
    if (plan.timeline.durationMs < 60_000) {
      throw new Error(`acceptance ${lid}/${tid} too short: ${plan.timeline.durationMs}`);
    }
    const acts = new Set(plan.sentences.map((s) => s.contentAct));
    if (acts.size < 2) {
      throw new Error(`acceptance ${lid}/${tid} needs varied acts, got ${[...acts]}`);
    }
  }
}
const saraFrac = buildProofLessonInput("fractions_half", "sara");
const aliFrac = buildProofLessonInput("fractions_half", "ali");
if (saraFrac.blocks[0]?.text === aliFrac.blocks[0]?.text) {
  throw new Error("sara/ali acceptance hooks must differ (persona lock)");
}

const proofInput = buildProofLessonInput("forces_law_lab", "ali");
const proofPlan = directLesson({
  input: proofInput,
  maxDurationMs: Math.max(65000, proofInput.durationMs || 65000),
});
if (proofPlan.timeline.durationMs < 60000) {
  throw new Error(`proof lesson too short: ${proofPlan.timeline.durationMs}ms`);
}
if (!proofPlan.sentences.some((s) => s.contentAct === "write_law" || s.contentAct === "write_board")) {
  throw new Error("proof lesson missing write act");
}

// Live adapt differs by persona
const askSara = adaptLiveTeacher({
  teacherId: "sara",
  lessonTitle: "القوة",
  event: { type: "ask_text", text: "ما هو التسارع؟" },
});
const askAli = adaptLiveTeacher({
  teacherId: "ali",
  lessonTitle: "القوة",
  event: { type: "ask_text", text: "ما هو التسارع؟" },
});
if (askSara.reply === askAli.reply) {
  throw new Error("sara/ali adapt replies must differ");
}
if (askSara.microPlan.timeline.durationMs < 1000) {
  throw new Error("adapt microPlan empty");
}

// Teacher Mind profiles + Behaviour Tree
const profiles = listDefaultTeacherProfiles();
if (profiles.length < 2) throw new Error("expected sara+ali teacher mind profiles");
if (
  getDefaultTeacherProfile("sara").voice.edgeTts ===
  getDefaultTeacherProfile("ali").voice.edgeTts
) {
  throw new Error("sara/ali profiles must differ in voice");
}
const tree = describeTeacherMindTree();
if (tree.id !== "teacher_root" || tree.type !== "selector") {
  throw new Error("teacher BT root invalid");
}

// Remediation must advance to a new unused strategy (not same words/mode)
let mem = createSessionMemory({
  teacherId: "sara",
  lessonId: "remediate_test",
  lessonTitle: "القوة",
});
const r1 = adaptLiveTeacher({
  teacherId: "sara",
  lessonTitle: "القوة",
  event: { type: "confused" },
  memory: mem,
  elapsedMs: 20_000,
});
mem = r1.memory;
const r2 = adaptLiveTeacher({
  teacherId: "sara",
  lessonTitle: "القوة",
  event: { type: "explain_simpler" },
  memory: mem,
  elapsedMs: 25_000,
});
if (r1.strategy === r2.strategy) {
  throw new Error(
    `remediation must pick unused strategy; got ${r1.strategy} twice`,
  );
}
if (r1.reply === r2.reply) {
  throw new Error("remediation replies must differ across strategies");
}
if (!r2.memory.strategiesUsed.includes(r1.strategy as never)) {
  throw new Error("session memory must retain first strategy");
}

// Deterministic BT tick for same blackboard inputs
const d1 = adaptLiveTeacher({
  teacherId: "ali",
  lessonTitle: "الكسور",
  event: { type: "ask_text", text: "ما المقام؟" },
  memory: createSessionMemory({
    teacherId: "ali",
    lessonId: "det",
    lessonTitle: "الكسور",
  }),
  elapsedMs: 30_000,
});
const d2 = adaptLiveTeacher({
  teacherId: "ali",
  lessonTitle: "الكسور",
  event: { type: "ask_text", text: "ما المقام؟" },
  memory: createSessionMemory({
    teacherId: "ali",
    lessonId: "det",
    lessonTitle: "الكسور",
  }),
  elapsedMs: 30_000,
});
if (d1.decision.state !== d2.decision.state || d1.reply !== d2.reply) {
  throw new Error("teacher mind adapt not deterministic for same inputs");
}

// Skinned humanoid assets must exist for product path
const saraGlb = path.resolve("public/media/ai-teachers/sara/humanoid/teacher.glb");
const aliGlb = path.resolve("public/media/ai-teachers/ali/humanoid/teacher.glb");
if (!fs.existsSync(saraGlb) || !fs.existsSync(aliGlb)) {
  throw new Error("missing skinned teacher.glb humanoids — run npm run ai-teachers:humanoids");
}
if (fs.statSync(saraGlb).size < 100_000 || fs.statSync(aliGlb).size < 100_000) {
  throw new Error("teacher.glb files look empty");
}

// Core TeacherProfile entity — Sara & Ali only
const coreCat = buildCoreTeacherCatalog();
if (coreCat.teachers.length !== 2) throw new Error("core catalog must be sara+ali");
if (!getCoreTeacherProfile("sara")?.eyeContact || !getCoreTeacherProfile("ali")?.bodyMovement) {
  throw new Error("core profiles missing human behaviour flags");
}
if (getCoreTeacherProfile("sara")!.personality === getCoreTeacherProfile("ali")!.personality) {
  throw new Error("sara/ali core personalities must differ");
}

// Pre-lesson analysis → dynamic teaching plan (understand first)
const analyzed = analyzeScriptedLesson({
  teacherId: "sara",
  subject: "chemistry",
  title: "جزيء الماء",
  lines: [
    "الماء مركّب من هيدروجين وأكسجين",
    "الصيغة H2O",
    "نموذج جزيئي ثلاثي الأبعاد",
  ],
  student: { level: "below", priorMistakes: ["نسيان نسب الذرات"] },
});
if (analyzed.pedagogy !== "chemistry_lab_molecular") {
  throw new Error(`expected chemistry pedagogy, got ${analyzed.pedagogy}`);
}
if (!analyzed.analysis.objectives.length || !analyzed.beats.some((b) => b.purpose === "model_3d")) {
  throw new Error("teaching plan missing objectives or molecular model beat");
}
if (!analyzed.beats.some((b) => b.purpose === "remediate")) {
  throw new Error("below-level plan must auto-remediate without student request");
}
const planned = planLessonForTeacher({
  pkg: resolveTeachablePackage({ packageId: "demo" }),
  teacherId: "ali",
  studentLevel: "on",
});
if (planned.teacherId !== "ali" || planned.beats.length < 5) {
  throw new Error("planLessonForTeacher failed for ali");
}

// Universal bridge: any platform lesson → Sara/Ali HE plan with rich acts
const catalog = listTeachableCatalog(5);
if (!catalog.length) throw new Error("teachable catalog empty");
const pkg = resolveTeachablePackage({ packageId: catalog[0]!.packageId });
const bridged = bridgeInteractiveLessonToHuman({
  pkg,
  teacherId: "sara",
  studentLevel: "on",
});
const bridgedPlan = directLesson({
  input: bridged,
  maxDurationMs: Math.max(65_000, bridged.durationMs),
});
if (bridgedPlan.timeline.durationMs < 60_000) {
  throw new Error(`bridged lesson too short: ${bridgedPlan.timeline.durationMs}`);
}
const bridgedActs = new Set(bridgedPlan.sentences.map((s) => s.contentAct));
if (bridgedActs.size < 3) {
  throw new Error(`bridged plan needs varied acts, got ${[...bridgedActs].join(",")}`);
}
// Consecutive explain gestures should prefer variety when pool allows
const gestures = bridgedPlan.timeline.gesture.keys.map((k) => k.intent);
let sameStreak = 1;
let maxStreak = 1;
for (let i = 1; i < gestures.length; i++) {
  if (gestures[i] === gestures[i - 1]) sameStreak += 1;
  else sameStreak = 1;
  maxStreak = Math.max(maxStreak, sameStreak);
}
if (maxStreak > 3) {
  throw new Error(`gesture repetition streak too high: ${maxStreak}`);
}

console.log(
  `human-engine runtime OK · proof=${proofPlan.timeline.durationMs}ms · bridge=${bridgedPlan.timeline.durationMs}ms · teacher-mind+bt · humanoids`,
);
