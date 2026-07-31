"use client";

import { useEffect, useMemo, useState , type CSSProperties } from "react";
import type { InteractiveLesson, LessonStageId } from "@/src/lib/sos-lesson-engine/schema/types";
import { REQUIRED_STAGE_ORDER } from "@/src/lib/sos-lesson-engine/schema/types";
import { ActivityRenderer } from "@/src/components/sos-lesson-engine/ActivityRenderer";
import { AITutorPanel } from "@/src/components/sos-lesson-engine/AITutorPanel";
import { CollaborativeBoardView } from "@/src/components/sos-lesson-engine/CollaborativeBoardView";
import { masteryLevel, scorePercent } from "@/src/lib/sos-lesson-engine/evaluate";

type Props = {
  lesson: InteractiveLesson;
  studentKey?: string;
  teacherLockedStage?: LessonStageId | null;
  onMasterySaved?: (payload: { percent: number; mastery: string }) => void;
};

const STAGE_LABEL: Record<LessonStageId, string> = {
  identity: "هوية الدرس",
  hook: "الترحيب والتمهيد",
  prerequisite: "فحص المتطلبات",
  objectives: "الأهداف",
  vocabulary: "المفردات",
  explanation: "الشرح",
  guided_practice: "تدريب موجّه",
  interactive_activity: "نشاط تفاعلي",
  real_life: "تطبيق حياتي",
  collaboration: "تعاون",
  independent_practice: "تدريب مستقل",
  assessment: "تقييم",
  results: "النتائج",
  reflection: "تأمل",
  next_step: "الخطوة التالية",
};

