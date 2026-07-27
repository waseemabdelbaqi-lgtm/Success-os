/**
 * Node smoke tests for interactive lesson answer logic + scene contract.
 * Run: node scripts/test-interactive-lesson-engine.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { register } from "node:module";

// Lightweight inline ports of answer helpers (avoid TS loader complexity)
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

const require = createRequire(import.meta.url);

// Dynamic import of compiled lesson via tsx if available, else parse via next-style path fail → inline check
async function loadLesson() {
  try {
    const { execSync } = await import("node:child_process");
    const out = execSync(
      `npx --yes tsx -e "import { JORDAN_G1_MATH_INTERACTIVE as L } from './src/lib/interactive-lesson/lessons/jordan-g1-math-number-line.ts'; console.log(JSON.stringify(L))"`,
      { cwd: new URL("..", import.meta.url).pathname, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return JSON.parse(out.trim().split("\n").pop());
  } catch (err) {
    console.error("Failed to load lesson via tsx:", err.message);
    throw err;
  }
}

const lesson = await loadLesson();

assert.equal(lesson.schema, "success-os.interactive-lesson.v1");
assert.equal(lesson.preparedBy, "Prepared by Mr Waseem Allabadi");
assert.ok(lesson.scenes.length >= 12, "enough scenes");

const interactive = lesson.scenes.filter((s) => s.completionRule === "interaction");
assert.ok(interactive.length >= 6, "enough interactions");

const types = new Set(lesson.scenes.map((s) => s.interactionType));
for (const needed of ["mcq", "tap", "type", "drag", "match", "draw"]) {
  assert.ok(types.has(needed), `missing interaction type: ${needed}`);
}

const structure = lesson.scenes.map((s) => s.sceneType);
for (const needed of [
  "hook",
  "objective",
  "prerequisite",
  "explain",
  "demo",
  "your_turn",
  "practice",
  "application",
  "quiz",
  "result",
]) {
  assert.ok(structure.includes(needed), `missing sceneType: ${needed}`);
}

// Answer path tests
const mcq = lesson.scenes.find((s) => s.sceneId === "guided-1");
assert.equal(isCorrectAnswer(mcq, 1), true);
assert.equal(isCorrectAnswer(mcq, 0), false);

const typed = lesson.scenes.find((s) => s.sceneId === "practice-type");
assert.equal(isCorrectAnswer(typed, "5"), true);
assert.equal(isCorrectAnswer(typed, " 5 "), true);
assert.equal(isCorrectAnswer(typed, "6"), false);

const drag = lesson.scenes.find((s) => s.sceneId === "arrange");
assert.equal(isCorrectAnswer(drag, [0, 1, 2]), true);
assert.equal(isCorrectAnswer(drag, [2, 1, 0]), false);

const match = lesson.scenes.find((s) => s.sceneId === "match-sums");
assert.equal(isCorrectAnswer(match, [0, 1, 2]), true);
assert.equal(isCorrectAnswer(match, [1, 0, 2]), false);

const draw = lesson.scenes.find((s) => s.sceneId === "quiz-2");
assert.equal(draw.interactionType, "draw");
assert.equal(isCorrectAnswer(draw, "5"), true);

// Audio + captions contract
for (const scene of lesson.scenes) {
  assert.ok(scene.narration.ar && scene.narration.en, scene.sceneId);
  assert.ok(scene.captions.ar && scene.captions.en, scene.sceneId);
  assert.ok(scene.accessibilityText.ar && scene.accessibilityText.en, scene.sceneId);
  assert.ok(scene.audio?.ar && scene.audio?.en, `audio missing for ${scene.sceneId}`);
  assert.ok(Array.isArray(scene.visualTimeline), scene.sceneId);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      scenes: lesson.scenes.length,
      interactions: interactive.length,
      interactionTypes: [...types].sort(),
    },
    null,
    2,
  ),
);
