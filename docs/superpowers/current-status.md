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
4. Child UX: practice stepper on **`/child/today`** — **答对后进入下一题**，最后一题答对后本轮完成；recent attempts list；**P2.3 练习总览**（连续打卡、今日/累计作答）；Server Actions + `router.refresh()` after submit. See **`docs/superpowers/plans/2026-05-10-child-practice-stepper-session-flow.md`**.
5. Parent dashboard: **低掌握度知识点** from practice DB (prototype child).
6. Parent **绘本列表** **`/parent/books`** (`listBooksForFamily`) — upload → 列表 → 校对闭环。
7. Dev DB: **`docker-compose.yml`**, **`prisma/migrations/`**, **`prisma/seed.ts`** (`prototype-family` / users / `ChildProfile`).
8. Larger photo uploads (`next.config.ts` body limit **25mb**).

**Still not production-grade:** real OCR/AI, object storage for images, real speech, production auth, CI always-on Postgres.

## Persistence Rules Of Thumb

- **`DATABASE_URL`** must be set for dev (e.g. copy `.env.example` → `.env`). Prisma Studio and the app both need it.
- After pulling: **`npx prisma migrate deploy`** (or `migrate dev`) then **`npm run db:seed`** if schema/seed changed.
- **`submitAttempt`** expects **`ChildProfile`** for `prototype-child` — seed creates this.
- Unit tests still use **`createInMemoryBookIngestionRepository()`** and **`createInMemoryPracticeRepository()`** only; production paths use Prisma.

## Recommended Next Work

Prioritized backlog: **`docs/superpowers/plans/2026-05-10-next-development.md`**. **P0** / **P1** / **P2**（含 **P2.3** 练习总览，见 spec **`2026-05-09-p2.3-practice-overview-streak.zh.md`**）完成度见该计划。下一步可选 **P3** 技术债或产品深化。

UX polish：P2 核心条目标已覆盖；进一步游戏化可另开计划。

## Verification Snapshot (last recorded locally)

```text
npm run prisma:generate
npm run typecheck  → pass
npm run lint       → pass
npm run test       → 10 files, 50 tests passed
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

Take over **`mvp-foundation`** at `/Users/darren/code/build_ai/english_tutor_app` (**tip:** run `git log -1`): Prisma book + practice, CI (**`.github/workflows/ci.yml`**), P2 UX（含 **`/parent/books`**、**`/child/today`** 练习总览 P2.3）。下一步：**`docs/superpowers/plans/2026-05-10-next-development.md`**（P3 / 可选 P1.3）。必读交接：**`docs/superpowers/handoffs/2026-05-06-project-handoff.md`**「Latest Handoff Update」。计划内多文件改动：**SDD**（`.cursor/rules/default-subagent-driven-development.mdc`）；Git SSH 代理问题：**`.cursor/rules/git-ssh-proxy-bypass.mdc`**。
