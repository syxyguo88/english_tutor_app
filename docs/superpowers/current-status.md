# English Tutor App Current Status

Updated: 2026-05-11

## Start Here

Short entry point for new agents. Deep history and narrative live in:

```text
docs/superpowers/handoffs/2026-05-06-project-handoff.md
```

**Product / phase priorities (stakeholder):**

```text
docs/superpowers/plans/2026-05-11-phase-priorities-parent-child.md
```

Persistence (Phases A–D):

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
- **Tip:** run **`git log -1`** locally (recent work includes C6 book review, child practice stepper, P1.3 integration tests, partial P3, book-ingestion **HMR singleton refresh**).

## Product State (runtime)

Completed **prototype** capabilities include:

1. MVP foundation (domain, Prisma schema, role shell).
2. Book ingestion UI + mock OCR → **PostgreSQL** via **`src/lib/book-ingestion/prisma-book-repository.ts`** (`getBookIngestionRepository()`). **C6 APIs:** `listBooksWithReviewSentencesForFamily`, `getBookSentenceReviewList`; global repo **re-instantiated** if cached object lacks these methods (dev HMR).
3. Practice generation + grading → **PostgreSQL** via **`src/lib/practice/prisma-practice-repository.ts`** (`getPracticeRepository()`).
4. **Child `/child/today`:** practice stepper — **advance to next exercise only after a correct answer**; last exercise → session complete + 「再练一次」; `submitPracticeAttemptAction` returns `{ isCorrect }` + **`router.refresh()`**; recent attempts; **P2.3** overview strip. Plan: `docs/superpowers/plans/2026-05-10-child-practice-stepper-session-flow.md`.
5. **Child `/child/book-review`:** book list + **`/child/book-review/[bookId]`** sentence list (read-only review MVP); shared **`src/app/child/child-nav.ts`**. Spec: **`docs/superpowers/specs/2026-05-11-c6-child-book-review-mvp.zh.md`**. Does **not** call `syncConfirmedPracticeExercises` (that stays on `/child/today`).
6. Parent dashboard + **`/parent/books`** upload → list → **`/[bookId]/review`** confirm loop.
7. Dev DB: **`docker-compose.yml`**, **`prisma/migrations/`**, **`prisma/seed.ts`** (`prototype-family` / users / **`ChildProfile`**).
8. Upload: per-page **5 MiB** cap (`src/lib/book-ingestion/upload-limits.ts`); Next **`serverActions.bodySizeLimit` 25mb** (`next.config.ts`).

**Still not production-grade:** real OCR/AI, object storage, real speech, production auth; **PictureSentence** image URLs may break if stored data is invalid (explicitly **not** P0 for current phase).

## Persistence Rules Of Thumb

- **`DATABASE_URL`** in `.env` (from `.env.example`). After pull: **`npx prisma migrate deploy`**, **`npm run db:seed`**, **`npm run prisma:generate`**.
- **`submitAttempt`** needs **`ChildProfile`** for `prototype-child` (seed).
- Unit tests: in-memory book + practice repos; integration: **`RUN_INTEGRATION=1 npm run test`** (see README).

## Recommended Next Work

1. **`docs/superpowers/plans/2026-05-11-phase-priorities-parent-child.md`** — **Track A** remainder (small reliability, excluding deferred 看图裂图); optional **C6 e2e** (spec AC7); **「我的星星」** still placeholder → `/child/today`.
2. **`docs/superpowers/plans/2026-05-10-next-development.md`** — **P3.4** Prisma 7, remaining P3, **img `src` allowlist** (security hardening when URLs are user-controlled).
3. Multi-file features: **SDD**; when the plan asks for **TDD**, add failing tests before implementation.

## Verification Snapshot (last recorded locally)

```text
npm run prisma:generate
npm run typecheck  → pass
npm run lint       → pass
npm run test       → ~12 files, 63 passed, 1 skipped (opt-in prisma.integration.test.ts)
```

Re-run **`npm run test:e2e`** after large persistence or nav/route changes.

- **CI:** `.github/workflows/ci.yml` — `main` / `mvp-foundation`.

## `PROFILE_CHILD_TODAY`（孩子端性能对照）

Set **`PROFILE_CHILD_TODAY=1`** for phase timing logs. Add **`PROFILE_CHILD_TODAY_JSON=1`** for structured JSON lines. See README.

## Known Caveats

- Images: **data URLs** in DB — large payloads; optional thumbnails on book-review may fail → hidden by design.
- **`getBookIngestionRepository()`:** stale global after adding repository methods was fixed by **recreating** when C6 methods are missing; if odd runtime errors persist, **`rm -rf .next`** and restart dev.
- **Docker:** mirror / local Postgres if Hub pull fails.

## One-Line Handoff

Take over **`mvp-foundation`** at `/Users/darren/code/build_ai/english_tutor_app` (**`git log -1`** for tip): read **`docs/superpowers/handoffs/2026-05-06-project-handoff.md`** «Latest Handoff Update» (2026-05-11) and this file. **C6** `/child/book-review` shipped; **child today** = correct-only advance + refresh; **P1.3** + partial **P3**. Next: **`2026-05-11-phase-priorities-parent-child.md`**, **`2026-05-10-next-development.md`**. **SDD** for multi-file work; **`.cursor/rules/git-ssh-proxy-bypass.mdc`** for GitHub SSH.
