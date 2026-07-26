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
import type { LessonModuleContent } from "@/src/lib/digital-library/types";

type Props = {
  lesson: LessonModuleContent;
  crumbs: Array<{ label: string; href?: string }>;
  storageKey: string;
  teacherSubjects?: string[];
  teacherCurricula?: string[];
};

export function LessonShell({
  lesson,
  crumbs,
  storageKey,
}: Props) {
  const isJordan = lesson.slug.startsWith("jordan-");
  const teacherName = lesson.slug.includes("science")
    ? "أ. رنيم صالح"
    : "أ. لاما النوري";

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
            {teacherName} · مشاهدة الحصة ثم التفاعليات
          </p>
          <div className="dl-module-jump" role="navigation" aria-label="Jump">
            <a href="#ai-class">الحصة</a>
            <a href="#ai-acts">تفاعليات</a>
            <a href="#visualizer">3D</a>
            <a href="#quiz">اختبار</a>
          </div>
        </header>

        <AiTeacherTheater
          slug={lesson.slug}
          title={lesson.title}
          teacherName={teacherName}
        />
        <ThreeDCanvas kind={lesson.visualizer.kind} caption={lesson.visualizer.caption} />
        <GamifiedQuiz items={lesson.quiz} />
        <SolvedExamples examples={lesson.examples} />
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
