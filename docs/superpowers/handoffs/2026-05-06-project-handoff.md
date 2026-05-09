# English Tutor App Project Handoff

Date: 2026-05-06

## Start Here For New Agents

For a short current-state entry point, read:

```text
docs/superpowers/current-status.md
```

Prioritized next steps (verification → CI → UX):

```text
docs/superpowers/plans/2026-05-10-next-development.md
```

Use this full handoff as the historical record when deeper context is needed.

## P0 checklist — ship-quality verification (next agent)

**Goal:** Close **`docs/superpowers/plans/2026-05-10-next-development.md`** section **P0** before starting P1 (CI). Use **SDD** (`.cursor/rules/default-subagent-driven-development.mdc`) for multi-file work; mark items `[x]` as you finish.

### P0.1 — E2E path works on a “clean” machine flow

- [x] Read README **Local database** + Playwright notes; confirm **one** coherent sequence from clone → DB → seed → e2e (patch README if any step is missing or wrong).
- [x] Start Postgres: `docker compose up -d` (or equivalent local Postgres); ensure **`.env`** exists (`cp .env.example .env`).
- [x] `npx prisma migrate deploy` (or `npm run db:migrate` in dev), then **`npm run db:seed`**, then **`npm run prisma:generate`**.
- [x] **`npm run playwright:install`** (minimum Chromium; document if WebKit skipped).
- [x] **`npm run test:e2e`** (default Chromium project) — **all green**.
- [x] Optional: **`npm run test:e2e:all`** if WebKit browsers installed; if skipped, note “WebKit not installed” in `current-status` or README troubleshooting.

**Done when:** Chromium e2e passes against seeded DB; commands above are copy-pasteable for the next developer.

### P0.2 — Production-like timing spot-check

- [ ] **`npm run build`** succeeds with no errors.
- [ ] **`npm run start`** (production server on port 3000 or note alternate port).
- [ ] After warm-up, hit **`/parent/dashboard`** and **`/child/today`**; record rough latency vs same routes on **`npm run dev`** (one-line notes OK).
- [ ] Optional: add a **Verification snapshot** line to **`docs/superpowers/current-status.md`** (build/start timing or “spot-check 2026-__-__”).

**Done when:** You have a subjective sense that prod mode is acceptable; optional snapshot committed.

### P0.3 — Persistence plan doc hygiene (Phase D vs reality)

- [ ] Open **`docs/superpowers/plans/2026-05-08-prisma-persistence.md`** — **Phase D** section.
- [ ] For each Phase D bullet: set **`[x]`** if done, or add a **short footnote** under the section (“Remaining: …” / “Done in commit …”).
- [ ] If Phase D is fully satisfied, trim **“Recommended Next Work”** in **`docs/superpowers/current-status.md`** so it does not still ask for Phase D as if outstanding (point at **`2026-05-10-next-development.md`** only).

**Done when:** A new agent reading the persistence plan does not get a false “Phase D still open” signal.

---

## Latest Handoff Update

Updated: 2026-05-10 (P0 checklist for next agent)

### Branch and tip commit

- **Path:** `/Users/darren/code/build_ai/english_tutor_app`
- **Branch:** `mvp-foundation`
- **Recent commits (newest first — use `git log` for truth):**
  - `6afbc4b` — feat(practice): persist exercises, attempts, mastery via Prisma (**Phase C**)
  - `b391f1d` — feat(book-ingestion): persist books and pages with Prisma (**Phase B**)
  - `1a4215d` — chore(db): Postgres compose, initial migration, Prisma seed (**Phase A**)
  - `667d34c` — feat(child): recent attempt history on `/child/today`
  - `4d93996` — feat(parent): low mastery metric from practice repository
  - `c28276e` — chore(rules): mandatory **subagent-driven development** (`.cursor/rules/default-subagent-driven-development.mdc`)
  - `b441169` — feat(child): practice stepper (one exercise at a time, server action passed from server component)

Working tree at this edit: commit documentation updates as needed.

### Agent workflow (mandatory for plan/handoff work)

- Read **once:** `docs/superpowers/current-status.md` and the relevant section of `docs/superpowers/plans/2026-05-08-prisma-persistence.md`.
- Follow **`.cursor/rules/default-subagent-driven-development.mdc`**: coordinator dispatches **Task/subagents** per task; **spec review then code review**; coordinator does **not** implement application code for those tasks.

