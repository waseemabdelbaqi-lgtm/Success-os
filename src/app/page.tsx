"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { filterInstitutions } from "@/src/actions/admission";
import { AdmissionLayout } from "@/src/app/layout";
import InstitutionCard from "@/src/components/InstitutionCard";
import PaymentModal from "@/src/components/PaymentModal";
import { NotificationsPanel } from "@/src/components/admission-funnel/notifications-panel";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  readAdmissionProfile,
  writePaymentUnlock,
} from "@/src/lib/admission/profile-session";
import type { AdmissionProfileInput, Institution } from "@/src/types/admission";

/**
 * صفحة الفلترة الذكية وعرض الجامعات المتوافقة
 */
export default function AdmissionMatchesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdmissionProfileInput | null>(null);
  const [matches, setMatches] = useState<Institution[]>([]);
  const [mode, setMode] = useState<"supabase" | "preview" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Institution | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    const saved = readAdmissionProfile();
    if (!saved) {
      router.replace("/onboard");
      return;
    }
    setProfile(saved);
    startTransition(async () => {
      const res = await filterInstitutions(saved);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMatches(res.data.institutions);
      setMode(res.data.mode);
    });
  }, [router]);

  if (!profile) {
    return (
      <AdmissionLayout>
        <div className="mx-auto max-w-lg px-4 py-20 text-sm text-[#73636a]">Loading profile…</div>
      </AdmissionLayout>
    );
  }

  return (
    <AdmissionLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <header className="rounded-3xl bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] px-6 py-8 text-white shadow-lg sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f2dadd]">
            SUCCESS OS · Step 2
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-sos-display)] text-3xl font-semibold sm:text-4xl">
            Matching institutions
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#f2dadd]">
            Showing options for <strong>{profile.nationality}</strong> · GPA {profile.gpa} ·{" "}
            {profile.targetDegree} · {profile.major}
            {mode ? ` · data: ${mode}` : ""}
          </p>
          <div className="mt-5">
            <Button asChild variant="secondary" size="sm">
              <Link href="/onboard">Edit profile</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <section className="space-y-4" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[#301218]">Results</h2>
              <Badge variant="muted">{pending ? "…" : `${matches.length} matches`}</Badge>
            </div>
            {error ? (
              <p className="text-sm font-medium text-[#9e1722]" role="alert">
                {error}
              </p>
            ) : null}
            {!pending && matches.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-sm text-[#73636a]">
                  No institutions match this profile.{" "}
                  <Link className="font-bold text-[#9e1722] underline" href="/onboard">
                    Adjust filters
                  </Link>
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
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <NotificationsPanel />
          </aside>
        </div>

        <PaymentModal
          open={payOpen}
          institution={selected}
          profile={profile}
          customerEmail={profile.email}
          onOpenChange={setPayOpen}
          onUnlocked={({ paymentId, unlockToken, institutionId }) => {
            writePaymentUnlock({ paymentId, unlockToken, institutionId });
            router.push(
              `/apply/${institutionId}?payment_id=${encodeURIComponent(paymentId)}&unlock_token=${encodeURIComponent(unlockToken)}`,
            );
          }}
        />
      </div>
    </AdmissionLayout>
  );
}
