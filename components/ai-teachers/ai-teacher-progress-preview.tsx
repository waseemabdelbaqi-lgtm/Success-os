"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";

type TeacherId = "sara" | "ali";
type Pose = "stand" | "point" | "write";

type Status = "completed" | "in_progress" | "not_started";

type RequirementRow = {
  id: string;
  label: string;
  status: Status;
  evidence: string;
  runnableNow: boolean;
};

const REQUIREMENTS: RequirementRow[] = [
  {
    id: "photoreal",
    label: "شخصيات بشرية واقعية (Photorealistic) — ليست كرتون/أفاتار",
    status: "completed",
    evidence: "صور photoreal جاهزة لسارة وعلي (portrait + classroom poses)",
    runnableNow: true,
  },
  {
    id: "sara-ali-only",
    label: "معلمان: سارة وعلي فقط حالياً",
    status: "completed",
    evidence: "catalog + validate:ai-teachers يفرضان sara/ali فقط",
    runnableNow: true,
  },
  {
    id: "studio-ui",
    label: "استوديو تعليمي (واجهة سينمائية قابلة للتشغيل)",
    status: "completed",
    evidence: "/ai-teacher/studio و /ai-teacher/classroom يعملان",
    runnableNow: true,
  },
  {
    id: "neural-voice",
    label: "صوت عربي عصبي (Jordanian neural TTS مُخبز مسبقاً)",
    status: "completed",
    evidence: "12 ملف MP3 لكل معلم عبر edge-tts (Sana/Taim)",
    runnableNow: true,
  },
  {
    id: "lesson-analyze",
    label: "تحليل الدرس قبل توليد الأداء",
    status: "completed",
    evidence: "lib/digital-human-studio/analyze-lesson.ts + API plan",
    runnableNow: true,
  },
  {
    id: "auto-cast",
    label: "اختيار المعلم تلقائياً حسب الدرس",
    status: "completed",
    evidence: "cast-teacher.ts (صفوف مبكرة→سارة، STEM→علي)",
    runnableNow: true,
  },
  {
    id: "scene-plan",
    label: "تقسيم الدرس لمشاهد + كاميرا/إضاءة/انتقالات",
    status: "completed",
    evidence: "plan-scenes.ts يولّد مشاهد ديناميكية",
    runnableNow: true,
  },
  {
    id: "dynamic-gestures",
    label: "حركات غير مكررة حسب محتوى المشهد",
    status: "completed",
    evidence: "behavior-director يولّد timelines ببذرة المحتوى",
    runnableNow: true,
  },
  {
    id: "board-write",
    label: "كتابة/إظهار محتوى على السبورة أثناء الشرح",
    status: "completed",
    evidence: "LivingBoard + board cues متزامنة مع التقدم",
    runnableNow: true,
  },
  {
    id: "pose-swap",
    label: "تبديل وقوف/إشارة/كتابة (prototype حضور صفّي)",
    status: "completed",
    evidence: "classroom/{stand,point,write}.png + AliveTeacherStage",
    runnableNow: true,
  },
  {
    id: "scalable",
    label: "بنية قابلة لإضافة معلمين/استوديوهات لاحقاً",
    status: "completed",
    evidence: "catalog + provider ports + studioId/cast extensible",
    runnableNow: true,
  },
  {
    id: "lesson-hook",
    label: "إطلاق الاستوديو عند فتح درس كتاب",
    status: "completed",
    evidence: "StudioLessonLauncher داخل صفحة درس الطالب",
    runnableNow: true,
  },
  {
    id: "mouth-approx",
    label: "حركة فم تقريبية متزامنة مع الصوت (Prototype)",
    status: "in_progress",
    evidence: "طاقة صوت/ morph إطارات — ليس lip-sync صوتي-حرفي احترافي",
    runnableNow: true,
  },
  {
    id: "camera-css",
    label: "زوايا كاميرا سينمائية (محاكاة CSS وليست كاميرات 3D حقيقية)",
    status: "in_progress",
    evidence: "cameraStyle transforms في DigitalHumanStudio",
    runnableNow: true,
  },
  {
    id: "props-interact",
    label: "تفاعل مع معادلات/نماذج/تجارب كعناصر درس",
    status: "in_progress",
    evidence: "props إجرائية تظهر على السبورة — ليست نماذج 3D حقيقية متحركة",
    runnableNow: true,
  },
  {
    id: "qa-adapt",
    label: "إعادة الشرح / أبسط / مثال / تحدٍّ",
    status: "in_progress",
    evidence: "adapt API + أوامر الصف — محادثة صوتية حرة غير مكتملة",
    runnableNow: true,
  },
  {
    id: "realtime-3d-studio",
    label: "استوديو ثلاثي الأبعاد حقيقي (WebGL/Three scene كاملة)",
    status: "not_started",
    evidence: "three موجود بالـ deps لكن لا يوجد مشهد MetaHuman/استوديو 3D مُشغَّل",
    runnableNow: false,
  },
  {
    id: "full-body-skel",
    label: "حركة جسم كاملة (مشي/جلوس/هيكل عظمي) مولَّدة لحظياً",
    status: "not_started",
    evidence: "حالياً تبديل صور poses فقط — لا animation rig",
    runnableNow: false,
  },
  {
    id: "face-blendshapes",
    label: "تعابير وجه دقيقة (blendshapes / رمش/تنفس فيزيائي)",
    status: "not_started",
    evidence: "لا يوجد نموذج وجه قابل للتحريك — صور ثابتة + canvas overlays",
    runnableNow: false,
  },
  {
    id: "pro-lipsync",
    label: "Lip Sync احترافي 100% (phoneme / digital twin video)",
    status: "not_started",
    evidence: "HEYGEN_* فارغ — لا فيديو twin حي؛ المزامنة الحالية تقريبية",
    runnableNow: false,
  },
  {
    id: "ai-gen-performance",
    label: "توليد أداء كامل بالذكاء الاصطناعي لكل درس دون أصول جاهزة",
    status: "not_started",
    evidence: "المخطّط/المخرجات مولَّدة؛ الأداء المرئي يعتمد أصول صور+صوت مخبوزة",
    runnableNow: false,
  },
  {
    id: "live-3d-models",
    label: "تحريك نماذج 3D حقيقية حول المعلم أثناء الشرح",
    status: "not_started",
    evidence: "بطاقات props فقط — لا mesh/orbit حقيقي مربوط بالكلام",
    runnableNow: false,
  },
];

