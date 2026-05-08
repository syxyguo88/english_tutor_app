# english_tutor_app
English tutor app for my daughters

## Local database

The app uses PostgreSQL via Prisma. Bring up a local database and seed it before running the dev server, tests, or e2e:

```bash
cp .env.example .env
docker compose up -d
npx prisma migrate deploy   # or `npm run db:migrate` for `prisma migrate dev`
npm run db:seed
```

Notes:

- `DATABASE_URL` from `.env.example` matches the credentials in `docker-compose.yml`.
- **End-to-end (Playwright):** after `npm install` or upgrading `@playwright/test`, run **`npm run playwright:install`** once to download browser binaries (otherwise you see “Executable doesn't exist”).
- `npm run test:e2e` runs **Chromium** only. Use **`npm run test:e2e:all`** to run every project in `playwright.config.ts` (includes WebKit / “mobile-safari”; requires those browsers installed).
- Playwright starts the Next.js dev server via `playwright.config.ts` and expects `DATABASE_URL` to point at a running, seeded database. If port **3000** is already in use, run `E2E_PORT=3001 npm run test:e2e` (or another free port). The Playwright config prepends `127.0.0.1,localhost` to `NO_PROXY` so a system HTTP proxy does not fake responses on loopback (which used to make Playwright skip starting the server).
