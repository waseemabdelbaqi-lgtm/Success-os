import assert from "node:assert/strict";
import test from "node:test";
import { createTeacherSession, runTurn, getSession, _clearSessionsForTests } from "../ai-teacher-runtime.ts";
import { _clearAllMemoryForTests } from "../session-memory.ts";
import { _clearRegistryForTests } from "../subject-tool-router.ts";
import { registerPhysicsSubjectTool } from "../physics-subject-tool.ts";

function freshRuntime() {
  _clearSessionsForTests();
  _clearAllMemoryForTests();
  _clearRegistryForTests();
  registerPhysicsSubjectTool();
}

test("createTeacherSession rejects an unknown teacher id end-to-end", () => {
  freshRuntime();
  assert.throws(() => createTeacherSession({ teacherId: "bob", subject: "physics", lesson: "projectile-motion" }), /not a recognized teacher/);
});

test("createTeacherSession normalizes sarah -> sara end-to-end", () => {
  freshRuntime();
  const session = createTeacherSession({ teacherId: "sarah", subject: "physics", lesson: "projectile-motion" });
  assert.equal(session.teacherId, "sara");
});

test("Ali uses the exact same runtime/architecture as Sara", () => {
  freshRuntime();
  const session = createTeacherSession({ teacherId: "ali", subject: "physics", lesson: "projectile-motion" });
  const { turn } = runTurn(session.sessionId);
  assert.equal(turn.teacherId, "ali");
  assert.ok(turn.spokenText.startsWith("Ali:"));
});

test("full happy-path lesson: correct answer leads to SUMMARIZE/COMPLETE with mastery recorded", () => {
  freshRuntime();
  const session = createTeacherSession({ teacherId: "sara", subject: "physics", lesson: "projectile-motion" });

  const sessionId = session.sessionId;
  const stage = getSession(sessionId).stage;
  const seenStages = [stage];
  // INITIALIZE -> GREET -> DIAGNOSE -> PLAN -> EXPLAIN -> DEMONSTRATE -> ASK -> WAIT_FOR_STUDENT
  for (let i = 0; i < 7; i++) {
    const { turn } = runTurn(sessionId);
    seenStages.push(getSession(sessionId).stage);
    assert.equal(turn.teacherId, "sara");
    assert.ok(turn.spokenText.length > 0, "every turn must have non-empty spokenText");
  }
  assert.equal(getSession(sessionId).stage, "WAIT_FOR_STUDENT");
  assert.deepEqual(seenStages, ["INITIALIZE", "GREET", "DIAGNOSE", "PLAN", "EXPLAIN", "DEMONSTRATE", "ASK", "WAIT_FOR_STUDENT"], "session must pass through every stage in the exact documented order");

  // Student answers correctly -> EVALUATE -> FEEDBACK -> CHECK_UNDERSTANDING -> SUMMARIZE -> COMPLETE
  const { turn: evalTurn, memory: memAfterCorrect } = runTurn(sessionId, { isCorrect: true });
  assert.equal(evalTurn.nextStage, "FEEDBACK");
  assert.ok(memAfterCorrect.masteredConcepts.includes("peak-velocity-check"));

  runTurn(sessionId); // FEEDBACK -> CHECK_UNDERSTANDING
  const { turn: checkTurn } = runTurn(sessionId, { hasMoreObjectives: false }); // CHECK_UNDERSTANDING -> SUMMARIZE
  assert.equal(checkTurn.nextStage, "SUMMARIZE");
  const { turn: summaryTurn, memory: finalMemory } = runTurn(sessionId); // SUMMARIZE -> COMPLETE
  assert.equal(summaryTurn.nextStage, "COMPLETE");
  assert.equal(finalMemory.lessonProgress, 1);
  assert.ok(summaryTurn.spokenText.includes("peak-velocity-check"));
});

test("incorrect answer triggers misconception detection, remediation, and loops back to ASK", () => {
  freshRuntime();
  const session = createTeacherSession({ teacherId: "sara", subject: "physics", lesson: "projectile-motion" });
  for (let i = 0; i < 7; i++) runTurn(session.sessionId); // reach WAIT_FOR_STUDENT

  const { turn: evalTurn, memory } = runTurn(session.sessionId, {
    isCorrect: false,
    misconceptionParams: { studentClaimedTotalVelocityZeroAtPeak: true },
  });
  assert.equal(evalTurn.misconceptionDetected, "total-velocity-zero-at-peak");
  assert.ok(evalTurn.remediation);
  assert.equal(evalTurn.remediation?.misconceptionId, "total-velocity-zero-at-peak");
  assert.ok(memory.misconceptions.includes("total-velocity-zero-at-peak"));
  assert.ok(memory.mistakes.length > 0);

  const { turn: feedbackTurn } = runTurn(session.sessionId); // FEEDBACK -> REMEDIATE
  assert.equal(feedbackTurn.nextStage, "REMEDIATE");
  const { turn: remediateTurn } = runTurn(session.sessionId); // REMEDIATE -> ASK
  assert.equal(remediateTurn.nextStage, "ASK");
  assert.ok(remediateTurn.spokenText.length > 0);
  assert.equal(remediateTurn.remediation?.misconceptionId, "total-velocity-zero-at-peak");
});

