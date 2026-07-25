import Link from "next/link";
import { notFound } from "next/navigation";
import { CURRICULUM_TREE } from "@/src/lib/digital-library/curriculum-map";

export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }> | { region: string };
}) {
  const { region } = await Promise.resolve(params);
  const node = CURRICULUM_TREE.find((r) => r.slug === region);
  if (!node) notFound();

  return (
    <div className="dl-hub">
      <header className="dl-hub-hero">
        <p className="dl-kicker" style={{ color: "#9fd9c8" }}>
          Region
        </p>
        <h1>{node.name}</h1>
        <p>Select a country / system to continue the taxonomic path.</p>
      </header>
      <div className="dl-hub-grid">
        {(node.children || []).map((c) => (
          <Link
            key={c.slug}
            href={`/digital-library/${region}/${c.slug}`}
            className="dl-hub-card"
          >
            <strong>{c.name}</strong>
            <span>{c.slug}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
