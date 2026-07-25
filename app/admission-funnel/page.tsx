"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Redirector() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const step = sp.get("step") || "";
    const paid = sp.get("paid");
    const institutionId = sp.get("institution_id") || sp.get("institution") || "";

    if (paid && institutionId) {
      const qs = sp.toString();
      router.replace(`/apply/${institutionId}?${qs}`);
      return;
    }
    if (step === "matches") {
      router.replace("/admission");
      return;
    }
    router.replace("/onboard");
  }, [router, sp]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-sm text-[#73636a]">
      Redirecting to the admission funnel…
    </div>
  );
}

/** Legacy URL → multi-page admission funnel */
export default function AdmissionFunnelRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-20 text-sm text-[#73636a]">Redirecting…</div>
      }
    >
      <Redirector />
    </Suspense>
  );
}
