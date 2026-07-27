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
    <div className="dl-hub" dir="rtl">
      <header className="dl-hub-hero">
        <p className="dl-kicker" style={{ color: "#f2d77c" }}>
          SUCCESS OS · المكتبة الرقمية العالمية
        </p>
        <h1 style={{ color: "#fff" }}>SUCCESS OS</h1>
        <p>
          مناهج العالم في شجرة واحدة — من المنطقة إلى الدرس. الدرس التفاعلي و3D أدوات دراسة؛
          الشرح والتدريس من معلّم حقيقي عبر Teachers OS.
        </p>
        <p style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
          <Link
            href="/curriculum/jordan/elementary"
            style={{
              display: "inline-flex",
              background: "#f2d77c",
              color: "#4b0a11",
              fontWeight: 800,
              padding: "0.7rem 1rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
            }}
          >
            المرحلة الابتدائية · حصص AI
          </Link>
          <Link
            href="/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد#ai-class"
            style={{
              display: "inline-flex",
              background: "#9e1722",
              color: "#f2d77c",
              fontWeight: 800,
              padding: "0.7rem 1rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
              border: "1px solid rgba(242,215,124,.55)",
            }}
          >
            حصة AI · صف 1 رياضيات
          </Link>
          <Link
            href="/teachers"
            style={{
              display: "inline-flex",
              background: "transparent",
              color: "#fff",
              fontWeight: 700,
              padding: "0.7rem 1rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,.35)",
            }}
          >
            معلّمون حقيقيون
          </Link>
          <Link
            href={prototypeHref}
            style={{
              display: "inline-flex",
              background: "transparent",
              color: "#fff",
              fontWeight: 700,
              padding: "0.7rem 1rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,.25)",
            }}
          >
            IB Physics (مرجعي)
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
