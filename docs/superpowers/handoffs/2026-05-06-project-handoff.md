# English Tutor App Project Handoff

Date: 2026-05-06

## Start Here For New Agents

For a short current-state entry point, read:

```text
docs/superpowers/current-status.md
```

Use this full handoff as the historical record when deeper context is needed.

## Latest Handoff Update

Updated: 2026-05-08 10:23 UTC+8

### Current Branch And Repository State

Project path:

```text
/Users/darren/code/build_ai/english_tutor_app
```

Current branch:

```text
mvp-foundation
```

Latest pushed commit on this branch:

```text
c810990 feat: add practice and mastery prototype
fe970df fix: allow larger book photo uploads
7289842 feat: expand deterministic practice exercises
```

Most recent commit:

```text
7289842 feat: expand deterministic practice exercises
```

Current working tree before this handoff edit:

```text
clean
```

If this file is modified when the next agent starts, it is likely only this handoff update and can be committed separately as documentation.

### Current Product Status

The app now has four completed prototype phases on `mvp-foundation`:

1. MVP Foundation
2. Book Ingestion Prototype
3. Practice And Mastery MVP
4. Expanded Deterministic Practice Exercises

The confirmed long-term product goal is still the family-use English picture-book tutor:

1. Parent uploads picture-book page photos.
2. AI/OCR extracts English sentences, words, and phrases as draft content.
3. Parent reviews and confirms extracted content.
4. Confirmed content becomes official learning content.
5. The app generates practice exercises.
6. Child answers exercises.
7. The app grades answers, updates mastery, and schedules review.
8. Later phases add real OCR/AI, real storage, audio, persistence, and production auth.

The current implementation is still a local prototype. It intentionally does not yet include real OCR, real object storage, real audio upload/transcription/alignment, real AI exercise generation/grading, Prisma-backed app data flows, or production authentication.

### MVP Foundation Completed

The original plan is:

```text
docs/superpowers/plans/2026-05-05-mvp-foundation.md
```

Tasks completed:

1. Project tooling and baseline app.
2. Domain rules for confirmation gates.
3. Mastery calculation foundation.
4. Database schema for MVP foundation.
5. Role routing and app shell.
6. Browser smoke tests.
7. Final foundation verification.

Important foundation files:

- `src/domain/enums.ts`
- `src/domain/content-rules.ts`
- `src/domain/content-rules.test.ts`
- `src/domain/mastery.ts`
- `src/domain/mastery.test.ts`
- `src/lib/auth/roles.ts`
- `src/lib/auth/roles.test.ts`
- `prisma/schema.prisma`
- `src/lib/db.ts`
- `src/components/app-shell.tsx`
- `src/components/role-card.tsx`
- `tests/e2e/landing.spec.ts`

### Book Ingestion Prototype Completed

Plan used:

```text
/Users/darren/.cursor/plans/book-ingestion_59596ec5.plan.md
```

The user explicitly said not to edit that plan file.

Implemented behavior:

- Parent opens `/parent/books/new`.
- Parent enters title, optional reading date, optional comma-separated tags, and page images.
- A deterministic mock OCR/AI extractor creates draft sentences and word/phrase candidates.
- Parent is redirected to `/parent/books/[bookId]/review`.
- Parent reviews page image, editable sentence drafts, and editable knowledge candidates.
- Parent confirms a page.
- Confirmed page state shows official confirmed sentences and sentence-specific knowledge links.
- Unconfirmed drafts are kept out of official confirmed content.
- Parent dashboard navigation links “绘本” to `/parent/books/new`.
- Parent dashboard metrics read from the prototype ingestion repository.

Important implementation details:

- `src/lib/book-ingestion/repository.ts`
  - Uses a process-local in-memory repository for app/UI behavior because local Postgres is not available.
  - `confirmPage()` requires `parentConfirmed: true`.
  - Knowledge candidates are linked only to confirmed sentences whose text contains the candidate surface form.
  - `getConfirmedPracticeContent()` exposes only confirmed sentences and links for practice generation.
  - A repository `version` resets the global in-memory repository after hot module replacement so stale code does not survive Next dev reloads.
- `src/app/parent/books/[bookId]/review/page.tsx`
  - Uses a plain `img` for prototype `data:` URL previews and disables the Next `no-img-element` lint rule for that file.
- `src/app/parent/books/[bookId]/review/actions.ts`
  - Revalidates `/child/today` after page confirmation so practice can see newly confirmed content.

### Practice And Mastery MVP Completed

Plan used:

```text
/Users/darren/.cursor/plans/practice_mastery_94c3981d.plan.md
```

The user explicitly said not to edit that plan file.

Implemented in commit:

```text
c810990 feat: add practice and mastery prototype
```

Implemented behavior:

- Parent confirms book page content in the ingestion flow.
- `/child/today` lazily generates deterministic fill-in-the-blank exercises from confirmed content.
- Child submits an answer with keyboard input.
- The app grades deterministically.
- The in-memory practice repository records an attempt summary.
- Mastery score, streak, next review time, and review queue item are updated using `src/domain/mastery.ts`.
- `/child/today` uses `export const dynamic = "force-dynamic"` because it reads mutable prototype repositories.
- Newly generated unattempted exercises remain available even when the same target item has a future review date.

Key files:

- `src/domain/practice.ts`
- `src/domain/practice.test.ts`
- `src/lib/practice/repository.ts`
- `src/lib/practice/repository.test.ts`
- `src/app/child/today/page.tsx`
- `src/app/child/today/actions.ts`
- `tests/e2e/practice-and-mastery.spec.ts`

### Expanded Deterministic Practice Exercises Completed

