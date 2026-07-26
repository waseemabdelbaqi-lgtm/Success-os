"use client";

import Link from "next/link";
import { DeepKnowledgeBase } from "@/src/components/digital-library/DeepKnowledgeBase";
import { FloatingScientificCalc } from "@/src/components/digital-library/FloatingScientificCalc";
import { GamifiedQuiz } from "@/src/components/digital-library/GamifiedQuiz";
import { RealTeacherBridge } from "@/src/components/digital-library/RealTeacherBridge";
import { SmartWorkspace } from "@/src/components/digital-library/SmartWorkspace";
import { SolvedExamples } from "@/src/components/digital-library/SolvedExamples";
import { AiClassStudio } from "@/src/components/digital-library/AiClassStudio";
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

const MODULE_LINKS = [
  { href: "#ai-class", label: "حصة AI" },
  { href: "#teacher-explain", label: "سكربت الشرح" },
  { href: "#visualizer", label: "3D" },
  { href: "#quiz", label: "اختبار" },
  { href: "#examples", label: "أمثلة" },
  { href: "#knowledge", label: "معرفة" },
];

export function LessonShell({
  lesson,
  crumbs,
  storageKey,
  teacherSubjects = ["physics", "فيزياء"],
  teacherCurricula = ["IB", "ib"],
}: Props) {
  const isJordan = lesson.slug.startsWith("jordan-");
  const isJordanMath = lesson.slug.includes("-math-");
  const isJordanScience = lesson.slug.includes("-science-");
  const isS4s = lesson.slug.startsWith("s4s-");
  const bridgeSubjects = isJordanMath
    ? ["رياضيات", "الرياضيات", "Math", "math", ...teacherSubjects]
    : isJordanScience
      ? ["علوم", "العلوم", "Science", "science", ...teacherSubjects]
      : isJordan
        ? ["رياضيات", "الرياضيات", "علوم", ...teacherSubjects]
        : isS4s
          ? ["Chemistry", "chemistry", "كيمياء", "الكيمياء", ...teacherSubjects]
          : teacherSubjects;
  const bridgeCurricula = isJordan
    ? [
        "Jordan",
        "national",
        "المنهاج الوطني",
        "Elementary",
        "المرحلة الابتدائية",
        "الصف الأول",
        "الصف الثاني",
        ...teacherCurricula,
      ]
    : isS4s
      ? ["EST", "AP", ...teacherCurricula]
      : teacherCurricula;
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
        <p className="dl-kicker">
          {isJordan
            ? "الأردن · المرحلة الابتدائية · حصة AI"
            : "درس تفاعلي · شرح + تفاعليات"}
        </p>
        <h1>{lesson.title}</h1>
        <p className="dl-hero-lead">{lesson.subtitle}</p>
        <p className="dl-meta">
          ~{lesson.estimatedMinutes} min · شرح معلّم كامل + وحدات تفاعلية · Teachers OS
        </p>
        <div className="dl-module-jump" role="navigation" aria-label="Jump to module">
          {(lesson.teacherExplanation || isJordan
            ? MODULE_LINKS
            : MODULE_LINKS.filter((m) => m.href !== "#teacher-explain" && m.href !== "#ai-class")
          ).map((m) => (
            <a key={m.href} href={m.href}>
              {m.label}
            </a>
          ))}
        </div>
      </header>

      {isJordan ? <AiClassStudio slug={lesson.slug} /> : null}
      {lesson.teacherExplanation ? (
        <TeacherFullExplanation explanation={lesson.teacherExplanation} />
      ) : null}
      <ThreeDCanvas kind={lesson.visualizer.kind} caption={lesson.visualizer.caption} />
      <GamifiedQuiz items={lesson.quiz} />
      <SolvedExamples examples={lesson.examples} />
      <SmartWorkspace storageKey={storageKey} />
      <DeepKnowledgeBase markdown={lesson.knowledgeMarkdown} objectives={lesson.learningObjectives} />
      <RealTeacherBridge
        lessonTitle={lesson.title}
        subjects={bridgeSubjects}
        curricula={bridgeCurricula}
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
