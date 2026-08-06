"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import type {
  AnswerStyle,
  BoardWritingStyle,
  BodyLanguageStyle,
  FormalityLevel,
  InteractionLevel,
  MotivationStyle,
  RemediationMode,
  TeacherMindProfile,
  TeachingPace,
} from "@/types/teacher-mind";

const PACE: TeachingPace[] = ["slow", "measured", "brisk"];
const FORMALITY: FormalityLevel[] = ["warm_casual", "balanced", "formal"];
const INTERACTION: InteractionLevel[] = ["low", "medium", "high"];
const MOTIVATION: MotivationStyle[] = [
  "encourage_often",
  "praise_precise",
  "challenge_forward",
];
const ANSWER: AnswerStyle[] = [
  "analogy_then_steps",
  "definition_then_example",
  "socratic_questions",
  "visual_first",
];
const BOARD: BoardWritingStyle[] = ["slow_clear", "crisp_bullets", "diagram_heavy"];
const BODY: BodyLanguageStyle[] = ["open_warm", "precise_point", "animated"];
const REMEDIATION: RemediationMode[] = [
  "analogy",
  "diagram",
  "experiment",
  "model_3d",
  "slower_steps",
  "simpler_words",
];

type Props = {
  initialProfiles: TeacherMindProfile[];
};

