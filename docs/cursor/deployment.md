# Deployment (Vercel)

Success OS is optimized for Vercel deployment with multi-region availability.

## Initial setup

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Framework preset: **Next.js** (auto-detected).
4. Set environment variables from `.env.example` for each environment:
   - Development
   - Preview
   - Production

## Required production values

| Variable | Production value |
|----------|------------------|
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` |
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `AUTH_SECURE_COOKIES` | `true` |
| `FEATURE_AUTH_ENABLED` | `true` (after auth UI is complete) |
| `LOG_LEVEL` | `info` or `warn` |

Use real Firebase credentials for Preview and Production environments.

## vercel.json

The project includes `vercel.json` with:

- Multi-region deployment: `iad1`, `sfo1`, `cdg1`
- API cache control headers (`no-store`)
- Explicit Next.js framework setting

## Build settings

| Setting | Value |
|---------|-------|
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output | Next.js default |
| Node.js Version | 20.x |

Quality gates (`lint`, `format:check`, `typecheck`) run in GitHub Actions CI.

## Domains

1. Add your custom domain in Vercel → Settings → Domains.
2. Add the domain to Firebase Auth authorized domains.
3. Update `NEXT_PUBLIC_APP_URL` to match the canonical domain.

## Preview deployments

Every pull request receives an isolated preview URL when the repo is connected to Vercel.

The GitHub `preview-comment` workflow documents this process on each PR.

## Health checks

After deployment, verify:

```bash
curl https://your-domain.com/api/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "v1",
    "environment": "production",
    "services": { "firebase": "ok" }
  }
}
```

## Production checklist

- [ ] All env vars configured in Vercel Production
- [ ] Firebase authorized domains updated
- [ ] `AUTH_SECURE_COOKIES=true`
- [ ] Custom domain + HTTPS verified
- [ ] CI passing on `main`
- [ ] Error monitoring configured (Sentry/Datadog/etc.)
- [ ] Firebase App Check enabled
- [ ] Backup strategy documented for future Firestore data

## Scaling notes

- Vercel automatically scales serverless functions per request.
- Session cookies keep server routes stateless.
- Consider Upstash Redis for distributed rate limiting at high traffic.
- Move long-running jobs off request path into queues/cron as features grow.
