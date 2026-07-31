import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { InteractiveLessonViewer } from "@/components/interactive-lesson-engine/interactive-lesson-viewer";
import {
  getLocalized,
  resolveLessonPackage,
} from "@/lib/interactive-lesson-engine";

type PageProps = {
  params: Promise<{ packageId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { packageId } = await params;
  const pkg = resolveLessonPackage({ packageId });
  return { title: pkg ? getLocalized(pkg.title, "en") : "Interactive Lesson" };
}

export default async function InteractiveLessonPackagePage({
  params,
  searchParams,
}: PageProps): Promise<ReactNode> {
  const { packageId } = await params;
  const sp = await searchParams;
  const locale = sp.lang === "en" ? "en" : "ar";
  const pkg = resolveLessonPackage({ packageId });
  if (!pkg) notFound();
  return <InteractiveLessonViewer pkg={pkg} locale={locale} />;
}
