"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Session = Record<string, unknown>;

const STEPS = [
  "Country",
  "Curricula",
  "Educational structure",
  "Subjects",
  "Official sources",
  "Inventory",
  "Rights",
  "Production",
  "Validation",
];

export default function CountryWizardPage() {
  const [iso, setIso] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [lang, setLang] = useState("en");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const r = await fetch("/api/global-curriculum?view=wizard-sessions");
    const d = await r.json();
    setSessions(d.sessions || []);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function start() {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/global-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "wizard_start",
          isoCode: iso,
          nameEn,
          nameAr: nameAr || nameEn,
          defaultLanguage: lang,
          supportedLanguages: [lang, "en"].filter((v, i, a) => a.indexOf(v) === i),
        }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "failed");
      setSessionId(d.result.sessionId);
      setStep(1);
      setMessage(`Started onboarding for ${d.result.countryId} (inactive until approved)`);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function nextStep() {
    if (!sessionId) return;
    setBusy(true);
    try {
      const r = await fetch("/api/global-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "wizard_step",
          sessionId,
          step,
          payload: { completedAt: new Date().toISOString(), note: `Step ${step} draft` },
        }),
      });
      const d = await r.json();
      setStep(d.result.currentStep || step + 1);
      setMessage(`Step saved. Status: ${d.result.status}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function approve(approve: boolean) {
    if (!sessionId) return;
    setBusy(true);
    try {
      const r = await fetch("/api/global-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "wizard_approve", sessionId, approve }),
      });
      const d = await r.json();
      setMessage(d.result?.message || JSON.stringify(d));
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="ltr" style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto", fontFamily: "Georgia, serif" }}>
      <p style={{ color: "#6b1d22" }}>Success OS · Admin · Country Onboarding Wizard</p>
      <h1>Add a future country (inactive until approved)</h1>
      <p>
        Jordan remains the only student-visible country until Gate 3 audit passes. Do not invent books for
        inactive countries.
      </p>
      <p>
        <Link href="/admin/country-readiness">Country readiness</Link>
        {" · "}
        <Link href="/admin/jordan-coverage">Jordan coverage</Link>
        {" · "}
        <Link href="/admin/global-curriculum-matrix">Global matrix</Link>
      </p>

      <section style={{ borderTop: "1px solid #ddd", paddingTop: "1rem", marginTop: "1rem" }}>
        <h2>Start onboarding</h2>
        <label>
          ISO{" "}
          <input value={iso} onChange={(e) => setIso(e.target.value.toUpperCase())} maxLength={2} />
        </label>{" "}
        <label>
          English name <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </label>{" "}
        <label>
          Arabic name <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        </label>{" "}
        <label>
          Default language{" "}
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">English LTR</option>
            <option value="ar">Arabic RTL</option>
            <option value="fr">French</option>
          </select>
        </label>
        <div style={{ marginTop: 12 }}>
          <button disabled={busy || !iso || !nameEn} onClick={() => void start()}>
            Start wizard
          </button>
        </div>
      </section>

      {sessionId && (
        <section style={{ marginTop: "1.5rem" }}>
          <h2>
            Session {sessionId.slice(0, 8)}… — Step {Math.min(step, 9)} / 9: {STEPS[Math.min(step, 9) - 1]}
          </h2>
          <ol>
            {STEPS.map((s, i) => (
              <li key={s} style={{ fontWeight: i + 1 === step ? 700 : 400 }}>
                {i + 1}. {s}
              </li>
            ))}
          </ol>
          <button disabled={busy || step > 9} onClick={() => void nextStep()}>
            Save step & continue
          </button>{" "}
          <button disabled={busy} onClick={() => void approve(false)}>
            Keep inactive / reject
          </button>{" "}
          <button disabled={busy || step < 9} onClick={() => void approve(true)}>
            Approve student visibility (requires step 9)
          </button>
        </section>
      )}

      {message && <p role="status">{message}</p>}

      <section style={{ marginTop: "2rem" }}>
        <h2>Sessions</h2>
        <ul>
          {sessions.map((s) => (
            <li key={String(s.id)}>
              {String(s.iso_code)} · {String(s.name_en)} · step {String(s.current_step)} · {String(s.status)} ·
              student_visible={String(s.student_visible)}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
