"use client";

import InstitutionCardImpl from "@/src/components/InstitutionCard";
import type { AdmissionProfileInput, Institution } from "@/src/types/admission";

type Props = {
  institution: Institution;
  /** Profile fields forwarded into /api/checkout (needed for live Stripe mode). */
  profile?: AdmissionProfileInput;
};

/**
 * Adapter used by the admission funnel pages.
 * Apply Now posts to /api/checkout and redirects to Stripe (or the preview unlock URL).
 */
export function InstitutionCard({ institution, profile }: Props) {
  return (
    <InstitutionCardImpl
      id={institution.id}
      name={institution.name}
      type={institution.type}
      logo_url={institution.logo_url}
      is_partner={institution.is_partner}
      matchedCriteria={
        institution.criteria
          ? {
              min_gpa: institution.criteria.min_gpa,
              requirements_text: institution.criteria.requirements_text,
            }
          : null
      }
      userId={profile?.userId}
      customerEmail={profile?.email}
      fullName={profile?.fullName}
      nationality={profile?.nationality}
      gpa={profile?.gpa}
      targetDegree={profile?.targetDegree}
      major={profile?.major}
    />
  );
}

export default InstitutionCard;
