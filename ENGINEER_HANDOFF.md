# SUCCESS OS — Engineer Handoff

Updated: 2026-07-13  
Product owner: Mr. Waseem Allabadi / Success 4 Sure

## Product rule

SUCCESS OS is a lifelong education operating system, not an LMS or a course store. Every feature must connect to one learner identity, evidence, permissions, notifications and an Education Passport.

## Technology choice

- JavaScript + React JSX + CSS.
- Vinext/Cloudflare Sites hosting.
- Modular monolith for the current phase.
- Plain JavaScript data files under `app/data/` so academic and operations staff can edit launch data without a database console.
- Avoid TypeScript, microservices and a large state library until the real MVP validates one connected learner journey.

## Human-editable files

- `app/data/education-data.js`: university fields, languages and content-production stages.
- `app/data/source-registry.js`: source policy categories and links.
- `app/data/security-controls.js`: protection profiles, defense layers and role matrix.
- `app/components.jsx`: global navigation.
- `app/globals.css`: visual system and responsive styles.

## Content security handoff

Read `SECURITY_AND_CONTENT_PROTECTION.md` before implementing uploads, AI jobs, assessments or paid delivery. The repository includes a protection-manifest schema and SHA-256 generator. These are integrity/provenance building blocks; production enforcement still requires authenticated server APIs, private storage, malware scanning, signed delivery, tenant isolation, monitoring and incident response.

Create a manifest for a new asset with:

`npm run protect:manifest -- <file> --title "Title" --type lesson --owner "Success 4 Sure"`

## User-facing modules already present

- Seven public gateways and role profiles.
- Student, teacher, institution, staff and owner control-center views.
- School/local/international subject catalog.
- University/college degree discovery and admissions.
- University subject catalog.
- Content upload and AI-production studio UI.
- Teacher marketplace, booking concepts and notifications.
- Jobs and job-seeker journey.
- Global exam calendar and university ranking summaries.
- Education Passport, diagnostics, lessons, assessment and AI Tutor demo.
- Official-source and content-rights registries.

## Content ingestion contract

Every uploaded asset requires:

1. Owner.
2. Permission or license.
3. Country, system, level and subject/course.
4. Source version and date.
5. Allowed uses: internal reference, summarize, adapt, generate video, publish, commercial use.
6. Teacher reviewer and academic approver.
7. Provenance retained on every derived lesson, quiz, summary and video.

Never send a protected file to an AI model merely because it is available online or was purchased. A subscription or URL is not a publishing or AI-processing license.

## AI production workflow

`upload → rights gate → parsing → curriculum map → summary/script/lesson/quiz → factual evaluation → teacher review → academic approval → publish → learner evidence`

The frontend is ready. The production API must remain server-side. Never expose `OPENAI_API_KEY` to browser JavaScript. Add rate limits, audit logs, file scanning, content moderation, job queues, versioning and cost budgets before live generation.

## Auth and permissions

The public demo intentionally allows navigation without credentials. Production must use authenticated role-based and attribute-based access with default-deny:

- Student/job seeker
- Parent/guardian
- Teacher
- Learning center
- School
- University/college
- Employer
- Engineer
- Content creator
- Social media manager
- Academic director
- In-house teacher
- Owner/admin

## Language strategy

Arabic and English are live. The interface registry includes additional launch languages. Use BCP 47 locale keys, `dir` per locale, translation dictionaries, locale-aware dates/currency and human review. Do not claim a language is fully supported until the entire critical journey is translated and tested.

## Priority engineering backlog

1. Secure authentication and tenant/role model.
2. Object storage upload with malware scanning and rights metadata.
3. Content ingestion jobs and provenance records.
4. Server-side OpenAI integration after a securely stored key is available.
5. Review queues for teacher/content/academic roles.
6. Real notification service and booking state machine.
7. Official university/accreditation data connectors by country.
8. Localization framework and accessibility testing.
9. Analytics, audit and AI evaluation harness.

## Definition of done for generated content

- Rights gate passed.
- Source and version visible.
- Curriculum/learning outcomes mapped.
- Factuality and alignment tests passed.
- Teacher reviewed.
- Academic director approved.
- Accessible transcript/captions included.
- Student can report an error.
- Version can be withdrawn without deleting the source record.
