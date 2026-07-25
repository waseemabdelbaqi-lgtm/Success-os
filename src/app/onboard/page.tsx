"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { OnboardingForm } from "@/src/components/admission-funnel/onboarding-form";
import { AdmissionLayout } from "@/src/app/layout";
import {
  readAdmissionProfile,
  writeAdmissionProfile,
} from "@/src/lib/admission/profile-session";
import type { AdmissionProfileInput } from "@/src/types/admission";

/**
 * استمارة إدخال بيانات الطالب الأولية (الجنسية والمعدل)
 */
function OnboardFormClient() {
  const router = useRouter();
  const search = useSearchParams();
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = readAdmissionProfile();
    const nationality = search.get("nationality");
    const studyCountry = search.get("studyCountry");
    setProfile((p) => ({
      ...p,
      ...(saved || {}),
      nationality: nationality || saved?.nationality || p.nationality,
      preferredStudyCountry:
        studyCountry || saved?.preferredStudyCountry || p.preferredStudyCountry,
    }));
  }, [search]);

  function onSubmit() {
    if (!profile.nationality || Number.isNaN(Number(profile.gpa))) {
      setError("Nationality and GPA are required.");
      return;
    }
    if (!profile.major || !profile.targetDegree) {
      setError("Target degree and major are required.");
      return;
    }
    writeAdmissionProfile(profile);
    const qs = new URLSearchParams({
      nationality: profile.nationality,
      gpa: String(profile.gpa),
    });
    if (profile.targetDegree === "school") qs.set("type", "school");
    router.push(`/admission?${qs.toString()}`);
  }

  return (
    <AdmissionLayout>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9e1722]">
            SUCCESS OS · Step 1
          </p>
          <h1 className="font-[family-name:var(--font-sos-display)] text-3xl font-semibold text-[#301218]">
            Student onboarding
          </h1>
          <p className="text-sm text-[#73636a]">
            Enter nationality, GPA, target degree, and major. We will show institutions and
            nationality-specific admission criteria next.
          </p>
        </header>
        <OnboardingForm
          value={profile}
          error={error}
          onChange={setProfile}
          onSubmit={onSubmit}
        />
      </div>
    </AdmissionLayout>
  );
}

export default function OnboardPage() {
  return (
    <Suspense
      fallback={
        <AdmissionLayout>
          <div className="mx-auto max-w-lg px-4 py-20 text-sm text-[#73636a]">Loading…</div>
        </AdmissionLayout>
      }
    >
      <OnboardFormClient />
    </Suspense>
  );
}
