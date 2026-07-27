"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type Domain = {
  id: string;
  depth: number;
  labelAr: string;
  labelEn: string;
  essence: string;
  color: string;
  surfaces?: string[];
};

type Artery = {
  id: string;
  labelAr: string;
  labelEn: string;
  meaning: string;
  from: string;
  to: string[];
};

type Pulse = {
  vitality: number;
  alive: number;
  total: number;
  createdAt: string;
  probes: { id: string; path: string; ok: boolean; status: number; domain: string }[];
  domains: { id: string; labelAr: string; vitality: number | null; alive: number; probed: number }[];
};

type Snapshot = {
  manifest: {
    version: string;
    codename: string;
    steward: string;
    doctrine: {
      titleAr: string;
      manifestoAr: string[];
      operatingLaw: string[];
    };
    domains: Domain[];
    arteries: Artery[];
  };
  pulse: Pulse | null;
  nextGrowth: { id: string; labelAr: string; feeds: string[] }[];
};

/**
 * SUCCESS OS Roots — living organism map.
 * Planted as the deep foundation beneath all control rooms.
 */
export default function RootsPage(): ReactNode {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/os-roots?view=snapshot", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || "LOAD_FAILED");
    setSnapshot(json.snapshot);
  }, []);

  useEffect(() => {
    load().catch((e: unknown) =>
      setError(e instanceof Error ? e.message : "LOAD_FAILED"),
    );
  }, [load]);

  async function runPulse() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/os-roots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pulse",
          actor: "Waseem · Partner",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "PULSE_FAILED");
      setSnapshot(json.snapshot);
      setMessage(
        `نبض الجذور: حيوية ${json.report.vitality}% — ${json.report.alive}/${json.report.total} شرايين مستجيبة`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "PULSE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  const m = snapshot?.manifest;
  const pulse = snapshot?.pulse;
  const primary = (m?.domains || []).filter((d) => d.depth <= 1);
  const feeders = (m?.domains || []).filter((d) => d.depth === 2);

  return (
    <div className="roots-os min-h-screen text-[#fff8f4]" dir="rtl">
      <style>{`
        .roots-os {
          background:
            radial-gradient(900px 500px at 50% -10%, rgba(242,215,124,.18), transparent 55%),
            radial-gradient(700px 400px at 10% 80%, rgba(158,23,34,.35), transparent 50%),
            radial-gradient(600px 360px at 90% 70%, rgba(75,10,17,.5), transparent 45%),
            linear-gradient(180deg, #0c0608 0%, #1a0c10 40%, #301218 100%);
        }
        .roots-os .sap {
          animation: sapFlow 4.5s ease-in-out infinite;
        }
        .roots-os .root-node {
          transition: transform .35s ease, box-shadow .35s ease;
        }
        .roots-os .root-node:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 0 40px rgba(242,215,124,.18);
        }
        .roots-os .artery-line {
          animation: arteryPulse 3s ease-in-out infinite;
        }
        @keyframes sapFlow {
          0%,100% { opacity: .45; filter: blur(0px); }
          50% { opacity: 1; filter: blur(0.2px); }
        }
        @keyframes arteryPulse {
          0%,100% { opacity: .35; }
          50% { opacity: .9; }
        }
      `}</style>

      <header className="relative overflow-hidden border-b border-white/10">
        <div className="sap pointer-events-none absolute left-1/2 top-0 h-40 w-px -translate-x-1/2 bg-gradient-to-b from-[#f2d77c] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f2d77c]">
            SUCCESS OS · {m?.codename || "SHARAYEEN"} · ROOTS KERNEL {m?.version}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            جذور المنظومة
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            مش واجهات فوق التراب. هاي الشرايين: هوية، رحلة، مطابقة، معاملة، دليل، وتدقيق — تسقي
            المعلم والطالب والشريك والباحث من نواة واحدة. سابق عصره لأنه يخلي المنصة كائن حي مو كتالوج.
          </p>
          <p className="mt-2 text-xs text-[#f2d77c]">{m?.steward}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={runPulse}
              className="rounded-xl bg-[#f2d77c] px-4 py-2.5 text-sm font-bold text-[#301218] disabled:opacity-60"
            >
              {busy ? "يجري النبض…" : "نبض الجذور الآن"}
            </button>
            <Link
              href="/guide"
              className="rounded-xl border border-white/25 bg-white/5 px-4 py-2.5 text-sm font-semibold"
            >
              دليل الشريك الحي
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/25 bg-white/5 px-4 py-2.5 text-sm font-semibold"
            >
              الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {error ? (
          <p className="rounded-xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            {message}
          </p>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.16em] text-[#f2d77c]">حيوية الجذور</p>
            <p className="mt-2 text-4xl font-bold">{pulse ? `${pulse.vitality}%` : "—"}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.16em] text-[#f2d77c]">شرايين مستجيبة</p>
            <p className="mt-2 text-4xl font-bold">
              {pulse ? `${pulse.alive}/${pulse.total}` : "—"}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.16em] text-[#f2d77c]">آخر نبض</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed">
              {pulse?.createdAt
                ? new Date(pulse.createdAt).toLocaleString("ar")
                : "اضغط نبض الجذور"}
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-[#f2d77c]/25 bg-gradient-to-br from-[#4b0a11]/80 to-[#1a0c10] p-6">
          <h2 className="text-2xl font-bold text-[#f2d77c]">
            {m?.doctrine.titleAr || "عقيدة الجذور"}
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/80">
            {(m?.doctrine.manifestoAr || []).map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#f2d77c]" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            {(m?.doctrine.operatingLaw || []).map((law) => (
              <span
                key={law}
                className="rounded-full border border-[#f2d77c]/30 px-3 py-1 text-xs text-[#f2d77c]"
              >
                {law}
              </span>
            ))}
          </div>
        </section>

        <section>
          <header className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f2d77c]">
              PRIMARY ROOTS
            </p>
            <h2 className="text-2xl font-bold">الجذور الأساسية</h2>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {primary.map((d) => {
              const vitality = pulse?.domains?.find((x) => x.id === d.id)?.vitality;
              return (
                <article
                  key={d.id}
                  className="root-node rounded-3xl border border-white/10 bg-white/5 p-5"
                  style={{ borderTopColor: d.color, borderTopWidth: 3 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-white/50">
                        {d.labelEn}
                      </p>
                      <h3 className="mt-1 text-xl font-bold" style={{ color: d.color }}>
                        {d.labelAr}
                      </h3>
                    </div>
                    <span className="text-sm font-bold text-white/70">
                      {vitality == null ? "—" : `${vitality}%`}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{d.essence}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(d.surfaces || []).slice(0, 3).map((s) => (
                      <Link
                        key={s}
                        href={s}
                        className="rounded-lg bg-black/30 px-2 py-1 text-[11px] text-[#f2d77c] hover:bg-black/50"
                      >
                        {s}
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {feeders.length ? (
          <section>
            <header className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f2d77c]">
                FEEDER ROOTS
              </p>
              <h2 className="text-xl font-bold">جذور مغذّية</h2>
            </header>
            <div className="grid gap-3 sm:grid-cols-2">
              {feeders.map((d) => (
                <article
                  key={d.id}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                >
                  <h3 className="font-bold" style={{ color: d.color }}>
                    {d.labelAr}
                  </h3>
                  <p className="mt-1 text-sm text-white/70">{d.essence}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <header className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f2d77c]">
              LIFE ARTERIES
            </p>
            <h2 className="text-2xl font-bold">شرايين الحياة</h2>
          </header>
          <div className="space-y-3">
            {(m?.arteries || []).map((a) => (
              <div
                key={a.id}
                className="artery-line rounded-2xl border border-[#f2d77c]/15 bg-black/25 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-[#f2d77c]">{a.labelAr}</h3>
                  <span className="text-xs text-white/45">{a.labelEn}</span>
                </div>
                <p className="mt-1 text-sm text-white/75">{a.meaning}</p>
                <p className="mt-2 text-xs text-white/45">
                  {a.from} → {(a.to || []).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </section>

        {pulse?.probes?.length ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold">تفاصيل آخر نبض</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {pulse.probes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm"
                >
                  <span className="text-white/80">{p.path}</span>
                  <span className={p.ok ? "font-bold text-emerald-300" : "font-bold text-red-300"}>
                    {p.ok ? `OK ${p.status}` : `FAIL ${p.status || "—"}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-[#f2d77c]/20 bg-[#4b0a11]/40 p-5">
          <h2 className="text-xl font-bold text-[#f2d77c]">نمو الجذور القادم</h2>
          <p className="mt-1 text-sm text-white/70">
            الجذور تُزرع الآن — النمو يطلع لفوق على نفس الشرايين.
          </p>
          <ul className="mt-4 space-y-2">
            {(snapshot?.nextGrowth || []).map((g) => (
              <li
                key={g.id}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"
              >
                <strong className="text-white">{g.labelAr}</strong>
                <span className="mt-1 block text-xs text-white/50">
                  يغذّي: {g.feeds.join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
