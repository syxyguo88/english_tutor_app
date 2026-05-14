# Next development plan (post–Prisma prototype + child page perf)

Updated: 2026-05-10  
**长期路线图（A–E）：** [2026-05-12-long-term-roadmap.zh.md](./2026-05-12-long-term-roadmap.zh.md)  
**Context:** Persistence Phases A–D are reflected in the repo (runtime **`get*Repository()`** uses Prisma; Phase D status is documented in **`2026-05-08-prisma-persistence.md`**). Child `/child/today` **two-phase `Exercise` reads**, `PROFILE_CHILD_TODAY` profiling, and `unstable_cache` for confirmed→exercise sync are in place. This plan picks up **verification, CI, product polish, and optional deeper work**.

Use **`superpowers:subagent-driven-development`** when executing multi-file tasks from this plan unless the change is trivial.

---

## P0 — Ship-quality verification (do first)

**Checkbox copy for agents:** the same list lives in **`docs/superpowers/handoffs/2026-05-06-project-handoff.md`** section **“P0 checklist — ship-quality verification”** — update checkboxes there when working so the next session sees progress.

### P0.1 — E2E path works on a “clean” machine flow

- [x] README **Local database** + Playwright steps form one coherent sequence (patch README if needed).
- [x] Postgres up (`docker compose up -d` or local); **`.env`** from `.env.example`.
- [x] `npx prisma migrate deploy`, **`npm run db:seed`**, **`npm run prisma:generate`**.
- [x] **`npm run playwright:install`** (minimum Chromium).
- [x] **`npm run test:e2e`** — Chromium suite green.
- [x] Optional: **`npm run test:e2e:all`** or document WebKit skip.

### P0.2 — Production-like timing spot-check

- [x] **`npm run build`** succeeds.
- [x] **`npm run start`**; warm **`/parent/dashboard`** and **`/child/today`**; note rough latency vs **`npm run dev`**.
- [x] Optional: append one line to **`docs/superpowers/current-status.md`** verification snapshot.

### P0.3 — Persistence plan doc hygiene

- [x] **`docs/superpowers/plans/2026-05-08-prisma-persistence.md`** Phase D: **`[x]`** completed items or footnote “done / remaining”.
- [x] **`docs/superpowers/current-status.md`** “Recommended Next Work” does not falsely imply Phase D is still open.

---

## P1 — CI & test strategy

| ID | Task | Acceptance | Verification |
|----|------|------------|----------------|
| P1.1 | **GitHub Actions (or chosen CI)** workflow | Job: checkout → `npm ci` → `npx prisma migrate deploy` against service Postgres (or `docker run`) → `npm run prisma:generate` → `typecheck` + `lint` + `test`. | CI green on branch. |
| P1.2 | **Optional: e2e job** | Same pipeline + `npm run playwright:install --with-deps` (or cache browsers) + `npm run test:e2e` with `DATABASE_URL` and seeded DB. | Job green or explicitly `continue-on-error` with ticket link. |
| P1.3 | **Integration tests (optional)** | Opt-in Prisma tests behind `RUN_INTEGRATION=1` + test DB URL; document in README. | `RUN_INTEGRATION=1 npm run test` passes when DB available. |

**P1 progress (2026-05-10):** P1.1 and P1.2 are implemented in-repo via `.github/workflows/ci.yml` with separate `unit` and Chromium `e2e` jobs against PostgreSQL 16. **P1.3:** opt-in Prisma integration tests — `src/lib/practice/prisma.integration.test.ts` (`*.integration.test.ts`), `RUN_INTEGRATION=1`, URL precedence `INTEGRATION_DATABASE_URL` → `DATABASE_URL`; documented in README (**Opt-in Prisma integration tests**).

---

## P2 — Product / UX (prototype polish)

| ID | Task | Acceptance | Verification |
|----|------|------------|----------------|
| P2.1 | **Empty states** | Parent/child flows show clear copy when no books / no exercises / no attempts. | Manual + e2e where cheap. |
| P2.2 | **Dashboard “待复核 AI 判断”** | Replace hardcoded `0` with real metric or explicit “未实现”占位 + link to backlog. | Parent dashboard renders; copy accurate. |
| P2.3 | **Streak / global metrics** | Thin slice: local-calendar **practice streak** + **attempts today/total** on **`/child/today`**. Spec: **`docs/superpowers/specs/2026-05-09-p2.3-practice-overview-streak.zh.md`**. | Unit tests for calendar + in-memory overview; manual smoke on child page. |

**P2 progress (2026-05-09):** **P2.1** shipped — empty states for「最近作答」、家长总览无待校对时的上传引导、绘本校对页零页面提示。**P2.2** shipped —「待复核 AI 判断」改为占位 **—** + 脚注说明原型未接入 AI 复核队列，并指向本文件。**P2.3** shipped — **`getChildPracticeOverview`**（连续打卡天、今日/累计作答）+ **`/child/today`** 顶部「我的练习」卡片；规格见 **`docs/superpowers/specs/2026-05-09-p2.3-practice-overview-streak.zh.md`**。

**Also shipped:** Parent **`/parent/books`** index + **`listBooksForFamily`** (绘本列表 → 校对)，导航「绘本」指向列表；上传仍为 **`/parent/books/new`**。

---

## P3 — Technical debt (schedule when needed)

| ID | Task | Notes |
|----|------|--------|
| P3.1 | **Images** | Data URLs in Postgres hurt size and `Exercise` JSON; spike object storage + short URLs, or cap upload size further. |
| P3.2 | **`getRecentAttempts` payload** | If profiling shows cost, mirror two-phase pattern or `select` slimmer exercise fields for list rows. |
| P3.3 | **Profiling flags** | Keep `PROFILE_CHILD_TODAY`; optionally gate logs behind second env to reduce noise. |
| P3.4 | **Prisma 7 / `prisma.config.ts`** | Address deprecation warning when upgrading. |

**P3 progress (2026-05-09):** **P3.2** — `getRecentAttempts` uses `exercise: { select: { type: true } }`; `attemptRowToSummary` typed with `Pick<Exercise, "type">`. **P3.3** — `childTodayProfileLogJson` gated by `PROFILE_CHILD_TODAY_JSON=1` in addition to `PROFILE_CHILD_TODAY` (`isChildTodayProfileDetail`). **P3.1** — per-page upload cap `MAX_BOOK_PAGE_IMAGE_BYTES` (5 MiB) in book upload action + README **Upload limits**. **P3.4** — not upgraded in-repo yet (major-version bump; track release notes / `prisma.config.ts` when adopting Prisma 7).

---

## Explicit non-goals (this plan cycle)

- Production auth, real OCR, real speech (see design doc / later roadmap).
- Multi-tenant families (prototype remains single seeded family unless spec changes).

---

## Verification commands (recurring)

```bash
npm run prisma:generate
npm run typecheck
npm run lint
npm run test
npm run test:e2e          # after playwright:install; DB + seed
```

**Perf spot-check (dev):** `PROFILE_CHILD_TODAY=1 npm run dev` — grep `[profile:child-today]`; see README and `docs/superpowers/current-status.md`.

---

## References

- `docs/superpowers/current-status.md`
- `docs/superpowers/handoffs/2026-05-06-project-handoff.md`
- `docs/superpowers/plans/2026-05-08-prisma-persistence.md`
- README: Local database, Playwright, `PROFILE_CHILD_TODAY`, `allowedDevOrigins`
