import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { findNodePath, lessonHref } from "@/src/lib/digital-library/curriculum-map";
import { getLessonBySlug } from "@/src/lib/digital-library/lesson-registry";

type Params = { region: string; browse: string[] };

/**
 * Intermediate taxonomic browser for incomplete paths.
 * Full 7-segment lesson URLs are handled by the dedicated lesson page.
 */
export default async function BrowseTaxonomyPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const { region, browse } = await Promise.resolve(params);
  const slugs = [region, ...(browse || [])];

  // Full lesson path → dedicated page (should be preferred by Next, but redirect safely)
  if (slugs.length === 7) {
    redirect(lessonHref(slugs));
  }

  const path = findNodePath(slugs);
  if (!path) notFound();
  const node = path[path.length - 1];
  if (!node) notFound();

  if (node.lessonSlug) {
    const lesson = getLessonBySlug(node.lessonSlug);
    if (lesson) redirect(lessonHref(slugs));
  }

  return (
    <div className="dl-hub">
      <header className="dl-hub-hero">
        <p className="dl-kicker" style={{ color: "#9fd9c8" }}>
          {path.map((p) => p.name).join(" / ")}
        </p>
        <h1>{node.name}</h1>
        <p>Continue drilling into the curriculum tree.</p>
      </header>
      <div className="dl-hub-grid">
        {(node.children || []).map((c) => (
          <Link
            key={c.slug}
            href={lessonHref([...slugs, c.slug])}
            className="dl-hub-card"
          >
            <strong>{c.name}</strong>
            <span>{c.lessonSlug ? "Lesson" : "Branch"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
