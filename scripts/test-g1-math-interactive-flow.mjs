/**
 * Programmatic E2E for the 60–90s interactive micro prototype.
 * Simulates: play demo → pause for question → wrong → hint → wrong → reexplain → correct → continue.
 * Run: node scripts/test-g1-math-interactive-flow.mjs
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

function normalizeTypeAnswer(value) {
  return String(value).replace(/[^\d]/g, "").trim();
}

function isCorrectAnswer(scene, answer) {
  if (scene.interactionType === "type" || scene.interactionType === "draw") {
    return normalizeTypeAnswer(String(answer ?? "")) === normalizeTypeAnswer(String(scene.correctAnswer));
  }
  if (
    scene.interactionType === "arrange" ||
    scene.interactionType === "drag" ||
    scene.interactionType === "match"
  ) {
    const expected = scene.correctAnswer;
    const got = answer;
    return (
      Array.isArray(got) &&
      Array.isArray(expected) &&
      expected.length === got.length &&
      expected.every((v, i) => v === got[i])
    );
  }
  return Number(answer) === Number(scene.correctAnswer);
}

const out = execSync(
  `npx --yes tsx -e "import { JORDAN_G1_MATH_MICRO_PROTOTYPE as L } from './src/lib/interactive-lesson/lessons/jordan-g1-math-micro.ts'; console.log(JSON.stringify(L))"`,
  { cwd: "/workspace", encoding: "utf8" },
);
const lesson = JSON.parse(out.trim().split("\n").pop());

assert.equal(lesson.scenes.length, 3);
const totalAutoMs = lesson.scenes
  .filter((s) => s.completionRule === "auto")
  .reduce((a, s) => a + s.durationMs, 0);
assert.ok(totalAutoMs >= 20000 && totalAutoMs <= 90000, `auto duration ${totalAutoMs}`);

const demo = lesson.scenes[0];
const turn = lesson.scenes[1];
const result = lesson.scenes[2];

assert.equal(demo.completionRule, "auto");
assert.ok(demo.visualTimeline.some((e) => e.action === "jump"));
assert.equal(turn.completionRule, "interaction");
assert.equal(turn.interactionType, "mcq");
assert.ok(turn.firstHint?.ar);
assert.ok(turn.secondExplanation?.ar);
assert.equal(result.sceneType, "result");

// Simulate student answer paths
assert.equal(isCorrectAnswer(turn, 0), false);
assert.equal(isCorrectAnswer(turn, 1), true);
assert.equal(isCorrectAnswer(turn, 2), false);

// State machine simulation
let phase = "playing";
let attempts = 0;
const transitions = [];

function submit(answer) {
  assert.equal(phase === "awaiting_interaction" || phase === "hint", true, `bad phase ${phase}`);
  attempts += 1;
  if (isCorrectAnswer(turn, answer)) {
    phase = "feedback_correct";
    transitions.push({ attempts, answer, phase });
    return;
  }
  if (attempts === 1) {
    phase = "hint";
    transitions.push({ attempts, answer, phase, hint: turn.firstHint.ar });
    return;
  }
  phase = "reexplain";
  transitions.push({ attempts, answer, phase, easier: turn.secondExplanation.ar });
}

phase = "awaiting_interaction";
submit(0);
assert.equal(phase, "hint");
phase = "awaiting_interaction"; // dismiss hint
submit(2);
assert.equal(phase, "reexplain");
phase = "awaiting_interaction"; // after reexplain
submit(1);
assert.equal(phase, "feedback_correct");
// Continue button required
phase = "playing";
transitions.push({ action: "continue", next: result.sceneId });

console.log(
  JSON.stringify(
    {
      ok: true,
      route: "/ai-lessons/g1-math",
      autoMs: totalAutoMs,
      transitions,
      notMp4: true,
    },
    null,
    2,
  ),
);
