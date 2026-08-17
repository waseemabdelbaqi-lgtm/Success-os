import assert from "node:assert/strict";
import test from "node:test";
import { TEACHING_STAGES, VALID_TRANSITIONS, isValidTransition, transition, isTerminalStage } from "../teaching-state-machine.ts";

test("state machine covers all 15 required stages in order", () => {
  assert.deepEqual([...TEACHING_STAGES], [
    "INITIALIZE", "GREET", "DIAGNOSE", "PLAN", "EXPLAIN", "DEMONSTRATE", "ASK",
    "WAIT_FOR_STUDENT", "EVALUATE", "FEEDBACK", "REMEDIATE", "CHECK_UNDERSTANDING",
    "CONTINUE", "SUMMARIZE", "COMPLETE",
  ]);
});

test("every stage has a defined (possibly empty) transition list", () => {
  for (const stage of TEACHING_STAGES) {
    assert.ok(Array.isArray(VALID_TRANSITIONS[stage]), `${stage} is missing from VALID_TRANSITIONS`);
  }
});

test("only COMPLETE is terminal", () => {
  for (const stage of TEACHING_STAGES) {
    if (stage === "COMPLETE") assert.equal(isTerminalStage(stage), true);
    else assert.equal(isTerminalStage(stage), false, `${stage} should not be terminal`);
  }
});

test("the documented happy path INITIALIZE -> ... -> COMPLETE is entirely valid", () => {
  const path: (typeof TEACHING_STAGES)[number][] = [
    "INITIALIZE", "GREET", "DIAGNOSE", "PLAN", "EXPLAIN", "DEMONSTRATE", "ASK",
    "WAIT_FOR_STUDENT", "EVALUATE", "FEEDBACK", "CHECK_UNDERSTANDING", "SUMMARIZE", "COMPLETE",
  ];
  for (let i = 0; i < path.length - 1; i++) {
    // Non-null assertions are safe here: the loop bound (path.length - 1)
    // guarantees both indices are always in range.
    assert.equal(isValidTransition(path[i]!, path[i + 1]!), true, `${path[i]} -> ${path[i + 1]} should be valid`);
  }
});

test("REMEDIATE loops back into the lesson (ASK) rather than being a dead end", () => {
  assert.equal(isValidTransition("REMEDIATE", "ASK"), true);
});

test("CONTINUE loops back to PLAN for the next objective", () => {
  assert.equal(isValidTransition("CONTINUE", "PLAN"), true);
});

test("illegal transitions are rejected, e.g. INITIALIZE straight to COMPLETE", () => {
  assert.equal(isValidTransition("INITIALIZE", "COMPLETE"), false);
});

test("transition() throws a descriptive error for an illegal jump", () => {
  assert.throws(() => transition("INITIALIZE", "COMPLETE"), /illegal transition/);
});

test("transition() returns the target stage for a legal jump", () => {
  assert.equal(transition("GREET", "DIAGNOSE"), "DIAGNOSE");
});

test("COMPLETE has no valid next stage", () => {
  assert.deepEqual(VALID_TRANSITIONS.COMPLETE, []);
});