Implemented in commit:

```text
7289842 feat: expand deterministic practice exercises
```

Implemented behavior:

- Confirmed content can now generate all four prototype exercise types:
  - Fill-in-the-blank.
  - Picture-to-sentence.
  - Grammar correction.
  - Sentence creation.
- `/child/today` renders multiple exercise cards rather than a single fill-in-the-blank card.
- Each card posts through the same server action using `exerciseId` and `answer`.
- Deterministic grading now handles:
  - Exact normalized answers for fill blank, picture sentence, and grammar correction.
  - Required word/phrase matching for sentence creation.
- Sentence creation grading uses word/phrase boundary matching so `page` does not accidentally pass inside `homepage`.
- The e2e flow verifies all four exercise cards render and submits a sentence-creation answer.

### Larger Photo Upload Fix Completed

Implemented in commits:

```text
84308e5 fix: allow larger book page uploads
fe970df fix: allow larger book photo uploads
```

Issue observed by user:

```text
http://127.0.0.1:3000/parent/books/new
An unexpected response was received from the server.
Body exceeded 10mb limit.
```

Root cause: real phone photos can exceed the Next Server Actions body size limit. The first fix raised the limit from the default 1 MB to 10 MB; a later real upload exceeded 10 MB.

Current fix:

- `next.config.ts`
  - `experimental.serverActions.bodySizeLimit = "25mb"`.
- `tests/e2e/book-ingestion.spec.ts`
  - Uses a `12_000_000` byte image buffer for regression coverage.
  - The upload redirect wait is `15_000ms` because a 12 MB Server Action upload can take more than the default 5 seconds under parallel e2e load.

Important: after changing `next.config.ts`, restart `npm run dev` so the new body limit applies.

### Verification Status

Latest full verification after expanded exercise types and the 25 MB upload fix:

```bash
npm run test
npm run typecheck
npm run lint
npm run test:e2e
```

Result:

```text
npm run test: 9 files, 35 tests passed
npm run typecheck: passed
npm run lint: passed
npm run test:e2e: 10 passed
```

Targeted checks also passed during development:

```text
npm run test -- src/domain/practice.test.ts
npm run test -- src/lib/practice/repository.test.ts
npm run test -- src/lib/book-ingestion/repository.test.ts
npm run test:e2e -- tests/e2e/book-ingestion.spec.ts
npm run test:e2e -- tests/e2e/practice-and-mastery.spec.ts
```

Code review status:

```text
No remaining Critical or Important findings after re-review.
```

### Current Dev Server

At the time of the latest work, a fresh `npm run dev` was started after changing `next.config.ts` so the new Server Action body limit would be applied.

If the user still sees upload errors:

1. Confirm the active dev server was restarted after the `next.config.ts` change.
2. Confirm only one `npm run dev` process is listening on port 3000.
3. Check server logs for `Body exceeded 25mb limit`; if present, the prototype needs real object storage or a still higher temporary limit.

### Current Known Issues And Caveats

- Browser extensions such as Monica can inject attributes into `<body>` and trigger Next hydration warnings. This is not app logic. Test in a clean/incognito browser profile if needed.
- Real uploaded images are stored as data URLs in process memory for this prototype. This is not production storage.
- Restarting the dev server clears in-memory book drafts, generated exercises, attempts, mastery stats, and review queue items.
- The upload body limit is now `25mb`, but very large phone photos can still exceed it. Real storage should replace Server Action file transfer in a later phase.
- Practice generation and grading are deterministic prototypes, not real AI.
- Picture-to-sentence uses the original page image, not a text-removed image.
- Grammar correction currently creates simple deterministic mistakes such as `is` -> `are` or `can` -> `cans`.
- Sentence creation currently checks for required word/phrase presence with boundaries; it does not judge sentence quality.
- The app uses a fixed prototype session id from `src/lib/prototype-session.ts`.
- The plan text said `src/lib/book-ingestion/repository.ts` would be Prisma reads/writes, but the implemented prototype uses an in-memory repository because local Postgres is unavailable. This was reviewed and accepted as a local prototype boundary, but future work should add real Prisma persistence.
- GitHub PR creation previously failed because remote branch history had no common history with remote `main`. The branch itself has been pushed successfully.

### Recommended Next Tasks

1. Create a plan for Prisma/Postgres persistence:

- Replace in-memory book ingestion repository with Prisma-backed reads/writes.
- Persist exercises, attempts, mastery stats, and review queue items.
- Map prototype child user to `ChildProfile` for `MasteryStat`.
- Add migration/seed/dev database workflow once local Postgres is available.

2. Or create a plan for Parent/Child UX Polish:

- Let child advance through exercises one at a time instead of rendering all cards at once.
- Show attempt history, current streak, review due state, and next exercise navigation.
- Improve parent dashboard metrics for low mastery, pending review, and recent attempts.
- Add clearer empty states when no confirmed content exists.

3. Or create a plan for real ingestion infrastructure:

- PostgreSQL setup and migrations.
- Object storage or local file storage strategy.
- Real OCR/AI provider and response schemas.
- Text-removed image generation strategy.
- Audio upload/transcription/alignment strategy.

### One-Line Handoff

```text
Take over /Users/darren/code/build_ai/english_tutor_app on branch mvp-foundation. MVP Foundation, Book Ingestion Prototype, Practice And Mastery MVP, expanded deterministic exercise types, and 25 MB photo upload support are implemented and pushed through 7289842. Latest verification passed: npm run test (9 files, 35 tests), typecheck, lint, and npm run test:e2e (10 tests). Next recommended work is Prisma/Postgres persistence or Parent/Child UX Polish.
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