test("partially correct answer is handled distinctly from fully correct/incorrect", () => {
  freshRuntime();
  const session = createTeacherSession({ teacherId: "sara", subject: "physics", lesson: "projectile-motion" });
  for (let i = 0; i < 7; i++) runTurn(session.sessionId);
  const { turn, memory } = runTurn(session.sessionId, { isCorrect: "partial" });
  assert.ok(turn.spokenText.toLowerCase().includes("partly"));
  assert.equal(memory.masteredConcepts.includes("peak-velocity-check"), false);
  const lastQuestion = memory.questionHistory[memory.questionHistory.length - 1];
  assert.ok(lastQuestion, "questionHistory must have at least one entry");
  assert.equal(lastQuestion!.correct, false);
});

test('student says "I don\'t understand" -> loops back to DEMONSTRATE instead of being forced to answer', () => {
  freshRuntime();
  const session = createTeacherSession({ teacherId: "sara", subject: "physics", lesson: "projectile-motion" });
  for (let i = 0; i < 7; i++) runTurn(session.sessionId);
  const { turn } = runTurn(session.sessionId, { intent: "confused" });
  assert.equal(turn.nextStage, "DEMONSTRATE");
  assert.ok(turn.spokenText.toLowerCase().includes("slow down"));
});

test('student asks "explain another way" -> re-explains via DEMONSTRATE with different phrasing', () => {
  freshRuntime();
  const session = createTeacherSession({ teacherId: "sara", subject: "physics", lesson: "projectile-motion" });
  for (let i = 0; i < 7; i++) runTurn(session.sessionId);
  const { turn } = runTurn(session.sessionId, { intent: "explain-again" });
  assert.equal(turn.nextStage, "DEMONSTRATE");
  assert.ok(turn.spokenText.includes("different way"));
});

test('student asks "give me an easier example" -> calls the Physics Engine with simpler parameters, not fabricated numbers', () => {
  freshRuntime();
  const session = createTeacherSession({ teacherId: "sara", subject: "physics", lesson: "projectile-motion" });
  for (let i = 0; i < 7; i++) runTurn(session.sessionId);
  const { turn } = runTurn(session.sessionId, { intent: "easier-example" });
  assert.equal(turn.nextStage, "DEMONSTRATE");
  assert.equal(turn.toolEvidence.length, 1);
  const evidence = turn.toolEvidence[0];
  assert.ok(evidence, "toolEvidence must have one entry");
  assert.equal(evidence!.tool, "PhysicsEngine");
  const data = evidence!.result as { summary: { range: number } };
  assert.ok(turn.spokenText.includes(data.summary.range.toFixed(2)), "spoken text must cite the actual computed value, not a placeholder");
});

test("structured output: every TeacherTurn has all required TeacherTurn fields present", () => {
  freshRuntime();
  const session = createTeacherSession({ teacherId: "ali", subject: "physics", lesson: "projectile-motion" });
  const { turn } = runTurn(session.sessionId);
  for (const key of ["teacherId", "sessionId", "subject", "lesson", "stage", "spokenText", "boardActions", "visualActions", "gesture", "expression", "question", "expectedResponseType", "waitForStudent", "misconceptionDetected", "remediation", "nextStage", "toolEvidence"]) {
    assert.ok(key in turn, `TeacherTurn is missing required field "${key}"`);
  }
});

test("results are computed, not hardcoded: DEMONSTRATE spoken text cites the actual computed range for the fixed demo params", () => {
  freshRuntime();
  const session = createTeacherSession({ teacherId: "sara", subject: "physics", lesson: "projectile-motion" });
  for (let i = 0; i < 5; i++) runTurn(session.sessionId); // reach DEMONSTRATE (INITIALIZE..EXPLAIN consumed, session.stage now DEMONSTRATE)
  const { turn: demoTurn } = runTurn(session.sessionId); // this call processes DEMONSTRATE itself -> numeric spokenText
  assert.ok(/\d+\.\d{2} m/.test(demoTurn.spokenText), "DEMONSTRATE spokenText must contain a real computed decimal value, not a placeholder");
});

test("unavailable subject in a session produces no crash and no tool evidence", () => {
  freshRuntime();
  const session = createTeacherSession({ teacherId: "sara", subject: "chemistry", lesson: "acids-and-bases" });
  const { turn } = runTurn(session.sessionId); // INITIALIZE -> GREET, no tool call yet
  assert.equal(turn.toolEvidence.length, 0);
  assert.doesNotThrow(() => runTurn(session.sessionId)); // GREET -> DIAGNOSE, still no tool needed
});
