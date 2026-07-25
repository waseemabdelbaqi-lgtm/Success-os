"use client";

import { useEffect, useState, useTransition } from "react";
import { filterInstitutions } from "@/src/actions/admission";
import { ApplicationForm } from "@/src/components/admission-funnel/application-form";
import { InstitutionCard } from "@/src/components/admission-funnel/institution-card";
import { NotificationsPanel } from "@/src/components/admission-funnel/notifications-panel";
import { OnboardingForm } from "@/src/components/admission-funnel/onboarding-form";
import { PaymentDialog } from "@/src/components/admission-funnel/payment-dialog";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { FALLBACK_INSTITUTIONS } from "@/src/lib/admission/fallback-data";
import type { AdmissionProfileInput, Institution } from "@/src/types/admission";

const STEPS = [
  { id: "onboarding", label: "1 · Profile" },
  { id: "matches", label: "2 · Matches" },
  { id: "apply", label: "3 · Apply" },
  { id: "done", label: "4 · Done" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function AdmissionFunnelApp() {
  const [step, setStep] = useState<StepId>("onboarding");
  const [profile, setProfile] = useState<AdmissionProfileInput>({
    fullName: "",
    nationality: "Jordan",
    gpa: 3.2,
    targetDegree: "bachelor",
    major: "Engineering",
    preferredStudyCountry: "",
    email: "",
    phone: "",
  });
  const [matches, setMatches] = useState<Institution[]>([]);
  const [filterMode, setFilterMode] = useState<"supabase" | "preview" | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Institution | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [unlockToken, setUnlockToken] = useState("");
  const [noteKey, setNoteKey] = useState(0);
  const [result, setResult] = useState<{
    applicationId: string;
    route: "partner" | "email";
    status: string;
    emailPreviewHtml?: string;
  } | null>(null);

  function runFilter(nextProfile: AdmissionProfileInput = profile) {
    setFilterError(null);
    startTransition(async () => {
      const res = await filterInstitutions(nextProfile);
      if (!res.ok) {
        setFilterError(res.error);
        return;
      }
      setMatches(res.data.institutions);
      setFilterMode(res.data.mode);
      setStep("matches");

      const paidId = sessionStorage.getItem("sos_paid_institution");
      if (paidId) {
        const inst = res.data.institutions.find((i) => i.id === paidId);
        if (inst) setSelected(inst);
      }
    });
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    const payment_id = params.get("payment_id");
    const institution_id = params.get("institution_id");
    const session_id = params.get("session_id");
    const nationality = params.get("nationality");
    const studyCountry = params.get("studyCountry");
    const stepParam = params.get("step");

    const seeded: AdmissionProfileInput = {
      ...profile,
      nationality: nationality || profile.nationality,
      preferredStudyCountry: studyCountry || profile.preferredStudyCountry,
    };

    if (nationality || studyCountry) {
      setProfile(seeded);
    }

    // Deep-link from admissions CTAs: auto-run smart filter
    if (stepParam === "matches" && !paid) {
      runFilter(seeded);
    }

    if (paid && (payment_id || session_id)) {
      void (async () => {
        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: payment_id || undefined,
            sessionId: session_id || undefined,
          }),
        });
        const data = (await res.json()) as {
          paymentId?: string;
          unlockToken?: string;
          institutionId?: string;
          status?: string;
        };
        if (data.paymentId && data.unlockToken && data.status === "completed") {
          setPaymentId(data.paymentId);
          setUnlockToken(data.unlockToken);
          const instId = institution_id || data.institutionId || "";
          if (instId) {
            sessionStorage.setItem("sos_paid_institution", instId);
            const fallback = FALLBACK_INSTITUTIONS.find((i) => i.id === instId) || null;
            if (fallback) setSelected(fallback);
          }
          setStep("apply");
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap from URL once
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] px-6 py-8 text-white shadow-lg sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f2dadd]">
          SUCCESS OS · Admissions
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-sos-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
          University admission funnel
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#f2dadd] sm:text-base">
          Filter by nationality · pay a fixed $5 unlock fee · submit via partner notifications or
          official institution email.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Funnel steps">
          {STEPS.map((s) => (
            <Badge
              key={s.id}
              variant={s.id === step ? "default" : "muted"}
              className={s.id === step ? "bg-white text-[#9e1722]" : "bg-white/15 text-white"}
            >
              {s.label}
            </Badge>
          ))}
        </nav>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {step === "onboarding" || step === "matches" ? (
            <OnboardingForm
              value={profile}
              busy={pending}
              error={filterError}
              onChange={setProfile}
              onSubmit={runFilter}
            />
          ) : null}

          {step === "matches" ? (
            <section className="space-y-4" aria-live="polite">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#301218]">Matching institutions</h2>
                  <p className="text-sm text-[#73636a]">
                    Showing criteria for <strong>{profile.nationality}</strong>
                    {filterMode ? ` · data: ${filterMode}` : ""}
                  </p>
                </div>
                <Badge variant="muted">{matches.length} matches</Badge>
              </div>
              {matches.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-sm text-[#73636a]">
                    No institutions match this profile. Adjust GPA, major, or study country.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {matches.map((inst) => (
                    <InstitutionCard
                      key={inst.id}
                      institution={inst}
                      onApply={(i) => {
                        setSelected(i);
                        setPayOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {step === "apply" && selected && paymentId && unlockToken ? (
            <ApplicationForm
              institution={selected}
              profile={profile}
              paymentId={paymentId}
              unlockToken={unlockToken}
              initialPersonal={{
                fullName: profile.fullName,
                email: profile.email,
                phone: profile.phone,
              }}
              onComplete={(r) => {
                setResult(r);
                setNoteKey((k) => k + 1);
                setStep("done");
              }}
            />
          ) : null}

          {step === "apply" && (!paymentId || !selected) ? (
            <Card>
              <CardHeader>
                <CardTitle>Complete payment to unlock the form</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[#73636a]">
                Choose an institution and pay the $5 fee. If you returned from Stripe, confirm the
                URL includes <code>paid=1</code> and run a profile filter so we can restore your
                institution.
              </CardContent>
            </Card>
          ) : null}

          {step === "done" && result ? (
            <Card>
              <CardHeader>
                <CardTitle>Application submitted</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Reference <strong>{result.applicationId}</strong> · status{" "}
                  <strong>{result.status}</strong>
                </p>
                <Badge variant={result.route === "partner" ? "partner" : "email"}>
                  {result.route === "partner"
                    ? "Route A — Partner: stored + notifications"
                    : "Route B — Non-partner: official email"}
                </Badge>
                {result.emailPreviewHtml ? (
                  <details className="rounded-xl border border-[#ead9db] p-3">
                    <summary className="cursor-pointer font-bold text-[#9e1722]">
                      View email HTML preview
                    </summary>
                    <iframe
                      title="Email preview"
                      className="mt-3 h-80 w-full rounded-lg border border-[#ead9db] bg-white"
                      srcDoc={result.emailPreviewHtml}
                    />
                  </details>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <NotificationsPanel refreshKey={noteKey} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How dual-route works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[#4d3439]">
              <p>
                <strong>Partner</strong> — row in <code>applications</code> + realtime student
                notifications.
              </p>
              <p>
                <strong>Non-partner</strong> — Resend HTML email to the institution with transcript
                & passport PDFs attached.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <PaymentDialog
        open={payOpen}
        institution={selected}
        profile={profile}
        customerEmail={profile.email}
        onOpenChange={setPayOpen}
        onUnlocked={({ paymentId: pid, unlockToken: token, institutionId }) => {
          setPaymentId(pid);
          setUnlockToken(token);
          const inst = matches.find((m) => m.id === institutionId) || selected;
          setSelected(inst);
          setStep("apply");
        }}
      />
    </div>
  );
}
