import { Suspense } from "react";
import { InnerNav } from "../../components";
import ApplyInstitutionPage from "@/src/app/apply/[institutionId]/page";

export const metadata = {
  title: "Apply",
  description: "Unified admission application — unlocks after $5 payment.",
};

export default function ApplyPage() {
  return (
    <>
      <InnerNav active="admissions" />
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg px-4 py-20 text-sm text-[#73636a]">
            Loading application…
          </div>
        }
      >
        <ApplyInstitutionPage />
      </Suspense>
    </>
  );
}