### What runs on Postgres vs in-memory

| Layer | Runtime (`get*Repository()`) | Unit tests |
|-------|------------------------------|------------|
| Book ingestion | **Prisma** — `src/lib/book-ingestion/prisma-book-repository.ts` wired from `repository.ts` | `createInMemoryBookIngestionRepository()` in `repository.test.ts` |
| Practice | **Prisma** — `src/lib/practice/prisma-practice-repository.ts` wired from `repository.ts` | `createInMemoryPracticeRepository()` in `repository.test.ts` |

Shared constants (avoid circular imports): `src/lib/practice/constants.ts` (`LOW_MASTERY_SCORE_THRESHOLD`, `RECENT_ATTEMPTS_BUFFER_SIZE`), re-exported from `repository.ts`.

### Database and migrations

- **Compose:** `docker-compose.yml` — Postgres 16, credentials align with `.env.example`.
- **Migrations:** under `prisma/migrations/` including initial schema + later **`Exercise` ordering / `pageId` / Attempt mastery snapshot** (`20260508133000_exercise_order_page_attempt_mastery_snapshot`).
- **Seed:** `prisma/seed.ts` — `prototype-family`, `prototype-parent`, `prototype-child`, **`ChildProfile`** with `grade: "G1"`. **`submitAttempt`** expects this profile to exist.
- **Local setup:** copy `.env.example` → `.env` so **`DATABASE_URL`** is set (required for app, Prisma Studio, and migrations). After pull: `npx prisma migrate deploy`, `npm run db:seed`, `npm run prisma:generate`.

### UX notes (child / parent)

- **`PROFILE_CHILD_TODAY` (perf):** Set **`PROFILE_CHILD_TODAY=1`** in dev to log **`[profile:child-today]`** for `/child/today`. **`getTodayPractice`** uses a **two-phase `Exercise` read** (light `select` for eligibility scan, then full rows by id for the few shown) because profiling showed one full `findMany` over ~120 rows was **~3s** due to large **`prompt` / `expectedAnswer` JSON**. See README subsection “`PROFILE_CHILD_TODAY`” and `src/lib/practice/prisma-practice-repository.ts`.
- **`/child/today`:** `PracticeStepper` client component; **`submitPracticeAttemptAction`** passed as a prop from the server page (avoids `UnrecognizedActionError` after HMR).
- **Serialization:** `client-practice-exercise.ts` — `toClientExercise()` must stay in a **non-**`"use client"` module (do not call client-module helpers from RSC).
- **Parent dashboard:** “低掌握度知识点” uses `countLowMasteryKnowledge` for the prototype child.

### Product boundaries (unchanged intent)

Still a **family prototype**: deterministic practice/OCR mock, no real AI grading, images often **data URLs stored as strings** in the DB (not object storage), no production auth. Long-term goals remain in `docs/superpowers/specs/2026-05-04-private-english-tutor-app-design.zh.md`.

### Verification snapshot (last recorded)

```bash
npm run prisma:generate
npm run typecheck   # pass
npm run lint        # pass
npm run test        # 9 files, 41 tests pass (in-memory repository tests only)
```

Re-run **`npm run test:e2e`** with Postgres up and **`npm run dev`** after persistence changes. CI may need **`DATABASE_URL`** or a test DB service.

### Known caveats

- **Docker:** some networks cannot pull `postgres` from Docker Hub; use registry mirrors or install Postgres via Homebrew instead.
- **Next.js:** `Cannot find module './NNN.js'` or stale Server Actions — delete **`.next`** and restart dev server.
- **Prisma Studio:** requires **`DATABASE_URL`** in environment (`.env` at project root).
- **Exercise `createdOrder`:** concurrent `ensure*` could theoretically collide under extreme parallelism (acceptable for prototype).

### Recommended next tasks

1. **P0 checklist** (this document, section **“P0 checklist — ship-quality verification”**): e2e path, build/start spot-check, persistence plan Phase D hygiene — then proceed to **`docs/superpowers/plans/2026-05-10-next-development.md`** P1 (CI).
2. **UX polish (P2):** empty states; dashboard card **待复核 AI 判断** still placeholder `0`.
3. **Real ingestion / infra** (later): object storage, OCR provider, audio pipeline.

### One-Line Handoff

