# SUCCESS OS — Content Protection & Security Manual

Updated: 2026-07-13  
Classification: Confidential — Owner & Engineering Team  
Scope: lessons, summaries, videos, audio, presentations, assessments, exams, question banks, teacher uploads, AI-generated derivatives, certificates and downloadable files.

## 1. Security promise

SUCCESS OS protects every content asset through defense in depth. No single control is treated as sufficient. Every asset must have an owner, rights basis, immutable fingerprint, protection profile, review state, access policy and audit trail.

The platform must never promise absolute prevention of screenshots, camera recording or credential sharing. Those risks are reduced through short-lived access, visible and forensic watermarking, session/device controls, traceability and rapid revocation.

## 2. Required security baseline

1. Default deny: no user or service receives access unless a policy explicitly grants it.
2. Least privilege: each role receives only the minimum permissions required for the current task.
3. Server enforcement: authorization, signed delivery, encryption keys, AI keys and download decisions remain on the server. The browser is never a security boundary.
4. Tenant isolation: a school, center, university, teacher or employer cannot access another organization's assets or learner records.
5. Human publication gate: AI and content staff can prepare material, but a qualified reviewer and academic approver control publication.
6. Provenance: source, owner, license, version, reviewers and every derived asset remain linked.
7. Reversibility: every published version can be withdrawn without destroying the evidence record.

## 3. Asset lifecycle

`upload → quarantine → validate → malware scan → rights gate → fingerprint → private storage → process → review → approve → protected publish → monitor → revoke/archive`

An asset that fails any gate remains unavailable to learners. Failed, suspicious and unlicensed files are isolated from production processing.

## 4. Upload protection

The production upload API must:

- require authenticated and authorized uploaders;
- allow-list extensions and independently validate MIME type and file signature;
- reject double extensions, executable content, dangerous archives and files above the policy limit;
- replace the original filename with a random storage key while retaining a sanitized display name;
- store uploads outside the public web root in a private object store;
- quarantine before antivirus/malware scanning and content disarm where appropriate;
- limit decompressed archive size and nested archive depth;
- apply rate, count and storage quotas per user and organization;
- record uploader, IP/session, tenant, checksum, scan result, rights declaration and timestamps;
- require CSRF protection where cookie authentication is used.

These controls follow the OWASP File Upload guidance and must be verified in production, not only represented in the interface.

## 5. Identity, roles and access

Use RBAC for broad roles and ABAC for asset-specific conditions such as tenant, enrollment, purchase, course, geography, time window, device, review state and age/guardian status.

| Role | Permitted | Explicitly denied by default |
|---|---|---|
| Student / job seeker | View assigned or purchased content; submit own work | Source masters, exam answers, other users' data |
| Teacher | Upload and edit own drafts; view assigned learners | Final publication without approval; other teachers' private assets |
| Content creator | Edit media, layout, captions and translations | Change academic truth, rights basis or approval state |
| Academic director | Approve, reject, withdraw and request corrections | Alter audit history or impersonate a reviewer |
| Institution | Manage assets and members inside its tenant | Cross-tenant data and platform-wide secrets |
| Engineer | Operate systems through ticketed, time-limited access | Read learner content or answers without a justified support case |
| Owner / security lead | Risk reports, policy and incident command | Bypass law, consent, rights or immutable audit records |
| AI service | Minimum content required for the approved job | Permanent access, autonomous publication or reuse outside the job |

High-risk roles require MFA. Privileged actions require re-authentication, explicit reason, short-lived elevation and an audit event.

## 6. Storage and delivery

- Encrypt data in transit with modern TLS and at rest with managed keys.
- Keep source masters, derived assets, answer keys and user submissions in separate logical stores and access policies.
- Use private object storage; never expose predictable permanent object URLs.
- Deliver through short-lived signed URLs bound where feasible to user, asset, entitlement, session and expiry.
- Use HLS/DASH segmented delivery with encryption for protected video; do not expose a direct downloadable master.
- Add dynamic visible watermarks containing masked user identity, asset ID and session/time; vary position to resist cropping.
- For authorized PDF downloads, generate a per-user copy with license ID and watermark on every page.
- Enforce configurable device, concurrent-session, download-count and offline-expiry limits.
- Apply `Cache-Control` and content-disposition rules appropriate to the policy; sensitive responses must not enter shared caches.

## 7. Protection profiles

| Asset | Minimum production controls |
|---|---|
| Lesson / summary | In-platform view, dynamic watermark, signed access, audit, fingerprint and withdrawable version |
| Video / audio | Encrypted segmented stream, short-lived token, moving watermark, session/device limits, no public master |
| Exam / quiz | Time window, shuffled order, item pools, per-learner version, autosave, separate answer store, anomaly review |
| Question bank | No bulk export, encrypted answer/rationale data, author/reviewer separation, sampling API and full audit |
| Licensed download | Personalized copy, visible license, expiry, download limit and attached use terms |
| Teacher draft | Private workspace, source preservation, comments-only review, two-person approval and no external sharing |
| Certificate | Verifiable ID/QR, issuer signature, issue/revocation status and minimal public verification data |

## 8. Integrity manifest and provenance

The repository includes:

- `security/content-protection.schema.json` — the protection manifest contract.
- `scripts/content-protection-manifest.mjs` — generates an asset ID and SHA-256 fingerprint.
- `npm run protect:manifest -- <file> --title "Title" --type lesson --owner "Success 4 Sure"` — engineer command.

The generated manifest records ownership, rights basis, allowed uses, territory, protection profile, review state and checksum. The manifest is not a substitute for database authorization or secure storage; it is the verifiable record that connects those systems.

