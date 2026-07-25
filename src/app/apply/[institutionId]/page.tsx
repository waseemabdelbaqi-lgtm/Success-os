"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdmissionLayout } from "@/src/app/layout";
import { ApplicationForm } from "@/src/components/admission-funnel/application-form";
import PaymentModal from "@/src/components/PaymentModal";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { FALLBACK_INSTITUTIONS } from "@/src/lib/admission/fallback-data";
import {
  readAdmissionProfile,
  readPaymentUnlock,
  writePaymentUnlock,
} from "@/src/lib/admission/profile-session";
import type { AdmissionProfileInput, Institution } from "@/src/types/admission";

/**
 * صفحة التقديم الموحد (مغلقة وتفتح بعد الدفع)
 */
export default function ApplyInstitutionPage() {
  const params = useParams<{ institutionId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const institutionId = params.institutionId;

  const [profile, setProfile] = useState<AdmissionProfileInput | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [paymentId, setPaymentId] = useState("");
  const [unlockToken, setUnlockToken] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [done, setDone] = useState<{
    applicationId: string;
    route: "partner" | "email";
    status: string;
    emailPreviewHtml?: string;
  } | null>(null);

  useEffect(() => {
    const saved = readAdmissionProfile();
    if (!saved) {
      router.replace("/onboard");
      return;
    }
    setProfile(saved);

    const inst =
      FALLBACK_INSTITUTIONS.find((i) => i.id === institutionId) ||
      ({
        id: institutionId,
        name: "Selected institution",
        type: "university" as const,
        official_email: "admissions@example.edu",
        is_partner: true,
      } satisfies Institution);
    setInstitution(inst);

    const fromUrl = {
      paymentId: search.get("payment_id") || "",
      unlockToken: search.get("unlock_token") || "",
      sessionId: search.get("session_id") || "",
      paid: search.get("paid"),
    };

    async function unlock() {
      if (fromUrl.paid && fromUrl.sessionId) {
        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: fromUrl.sessionId }),
        });
        const data = (await res.json()) as {
          paymentId?: string;
          unlockToken?: string;
          status?: string;
        };
        if (data.status === "completed" && data.paymentId && data.unlockToken) {
          setPaymentId(data.paymentId);
          setUnlockToken(data.unlockToken);
          writePaymentUnlock({
            paymentId: data.paymentId,
            unlockToken: data.unlockToken,
            institutionId,
          });
          return;
        }
      }

      if (fromUrl.paymentId && fromUrl.unlockToken) {
        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: fromUrl.paymentId }),
        });
        const data = (await res.json()) as { status?: string };
        if (data.status === "completed") {
          setPaymentId(fromUrl.paymentId);
          setUnlockToken(fromUrl.unlockToken);
          writePaymentUnlock({
            paymentId: fromUrl.paymentId,
            unlockToken: fromUrl.unlockToken,
            institutionId,
          });
          return;
        }
      }

      const stored = readPaymentUnlock(institutionId);
      if (stored) {
        setPaymentId(stored.paymentId);
        setUnlockToken(stored.unlockToken);
      }
    }

    void unlock();
  }, [institutionId, router, search]);

  const unlocked = Boolean(paymentId && unlockToken && institution && profile);

  return (
    <AdmissionLayout>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9e1722]">
            SUCCESS OS · Step 3–4
          </p>
          <h1 className="font-[family-name:var(--font-sos-display)] text-3xl font-semibold text-[#301218]">
            Apply to {institution?.name || "…"}
          </h1>
          <p className="text-sm text-[#73636a]">
            Form stays locked until the $5 application fee is paid.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/admission">← Back to matches</Link>
          </Button>
        </header>

        {done ? (
          <Card>
            <CardHeader>
              <CardTitle>Application submitted</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                Reference <strong>{done.applicationId}</strong> · {done.status} ·{" "}
                {done.route === "partner" ? "Partner notification route" : "Official email route"}
              </p>
              {done.emailPreviewHtml ? (
                <iframe
                  title="Email preview"
                  className="h-72 w-full rounded-lg border border-[#ead9db]"
                  srcDoc={done.emailPreviewHtml}
                />
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {!done && !unlocked ? (
          <Card>
            <CardHeader>
              <CardTitle>Payment required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[#73636a]">
              <p>
                This unified application form is locked. Pay the fixed $5 USD fee to unlock personal
                details and PDF uploads.
              </p>
              <Button type="button" onClick={() => setPayOpen(true)}>
                Unlock with $5 payment
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!done && unlocked && institution && profile ? (
          <ApplicationForm
            institution={institution}
            profile={profile}
            paymentId={paymentId}
            unlockToken={unlockToken}
            initialPersonal={{
              fullName: profile.fullName,
              email: profile.email,
              phone: profile.phone,
            }}
            onComplete={setDone}
          />
        ) : null}

        <PaymentModal
          open={payOpen}
          institution={institution}
          profile={profile || undefined}
          customerEmail={profile?.email}
          onOpenChange={setPayOpen}
          onUnlocked={({ paymentId: pid, unlockToken: token, institutionId: id }) => {
            writePaymentUnlock({ paymentId: pid, unlockToken: token, institutionId: id });
            setPaymentId(pid);
            setUnlockToken(token);
            setPayOpen(false);
          }}
        />
      </div>
    </AdmissionLayout>
  );
}
