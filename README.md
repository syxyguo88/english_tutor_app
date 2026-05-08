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
- `npm run test:e2e` (Playwright) starts the Next.js dev server via `playwright.config.ts` and expects `DATABASE_URL` to point at a running, seeded database.