```text
Take over /Users/darren/code/build_ai/english_tutor_app on branch mvp-foundation. Read docs/superpowers/current-status.md and docs/superpowers/handoffs/2026-05-06-project-handoff.md — complete the P0 checklist (e2e, build/start spot-check, Phase D doc hygiene), then docs/superpowers/plans/2026-05-10-next-development.md. Follow .cursor/rules/default-subagent-driven-development.mdc for plan work.
```

## Repository

Project path:

```text
/Users/darren/code/build_ai/english_tutor_app
```

Current branch:

```text
mvp-foundation
```

Primary documents:

- Spec: `docs/superpowers/specs/2026-05-04-private-english-tutor-app-design.zh.md`
- MVP Foundation plan: `docs/superpowers/plans/2026-05-05-mvp-foundation.md`

## Project Goal

Build a family-use English picture-book learning Web App prototype for a first-grade child.

The target learning loop is:

1. Parent or child uploads paper picture-book pages by taking photos.
2. AI/OCR extracts English sentences, words, and phrases.
3. Parent reviews and confirms extracted content.
4. Confirmed content enters the book, sentence, word/phrase, and knowledge libraries.
5. The app generates targeted exercises.
6. The child answers by keyboard or speech-to-text where suitable.
7. AI performs initial grading and error attribution.
8. Parent can review uncertain or important AI judgments.
9. The app updates mastery stats.
10. The app schedules review using forgetting-curve-style intervals.

The first version is a cloud-hosted Web App prototype for one family. It is not a public SaaS product and not a native iOS app.

## Spec Summary

The confirmed design is in:

```text
docs/superpowers/specs/2026-05-04-private-english-tutor-app-design.zh.md
```

Key product decisions:

- Cloud Web App usable from iPad, iPhone, and desktop browsers.
- Parent account and child account.
- Parent uploads picture-book page images.
- Parent can also upload optional companion audio such as mp3 or m4a.
- AI OCR extracts text, sentence candidates, words, and phrases.
- AI can transcribe companion audio and align audio segments with confirmed sentences.
- AI output is draft-only until parent confirmation.
- Unconfirmed content must not enter official exercises, mastery stats, or review scheduling.
- Each book page stores two image assets:
  - Original image for review, debugging, and reprocessing.
  - Text-removed image for picture-based recall exercises.
- Companion audio is not a standalone listening-question system in v1. It is used as context or hints inside the picture-to-sentence exercise.
- The app keeps original images and audio in the prototype stage for review and debugging.
- The app does not perform pronunciation scoring or complex fluency scoring in v1.
- The app does not infer interests automatically in v1; parent sets lightweight interest tags.

Core exercise types:

- Fill-in-the-blank.
- Picture-to-sentence.
- Grammar error correction.
- Sentence creation with a word or phrase.

Picture-to-sentence audio hint modes:

- If one image has multiple confirmed sentences, play the first sentence and ask the child to produce the next sentence.
- Play the last sentence from the previous page or previous image and ask the child to produce the current image's sentence.

Mastery tracking granularity:

```text
child + knowledge item + variant + exercise type
```

Examples:

- `book` as item, `books` as plural variant, in fill-in-the-blank.
- `be verb agreement` as grammar item, `they are` as variant, in grammar error correction.
- `by bus` as phrase item, in sentence creation.

Initial review schedule:

- Same day.
- Day 1.
- Day 3.
- Day 7.
- Day 14.
- Day 30.

Scheduling adjusts by performance:

- Wrong answers shorten interval and increase priority.
- Consecutive correct answers lengthen interval and reduce priority.
- Low mastery score items can be pulled into today's practice.

## Implementation Plan

The current implementation plan is:

```text
docs/superpowers/plans/2026-05-05-mvp-foundation.md
```

This plan only covers the MVP foundation. It intentionally does not implement OCR, AI calls, uploads, file storage, image processing, audio alignment workers, practice generation, or production authentication.

Later plans should be split roughly as:

1. `Book Ingestion`
2. `Practice And Mastery`
3. `Parent And Child UX Polish`

MVP Foundation task list:

1. Project tooling and baseline app.
2. Domain rules for confirmation gates.
3. Mastery calculation foundation.
4. Database schema for MVP foundation.
5. Role routing and app shell.
6. Browser smoke tests.
7. Final foundation verification.

