# AI Digital Human Teacher (ADHT)

World-class teacher **presence** architecture for Success OS.  
The student must feel they are learning from a **real teacher**, not a chatbot.

Schema: `success-os.ai-digital-human-teacher.v1` · [ADR-0055.1](./adr/ADR-0055.1-ai-digital-human-teacher.md)  
Pedagogy & grounding: [AI Teacher Engine](./ai-teacher-engine.md) (ADR-0055)

## Center of the platform

```
Student
  ↓ AI Digital Human Teacher (presence / voice / persona)
  ↓ AI Teacher Engine (conversation / reasoning / memory / grounding)
  ↓ Knowledge Graph + Curriculum Registry + ILE + Books + Videos + Assessments
```

## What this wave builds

| Area | Status |
|------|--------|
| Presence contracts (speak/listen/interrupt/gaze/gesture/whiteboard) | Architecture ready |
| Voice conversation contracts (auto language, accents, interrupt) | Architecture ready |
| Localized teacher profiles (admin-configurable) | Operational registry |
| Age-appropriate stage defaults | Operational |
| Personality memory (via ATE durable memory) | Operational projection |
| Provider-agnostic AI stack ports | Architecture ready |
| Live Tavus/HeyGen/ElevenLabs/OpenAI SDKs | **Not shipped** |

## Localized teachers

Administrators configure profiles per country (appearance, accent, cultural style).  
Example seeds: Jordan, Egypt, USA, Japan — not the only allowed teachers.

## Age-appropriate stages

Early childhood · Elementary · Middle school · High school · University  
Assignment remains admin-configurable.

## Provider-agnostic stack

| Port | Example vendors |
|------|-----------------|
| Reasoning & conversation | OpenAI |
| Multimodal understanding | Google Gemini |
| TTS | ElevenLabs |
| STT | Azure AI Speech / Google Cloud Speech |
| Digital human video | Tavus (or similar) |
| Avatar generation | HeyGen (or similar) |
| Realtime media | LiveKit (or equivalent) |
| Orchestration graph | LangGraph (or equivalent) |
| Vector memory | Vector database |
| Knowledge graph | Success OS Knowledge Graph |

Ports refuse live calls until configured in a later activation wave.

## Safety

Answers only via verified curriculum, Knowledge Graph, digital books, platform resources, official references — through ATE grounding. Uncertainty is stated; facts are never invented.

## APIs

Base: `/api/ai-digital-human-teacher`

| Action | Purpose |
|--------|---------|
| `status` / `snapshot` | Architecture status |
| `profiles` | List teacher profiles |
| `demo` | Seeded localized session plan |
| `session` / `plan` | Plan a DH session for a student |
| `providers` | List provider ports |
| `profile:upsert` | Admin create/update profile |
| `personality:update` | Update remembered preferences |
| `invoke-provider` | Always refuses live SDK (proof) |

Admin: `/admin/ai-digital-human-teacher`

## Validation

```bash
npm run validate:ai-digital-human-teacher
```