For exported media, add signed C2PA Content Credentials when the production media pipeline supports them. C2PA improves provenance and tamper evidence; it does not prevent copying.

## 9. Exam and assessment integrity

- Generate test forms from curriculum-tagged pools and record the item set issued to each learner.
- Keep answers, rubrics and scoring services isolated from learner-facing content.
- Reveal feedback according to the assessment policy, never through hidden client-side fields.
- Rate-limit submissions and require idempotency keys for autosave/final submission.
- Record timing, focus changes, session/device changes and answer revisions only when lawful and disclosed.
- Treat anomaly signals as review indicators, not automatic proof of cheating.
- Offer accessibility accommodations and human appeals.

## 10. AI processing gate

Before any file is sent to an AI service, the server must verify:

1. the owner or valid license;
2. permission for AI processing and the requested derivative use;
3. the minimum necessary excerpt/file;
4. approved provider, model, region, retention and privacy configuration;
5. prohibition of secret, payment, authentication and unnecessary personal data;
6. cost/rate budget and abuse limits;
7. output attribution and source linkage;
8. automated checks plus teacher and academic review before publication.

AI outputs must be labeled as generated or assisted, versioned, evaluated for factuality/curriculum alignment, and removable. API keys belong only in a server-side secret manager and must never be shipped in JavaScript, logs, documents or screenshots.

## 11. Audit, monitoring and incident response

Log access grants/denials, downloads, stream sessions, manifest creation, reviews, approvals, publication, withdrawal, permission changes and privileged support access. Protect logs from alteration and define retention by data class and jurisdiction.

When a leak or tampering event is suspected:

1. revoke the asset URL/token and affected sessions;
2. preserve logs, manifests, watermarks and relevant object versions;
3. identify the asset, user/tenant, rights owner and exposure window;
4. rotate compromised keys or credentials;
5. notify the security lead, owner and relevant business/academic owners;
6. assess legal, contractual and regulatory notification duties;
7. remove unauthorized copies where possible and communicate with affected parties;
8. fix the control failure, test the fix and publish a post-incident action record.

## 12. Backups, recovery and deletion

- Use encrypted, versioned and access-separated backups.
- Define RPO/RTO by service and test restoration on a schedule.
- Keep deletion, withdrawal and legal-hold states distinct.
- Delete expired temporary derivatives and AI job inputs according to policy.
- Retain only the minimum evidence needed for rights, assessment, audit and dispute handling.

## 13. Privacy, minors and legal controls

Collect the minimum personal data required, publish clear notices, separate consent from service terms and provide age/guardian flows where required. Complete jurisdiction-specific legal review before production, including privacy, children's data, consumer terms, teacher IP assignments/licenses, institution agreements, academic integrity, accessibility and breach notification.

This manual is a technical operating baseline, not legal advice.

## 14. Production readiness checklist

### Owner / security lead

- [ ] Approve asset classification, retention and incident policy.
- [ ] Approve teacher/partner license and IP terms.
- [ ] Name the incident commander, academic approver and privacy contact.
- [ ] Approve third-party AI, storage, email, payment and video processors.
- [ ] Review quarterly access, leakage, withdrawal and recovery reports.

### Engineer

- [ ] Implement server-side auth, MFA, RBAC + ABAC and tenant isolation.
- [ ] Build quarantine, signature validation, malware scanning and private object storage.
- [ ] Implement signed delivery, watermarks, segmented video and revocation.
- [ ] Store manifests and audit events in append-resistant systems.
- [ ] Separate answer keys and exam services from delivery clients.
- [ ] Add secret management, rotation, rate limits, queues and cost controls.
- [ ] Add security headers, dependency/secret scanning and CI security tests.
- [ ] Test authorization for every role/tenant/asset combination.
- [ ] Test backup restore and run a leak/credential incident exercise.
- [ ] Commission an independent security review before public launch.

## 15. Current implementation status

| Capability | Status | Production meaning |
|---|---|---|
| Security Center and protection profiles | Built in frontend | Clear policy selection and staff guidance |
| Dynamic preview watermark | Built in frontend | Demonstration only until server-generated delivery |
| SHA-256 manifest generator and JSON schema | Built in repository | Real local integrity record; connect to database/object store |
| Human review and rights-gate workflow | Designed in product | Requires authenticated backend state machine |
| Authentication, MFA, tenant isolation | Not yet production-enforced | Blocker for real user data/content |
| Malware scanning/private object store | Not yet connected | Blocker for public uploads |
| Signed URLs, DRM-like video delivery, revocation | Not yet connected | Blocker for protected paid content |
| Monitoring, alerts, incident automation | Not yet connected | Blocker for production security operations |

## 16. Engineering acceptance tests

- A user cannot access an asset by guessing/changing its ID.
- A user from tenant A cannot access tenant B even with a valid asset URL.
- Expired, revoked and out-of-entitlement URLs fail at the server.
- Answer keys never appear in page source, browser network payloads or client bundles.
- Uploads with spoofed MIME, double extensions, malware or oversized archives are rejected/quarantined.
- Every published derivative resolves to its source, rights record, reviewers and immutable checksum.
- Watermarked delivery identifies the licensed user/session without exposing excessive personal data.
- Removing a permission or asset version takes effect quickly across caches and active sessions.
- Secrets do not appear in git history, browser bundles, logs, analytics or support exports.
- Backup restoration reproduces access controls, manifests and audit linkage.

## 17. Reference standards

- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP REST Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- OWASP Application Security Verification Standard: https://owasp.org/www-project-application-security-verification-standard/
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- NIST Generative AI Profile: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
- CISA Secure by Design: https://www.cisa.gov/securebydesign
- C2PA Content Credentials Specification: https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html

