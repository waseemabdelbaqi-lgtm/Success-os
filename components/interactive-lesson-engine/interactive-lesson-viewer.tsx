"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  InteractiveLessonPackage,
  LearningMode,
  LessonSectionId,
} from "@/types/interactive-lesson-engine";
import { LESSON_SECTION_ORDER, LESSON_SECTION_LABELS } from "@/types/interactive-lesson-engine";
import {
  buildOutlines,
  getLocalized,
  modeConfig,
} from "@/lib/interactive-lesson-engine";
import {
  getWorkspace,
  markSectionComplete,
  saveWorkspace,
} from "@/lib/interactive-lesson-engine/workspace-store";
import { BlockRenderer } from "./block-renderer";
import { SlideEngine } from "./slide-engine";
import { LessonNavigation } from "./lesson-navigation";
import { StudentWorkspacePanel } from "./student-workspace-panel";

type Locale = "en" | "ar";

type InteractiveLessonViewerProps = {
  pkg: InteractiveLessonPackage;
  locale?: Locale;
};

export function InteractiveLessonViewer({
  pkg,
  locale = "ar",
}: InteractiveLessonViewerProps): ReactNode {
  const sections = useMemo(
    () => LESSON_SECTION_ORDER.filter((id) => (pkg.sections[id] || []).length > 0 || id === "interactive_slides"),
    [pkg],
  );
  const [sectionId, setSectionId] = useState<LessonSectionId>(sections[0] || "overview");
  const [mode, setMode] = useState<LearningMode>("student");
  const [searchQuery, setSearchQuery] = useState("");
  const [workspace, setWorkspace] = useState(() => getWorkspace(pkg.id));
  const [aiReply, setAiReply] = useState<string | null>(null);
  const outlines = useMemo(() => buildOutlines(pkg), [pkg]);
  const modeUi = modeConfig(mode);

  useEffect(() => {
    setWorkspace(getWorkspace(pkg.id));
    setSectionId(sections[0] || "overview");
    setAiReply(null);
  }, [pkg.id, sections]);

  const sectionIndex = sections.indexOf(sectionId);

  const filteredBlocks = useMemo(() => {
    const blocks =
      sectionId === "interactive_slides"
        ? []
        : pkg.sections[sectionId] || [];
    if (!searchQuery.trim()) return blocks;
    const q = searchQuery.trim().toLowerCase();
    return blocks.filter((b) => {
      const hay = `${getLocalized(b.title, locale)} ${getLocalized(b.text, locale)} ${b.formula || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pkg, sectionId, searchQuery, locale]);

  const completeCurrent = useCallback(() => {
    const next = markSectionComplete(pkg.id, sectionId, sections.length);
    setWorkspace(next);
  }, [pkg.id, sectionId, sections.length]);

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-ile-viewer="true"
      data-mode={mode}
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        paddingBottom: "2rem",
        background: modeUi.presentationChrome ? "#042f2e" : "transparent",
        minHeight: "100vh",
      }}
    >
      <LessonNavigation
        pkg={pkg}
        locale={locale}
        mode={mode}
        onModeChange={setMode}
        sectionId={sectionId}
        onSectionChange={(id) => {
          setSectionId(id);
          saveWorkspace(pkg.id, { continueAt: { sectionId: id } });
        }}
        sections={sections}
        outlines={outlines}
        progressPercent={workspace.progressPercent}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onPrev={() => {
          if (sectionIndex > 0) {
            const prev = sections[sectionIndex - 1];
            if (prev) setSectionId(prev);
          }
        }}
        onNext={() => {
          completeCurrent();
          if (sectionIndex < sections.length - 1) {
            const next = sections[sectionIndex + 1];
            if (next) setSectionId(next);
          }
        }}
        canPrev={sectionIndex > 0}
        canNext={sectionIndex < sections.length - 1}
      />

      <div style={{ padding: "1rem" }}>
        <header style={{ marginBottom: "1rem", color: modeUi.presentationChrome ? "#ecfdf5" : undefined }}>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
            {pkg.schema} · v{pkg.version} · {pkg.source.kind}
            {pkg.source.bookId ? (
              <>
                {" · "}
                <Link href={`/student/books/${pkg.source.bookId}`} style={{ color: "#5eead4" }}>
                  book
                </Link>
              </>
            ) : null}
          </p>
          <h1 style={{ margin: "0.35rem 0", fontSize: "1.55rem" }}>
            {getLocalized(pkg.title, locale)}
          </h1>
          <p style={{ margin: 0, lineHeight: 1.55, opacity: 0.9 }}>
            {getLocalized(pkg.summary, locale)}
          </p>
        </header>

        <div
          className="ile-main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: modeUi.presentationChrome
              ? "1fr"
              : "minmax(0, 1fr) minmax(220px, 280px)",
            gap: 14,
            alignItems: "start",
          }}
        >
          <style>{`
            @media (max-width: 900px) {
              .ile-main-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>

          <main
            style={{
              border: modeUi.presentationChrome ? "none" : "1px solid #e2e8f0",
              borderRadius: 12,
              background: modeUi.presentationChrome ? "transparent" : "#fff",
              padding: modeUi.presentationChrome ? 0 : "1rem",
              minHeight: 360,
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 18, color: modeUi.presentationChrome ? "#ecfdf5" : undefined }}>
              {getLocalized(LESSON_SECTION_LABELS[sectionId], locale)}
            </h2>

            {sectionId === "interactive_slides" ? (
              <SlideEngine
                slides={pkg.slides}
                locale={locale}
                presentation={modeUi.presentationChrome}
                virtualize={pkg.performance.virtualizeSlides}
              />
            ) : (
              <div>
                {filteredBlocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    locale={locale}
                    lazy={pkg.performance.lazyLoad}
                  />
                ))}
                {!filteredBlocks.length ? (
                  <p style={{ color: "#94a3b8" }}>
                    {locale === "ar" ? "لا محتوى مطابق" : "No matching content"}
                  </p>
                ) : null}
              </div>
            )}

            {sectionId === "next_lesson" && pkg.nextLesson?.href ? (
              <Link
                href={pkg.nextLesson.href}
                style={{
                  display: "inline-block",
                  marginTop: 12,
                  color: "#0f766e",
                  fontWeight: 700,
                }}
              >
                {getLocalized(pkg.nextLesson.title, locale)} →
              </Link>
            ) : null}

            <button
              type="button"
              onClick={completeCurrent}
              style={{
                marginTop: 14,
                border: "1px solid #0f766e",
                background: "#0f766e",
                color: "#fff",
                borderRadius: 8,
                padding: "0.45rem 0.8rem",
                cursor: "pointer",
              }}
            >
              {locale === "ar" ? "إكمال هذا القسم" : "Complete this section"}
            </button>
          </main>

          {!modeUi.presentationChrome ? (
            <StudentWorkspacePanel
              locale={locale}
              workspace={workspace}
              sectionId={sectionId}
              aiReply={aiReply}
              onNotesChange={(notes) => setWorkspace(saveWorkspace(pkg.id, { notes }))}
              onAddHighlight={(text, color) =>
                setWorkspace(
                  saveWorkspace(pkg.id, {
                    highlights: [
                      ...workspace.highlights,
                      {
                        id: `hl_${Date.now()}`,
                        text,
                        color,
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  }),
                )
              }
              onAddBookmark={(label, sid) =>
                setWorkspace(
                  saveWorkspace(pkg.id, {
                    bookmarks: [
                      ...workspace.bookmarks,
                      { id: `bm_${Date.now()}`, label, sectionId: sid },
                    ],
                  }),
                )
              }
              onSaveDrawing={(dataUrl) =>
                setWorkspace(saveWorkspace(pkg.id, { drawingDataUrl: dataUrl }))
              }
              onAiAsk={(prompt) => {
                setAiReply(
                  locale === "ar"
                    ? `ضمن «${getLocalized(pkg.title, "ar")}» / ${getLocalized(LESSON_SECTION_LABELS[sectionId], "ar")}: ${prompt} — ركّز على أهداف هذا الدرس (توليد الفيديو غير مفعّل في هذه المرحلة).`
                    : `On “${getLocalized(pkg.title, "en")}” / ${getLocalized(LESSON_SECTION_LABELS[sectionId], "en")}: ${prompt} — stay on this lesson’s objectives (video generation disabled in this phase).`,
                );
              }}
            />
          ) : null}
        </div>

        {mode === "teacher" ? (
          <section
            style={{
              marginTop: 14,
              border: "1px solid #fde68a",
              background: "#fffbeb",
              borderRadius: 10,
              padding: "0.75rem",
              fontSize: 13,
            }}
          >
            <strong>{locale === "ar" ? "وضع المعلم" : "Teacher mode"}</strong>
            <p style={{ margin: "0.35rem 0 0" }}>
              {locale === "ar"
                ? "معاينة هيكل الأقسام والشرائح. لا استيراد مناهج ولا توليد فيديو في هذه المرحلة."
                : "Preview section/slide structure. No curriculum import or AI video in this phase."}
            </p>
          </section>
        ) : null}

        {mode === "ai_tutor" ? (
          <section
            style={{
              marginTop: 14,
              border: "1px solid #99f6e4",
              background: "#f0fdfa",
              borderRadius: 10,
              padding: "0.75rem",
              fontSize: 13,
            }}
          >
            <strong>{locale === "ar" ? "وضع المعلّم الذكي" : "AI Tutor mode"}</strong>
            <p style={{ margin: "0.35rem 0 0" }}>
              {locale === "ar"
                ? "استخدم زر اسأل الذكاء الاصطناعي في مساحة العمل. التوليد الكامل لاحقًا."
                : "Use AI Ask in the workspace. Full generation comes later."}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
