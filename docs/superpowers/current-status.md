# English Tutor App Current Status

Updated: 2026-05-10

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

Prioritized backlog: **`docs/superpowers/plans/2026-05-10-next-development.md`**. **P0** / **P1** complete in-repo; **P2.1** empty states and **P2.2** dashboard AI-review placeholder are implemented (commit **`feat(ux): P2 empty states…`**). Next optional work: **P2.3** streak/metrics or **P3** tech debt.

UX polish backlog (non-blocking): **P2.3** streak/global metrics if prioritized.

## Verification Snapshot (last recorded locally)

```text
npm run prisma:generate
npm run typecheck  → pass
npm run lint       → pass
npm run test       → 9 files, 41 tests passed
```

Re-run **`npm run test:e2e`** after major persistence changes.

- **CI (2026-05-10):** `.github/workflows/ci.yml` added with unit + Chromium e2e jobs against PostgreSQL 16; validate green status on push/PR.

**Prod spot-check (2026-05-09):** `npm run build` exit 0; `PORT=3010 npm run start` (3000 busy). After warm-up, `curl` `time_total` ~0.10–0.21s `/parent/dashboard`, ~0.10–0.21s `/child/today`; dev on 3020 similar (~0.10–0.11s) — acceptable for prototype.

## `PROFILE_CHILD_TODAY`（孩子端性能对照）

Set **`PROFILE_CHILD_TODAY=1`** with dev server to log **`[profile:child-today]`** timings for `/child/today`. Profiling found **`getTodayPractice`** was dominated by loading **full `Exercise` rows** (~120 rows, huge JSON). Fix: **two-phase query** — light `select` over the scan window, then full rows **`where: { id: { in: chosenIds } }`** for only the exercises shown (see README “`PROFILE_CHILD_TODAY`” and `prisma-practice-repository.ts`).

## Known Caveats

- Images remain **data URLs or URLs stored as strings** — large payloads in Postgres; not CDN/object storage.
- **`Exercise.createdOrder`** / concurrent `ensure*` ordering — see code review notes in prisma practice repo (prototype acceptable).
- Browser extensions may cause spurious React hydration warnings in dev.

## One-Line Handoff

Take over **`mvp-foundation`** at `/Users/darren/code/build_ai/english_tutor_app`: book ingestion and practice are **Prisma-backed** (commits through **`6afbc4b`**); local Postgres via compose + migrate + seed; child/parent UX polish partially done. Next: follow **`docs/superpowers/plans/2026-05-10-next-development.md`** (e2e/CI, UX polish, optional deeper perf/infra).