export function LessonJourneyPlayer({
  lesson,
  studentKey = "student-local",
  teacherLockedStage = null,
  onMasterySaved,
}: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [prereqCorrect, setPrereqCorrect] = useState(0);
  const [prereqReady, setPrereqReady] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [flip, setFlip] = useState<Record<string, boolean>>({});
  const [expIndex, setExpIndex] = useState(0);
  const [attemptLog, setAttemptLog] = useState<Array<{ id: string; correct: boolean; weight: number }>>([]);
  const [startedAt] = useState(() => Date.now());
  const [reflection, setReflection] = useState("");
  const [confidence, setConfidence] = useState(2);
  const [saved, setSaved] = useState(false);

  const stage = teacherLockedStage || REQUIRED_STAGE_ORDER[stageIndex]!;

  useEffect(() => {
    if (teacherLockedStage) {
      const idx = REQUIRED_STAGE_ORDER.indexOf(teacherLockedStage);
      if (idx >= 0) setStageIndex(idx);
    }
  }, [teacherLockedStage]);

  function logResult(id: string, correct: boolean, weight: number) {
    setAttemptLog((prev) => {
      const without = prev.filter((p) => p.id !== id);
      return [...without, { id, correct, weight }];
    });
  }

  const percent = useMemo(
    () => scorePercent(attemptLog.map((a) => ({ correct: a.correct, weight: a.weight }))),
    [attemptLog],
  );

  async function saveMastery() {
    const timeSpentSec = Math.round((Date.now() - startedAt) / 1000);
    const outcomeScores: Record<string, number> = {};
    lesson.identity.learningOutcomes.forEach((_, i) => {
      outcomeScores[`o${i + 1}`] = percent / 100;
    });
    await fetch("/api/sos-lesson-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_mastery",
        record: {
          studentKey,
          lessonId: lesson.id,
          outcomeScores,
          skillScores: Object.fromEntries(lesson.identity.skills.map((s) => [s, percent / 100])),
          lessonMastery: percent / 100,
          attempts: attemptLog.length,
          timeSpentSec,
          lastStageId: stage,
          updatedAt: new Date().toISOString(),
        },
      }),
    });
    setSaved(true);
    onMasterySaved?.({ percent, mastery: masteryLevel(percent) });
  }

  function next() {
    if (teacherLockedStage) return;
    if (stage === "prerequisite" && !prereqReady && !showRecovery) {
      if (prereqCorrect >= lesson.prerequisiteCheck.minCorrect) setPrereqReady(true);
      else {
        setShowRecovery(true);
        return;
      }
    }
    setStageIndex((i) => Math.min(i + 1, REQUIRED_STAGE_ORDER.length - 1));
  }

  function prev() {
    if (teacherLockedStage) return;
    setStageIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div style={wrap} dir="rtl">
      <header style={header}>
        <div>
          <p style={eyebrow}>Success OS Interactive Learning Engine · Student-paced</p>
          <h1 style={h1}>{lesson.identity.lessonTitleAr}</h1>
          <p style={sub}>
            {lesson.identity.gradeAr} · {lesson.identity.subjectAr} · {lesson.identity.unitTitleAr}
          </p>
        </div>
        <div style={progressBox}>
          المرحلة {stageIndex + 1}/{REQUIRED_STAGE_ORDER.length}
          <div style={barTrack}>
            <div style={{ ...barFill, width: `${((stageIndex + 1) / REQUIRED_STAGE_ORDER.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <nav style={stageNav}>
        {REQUIRED_STAGE_ORDER.map((s, i) => (
          <button
            key={s}
            type="button"
            style={{ ...stageChip, ...(i === stageIndex ? stageOn : {}), ...(i < stageIndex ? stageDone : {}) }}
            disabled={Boolean(teacherLockedStage)}
            onClick={() => !teacherLockedStage && setStageIndex(i)}
          >
            {i + 1}. {STAGE_LABEL[s]}
          </button>
        ))}
      </nav>

      <section style={panel}>
        <h2 style={h2}>{STAGE_LABEL[stage]}</h2>

        {stage === "identity" && (
          <div>
            <ul>
              <li>الدولة: الأردن · المنهاج الوطني</li>
              <li>
                الصف/الفصل: {lesson.identity.gradeAr} · {lesson.identity.semesterAr}
              </li>
              <li>الكتاب: {lesson.identity.bookTitleAr}</li>
              <li>نطاق الصفحات الرسمي: {lesson.identity.officialPageRange}</li>
              <li>المدة التقديرية: {lesson.identity.estimatedMinutes} دقيقة</li>
              <li>المواد: {lesson.identity.materialsAr}</li>
              <li>الحقوق: {lesson.identity.rightsStatus} · الحالة: {lesson.identity.editorialStatus}</li>
              <li>{lesson.identity.preparedBy}</li>
            </ul>
            <p style={note}>النواتج الرسمية مفصولة عن صياغة المتعلم الودية في مرحلة الأهداف.</p>
            <ol>
              {lesson.identity.learningOutcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ol>
          </div>
        )}

        {stage === "hook" && (
          <div>
            <p style={lead}>{lesson.hook.openingAr}</p>
            <p>{lesson.hook.situationAr}</p>
            <pre style={visual}>{lesson.hook.visualAr}</pre>
            <p>
              <strong>سؤال:</strong> {lesson.hook.questionAr}
            </p>
            <p>
              <strong>توقّع:</strong> {lesson.hook.predictionPromptAr}
            </p>
            <p style={note}>{lesson.hook.priorConnectionAr}</p>
          </div>
        )}

        {stage === "prerequisite" && (
          <div>
            {!showRecovery ? (
              lesson.prerequisiteCheck.questions.map((q) => (
                <ActivityRenderer
                  key={q.id}
                  question={q}
                  onResult={(r) => {
                    if (r.correct) setPrereqCorrect((c) => c + 1);
                    logResult(q.id, r.correct, q.masteryWeight);
                  }}
                />
              ))
            ) : (
              <div>
                <p style={warn}>{lesson.prerequisiteCheck.recoveryExplanationAr}</p>
                <ActivityRenderer
                  question={lesson.prerequisiteCheck.recoveryActivity}
                  onResult={(r) => {
                    logResult(lesson.prerequisiteCheck.recoveryActivity.id, r.correct, 1);
                    if (r.correct) {
                      setPrereqReady(true);
                      setShowRecovery(false);
                    }
                  }}
                />
              </div>
            )}
            {prereqReady && <p style={ok}>جاهز للمتابعة ✓</p>}
          </div>
        )}

        {stage === "objectives" && (
          <ul>
            {lesson.objectivesLearnerAr.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        )}

        {stage === "vocabulary" && (
          <div style={vocabGrid}>
            {lesson.vocabulary.map((v) => (
              <button
                key={v.term}
                type="button"
                style={flipCard}
                onClick={() => setFlip({ ...flip, [v.term]: !flip[v.term] })}
              >
                {!flip[v.term] ? (
                  <strong>{v.term}</strong>
                ) : (
                  <span>
                    {v.definition}
                    <br />
                    مثال: {v.example} · ليس: {v.nonExample}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {stage === "explanation" && (
          <div>
            {lesson.explanationSections.map((sec, i) =>
              i === expIndex ? (
                <div key={sec.id}>
                  <h3>{sec.titleAr}</h3>
                  <p>{sec.bodyAr}</p>
                  <pre style={visual}>{sec.visualAr}</pre>
                  <p>
                    <strong>مثال محلول:</strong> {sec.workedExampleAr}
                  </p>
                  {sec.altExplanationAr && (
                    <p style={note}>شرح بديل: {sec.altExplanationAr}</p>
                  )}
                  <ActivityRenderer
                    question={sec.check}
                    onResult={(r) => logResult(sec.check.id, r.correct, sec.check.masteryWeight)}
                  />
                </div>
              ) : null,
            )}
            <div style={row}>
              <button type="button" style={btnGhost} disabled={expIndex === 0} onClick={() => setExpIndex((x) => x - 1)}>
                قسم سابق
              </button>
              <button
                type="button"
                style={btnGhost}
                disabled={expIndex >= lesson.explanationSections.length - 1}
                onClick={() => setExpIndex((x) => x + 1)}
              >
                القسم التالي
              </button>
            </div>
          </div>
        )}

        {stage === "guided_practice" &&
          lesson.guidedPractice.map((q) => (
            <ActivityRenderer
              key={q.id}
              question={q}
              onResult={(r) => logResult(q.id, r.correct, q.masteryWeight)}
            />
          ))}

        {stage === "interactive_activity" && (
          <div>
            <h3>{lesson.interactiveActivity.titleAr}</h3>
            <p>{lesson.interactiveActivity.instructionsAr}</p>
            {lesson.interactiveActivity.questions.map((q) => (
              <ActivityRenderer
                key={q.id}
                question={q}
                onResult={(r) => logResult(q.id, r.correct, q.masteryWeight)}
              />
            ))}
          </div>
        )}

        {stage === "real_life" && (
          <ul>
            <li>الأردن: {lesson.realLife.jordanContextAr}</li>
            <li>البيت: {lesson.realLife.homeAr}</li>
            <li>المدرسة: {lesson.realLife.schoolAr}</li>
            <li>المجتمع: {lesson.realLife.communityAr}</li>
          </ul>
        )}

        {stage === "collaboration" && (
          <CollaborativeBoardView
            lessonId={lesson.id}
            promptAr={lesson.collaboration.promptAr}
            boardType={lesson.collaboration.boardType}
            moderationRequired={lesson.collaboration.moderationRequired}
            anonymousAllowed={lesson.collaboration.anonymousAllowed}
            studentKey={studentKey}
          />
        )}

        {stage === "independent_practice" &&
          lesson.independentPractice.map((q) => (
            <ActivityRenderer
              key={q.id}
              question={q}
              onResult={(r) => logResult(q.id, r.correct, q.masteryWeight)}
            />
          ))}

        {stage === "assessment" && (
          <div>
            <h3>{lesson.assessment.titleAr}</h3>
            <p>درجة النجاح: {lesson.assessment.passScorePercent}%</p>
            {lesson.assessment.questions.map((q) => (
              <ActivityRenderer
                key={q.id}
                question={q}
                onResult={(r) => logResult(q.id, r.correct, q.masteryWeight)}
              />
            ))}
          </div>
        )}

        {stage === "results" && (
          <div>
            <p style={lead}>
              الدرجة التقديرية: {percent}% · مستوى الإتقان: {masteryLevel(percent)}
            </p>
            <p>المحاولات المسجّلة: {attemptLog.length}</p>
            <p>
              الصحيحة: {attemptLog.filter((a) => a.correct).length} · تحتاج مراجعة:{" "}
              {attemptLog.filter((a) => !a.correct).length}
            </p>
            <button type="button" style={btn} onClick={saveMastery} disabled={saved}>
              {saved ? "تم حفظ التقدّم" : "حفظ التقدّم والإتقان"}
            </button>
          </div>
        )}

        {stage === "reflection" && (
          <div>
            {lesson.reflectionPromptsAr.map((p) => (
              <p key={p}>• {p}</p>
            ))}
            <textarea
              style={textarea}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="اكتب تأمّلك هنا"
            />
            <label>
              الثقة (1–3):{" "}
              <input
                type="range"
                min={1}
                max={3}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
              />{" "}
              {confidence}
            </label>
          </div>
        )}

        {stage === "next_step" && (
          <div>
            <ul>
              <li>أعد قسماً من الشرح عند الحاجة</li>
              <li>
                {lesson.nextStep.revisionGameEnabled ? (
                  <a href={`/jordan-books/lesson-engine/${lesson.id}/review-game`}>افتح لعبة المراجعة</a>
                ) : (
                  "لعبة المراجعة غير مفعّلة"
                )}
              </li>
              {lesson.nextStep.nextLessonId && (
                <li>
                  الدرس التالي: {lesson.nextStep.nextLessonTitleAr} ({lesson.nextStep.nextLessonId})
                </li>
              )}
              <li>
                <a href={`/jordan-books/book/${lesson.identity.bookId}`}>العودة لوضع صفحات الكتاب</a>
              </li>
              <li>
                <a href={`/teacher/live-lesson?lessonId=${encodeURIComponent(lesson.id)}`}>
                  وضع المعلم المباشر
                </a>
              </li>
            </ul>
          </div>
        )}
      </section>

      {!teacherLockedStage && (
        <div style={navRow}>
          <button type="button" style={btnGhost} onClick={prev} disabled={stageIndex === 0}>
            السابق
          </button>
          <button
            type="button"
            style={btn}
            onClick={next}
            disabled={stageIndex >= REQUIRED_STAGE_ORDER.length - 1}
          >
            التالي
          </button>
        </div>
      )}

      {lesson.nextStep.aiTutorEnabled && (
        <AITutorPanel lesson={lesson} studentKey={studentKey} stageId={stage} />
      )}
    </div>
  );
}

const wrap: CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "1rem",
  fontFamily: '"IBM Plex Sans Arabic",Tahoma,sans-serif',
  color: "#2a0c10",
  background: "linear-gradient(165deg,#fff8f1,#f3e6db)",
  minHeight: "100vh",
};
const header: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" };
const eyebrow: CSSProperties = { color: "#9e1722", fontWeight: 900, margin: 0 };
const h1: CSSProperties = { color: "#4b0a11", margin: "0.2rem 0" };
const h2: CSSProperties = { color: "#9e1722", marginTop: 0 };
const sub: CSSProperties = { color: "#6b3a40" };
const progressBox: CSSProperties = { minWidth: 160, fontWeight: 800 };
const barTrack: CSSProperties = { height: 8, background: "rgba(158,23,34,.15)", borderRadius: 8, marginTop: 6 };
const barFill: CSSProperties = { height: 8, background: "#9e1722", borderRadius: 8 };
const stageNav: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6, margin: "0.8rem 0" };
const stageChip: CSSProperties = {
  border: "1px solid rgba(158,23,34,.2)",
  background: "#fffdf8",
  borderRadius: 999,
  padding: "0.25rem 0.55rem",
  fontSize: 12,
  cursor: "pointer",
};
const stageOn: CSSProperties = { background: "#9e1722", color: "#fff" };
const stageDone: CSSProperties = { background: "rgba(242,215,124,.55)" };
const panel: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.16)",
  borderRadius: 16,
  padding: "1rem",
};
const lead: CSSProperties = { fontSize: 18, fontWeight: 800 };
const visual: CSSProperties = {
  background: "rgba(158,23,34,.06)",
  padding: "0.8rem",
  borderRadius: 12,
  fontSize: 22,
  textAlign: "center",
};
const note: CSSProperties = { color: "#6b3a40", fontSize: 14 };
const warn: CSSProperties = {
  background: "rgba(242,215,124,.4)",
  padding: "0.7rem",
  borderRadius: 10,
  fontWeight: 700,
};
const ok: CSSProperties = { color: "#146c2e", fontWeight: 900 };
const vocabGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 };
const flipCard: CSSProperties = {
  minHeight: 110,
  border: "1px solid rgba(158,23,34,.2)",
  borderRadius: 12,
  background: "#fff",
  padding: "0.7rem",
  cursor: "pointer",
  textAlign: "right",
};
const row: CSSProperties = { display: "flex", gap: 8 };
const navRow: CSSProperties = { display: "flex", justifyContent: "space-between", marginTop: 12 };
const btn: CSSProperties = {
  background: "#9e1722",
  color: "#fff",
  border: 0,
  borderRadius: 10,
  padding: "0.6rem 1rem",
  fontWeight: 900,
  cursor: "pointer",
};
const btnGhost: CSSProperties = {
  ...btn,
  background: "#fff",
  color: "#9e1722",
  border: "1px solid rgba(158,23,34,.3)",
};
const textarea: CSSProperties = {
  width: "100%",
  minHeight: 90,
  borderRadius: 10,
  border: "1px solid rgba(158,23,34,.25)",
  padding: 10,
  marginBottom: 8,
};