export function TeacherMindAdmin({ initialProfiles }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [selectedId, setSelectedId] = useState(initialProfiles[0]?.id || "sara");
  const [draft, setDraft] = useState<TeacherMindProfile | null>(
    initialProfiles[0] || null,
  );
  const [status, setStatus] = useState("عدّل الملف ثم احفظ — التغييرات تُطبَّق على Teacher Mind");
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => profiles.find((p) => p.id === selectedId) || profiles[0] || null,
    [profiles, selectedId],
  );

  const selectProfile = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    setSelectedId(id);
    setDraft(structuredClone(p));
    setStatus(`تحرير: ${p.displayName.ar}`);
  };

  const patchTeaching = <K extends keyof TeacherMindProfile["teaching"]>(
    key: K,
    value: TeacherMindProfile["teaching"][K],
  ) => {
    if (!draft) return;
    setDraft({
      ...draft,
      teaching: { ...draft.teaching, [key]: value },
    });
  };

  const patchPhrase = <K extends keyof TeacherMindProfile["phrases"]>(
    key: K,
    value: string,
  ) => {
    if (!draft) return;
    setDraft({
      ...draft,
      phrases: { ...draft.phrases, [key]: value },
    });
  };

  const toggleRemediation = (mode: RemediationMode) => {
    if (!draft) return;
    const has = draft.remediationOrder.includes(mode);
    const next = has
      ? draft.remediationOrder.filter((m) => m !== mode)
      : [...draft.remediationOrder, mode];
    // Keep full catalog order for unused modes at end
    const ordered = REMEDIATION.filter((m) => next.includes(m));
    setDraft({ ...draft, remediationOrder: ordered.length ? ordered : ["simpler_words"] });
  };

  const moveRemediation = (mode: RemediationMode, dir: -1 | 1) => {
    if (!draft) return;
    const arr = [...draft.remediationOrder];
    const i = arr.indexOf(mode);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    setDraft({ ...draft, remediationOrder: arr });
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/teacher-mind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", profile: draft }),
      });
      const json = (await res.json()) as { success?: boolean; data?: TeacherMindProfile; error?: string };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "save failed");
      }
      setProfiles((prev) =>
        prev.map((p) => (p.id === json.data!.id ? json.data! : p)),
      );
      setDraft(json.data);
      setStatus(`تم الحفظ · ${json.data.displayName.ar} · ${json.data.updatedAt}`);
    } catch (e) {
      setStatus(`فشل الحفظ: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/teacher-mind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", id: draft.id }),
      });
      const json = (await res.json()) as { success?: boolean; data?: TeacherMindProfile };
      if (!res.ok || !json.data) throw new Error("reset failed");
      setProfiles((prev) =>
        prev.map((p) => (p.id === json.data!.id ? json.data! : p)),
      );
      setDraft(json.data);
      setStatus(`أُعيدت الإعدادات الافتراضية · ${json.data.displayName.ar}`);
    } catch (e) {
      setStatus(`فشل الإعادة: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setSaving(false);
    }
  };

  if (!draft || !selected) {
    return (
      <div dir="rtl" style={styles.page}>
        <p>لا توجد ملفات معلمين. أضف JSON تحت content/ai-teachers/profiles/</p>
      </div>
    );
  }

  return (
    <div dir="rtl" style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.brand}>SUCCESS OS · TEACHER MIND</div>
          <h1 style={styles.title}>إدارة عقول المعلمين</h1>
          <p style={styles.sub}>
            عدّل هوية وأسلوب سارة وعلي دون لمس الكود. نفس المحرك (Behaviour Tree +
            ذاكرة جلسة) يتوسّع لمئات المعلمين عبر ملفات JSON.
          </p>
        </div>
        <div style={styles.headerLinks}>
          <Link href="/ai-teacher" style={styles.link}>
            استوديو سارة وعلي
          </Link>
        </div>
      </header>

      <div style={styles.layout}>
        <aside style={styles.aside}>
          <h2 style={styles.h2}>الكتالوج</h2>
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              style={{
                ...styles.teacherBtn,
                ...(p.id === selectedId ? styles.teacherBtnActive : null),
              }}
              onClick={() => selectProfile(p.id)}
            >
              <strong>{p.displayName.ar}</strong>
              <span>
                {p.teaching.pace} · {p.teaching.answerStyle}
              </span>
            </button>
          ))}
          <p style={styles.hint}>
            لإضافة معلم جديد: انسخ ملف JSON في{" "}
            <code>content/ai-teachers/profiles/</code> بنفس المخطط.
          </p>
        </aside>

        <main style={styles.main}>
          <div style={styles.toolbar}>
            <div style={styles.status}>{status}</div>
            <div style={styles.toolbarActions}>
              <button type="button" style={styles.ghost} onClick={reset} disabled={saving}>
                إعادة الافتراضي
              </button>
              <button type="button" style={styles.primary} onClick={save} disabled={saving}>
                {saving ? "جاري الحفظ…" : "حفظ الملف"}
              </button>
            </div>
          </div>

          <section style={styles.section}>
            <h2 style={styles.h2}>الهوية والصوت</h2>
            <div style={styles.grid2}>
              <label style={styles.field}>
                <span>الاسم (عربي)</span>
                <input
                  style={styles.input}
                  value={draft.displayName.ar}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      displayName: { ...draft.displayName, ar: e.target.value },
                    })
                  }
                />
              </label>
              <label style={styles.field}>
                <span>الاسم (EN)</span>
                <input
                  style={styles.input}
                  value={draft.displayName.en}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      displayName: { ...draft.displayName, en: e.target.value },
                    })
                  }
                />
              </label>
              <label style={styles.field}>
                <span>صوت Edge TTS</span>
                <input
                  style={styles.input}
                  value={draft.voice.edgeTts}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      voice: { ...draft.voice, edgeTts: e.target.value },
                    })
                  }
                />
              </label>
              <label style={styles.field}>
                <span>طاقة الصوت (0–1)</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  style={styles.input}
                  value={draft.voice.energy}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      voice: {
                        ...draft.voice,
                        energy: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </label>
            </div>
            <label style={styles.field}>
              <span>نبذة</span>
              <textarea
                style={styles.textarea}
                rows={3}
                value={draft.identity.bioAr}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    identity: { ...draft.identity, bioAr: e.target.value },
                  })
                }
              />
            </label>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>أسلوب التدريس</h2>
            <div style={styles.grid3}>
              <Select
                label="السرعة"
                value={draft.teaching.pace}
                options={PACE}
                onChange={(v) => patchTeaching("pace", v as TeachingPace)}
              />
              <Select
                label="الرسمية"
                value={draft.teaching.formality}
                options={FORMALITY}
                onChange={(v) => patchTeaching("formality", v as FormalityLevel)}
              />
              <Select
                label="التفاعل"
                value={draft.teaching.interaction}
                options={INTERACTION}
                onChange={(v) => patchTeaching("interaction", v as InteractionLevel)}
              />
              <Select
                label="التحفيز"
                value={draft.teaching.motivation}
                options={MOTIVATION}
                onChange={(v) => patchTeaching("motivation", v as MotivationStyle)}
              />
              <Select
                label="أسلوب الإجابة"
                value={draft.teaching.answerStyle}
                options={ANSWER}
                onChange={(v) => patchTeaching("answerStyle", v as AnswerStyle)}
              />
              <Select
                label="كتابة السبورة"
                value={draft.teaching.boardWriting}
                options={BOARD}
                onChange={(v) => patchTeaching("boardWriting", v as BoardWritingStyle)}
              />
              <Select
                label="لغة الجسد"
                value={draft.teaching.bodyLanguage}
                options={BODY}
                onChange={(v) => patchTeaching("bodyLanguage", v as BodyLanguageStyle)}
              />
              <label style={styles.field}>
                <span>عاطفة افتراضية</span>
                <input
                  style={styles.input}
                  value={draft.teaching.defaultEmotion}
                  onChange={(e) => patchTeaching("defaultEmotion", e.target.value)}
                />
              </label>
              <label style={styles.field}>
                <span>تكرار التحقق (0–1)</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  style={styles.input}
                  value={draft.teaching.checkFrequency}
                  onChange={(e) =>
                    patchTeaching("checkFrequency", Number(e.target.value) || 0)
                  }
                />
              </label>
              <label style={styles.field}>
                <span>صبر إعادة الشرح (0–1)</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  style={styles.input}
                  value={draft.teaching.reexplainPatience}
                  onChange={(e) =>
                    patchTeaching("reexplainPatience", Number(e.target.value) || 0)
                  }
                />
              </label>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>عبارات المعلم</h2>
            <div style={styles.grid2}>
              {(
                [
                  ["addressStudent", "مخاطبة الطالب"],
                  ["explainVerb", "فعل الشرح"],
                  ["checkPhrase", "عبارة التحقق"],
                  ["reexplainOpener", "افتتاح إعادة الشرح"],
                  ["celebrate", "تشجيع النجاح"],
                  ["encourage", "تشجيع عند التعثر"],
                  ["wrongSoft", "تصحيح لطيف"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} style={styles.field}>
                  <span>{label}</span>
                  <input
                    style={styles.input}
                    value={draft.phrases[key]}
                    onChange={(e) => patchPhrase(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>ترتيب استراتيجيات المعالجة (عند عدم الفهم)</h2>
            <p style={styles.hintInline}>
              Behaviour Tree يختار أول استراتيجية غير مستخدمة في الجلسة — لا تكرار لنفس الكلمات.
            </p>
            <div style={styles.remediationList}>
              {draft.remediationOrder.map((mode, idx) => (
                <div key={mode} style={styles.remediationRow}>
                  <span style={styles.remediationIdx}>{idx + 1}</span>
                  <strong>{mode}</strong>
                  <div style={styles.remediationActions}>
                    <button
                      type="button"
                      style={styles.mini}
                      onClick={() => moveRemediation(mode, -1)}
                      disabled={idx === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      style={styles.mini}
                      onClick={() => moveRemediation(mode, 1)}
                      disabled={idx === draft.remediationOrder.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      style={styles.miniDanger}
                      onClick={() => toggleRemediation(mode)}
                    >
                      إزالة
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.addRow}>
              {REMEDIATION.filter((m) => !draft.remediationOrder.includes(m)).map((m) => (
                <button
                  key={m}
                  type="button"
                  style={styles.chip}
                  onClick={() => toggleRemediation(m)}
                >
                  + {m}
                </button>
              ))}
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>انحياز الحركة</h2>
            <div style={styles.grid3}>
              <label style={styles.checkField}>
                <input
                  type="checkbox"
                  checked={draft.gestureBias.preferOpenHands}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      gestureBias: {
                        ...draft.gestureBias,
                        preferOpenHands: e.target.checked,
                      },
                    })
                  }
                />
                تفضيل اليدين المفتوحتين
              </label>
              <label style={styles.field}>
                <span>طاقة المشي</span>
                <input
                  type="number"
                  step={0.05}
                  style={styles.input}
                  value={draft.gestureBias.walkEnergy}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      gestureBias: {
                        ...draft.gestureBias,
                        walkEnergy: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </label>
              <label style={styles.field}>
                <span>حدة الإشارة</span>
                <input
                  type="number"
                  step={0.05}
                  style={styles.input}
                  value={draft.gestureBias.pointSharpness}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      gestureBias: {
                        ...draft.gestureBias,
                        pointSharpness: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </label>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Select(props: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label style={styles.field}>
      <span>{props.label}</span>
      <select
        style={styles.input}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    margin: 0,
    background:
      "radial-gradient(1200px 600px at 80% -10%, #243044 0%, transparent 55%), linear-gradient(165deg, #0d121a 0%, #151c28 45%, #1a2433 100%)",
    color: "#f0ebe3",
    fontFamily: '"IBM Plex Sans Arabic", "Segoe UI", sans-serif',
    paddingBottom: 48,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: "20px 22px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  brand: {
    fontSize: 11,
    letterSpacing: "0.18em",
    color: "#c9b896",
    fontWeight: 700,
  },
  title: {
    margin: "6px 0",
    fontFamily: '"Fraunces", "IBM Plex Sans Arabic", serif',
    fontSize: "clamp(1.4rem, 2.6vw, 2rem)",
    fontWeight: 650,
  },
  sub: { margin: 0, maxWidth: 640, lineHeight: 1.65, opacity: 0.88, fontSize: 14 },
  headerLinks: { display: "flex", flexDirection: "column", gap: 8 },
  link: { color: "#d7e6f5", fontWeight: 650 },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(200px, 240px) 1fr",
    gap: 16,
    padding: "16px 20px",
  },
  aside: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  teacherBtn: {
    display: "grid",
    gap: 2,
    textAlign: "right",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#f0ebe3",
    padding: "12px 14px",
    borderRadius: 4,
    cursor: "pointer",
  },
  teacherBtnActive: {
    background: "rgba(240,228,208,0.14)",
    borderColor: "rgba(240,228,208,0.45)",
  },
  hint: { fontSize: 12, opacity: 0.75, lineHeight: 1.55, marginTop: 8 },
  hintInline: { fontSize: 13, opacity: 0.8, margin: "0 0 10px" },
  main: { display: "flex", flexDirection: "column", gap: 14 },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    padding: "10px 12px",
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  status: { fontSize: 13, opacity: 0.9 },
  toolbarActions: { display: "flex", gap: 8 },
  section: {
    padding: "14px 16px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  h2: {
    margin: "0 0 12px",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.02em",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
  },
  field: { display: "grid", gap: 4, fontSize: 12 },
  checkField: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    paddingTop: 18,
  },
  input: {
    background: "#121924",
    color: "#f0ebe3",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "9px 11px",
    borderRadius: 4,
    fontSize: 13,
  },
  textarea: {
    background: "#121924",
    color: "#f0ebe3",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "9px 11px",
    borderRadius: 4,
    fontSize: 13,
    width: "100%",
    resize: "vertical",
    marginTop: 8,
  },
  primary: {
    border: "none",
    background: "#f0e4d0",
    color: "#1a222c",
    fontWeight: 800,
    padding: "10px 16px",
    borderRadius: 4,
    cursor: "pointer",
  },
  ghost: {
    border: "1px solid rgba(255,255,255,0.25)",
    background: "transparent",
    color: "#f0ebe3",
    fontWeight: 650,
    padding: "10px 14px",
    borderRadius: 4,
    cursor: "pointer",
  },
  remediationList: { display: "grid", gap: 6 },
  remediationRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  remediationIdx: {
    width: 22,
    height: 22,
    display: "grid",
    placeItems: "center",
    background: "rgba(240,228,208,0.2)",
    fontSize: 12,
    fontWeight: 700,
  },
  remediationActions: { marginInlineStart: "auto", display: "flex", gap: 4 },
  mini: {
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "#f0ebe3",
    padding: "4px 8px",
    cursor: "pointer",
    borderRadius: 3,
  },
  miniDanger: {
    border: "1px solid rgba(220,120,100,0.45)",
    background: "transparent",
    color: "#f0c4b8",
    padding: "4px 8px",
    cursor: "pointer",
    borderRadius: 3,
  },
  addRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 },
  chip: {
    border: "1px dashed rgba(255,255,255,0.28)",
    background: "transparent",
    color: "#d8c4a0",
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: 3,
    fontSize: 12,
  },
};
