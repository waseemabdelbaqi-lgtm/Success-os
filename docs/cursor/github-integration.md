# GitHub Integration

Success OS includes GitHub workflows and repository hygiene for team-scale development.

## Workflows

### `CI` (`.github/workflows/ci.yml`)

Runs on pushes and pull requests to `main` and `develop`:

- ESLint
- Prettier check
- TypeScript (`tsc --noEmit`)
- Production build
- npm audit (non-blocking, high severity)

CI injects placeholder Firebase env vars so builds succeed without secrets.

### Preview comment (`.github/workflows/preview-comment.yml`)

Adds or updates a PR comment with Vercel preview deployment instructions.

## Dependabot

`.github/dependabot.yml` opens weekly PRs for:

- npm dependencies (grouped by prod/dev)
- GitHub Actions

## Pull request template

`.github/pull_request_template.md` enforces:

- Change summary
- Validation checklist
- Test plan
- Secret safety confirmation

## Issue templates

- Bug report
- Feature request

## Branch strategy (recommended)

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feature/*` | Feature work |
| `fix/*` | Bug fixes |

## Required repository settings

Configure in GitHub repository settings:

1. **Branch protection** on `main`:
   - Require PR reviews
   - Require status checks: `Lint, Typecheck, and Build`
   - Disallow force pushes
2. **Secrets** for production deployment pipelines (if extended later)
3. **Environments** (`staging`, `production`) with required reviewers

## Local pre-push checklist

```bash
npm run validate
npm run build
```

## Adding deployment automation

For automated Vercel production deploys from GitHub:

1. Connect repo in Vercel (preferred) — zero-config for Next.js
2. Or add a GitHub Actions deploy workflow using Vercel CLI and `VERCEL_TOKEN`

See `deployment.md` for Vercel-specific setup.
