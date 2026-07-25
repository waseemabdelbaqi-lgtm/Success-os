import Link from "next/link";
import {
  collectLessonLinks,
  listRegions,
  lessonHref,
} from "@/src/lib/digital-library/curriculum-map";

export default function DigitalLibraryHubPage() {
  const regions = listRegions();
  const featured = collectLessonLinks(12);
  const prototypeHref = lessonHref([
    "international-systems",
    "global",
    "ib",
    "dp",
    "physics",
    "quantum-physics",
    "photoelectric-effect",
  ]);

  return (
    <div className="dl-hub">
      <header className="dl-hub-hero">
        <p className="dl-kicker" style={{ color: "#9fd9c8" }}>
          SUCCESS OS · Global Digital Library
        </p>
        <h1>Navigate the world’s curricula</h1>
        <p>
          Nested taxonomy from region to lesson. Open the production prototype — IB Physics
          Photoelectric Effect — with all six interactive modules live.
        </p>
        <p style={{ marginTop: "1rem" }}>
          <Link
            href={prototypeHref}
            style={{
              display: "inline-flex",
              background: "#fff",
              color: "#0b1220",
              fontWeight: 800,
              padding: "0.7rem 1rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
            }}
          >
            Open IB Physics · Photoelectric Effect
          </Link>
        </p>
      </header>

      <h2 style={{ fontSize: "1.15rem", margin: "0 0 0.75rem" }}>Regions</h2>
      <div className="dl-hub-grid">
        {regions.map((r) => (
          <Link key={r.slug} href={`/digital-library/${r.slug}`} className="dl-hub-card">
            <strong>{r.name}</strong>
            <span>/digital-library/{r.slug}/…</span>
          </Link>
        ))}
      </div>

      <h2 style={{ fontSize: "1.15rem", margin: "1.5rem 0 0.75rem" }}>Sample lesson paths</h2>
      <div className="dl-hub-grid">
        {featured.map((f) => (
          <Link key={f.href} href={f.href} className="dl-hub-card">
            <strong>{f.label.split(" / ").slice(-2).join(" · ")}</strong>
            <span>{f.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
