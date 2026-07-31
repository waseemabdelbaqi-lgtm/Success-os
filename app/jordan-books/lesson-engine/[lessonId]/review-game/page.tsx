import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInteractiveLesson } from "@/src/lib/sos-lesson-engine/registry";
import { ReviewGamePlayer } from "@/src/components/sos-lesson-engine/ReviewGamePlayer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lessonId: string }> };

export const metadata: Metadata = { title: "لعبة مراجعة | Success OS" };

export default async function ReviewGamePage({ params }: Props) {
  const { lessonId } = await params;
  const lesson = getInteractiveLesson(decodeURIComponent(lessonId));
  if (!lesson) notFound();
  return <ReviewGamePlayer lesson={lesson} />;
}
