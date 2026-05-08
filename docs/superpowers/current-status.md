# English Tutor App Current Status

Updated: 2026-05-09

## Start Here

Short entry point for new agents. Deep history and narrative live in:

```text
docs/superpowers/handoffs/2026-05-06-project-handoff.md
```

Persistence implementation plan (Phases A–D):

```text
docs/superpowers/plans/2026-05-08-prisma-persistence.md
```

Subagent-driven development is **mandatory** for handoff/plan work:

```text
.cursor/rules/default-subagent-driven-development.mdc
```

## Repository

- Path: `/Users/darren/code/build_ai/english_tutor_app`
- Branch: **`mvp-foundation`**
- Latest commits (newest first): **`6afbc4b`** → **`b391f1d`** → **`1a4215d`** → … (see handoff for full list)

## Product State (runtime)

Completed **prototype** capabilities include:

1. MVP foundation (domain, Prisma schema, role shell).
2. Book ingestion UI + mock OCR → **PostgreSQL** via **`src/lib/book-ingestion/prisma-book-repository.ts`** (`getBookIngestionRepository()`).
3. Practice generation + grading → **PostgreSQL** via **`src/lib/practice/prisma-practice-repository.ts`** (`getPracticeRepository()`).
4. Child UX: one exercise at a time (`practice-stepper.tsx`), recent attempts list, Server Actions passed from server components where needed.
5. Parent dashboard: **低掌握度知识点** from practice DB (prototype child).
6. Dev DB: **`docker-compose.yml`**, **`prisma/migrations/`**, **`prisma/seed.ts`** (`prototype-family` / users / `ChildProfile`).
7. Larger photo uploads (`next.config.ts` body limit **25mb**).

**Still not production-grade:** real OCR/AI, object storage for images, real speech, production auth, CI always-on Postgres.

## Persistence Rules Of Thumb

- **`DATABASE_URL`** must be set for dev (e.g. copy `.env.example` → `.env`). Prisma Studio and the app both need it.
- After pulling: **`npx prisma migrate deploy`** (or `migrate dev`) then **`npm run db:seed`** if schema/seed changed.
- **`submitAttempt`** expects **`ChildProfile`** for `prototype-child` — seed creates this.
- Unit tests still use **`createInMemoryBookIngestionRepository()`** and **`createInMemoryPracticeRepository()`** only; production paths use Prisma.

## Recommended Next Work

From **`2026-05-08-prisma-persistence.md`** — **Phase D** and follow-ups:

- Remove obsolete in-memory singleton globals if any remain; document CI/test strategy (`DATABASE_URL` for e2e).
- Run **`npm run test:e2e`** against a running DB + dev server.
- Optional: README/db troubleshooting (Docker Hub mirrors), integration tests behind env.

UX polish backlog (non-blocking): empty states, dashboard placeholders (**待复核 AI 判断**), streak/global metrics.

## Verification Snapshot (last recorded locally)

```text
npm run prisma:generate
npm run typecheck  → pass
npm run lint       → pass
npm run test       → 9 files, 41 tests passed
```

Re-run **`npm run test:e2e`** after major persistence changes.

## Known Caveats

- Images remain **data URLs or URLs stored as strings** — large payloads in Postgres; not CDN/object storage.
- **`Exercise.createdOrder`** / concurrent `ensure*` ordering — see code review notes in prisma practice repo (prototype acceptable).
- Browser extensions may cause spurious React hydration warnings in dev.

## One-Line Handoff

Take over **`mvp-foundation`** at `/Users/darren/code/build_ai/english_tutor_app`: book ingestion and practice are **Prisma-backed** (commits through **`6afbc4b`**); local Postgres via compose + migrate + seed; child/parent UX polish partially done. Next: **Phase D** in the prisma persistence plan + **e2e/CI** hardening.
