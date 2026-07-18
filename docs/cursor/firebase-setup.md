# Firebase Setup

This guide prepares Firebase for Success OS authentication and future data services.

## 1. Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Create a project (e.g. `success-os-prod`).
3. Enable Google Analytics if desired.

## 2. Register the web app

1. Project Settings → Your apps → Add app → Web.
2. Copy the Firebase config into `.env.local` as `NEXT_PUBLIC_FIREBASE_*` values.

## 3. Enable Authentication

1. Authentication → Sign-in method.
2. Enable providers you plan to support (Email/Password, Google, GitHub, Apple).
3. Configure authorized domains:
   - `localhost`
   - Your Vercel preview domain
   - Your production domain

## 4. Create a service account

1. Project Settings → Service accounts.
2. Generate a new private key (JSON).
3. Map values to server env vars:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (replace literal newlines with `\n`)

## 5. Session cookies

Success OS uses Firebase Admin session cookies for server-side auth.

Relevant code:

- `lib/auth/session.ts`
- `app/api/auth/session/route.ts`
- `app/api/auth/logout/route.ts`

Flow:

1. Client obtains Firebase ID token after sign-in.
2. Client sends token to `POST /api/auth/session`.
3. Server verifies token and sets HttpOnly session cookie.
4. Middleware and server routes use the cookie for auth gating.

## 6. Production hardening checklist

- [ ] Restrict API key usage by HTTP referrer in Google Cloud Console
- [ ] Enable Firebase App Check
- [ ] Configure Identity Platform quotas and abuse protections
- [ ] Set `AUTH_SECURE_COOKIES=true` in production
- [ ] Set `FEATURE_AUTH_ENABLED=true` only after end-to-end testing
- [ ] Store admin credentials in Vercel encrypted env vars
- [ ] Enable audit logging for admin operations

## 7. Emulator support (optional)

For local emulator usage, set:

```env
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

The client SDK connects automatically in development when this variable is present.

## 8. Future Firestore / Storage

When data features are added:

- Create dedicated services under `/services`
- Apply Firebase Security Rules before any client-side data access
- Use Admin SDK for privileged server operations only
