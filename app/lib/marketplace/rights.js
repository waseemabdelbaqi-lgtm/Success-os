/**
 * Copyright, voice and likeness policy validation for teacher uploads.
 */

export const RIGHTS_POLICY_FLAGS = Object.freeze([
  'copyrighted_textbook_copying',
  'unauthorised_exams',
  'stolen_videos',
  'third_party_watermarks',
  'unauthorised_voice_cloning',
  'unauthorised_face_or_likeness',
]);

/**
 * Validate teacher course rights declaration before submit-for-review.
 */
export function validateTeacherRightsDeclaration(input = {}) {
  const accepted = input.copyrightDeclarationAccepted === true
    || input.copyright_declaration_accepted === true;
  if (!accepted) {
    return {
      ok: false,
      error: 'COPYRIGHT_DECLARATION_REQUIRED',
      message: 'Teacher must accept the copyright and rights declaration before submission.',
    };
  }

  const flags = input.rightsPolicyFlags || input.rights_policy_flags || {};
  const violations = [];
  for (const key of RIGHTS_POLICY_FLAGS) {
    if (flags[key] === true) violations.push(key);
  }

  if (violations.length) {
    return {
      ok: false,
      error: 'RIGHTS_POLICY_VIOLATION',
      violations,
      message: 'Course flagged for policy review and cannot be submitted until cleared.',
    };
  }

  return {
    ok: true,
    copyrightDeclarationAccepted: true,
    rightsPolicyFlags: Object.fromEntries(RIGHTS_POLICY_FLAGS.map((k) => [k, false])),
  };
}

/**
 * Media generation metadata required for generated assets.
 */
export function buildGeneratedMediaRecord({
  provider,
  model,
  generatedAt = new Date().toISOString(),
  consentReference = null,
  disclosureRequired = true,
  approvalStatus = 'PENDING',
} = {}) {
  if (!provider) throw new Error('MEDIA_PROVIDER_REQUIRED');
  return {
    provider,
    model: model || null,
    generation_date: generatedAt,
    consent_reference: consentReference,
    disclosure_requirement: Boolean(disclosureRequired),
    approval_status: approvalStatus,
  };
}
