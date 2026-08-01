import Link from "next/link";
import { buildAiTeachersCatalog } from "@/lib/ai-teachers/catalog";

export const metadata = {
  title: "AI Teachers | Success OS",
  description: "Professional AI-generated teachers catalog",
};

export default function AiTeachersPage() {
  const catalog = buildAiTeachersCatalog();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "2rem 1.25rem 4rem",
        background:
          "radial-gradient(circle at 15% 20%, #fff3a8 0%, transparent 35%), linear-gradient(165deg, #6ec8ff, #b8f0d0 55%, #7ed9a0)",
        fontFamily: "var(--font-cairo, Cairo, sans-serif)",
        color: "#1e2a3a",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header
          style={{
            background: "rgba(255,255,255,0.92)",
            borderRadius: 28,
            padding: "1.4rem 1.6rem",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: "#0f766e", letterSpacing: "0.04em" }}>
            SUCCESS OS
          </p>
          <h1 style={{ margin: "0.35rem 0", fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
            كتالوج المعلمين والمعلمات بالذكاء الاصطناعي
          </h1>
          <p style={{ margin: 0, opacity: 0.8 }}>
            {catalog.counts.total} معلمين · {catalog.counts.female} إناث · {catalog.counts.male} ذكور
          </p>
          <p style={{ marginTop: 10 }}>
            <Link href="/media/ai-teachers/index.html" style={{ color: "#0f766e", fontWeight: 700 }}>
              معاينة HTML مباشرة
            </Link>
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
          }}
        >
          {catalog.teachers.map((t) => {
            const pose = Object.values(t.assets.poses)[0];
            return (
              <article
                key={t.id}
                style={{
                  background: "rgba(255,255,255,0.92)",
                  borderRadius: 24,
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.assets.portrait}
                  alt={t.displayName.ar}
                  style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
                />
                <div style={{ padding: "14px 16px 18px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: t.gender === "male" ? "#9ad7ff" : "#ffd84a",
                    }}
                  >
                    {t.gender === "female" ? "أنثى" : "ذكر"}
                  </span>
                  <h2 style={{ margin: "10px 0 4px", fontSize: "1.25rem" }}>{t.displayName.ar}</h2>
                  <p style={{ margin: 0, opacity: 0.75, fontSize: 14 }}>
                    {t.subjects.join(" · ")} · {t.countryCode}
                  </p>
                  {pose ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pose}
                      alt={`${t.displayName.ar} pose`}
                      style={{
                        marginTop: 12,
                        width: "100%",
                        borderRadius: 14,
                        aspectRatio: "3/4",
                        objectFit: "cover",
                      }}
                    />
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
