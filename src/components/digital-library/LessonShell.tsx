"use client";

import Link from "next/link";
import { DeepKnowledgeBase } from "@/src/components/digital-library/DeepKnowledgeBase";
import { FloatingScientificCalc } from "@/src/components/digital-library/FloatingScientificCalc";
import { GamifiedQuiz } from "@/src/components/digital-library/GamifiedQuiz";
import { SmartWorkspace } from "@/src/components/digital-library/SmartWorkspace";
import { SolvedExamples } from "@/src/components/digital-library/SolvedExamples";
import { AiTeacherTheater } from "@/src/components/digital-library/AiTeacherTheater";
import { TeacherFullExplanation } from "@/src/components/digital-library/TeacherFullExplanation";
import { ThreeDCanvasLazy as ThreeDCanvas } from "@/src/components/digital-library/ThreeDCanvasLazy";
import { InteractiveLessonPlayer } from "@/src/components/interactive-lesson/InteractiveLessonPlayer";
import { withAiAssistantTitle } from "@/src/lib/digital-library/ai-assistant-teacher";
import { JORDAN_G1_MATH_INTERACTIVE } from "@/src/lib/interactive-lesson/lessons/jordan-g1-math-number-line";
import type { LessonModuleContent } from "@/src/lib/digital-library/types";

type Props = {
  lesson: LessonModuleContent;
  crumbs: Array<{ label: string; href?: string }>;
  storageKey: string;
  teacherSubjects?: string[];
  teacherCurricula?: string[];
};

export function LessonShell({ lesson, crumbs, storageKey }: Props) {
  const isJordan = lesson.slug.startsWith("jordan-");
  const teacherName = withAiAssistantTitle(
    lesson.slug.includes("science") ? "أ. رنيم صالح" : "أ. لاما النوري",
  );
  const useInteractive = Boolean(lesson.interactivePlayer);

  if (isJordan) {
    return (
      <div className="dl-lesson dl-lesson-theater" dir="rtl">
        <header className="dl-lesson-hero" style={{ paddingBottom: "0.75rem" }}>
          <nav className="dl-crumbs" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
                {i < crumbs.length - 1 ? <i>/</i> : null}
              </span>
            ))}
          </nav>
          <h1 style={{ marginBottom: "0.35rem" }}>{lesson.title}</h1>
          <p className="dl-meta" style={{ marginTop: 0 }}>
            {teacherName} ·{" "}
            {useInteractive
              ? "حصة تفاعلية · شرح متحرك · أسئلة أثناء الدرس"
              : "درس مصوّر بصوت أردني · ثم التفاعليات"}
          </p>
          <div className="dl-module-jump" role="navigation" aria-label="Jump">
            <a href="#ai-class">الحصة</a>
            {!useInteractive ? <a href="#ai-acts">تفاعليات</a> : null}
            <a href="#visualizer">3D</a>
            {!useInteractive ? <a href="#quiz">اختبار</a> : null}
          </div>
        </header>

        {useInteractive ? (
          <InteractiveLessonPlayer lesson={JORDAN_G1_MATH_INTERACTIVE} storageKey={storageKey} />
        ) : (
          <AiTeacherTheater slug={lesson.slug} title={lesson.title} teacherName={teacherName} />
        )}
        <ThreeDCanvas kind={lesson.visualizer.kind} caption={lesson.visualizer.caption} />
        {!useInteractive ? <GamifiedQuiz items={lesson.quiz} /> : null}
        {!useInteractive ? <SolvedExamples examples={lesson.examples} /> : null}
        <SmartWorkspace storageKey={storageKey} />
        <FloatingScientificCalc />
      </div>
    );
  }

  return (
    <div className="dl-lesson">
      <header className="dl-lesson-hero">
        <nav className="dl-crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`}>
              {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
              {i < crumbs.length - 1 ? <i>/</i> : null}
            </span>
          ))}
        </nav>
        <p className="dl-kicker">درس تفاعلي</p>
        <h1>{lesson.title}</h1>
        <p className="dl-hero-lead">{lesson.subtitle}</p>
      </header>

      {lesson.teacherExplanation ? (
        <TeacherFullExplanation explanation={lesson.teacherExplanation} />
      ) : null}
      <DeepKnowledgeBase markdown={lesson.knowledgeMarkdown} objectives={lesson.learningObjectives} />
      <ThreeDCanvas kind={lesson.visualizer.kind} caption={lesson.visualizer.caption} />
      <SmartWorkspace storageKey={storageKey} />
      <SolvedExamples examples={lesson.examples} />
      <GamifiedQuiz items={lesson.quiz} />
      <FloatingScientificCalc />

      <footer className="dl-sources">
        <h2>Sources & attribution</h2>
        <ul>
          {lesson.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
