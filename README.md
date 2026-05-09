# english_tutor_app
English tutor app for my daughters

**Next development plan:** [`docs/superpowers/plans/2026-05-10-next-development.md`](docs/superpowers/plans/2026-05-10-next-development.md)

## Getting started

From a fresh clone, run these steps in order (details and notes below):

```bash
git clone <repository-url>
cd english_tutor_app
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate deploy    # production-like / CI; for local iteration use `npm run db:migrate`
npm run db:seed
npm run prisma:generate
npm run playwright:install   # or `npx playwright install chromium` if you only need Chromium e2e
npm run test:e2e             # if port 3000 (or your chosen `E2E_PORT`) is busy, see notes below
```

Handoffs and CI should use **`npx prisma migrate deploy`** against the target database. In daily development you may prefer **`npm run db:migrate`** (`prisma migrate dev`) when creating or adjusting migrations.

## CI

GitHub Actions CI lives in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). It runs unit checks and Chromium e2e on pushes and pull requests targeting `main` or `mvp-foundation`, each against a PostgreSQL 16 service that matches `docker-compose.yml`.

## Opt-in Prisma integration tests

Vitest runs **unit tests only** by default (`npm run test`). Prisma integration tests live in files named `*.integration.test.ts` and run only when:

```bash
RUN_INTEGRATION=1 npm run test
```

Vitest does not load `.env` by itself; ensure **`DATABASE_URL`** (or **`INTEGRATION_DATABASE_URL`**) is exported in the shell—for example `set -a && . ./.env && set +a` before the command if you keep credentials in **`.env`**.

- **`INTEGRATION_DATABASE_URL`** is used when set; otherwise tests use **`DATABASE_URL`**.
- The database must exist, be **migrated** (`npx prisma migrate deploy` or `npm run db:migrate`), and **seeded** if a test depends on seed data (e.g. the prototype family in `prisma/seed.ts`).

Set `RUN_INTEGRATION=1` only when Postgres is up and configured; default CI does not set this flag, so the standard unit job does not need an integration database.

## Local database

The app uses PostgreSQL via Prisma. Bring up a local database and seed it before running the dev server, tests, or e2e:

```bash
cp .env.example .env
docker compose up -d
npx prisma migrate deploy   # or `npm run db:migrate` for `prisma migrate dev`
npm run db:seed
npm run prisma:generate
```

Notes:

- `DATABASE_URL` from `.env.example` matches the credentials in `docker-compose.yml`.
- **End-to-end (Playwright):** after `npm install` or upgrading `@playwright/test`, run **`npm run playwright:install`** once to download browser binaries (otherwise you see “Executable doesn't exist”). To install only Chromium: **`npx playwright install chromium`** (enough for **`npm run test:e2e`**).
- `npm run test:e2e` runs **Chromium** only. Use **`npm run test:e2e:all`** to run every project in `playwright.config.ts` (includes WebKit / “mobile-safari”; requires those browsers installed — run **`npm run playwright:install`** without filtering, or install the missing projects via `npx playwright install webkit` etc.).
- Playwright starts the Next.js dev server via `playwright.config.ts` and expects `DATABASE_URL` to point at a running, seeded database. If port **3000** is already in use, run **`E2E_PORT=<free-port> npm run test:e2e`** (for example `3001`; if that port is taken too, choose any unused port such as `3099`). The Playwright config prepends `127.0.0.1,localhost` to `NO_PROXY` so a system HTTP proxy does not fake responses on loopback (which used to make Playwright skip starting the server).
- In dev, open the app with a **single host** for the session (prefer **`http://localhost:3000`**). Mixing `localhost` and `127.0.0.1` can break client navigation with a **TypeError: network error**; `next.config.ts` sets `allowedDevOrigins` to reduce that.
- Prisma **SQL query logging** in development is off by default (faster navigation). Set **`PRISMA_LOG_QUERIES=1`** when you need verbose SQL in the terminal.
- **`/child/today`** syncs confirmed sentences → `Exercise` rows behind a short-lived **Next `unstable_cache`** (tag `confirmed-practice-sync`). After you confirm a page in the parent review UI, that tag is revalidated so the child view picks up new exercises. Repeat visits to the child page stay much faster than the first load after a confirmation.

### Troubleshooting

- **Docker:** if your network cannot pull images from Docker Hub, use a registry mirror or install Postgres locally and point **`DATABASE_URL`** at it (same schema/user as in `.env.example` or your own credentials).
- **Playwright WebKit:** if **`npm run test:e2e:all`** fails with missing WebKit, install it (`npx playwright install webkit`) or run Chromium-only **`npm run test:e2e`**.

### `PROFILE_CHILD_TODAY`（孩子端性能对照）

Set **`PROFILE_CHILD_TODAY=1`** when running **`npm run dev`** (or `start`) to print **`[profile:child-today]`** timings for `/child/today` in the server console.

**Why two-phase `Exercise` reads in `getTodayPractice`:** Profiling showed a single `findMany` for ~120 rows took **~3s** because each row carries large **`prompt` / `expectedAnswer` JSON** (e.g. long image URLs). The implementation now (1) **`select`** only light columns over the scan window to decide which exercises are “due”, then (2) **`findMany({ id: { in: … } })`** full rows for the small set actually shown (typically **≤ `limit`**). Compare **`getTodayPractice_exercise_scan_select`** vs **`getTodayPractice_exercise_full_by_ids`** in the logs. Instrumentation: `src/lib/profile/child-today-profile.ts`, `getTodayPractice` in `src/lib/practice/prisma-practice-repository.ts`.
