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
  detectContentAct,
  directLesson,
  directSentence,
  getTeacherPersona,
  sampleFrame,
  textToPhonemeTrack,
} from "../lib/human-engine/index";

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

// Skinned humanoid assets must exist for product path
const saraGlb = path.resolve("public/media/ai-teachers/sara/humanoid/teacher.glb");
const aliGlb = path.resolve("public/media/ai-teachers/ali/humanoid/teacher.glb");
if (!fs.existsSync(saraGlb) || !fs.existsSync(aliGlb)) {
  throw new Error("missing skinned teacher.glb humanoids — run npm run ai-teachers:humanoids");
}
if (fs.statSync(saraGlb).size < 100_000 || fs.statSync(aliGlb).size < 100_000) {
  throw new Error("teacher.glb files look empty");
}

console.log(
  `human-engine runtime OK · proof=${proofPlan.timeline.durationMs}ms · persona+adapt · humanoids`,
);
