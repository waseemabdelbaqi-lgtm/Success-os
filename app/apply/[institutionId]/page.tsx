import { Suspense } from "react";
import { InnerNav } from "../../components";
import ApplyPage from "@/src/app/apply/[institutionId]/page";

export const metadata = {
  title: "استمارة التقديم | SUCCESS OS",
  description: "رفع المستندات بعد تأكيد دفع رسوم الـ $5.",
};

interface PageProps {
  params: Promise<{ institutionId: string }>;
  searchParams: Promise<{
    success?: string;
    paid?: string;
    session_id?: string;
    payment_id?: string;
    unlock_token?: string;
    preview?: string;
  }>;
}

export default function ApplyRoutePage({ params, searchParams }: PageProps) {
  return (
    <>
      <InnerNav active="admissions" />
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-[#73636a]" dir="rtl">
            جاري تحميل استمارة التقديم…
          </div>
        }
      >
        <ApplyPage params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
