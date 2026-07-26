import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonShell } from "@/src/components/digital-library/LessonShell";
import { findNodePath, lessonHref } from "@/src/lib/digital-library/curriculum-map";
import { getLessonBySlug } from "@/src/lib/digital-library/lesson-registry";

type Params = {
  region: string;
  country: string;
  curriculumType: string;
  educationLevel: string;
  subject: string;
  chapter: string;
  lesson: string;
};

async function resolveParams(params: Promise<Params> | Params) {
  return Promise.resolve(params);
}

function decodeSlug(value: string) {
  let out = String(value || "");
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(out);
      if (next === out) break;
      out = next;
    } catch {
      break;
    }
  }
  return out;
}

function lessonSlugs(p: Params) {
  return [
    decodeSlug(p.region),
    decodeSlug(p.country),
    decodeSlug(p.curriculumType),
    decodeSlug(p.educationLevel),
    decodeSlug(p.subject),
    decodeSlug(p.chapter),
    decodeSlug(p.lesson),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params> | Params;
}): Promise<Metadata> {
  const p = await resolveParams(params);
  const path = findNodePath(lessonSlugs(p));
  const leaf = path?.[path.length - 1];
  const lesson = getLessonBySlug(leaf?.lessonSlug);
  return {
    title: lesson?.title || leaf?.name || "Lesson",
    description: lesson?.subtitle,
  };
}

/**
 * Taxonomic lesson route:
 * /digital-library/[region]/[country]/[curriculumType]/[educationLevel]/[subject]/[chapter]/[lesson]
 *
 * Prefixed with `digital-library` so dynamic segments do not collide with SUCCESS OS routes.
 */
export default async function GlobalLessonPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const p = await resolveParams(params);
  const slugs = lessonSlugs(p);
  const path = findNodePath(slugs);
  if (!path || path.length !== 7) notFound();

  const leaf = path[6];
  const lesson = getLessonBySlug(leaf?.lessonSlug);
  if (!lesson || !leaf) notFound();

  const crumbs = path.map((node, idx) => ({
    label: node.name,
    href: idx < path.length - 1 ? lessonHref(slugs.slice(0, idx + 1)) : undefined,
  }));

  return (
    <LessonShell
      lesson={lesson}
      crumbs={[{ label: "Library", href: "/digital-library" }, ...crumbs]}
      storageKey={`dl-workspace:${slugs.join("/")}`}
      teacherSubjects={[
        slugs[4],
        "Chemistry",
        "chemistry",
        "كيمياء",
        "physics",
        "فيزياء",
        "رياضيات",
        "math",
      ].filter(Boolean)}
      teacherCurricula={[
        slugs[2],
        "EST",
        "AP",
        "Success 4 Sure",
        "IB",
        "ib",
        "توجيهي",
        "Jordan",
        "national",
        "الصف الأول",
      ].filter(Boolean)}
    />
  );
}
