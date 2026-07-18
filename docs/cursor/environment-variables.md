# Environment Variables

Success OS uses validated environment variables for all runtime configuration.

## Setup

1. Copy the template:

```bash
cp .env.example .env.local
```

2. Fill in Firebase credentials (see `firebase-setup.md`).
3. Restart the dev server after changes.

## Variable reference

### Application

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `NEXT_PUBLIC_APP_NAME` | Client | Yes | Display name |
| `NEXT_PUBLIC_APP_URL` | Client | Yes | Canonical app URL |
| `NEXT_PUBLIC_APP_ENV` | Client | Yes | `development`, `staging`, `production`, or `test` |

### Firebase client

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | Yes | Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | Yes | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client | Yes | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client | Yes | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | Yes | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Client | No | Analytics measurement ID |

### Firebase admin (server only)

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `FIREBASE_PROJECT_ID` | Server | Yes | Admin project ID |
| `FIREBASE_CLIENT_EMAIL` | Server | Yes | Service account email |
| `FIREBASE_PRIVATE_KEY` | Server | Yes | Service account private key |
| `FIREBASE_DATABASE_URL` | Server | No | Realtime DB URL if used |

### Authentication

| Variable | Scope | Required | Default | Description |
|----------|-------|----------|---------|-------------|
| `AUTH_SESSION_COOKIE_NAME` | Server | No | `__session` | Session cookie name |
| `AUTH_SESSION_COOKIE_MAX_AGE` | Server | No | `432000` | Cookie max age in seconds |
| `AUTH_SECURE_COOKIES` | Server | No | `false` | Set `Secure` flag |
| `FEATURE_AUTH_ENABLED` | Server | No | `false` | Enable auth middleware enforcement |

### Logging

| Variable | Scope | Required | Default | Description |
|----------|-------|----------|---------|-------------|
| `LOG_LEVEL` | Server | No | `info` | `debug`, `info`, `warn`, `error` |

## Validation

Validation runs through:

- `validateClientEnv()` — browser-safe variables
- `validateServerEnv()` — includes admin credentials

Invalid configuration throws at startup with a detailed Zod error list.

## Security rules

- Never commit `.env.local` or service account JSON files.
- Never prefix secrets with `NEXT_PUBLIC_`.
- Store production secrets in Vercel project settings and GitHub Actions secrets.
- Rotate Firebase service account keys on a regular schedule.

## Local development without Firebase

The app can boot with placeholder values for UI development. Firebase-backed routes require valid credentials. Keep `FEATURE_AUTH_ENABLED=false` until Firebase is configured.
