"use client";

import Link from "next/link";
import { DeepKnowledgeBase } from "@/src/components/digital-library/DeepKnowledgeBase";
import { FloatingScientificCalc } from "@/src/components/digital-library/FloatingScientificCalc";
import { GamifiedQuiz } from "@/src/components/digital-library/GamifiedQuiz";
import { RealTeacherBridge } from "@/src/components/digital-library/RealTeacherBridge";
import { SmartWorkspace } from "@/src/components/digital-library/SmartWorkspace";
import { SolvedExamples } from "@/src/components/digital-library/SolvedExamples";
import { ThreeDCanvasLazy as ThreeDCanvas } from "@/src/components/digital-library/ThreeDCanvasLazy";
import type { LessonModuleContent } from "@/src/lib/digital-library/types";

type Props = {
  lesson: LessonModuleContent;
  crumbs: Array<{ label: string; href?: string }>;
  storageKey: string;
  teacherSubjects?: string[];
  teacherCurricula?: string[];
};

const MODULE_LINKS = [
  { href: "#knowledge", label: "Knowledge" },
  { href: "#visualizer", label: "3D" },
  { href: "#workspace", label: "Workspace" },
  { href: "#examples", label: "Examples" },
  { href: "#quiz", label: "Quiz" },
  { href: "#real-teacher", label: "معلّم" },
];

export function LessonShell({
  lesson,
  crumbs,
  storageKey,
  teacherSubjects = ["physics", "فيزياء"],
  teacherCurricula = ["IB", "ib"],
}: Props) {
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
        <p className="dl-kicker">درس تفاعلي · يقوده معلّم حقيقي</p>
        <h1>{lesson.title}</h1>
        <p className="dl-hero-lead">{lesson.subtitle}</p>
        <p className="dl-meta">
          ~{lesson.estimatedMinutes} min · 6 وحدات تفاعلية · المعلّم من Teachers OS
        </p>
        <div className="dl-module-jump" role="navigation" aria-label="Jump to module">
          {MODULE_LINKS.map((m) => (
            <a key={m.href} href={m.href}>
              {m.label}
            </a>
          ))}
        </div>
      </header>

      <DeepKnowledgeBase markdown={lesson.knowledgeMarkdown} objectives={lesson.learningObjectives} />
      <ThreeDCanvas kind={lesson.visualizer.kind} caption={lesson.visualizer.caption} />
      <SmartWorkspace storageKey={storageKey} />
      <SolvedExamples examples={lesson.examples} />
      <GamifiedQuiz items={lesson.quiz} />
      <RealTeacherBridge
        lessonTitle={lesson.title}
        subjects={teacherSubjects}
        curricula={teacherCurricula}
      />

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

      <FloatingScientificCalc />
    </div>
  );
}
