/**
 * Runtime assertions for Human Teacher Engine.
 * Sara.ts / Ali.ts must be the sole identity source.
 */
import {
  teachHumanLesson,
  resolveStudioTheme,
  rebuildLipPerformance,
} from "../lib/human-teacher-engine";
import {
  getTeacherAppearance,
  getTeacherDisplayName,
  getTeacherPersonalityLock,
  listTeacherConfigs,
  requireTeacherConfig,
  resolveTeacherVoice,
} from "../src/ai-teacher/config";
import { getCharacter } from "../lib/human-engine/character-generator";
import { castTeacher } from "../lib/digital-human-studio/cast-teacher";

const teachers = listTeacherConfigs();
if (teachers.length !== 2) throw new Error("exactly Sara + Ali");
for (const id of ["sara", "ali"] as const) {
  const cfg = requireTeacherConfig(id);
  if (!cfg.personalityLock?.traits?.length) throw new Error(`${id}: personalityLock`);
  if (!cfg.appearance?.assetRoot) throw new Error(`${id}: appearance`);
  if (!cfg.localeVoices?.["ar-JO"]) throw new Error(`${id}: localeVoices`);
  if (!cfg.performance?.indistinguishabilityGoal) throw new Error(`${id}: performance`);
  if (cfg.performance.targetContinuousMs < 3_600_000) {
    throw new Error(`${id}: must support ≥1h continuous teaching`);
  }
  const names = getTeacherDisplayName(id);
  if (!names.ar || !names.en) throw new Error(`${id}: displayName`);
  const char = getCharacter(id);
  if (char.displayName.ar !== names.ar) {
    throw new Error(`${id}: character displayName must come from config`);
  }
  if (char.appearance.photorealAssetRoot !== getTeacherAppearance(id).assetRoot) {
    throw new Error(`${id}: character appearance must come from config`);
  }
  const cast = castTeacher({
    lessonId: "x",
    title: "t",
    preferredTeacherId: id,
  });
  if (cast.voiceId !== resolveTeacherVoice(id).voiceId) {
    throw new Error(`${id}: cast voice must come from config`);
  }
  if (cast.displayNameAr !== names.ar) {
    throw new Error(`${id}: cast name must come from config`);
  }
}

const saraLock = getTeacherPersonalityLock("sara");
const aliLock = getTeacherPersonalityLock("ali");
if (saraLock.tone !== "warm") throw new Error("Sara must stay warm");
if (aliLock.tone !== "direct") throw new Error("Ali must stay direct");

const physicsStudio = resolveStudioTheme({ subject: "physics", grade: "g7", title: "Force" });
if (physicsStudio.id !== "physics_lab") throw new Error(`studio physics got ${physicsStudio.id}`);

const chemStudio = resolveStudioTheme({ subject: "chemistry", title: "ماء" });
if (chemStudio.id !== "chemistry_lab") throw new Error("chemistry studio");

const taught = teachHumanLesson({
  teacherId: "ali",
  targetDurationMs: 65_000,
  input: {
    lessonId: "hte-runtime",
    title: "Force Law",
    titleAr: "قانون القوة",
    subject: "physics",
    grade: "g7",
    blocks: [
      { id: "e1", kind: "explain", text: "القوة تساوي الكتلة في التسارع" },
      {
        id: "b1",
        kind: "explain",
        text: "اكتبوا معي على السبورة القانون F = m × a",
      },
      {
        id: "m1",
        kind: "example",
        text: "هذا نموذج ثلاثي الأبعاد للجسم، أمسكه وأديره وأكبّره",
      },
      {
        id: "c1",
        kind: "check",
        text: "إذا زادت الكتلة وثبتت القوة، ماذا يحدث للتسارع؟",
      },
    ],
  },
});

if (taught.brief.teacherId !== "ali") throw new Error("teach teacherId");
if (taught.brief.studio.id !== "physics_lab") {
  throw new Error(`teach studio ${taught.brief.studio.id}`);
}
if (taught.plan.character.displayName.ar !== "علي") {
  throw new Error("taught character name");
}
if (taught.plan.timeline.lipSync.length < 20) {
  throw new Error(`lip sync too sparse: ${taught.plan.timeline.lipSync.length}`);
}
if (!taught.qualityGates.personalityLocked) throw new Error("personality gate");
if (!taught.qualityGates.lipSyncAligned) throw new Error("lip gate");

const denser = rebuildLipPerformance(taught.plan);
if (denser.timeline.lipSync.length < taught.plan.timeline.lipSync.length) {
  throw new Error("rebuildLipPerformance must not shrink track");
}

// Endurance expansion for longer target
const long = teachHumanLesson({
  teacherId: "sara",
  targetDurationMs: 12 * 60_000,
  input: {
    lessonId: "hte-endurance",
    title: "Fractions",
    titleAr: "الكسور",
    subject: "math",
    grade: "g2",
    blocks: [{ id: "e", kind: "explain", text: "النصف جزء من الكل" }],
  },
});
if (long.brief.segments < 1) throw new Error("segments");
if (long.plan.sentences.length < 4) {
  throw new Error("endurance must expand teaching acts");
}

console.log(
  `human-teacher-engine runtime OK · sara=${saraLock.traits[0]} ali=${aliLock.traits[0]} · lip=${taught.plan.timeline.lipSync.length} · studio=${taught.brief.studio.id}`,
);
