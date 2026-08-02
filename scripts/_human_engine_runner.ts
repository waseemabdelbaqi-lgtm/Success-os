/**
 * Runtime assertions for Human Engine (invoked by validate:human-engine).
 */
import {
  assertTimelineIntegrity,
  buildDemoPlans,
  buildShowcasePlan,
  createAdapter,
  detectContentAct,
  directLesson,
  directSentence,
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

console.log("human-engine runtime OK · semantic director + showcase");
