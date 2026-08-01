import assert from "node:assert/strict";
import {
  adaptStudioSession,
  buildStudioLessonPlan,
  demoStudioPlan,
  lessonInputFromTexts,
} from "../lib/digital-human-studio/index.ts";

const plan = demoStudioPlan("sara");
assert.equal(plan.schema, "success-os.digital-human-studio.v1");
assert.equal(plan.cast.id, "sara");
assert.ok(plan.scenes.length >= 3);
assert.ok(plan.scenes.every((s) => s.behaviors.length >= 2));
assert.ok(plan.scenes.every((s) => s.board.length >= 1));

const sig = plan.scenes.map((s) => s.behaviors.map((b) => b.gesture).join(","));
assert.ok(new Set(sig).size >= 2, "expected dynamic non-identical gesture timelines");

const ali = demoStudioPlan("ali");
assert.equal(ali.cast.id, "ali");

const mathPlan = buildStudioLessonPlan({
  input: lessonInputFromTexts({
    lessonId: "phys-eq",
    title: "Ohm law equation",
    titleAr: "قانون أوم والمعادلة",
    subject: "physics",
    grade: "g10",
    texts: ["V = IR", "تمرين: احسب التيار"],
  }),
});
assert.equal(mathPlan.analysis.needsEquation, true);
assert.ok(mathPlan.analysis.visualNeeds.includes("equation"));
assert.equal(mathPlan.cast.id, "ali"); // STEM → Ali

const adapted = adaptStudioSession(plan, { type: "explain_simpler" }, 1);
assert.ok(adapted.reply.length > 10);
assert.equal(adapted.audioKey, "simpler");

console.log("digital-human-studio runtime OK");
