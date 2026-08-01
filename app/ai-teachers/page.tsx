import Link from "next/link";
import { buildAiTeachersCatalog } from "@/lib/ai-teachers/catalog";

export const metadata = {
  title: "AI Teachers Sara & Ali | Success OS",
  description: "Only two AI teachers — Sara and Ali",
};

export default function AiTeachersPage() {
  const catalog = buildAiTeachersCatalog();

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "2rem 1.25rem 4rem",
        background:
          "radial-gradient(circle at 15% 20%, #fff3a8 0%, transparent 35%), linear-gradient(165deg, #6ec8ff, #b8f0d0 55%, #7ed9a0)",
        color: "#1e2a3a",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header
          style={{
            background: "rgba(255,255,255,0.92)",
            borderRadius: 28,
            padding: "1.4rem 1.6rem",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: "#0f766e" }}>SUCCESS OS</p>
          <h1 style={{ margin: "0.35rem 0" }}>معلمان فقط: سارة وعلي</h1>
          <p style={{ margin: 0, opacity: 0.8 }}>
            {catalog.counts.total} معلمين · {catalog.counts.female} أنثى · {catalog.counts.male} ذكر
          </p>
          <p style={{ marginTop: 12 }}>
            <Link href="/ai-teacher/classroom" style={{ fontWeight: 800, color: "#ff5a6a" }}>
              افتح الصف التفاعلي الحي
            </Link>
            {" · "}
            <Link href="/media/ai-teachers/index.html" style={{ fontWeight: 700, color: "#0f766e" }}>
              معاينة الأصول
            </Link>
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
          {catalog.teachers.map((t) => (
            <article
              key={t.id}
              style={{ background: "rgba(255,255,255,0.92)", borderRadius: 24, overflow: "hidden" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.assets.portrait} alt={t.displayName.ar} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
              <div style={{ padding: 16 }}>
                <span
                  style={{
                    display: "inline-block",
                    fontWeight: 800,
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: t.gender === "male" ? "#9ad7ff" : "#ffd84a",
                  }}
                >
                  {t.gender === "female" ? "أنثى" : "ذكر"}
                </span>
                <h2 style={{ margin: "10px 0 4px" }}>{t.displayName.ar}</h2>
                <p style={{ margin: 0, opacity: 0.75 }}>{t.voice.edgeTts}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
