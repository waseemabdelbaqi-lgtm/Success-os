import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

/** Legacy URL → multi-page admission funnel */
export default async function AdmissionFunnelRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Search> | Search;
}) {
  const sp = await Promise.resolve(searchParams);
  const step = typeof sp.step === "string" ? sp.step : "";
  const paid = sp.paid;
  const institutionId =
    typeof sp.institution_id === "string"
      ? sp.institution_id
      : typeof sp.institution === "string"
        ? sp.institution
        : "";

  if (paid && institutionId) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string") qs.set(k, v);
    }
    redirect(`/apply/${institutionId}?${qs.toString()}`);
  }

  if (step === "matches") {
    redirect("/admission");
  }

  redirect("/onboard");
}
