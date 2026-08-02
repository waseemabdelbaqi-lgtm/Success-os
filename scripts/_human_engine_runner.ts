/**
 * Runtime assertions for Human Engine (invoked by validate:human-engine).
 */
import {
  assertTimelineIntegrity,
  buildDemoPlans,
  createAdapter,
  directLesson,
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
    "camera",
    "lighting",
    "behaviour",
  ] as const;
  for (const t of tracks) {
    if (!plan.timeline[t].keys.length) throw new Error(`${name}: empty ${t}`);
  }

  // Content-driven: different lesson text → different gesture seed sequence
  const a = plan.timeline.gesture.keys.map((k) => k.intent).join(",");
  const mid = sampleFrame(plan, Math.floor(plan.timeline.durationMs / 2));
  if (!mid.characterId) throw new Error(`${name}: sample missing character`);
  if (mid.jawOpen < 0 || mid.jawOpen > 1.01) throw new Error(`${name}: jaw out of range`);

  const adapter = createAdapter(plan.adapter.id);
  adapter.load(plan);
  adapter.applyFrame(mid);
  adapter.dispose?.();

  // phoneme track non-trivial
  const ph = textToPhonemeTrack("مرحبا سارة", 0, 1000);
  if (ph.length < 3) throw new Error("phoneme track too short");

  console.log(
    `${name}: ok duration=${plan.timeline.durationMs}ms gestures=${a.slice(0, 80)} adapter=${plan.adapter.id}/${plan.adapter.status}`,
  );
}

// MetaHuman stub still accepts plan
const mh = createAdapter("metahuman");
mh.load(demos.sara);
mh.applyFrame(sampleFrame(demos.sara, 500));
if (mh.status !== "stub") throw new Error("metahuman should be stub");

// Determinism: same input → same gesture intents
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

// Sara vs Ali plans must differ (character + content)
if (demos.sara.character.id === demos.ali.character.id) {
  throw new Error("sara/ali character collision");
}
if (
  demos.sara.timeline.gesture.keys.map((k) => k.seed).join() ===
  demos.ali.timeline.gesture.keys.map((k) => k.seed).join()
) {
  throw new Error("sara/ali gesture seeds should differ with different lesson text");
}

console.log("human-engine runtime OK");