## Current Git History

Recent commits on `mvp-foundation`:

```text
dcc1dce feat: add Prisma foundation schema
818f2e9 feat: add mastery scoring foundation
e6b8274 fix: harden content practice gates
243dc7e feat: add content confirmation gate rules
d6feea1 fix: resolve Vitest setup path
880ee90 chore: keep foundation plan scoped
27b8ea3 chore: scaffold Next.js foundation
5fc400d Add MVP foundation implementation plan
e956ca6 Add Chinese design spec for English tutor app
```

## Current Progress

Completed and reviewed:

- Task 1: Project tooling and baseline app.
- Task 2: Domain rules for confirmation gates.
- Task 3: Mastery calculation foundation.

Implemented but not yet reviewed:

- Task 4: Database schema for MVP foundation.

Not started:

- Task 5: Role routing and app shell.
- Task 6: Browser smoke tests.
- Task 7: Final foundation verification.

Important handoff point:

```text
Task 4 has been implemented and committed as dcc1dce, but it still needs spec compliance review and code quality review.
```

## Implemented Files

Project/tooling:

- `.env.example`
- `.gitignore`
- `eslint.config.mjs`
- `next-env.d.ts`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `tsconfig.json`
- `vitest.config.ts`
- `vitest.setup.ts`

App shell baseline:

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`

Domain foundation:

- `src/domain/enums.ts`
- `src/domain/content-rules.ts`
- `src/domain/content-rules.test.ts`
- `src/domain/mastery.ts`
- `src/domain/mastery.test.ts`

Database foundation:

- `prisma/schema.prisma`
- `src/lib/db.ts`

## Implemented Behavior Details

### Content Gate Rules

File:

```text
src/domain/content-rules.ts
```

Implemented rules:

- `canUseSentenceForPractice`
  - Requires `confirmedAt` to be a real valid `Date`.
  - `null` and invalid Date objects are rejected.
- `canUsePageForPicturePractice`
  - Requires `BookPageStatus.Confirmed`.
  - Requires `TextRemovedImageStatus.Accepted`.
- `canUseAudioHintForPractice`
  - Requires `AudioSegmentStatus.Confirmed`.
  - Requires integer millisecond bounds.
  - Requires `startsAtMs >= 0`.
  - Requires `endsAtMs > startsAtMs`.

Task 2 had a review finding that `new Date("invalid")` passed because invalid dates are still `instanceof Date`. This was fixed in commit:

```text
e6b8274 fix: harden content practice gates
```

### Mastery Functions

File:

```text
src/domain/mastery.ts
```

Implemented functions:

- `createMasteryKey`
  - Returns `childId:knowledgeItemId:knowledgeVariantId:exerciseType`.
- `calculateNextMastery`
  - Clamps score to `0..100`.
  - Correct answer: `previous + 8 + consecutiveCorrect * 4`, then increments streak.
  - Wrong answer: `previous - 18`, then resets streak to `0`.
- `scheduleNextReview`
  - Wrong answer: 1 day.
  - Correct answer default: 3 days.
  - Correct streak `>= 2`: 7 days.
  - Correct streak `>= 3`: 14 days.
  - Correct streak `>= 5`: 30 days.
  - Copies the input date before mutation.

Task 3 code review found no blocking issues. Minor future-hardening suggestions:

- Add boundary tests for score floor/ceiling.
- Add interval boundary tests for streaks `0`, `2`, `3`, `5`.
- Add test that `scheduleNextReview` does not mutate source `Date`.
- Consider input validation for invalid `consecutiveCorrect` values in a later pass.

### Prisma Schema

File:

```text
prisma/schema.prisma
```

Major models:

- `Family`
- `User`
- `ChildProfile`
- `InterestTag`
- `Book`
- `BookPage`
- `BookAudio`
- `Sentence`
- `SentenceAudioSegment`
- `KnowledgeItem`
- `KnowledgeVariant`
- `SentenceKnowledgeLink`
- `Exercise`
- `Attempt`
- `MasteryStat`
- `ReviewQueueItem`

Task 4 verification already performed by controller:

```bash
DATABASE_URL="postgresql://english_tutor:english_tutor@localhost:5432/english_tutor_app?schema=public" npm run prisma:validate
```

Result:

```text
The schema at prisma/schema.prisma is valid
```

`prisma generate` required elevated permissions because Prisma tried to update the user-level engine cache:

```text
/Users/darren/.cache/prisma/...
```

It passed after rerunning with approval.

`npm run typecheck` passed after Task 4.

Task 4 still needs review:

- Spec compliance review.
- Code quality review.

## Environment Notes

`npm install` initially stalled without output. It succeeded when run through local proxy:

```bash
http_proxy=http://127.0.0.1:7897 https_proxy=http://127.0.0.1:7897 npm install
```

`npm install` reported:

```text
2 moderate severity vulnerabilities
```

No `npm audit fix --force` was run because it can introduce breaking dependency changes and was not part of the plan.

Prisma commands that need `DATABASE_URL` can use:

```bash
DATABASE_URL="postgresql://english_tutor:english_tutor@localhost:5432/english_tutor_app?schema=public"
```

No `.env` file has been committed.

Ignored local/generated files currently include:

```text
docs/superpowers/.DS_Store
docs/superpowers/specs/.DS_Store
node_modules/
tsconfig.tsbuildinfo
```

## Verification Already Run

Known successful commands:

```bash
npm run typecheck
npm run test -- src/domain/content-rules.test.ts
npm run test -- src/domain/mastery.test.ts
DATABASE_URL="postgresql://english_tutor:english_tutor@localhost:5432/english_tutor_app?schema=public" npm run prisma:validate
DATABASE_URL="postgresql://english_tutor:english_tutor@localhost:5432/english_tutor_app?schema=public" npm run prisma:generate
```

Latest `npm run typecheck` was rerun on 2026-05-06 and exited `0`.

## Review History

Task 1:

- Initial worker stalled; controller implemented directly.
- `npm install` succeeded through local proxy.
- `npm run typecheck` passed.
- Spec review initially found out-of-scope plan edit involving `*.tsbuildinfo`; fixed by `880ee90`.
- Code review initially flagged empty test suites; after staged-plan context, reviewer agreed Task 1 can proceed because tests are introduced in Tasks 2 and 6.

Task 2:

- Worker wrote files but stalled before commit; controller took over.
- Target test initially exposed Vitest setup path issue.
- `vitest.config.ts` fixed in `d6feea1` to use `fileURLToPath(new URL(...))`.
- Task 2 committed in `243dc7e`.
- Code review found invalid Date bug.
- Bug fixed in `e6b8274`.
- Spec and code quality reviews passed after fix.

Task 3:

- Worker completed and committed `818f2e9`.
- Spec compliance passed.
- Code quality passed.
- Minor non-blocking suggestions recorded above.

Task 4:

- Worker wrote files but stalled before reporting; controller took over.
- `prisma validate`, `prisma generate`, and `typecheck` passed.
- Committed `dcc1dce`.
- Review not completed due to subagent usage limit.

## Next Agent Instructions

Start here:

```text
/Users/darren/code/build_ai/english_tutor_app
```

Confirm current branch:

```bash
git status --short --branch
```

Expected branch:

```text
mvp-foundation
```

Recommended next steps:

1. Review Task 4 spec compliance:
   - Compare `prisma/schema.prisma` and `src/lib/db.ts` against Task 4 in `docs/superpowers/plans/2026-05-05-mvp-foundation.md`.
   - Confirm no extra files or unrelated behavior were added.
2. Review Task 4 code quality:
   - Check Prisma relations, indexes, cascading behavior, optional relations, and future maintainability.
   - Pay attention to `SentenceKnowledgeLink` uniqueness with nullable `knowledgeVariantId`, and to whether `MasteryStat.knowledgeVariantId` should be required in the MVP foundation.
3. If Task 4 reviews pass, continue Task 5 from the plan:
   - Role routing helpers.
   - App shell components.
   - Parent dashboard route.
   - Child today route.
4. Continue subagent-driven workflow where possible:
   - Implement task.
   - Spec compliance review.
   - Code quality review.
   - Fix any important/critical issues.
   - Only then move to the next task.

One-line handoff:

```text
Take over /Users/darren/code/build_ai/english_tutor_app on branch mvp-foundation. Task 1-3 are complete and reviewed. Task 4 is implemented and committed as dcc1dce but still needs spec compliance and code quality review. Continue from Task 4 review, then proceed to Task 5 in docs/superpowers/plans/2026-05-05-mvp-foundation.md.
```