const QUALITY = [
  { label: "شكل الشخصية الحالي", value: "Photoreal PNG (وقوف/إشارة/كتابة) — Prototype قوي بصرياً", score: "7/10" },
  { label: "جودة الوجه", value: "صور عالية الواقعية، لكن ليست mesh قابل للتحريك", score: "7/10" },
  { label: "جودة الحركة", value: "تبديل poses + تنفس/تمايل canvas — ليست حركة جسم كاملة", score: "4/10" },
  { label: "جودة الصوت", value: "عصبي أردني مخبوز (Sana/Taim) — واضح وقابل للتشغيل", score: "8/10" },
  { label: "جودة Lip Sync", value: "تقريبي عبر طاقة الصوت/إطارات فم — غير احترافي 100%", score: "3/10" },
  { label: "الاستوديو الحالي", value: "واجهة سينمائية 2.5D (LED/سبورة) — ليس استوديو 3D حقيقي", score: "5/10" },
  { label: "العناصر التفاعلية", value: "سبورة حية، أوامر، props، مشاهد مخططة — نماذج 3D غير حقيقية", score: "5/10" },
];

export function AiTeacherProgressPreview() {
  const [teacher, setTeacher] = useState<TeacherId>("sara");
  const [pose, setPose] = useState<Pose>("stand");
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const imgSrc = useMemo(
    () => `/media/ai-teachers/${teacher}/classroom/${pose}.png`,
    [teacher, pose],
  );

  const counts = useMemo(() => {
    const completed = REQUIREMENTS.filter((r) => r.status === "completed").length;
    const inProgress = REQUIREMENTS.filter((r) => r.status === "in_progress").length;
    const notStarted = REQUIREMENTS.filter((r) => r.status === "not_started").length;
    return { completed, inProgress, notStarted, total: REQUIREMENTS.length };
  }, []);

  useEffect(() => {
    if (!playing) return;
    setDone(false);
    setSecondsLeft(10);
    setPose("stand");

    const audio = new Audio(`/media/ai-teachers/${teacher}/audio/welcome.mp3`);
    audioRef.current = audio;
    void audio.play().catch(() => undefined);

    const started = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = (Date.now() - started) / 1000;
      const left = Math.max(0, 10 - Math.floor(elapsed));
      setSecondsLeft(left);
      if (elapsed < 3.3) setPose("stand");
      else if (elapsed < 6.6) setPose("point");
      else setPose("write");
      if (elapsed >= 10) {
        window.clearInterval(tick);
        audio.pause();
        setPlaying(false);
        setDone(true);
        setSecondsLeft(0);
      }
    }, 200);

    return () => {
      window.clearInterval(tick);
      audio.pause();
    };
  }, [playing, teacher]);

  const statusIcon = (s: Status) =>
    s === "completed" ? "✅" : s === "in_progress" ? "🟡" : "❌";

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#0b1020,#141018 55%,#1a120c)",
        color: "#f4f1e8",
        fontFamily: "'Noto Kufi Arabic', 'Segoe UI', sans-serif",
        padding: "20px 16px 48px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ marginBottom: 18 }}>
          <div style={{ color: "#ffd84a", fontWeight: 800, letterSpacing: "0.06em", fontSize: 12 }}>
            SUCCESS OS · PROGRESS REVIEW (TEMPORARY)
          </div>
          <h1 style={{ margin: "6px 0 8px", fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}>
            AI Teacher Preview
          </h1>
          <p style={{ margin: 0, opacity: 0.85, maxWidth: 720, lineHeight: 1.6 }}>
            هذه صفحة مؤقتة للمراجعة فقط. لا تدّعي اكتمال Digital Human السينمائي.
            المعاينة التالية 10 ثوانٍ من الأصول والواجهات الموجودة فعلياً والقابلة للتشغيل الآن.
          </p>
        </header>

        {/* 10s preview */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 1fr) 1.1fr",
            gap: 14,
            marginBottom: 22,
          }}
          className="preview-grid"
        >
          <div
            style={{
              position: "relative",
              borderRadius: 18,
              overflow: "hidden",
              minHeight: 420,
              background: "#1c2438",
              border: "1px solid rgba(255,216,74,0.25)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={`${teacher} ${pose}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                insetInline: 0,
                bottom: 0,
                padding: "14px 14px 16px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 20 }}>
                {teacher === "sara" ? "المعلمة سارة" : "المعلم علي"}
              </div>
              <div style={{ color: "#ffd84a", fontWeight: 700 }}>
                وضعية: {pose} · Prototype Photoreal
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                background: playing ? "#c45c26" : "#2a9d8f",
                color: "#fff",
                fontWeight: 900,
                borderRadius: 999,
                padding: "8px 12px",
              }}
            >
              {playing ? `معاينة ${secondsLeft}ث` : done ? "انتهت 10ث" : "جاهز"}
            </div>
          </div>

          <div
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 16,
            }}
          >
            <h2 style={{ marginTop: 0 }}>معاينة 10 ثوانٍ — آخر إنجاز قابل للتشغيل</h2>
            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
              تشغّل صورة صفّية حقيقية + تبديل وضعيات (stand→point→write) + مقطع صوت عصبي
              <code style={{ marginInlineStart: 6 }}>welcome.mp3</code>.
              هذا Prototype وليس إنتاج استوديو عالمي مكتمل.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {(["sara", "ali"] as TeacherId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={playing}
                  onClick={() => {
                    setTeacher(id);
                    setDone(false);
                  }}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "10px 14px",
                    fontWeight: 800,
                    cursor: playing ? "not-allowed" : "pointer",
                    background: teacher === id ? "#c45c26" : "rgba(255,255,255,0.12)",
                    color: "#fff",
                  }}
                >
                  {id === "sara" ? "سارة" : "علي"}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPlaying(true)}
                disabled={playing}
                style={{
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 18px",
                  fontWeight: 900,
                  cursor: playing ? "not-allowed" : "pointer",
                  background: "linear-gradient(120deg,#ffd84a,#e0893a)",
                  color: "#1a1208",
                }}
              >
                شغّل Preview 10ث
              </button>
            </div>

            <h3 style={{ marginBottom: 8 }}>تقييم الجودة الحالي (صادق)</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {QUALITY.map((q) => (
                <div
                  key={q.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr 52px",
                    gap: 8,
                    fontSize: 13,
                    background: "rgba(0,0,0,0.25)",
                    borderRadius: 10,
                    padding: "8px 10px",
                  }}
                >
                  <strong>{q.label}</strong>
                  <span style={{ opacity: 0.9 }}>{q.value}</span>
                  <span style={{ color: "#ffd84a", fontWeight: 900 }}>{q.score}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Summary counts */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <Stat card="✅ Completed" n={counts.completed} color="#2a9d8f" />
          <Stat card="🟡 In Progress" n={counts.inProgress} color="#e6b35a" />
          <Stat card="❌ Not Started" n={counts.notStarted} color="#c45c26" />
        </section>

        <section
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            marginBottom: 18,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                <th style={th}>الحالة</th>
                <th style={th}>المتطلب</th>
                <th style={th}>الدليل داخل المشروع</th>
                <th style={th}>قابل للتشغيل الآن؟</th>
              </tr>
            </thead>
            <tbody>
              {REQUIREMENTS.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <td style={td}>{statusIcon(r.status)}</td>
                  <td style={td}>{r.label}</td>
                  <td style={{ ...td, opacity: 0.9 }}>{r.evidence}</td>
                  <td style={td}>{r.runnableNow ? "نعم" : "لا"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section
          style={{
            borderRadius: 16,
            padding: 16,
            background: "rgba(255,255,255,0.04)",
            marginBottom: 18,
            lineHeight: 1.7,
          }}
        >
          <h2 style={{ marginTop: 0 }}>ما تم بناؤه فعلاً ويمكن تشغيله الآن</h2>
          <ul>
            <li>
              صفحات:{" "}
              <Link href="/ai-teacher/classroom" style={{ color: "#ffd84a" }}>
                /ai-teacher/classroom
              </Link>
              {" · "}
              <Link href="/ai-teacher/studio" style={{ color: "#ffd84a" }}>
                /ai-teacher/studio
              </Link>
            </li>
            <li>أصول photoreal لسارة وعلي + صوت عصبي مخبوز</li>
            <li>محرك تخطيط: تحليل درس → اختيار معلم → مشاهد → سلوكيات ديناميكية</li>
            <li>API: <code>/api/digital-human-studio</code></li>
          </ul>
          <h2>ما لم يُبنَ بعد (لا نقول «تم»)</h2>
          <ul>
            <li>Digital Human ثلاثي الأبعاد حقيقي / MetaHuman / هيكل حركة كامل</li>
            <li>Lip Sync احترافي phoneme أو فيديو twin (HeyGen غير مهيأ)</li>
            <li>تعابير وجه blendshapes وتنفس فيزيائي حقيقي</li>
            <li>نماذج 3D حية حول المعلم مرتبطة بالكلام</li>
            <li>توليد أداء مرئي كامل بالـ AI لكل درس دون اعتماد صور/صوت جاهزين</li>
          </ul>
          <p style={{ marginBottom: 0, color: "#ffd84a", fontWeight: 800 }}>
            النسبة التقريبية للمتطلب الكامل «استوديو عالمي Digital Human»: حوالي 35–40٪
            (أساس قوي + Prototype قابل للعرض، والنواة السينمائية الحقيقية غير مكتملة).
          </p>
        </section>

        <footer style={{ opacity: 0.8, fontSize: 13 }}>
          بانتظار موافقتك قبل أي تطوير جديد. هذه صفحة مراجعة مؤقتة فقط.
        </footer>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .preview-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

function Stat({ card, n, color }: { card: string; n: number; color: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: "14px 12px",
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${color}55`,
      }}
    >
      <div style={{ fontWeight: 800, color }}>{card}</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>{n}</div>
    </div>
  );
}

const th: CSSProperties = {
  textAlign: "right",
  padding: "10px 12px",
  fontWeight: 800,
};

const td: CSSProperties = {
  textAlign: "right",
  padding: "10px 12px",
  verticalAlign: "top",
};
