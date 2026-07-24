# AGENTS.md

## Cursor Cloud specific instructions

SUCCESS OS is a single **Next.js 15 / React 19** web app (App Router). Package manager is **npm** (`package-lock.json`, Node >=20 / npm >=10). All `/api/*` routes are in-process Next.js route handlers — there is no separate backend service or database to run. Content/data lives in versioned JS files under `app/data/`.

### Running

- Dev server: `npm run dev` (serves at `http://127.0.0.1:3000`). This is the only service required to exercise the product end to end.
- The app boots with **no external credentials**: `FEATURE_AUTH_ENABLED=false` (and `NEXT_PUBLIC_FEATURE_AUTH_ENABLED=false`) disable Firebase, so the full public learner journey and all `/api/*` handlers work out of the box. Copy `.env.example` → `.env.local` (values can stay blank for local preview). `.env.local` is gitignored.
- Authenticated/role-gated flows require real Firebase client + admin credentials and setting `FEATURE_AUTH_ENABLED=true`; these are optional and not needed for general development.

### Lint / typecheck / build

- Standard scripts are in `package.json`: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`. `npm run validate` chains typecheck + lint + format:check.
- Gotcha: on the current base branch, `npm run lint` and `npm run typecheck` report **pre-existing** errors (mostly `no-explicit-any` / implicit-any in `components/student-portal/books/*` and a few pages). These are code issues, not environment problems — the tooling itself runs correctly. Because CI runs `npm run build` (which type-checks) with `FEATURE_AUTH_ENABLED=true`, a production `build` can fail on these pre-existing type errors even though `npm run dev` compiles and serves fine on demand.

### Other toolchains (optional, not needed for the product)

- Legacy Cloudflare/Vinext runtime: `npm run dev:vinext` (port 3001).
- Standalone Vite marketing landing (`index.html` → `src/main.jsx`).
- Node CLI content/curriculum engines: the many `npm run validate:*`, `jo:*`, `me:*`, `knowledge:*` scripts under `scripts/` — run on demand, not services.
