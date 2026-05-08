# English Tutor App Current Status

Updated: 2026-05-08 10:35 UTC+8

## Start Here

Use this file as the short handoff entry point. Read the full historical handoff only when deeper context is needed:

```text
docs/superpowers/handoffs/2026-05-06-project-handoff.md
```

## Repository

- Project path: `/Users/darren/code/build_ai/english_tutor_app`
- Branch: `mvp-foundation`
- Latest pushed work recorded in the handoff:
  - `c810990 feat: add practice and mastery prototype`
  - `fe970df fix: allow larger book photo uploads`
  - `7289842 feat: expand deterministic practice exercises`

## Product State

Completed prototype phases on `mvp-foundation`:

1. MVP Foundation.
2. Book Ingestion Prototype.
3. Practice And Mastery MVP.
4. Expanded Deterministic Practice Exercises.
5. Larger photo upload support with a temporary `25mb` Server Action body limit.

The app is still a local prototype. It does not yet include real OCR, object storage, audio processing, AI grading, Prisma-backed app data flows, or production authentication.

## Current Development Guidance

For multi-step work from plans or handoffs, use the project rule in:

```text
.cursor/rules/default-subagent-driven-development.mdc
```

The main agent should coordinate: read this status and the relevant plan once, give each subagent only the current task context, then run implementation, spec compliance review, and code quality review before moving on.

## Recommended Next Work

Pick one next plan before implementation:

1. Prisma/Postgres persistence.
   - Replace in-memory book ingestion repository with Prisma-backed reads and writes.
   - Persist exercises, attempts, mastery stats, and review queue items.
   - Map the prototype child user to `ChildProfile` for `MasteryStat`.
2. Parent/Child UX Polish.
   - Let the child advance through exercises one at a time.
   - Show attempt history, streak, review due state, and next exercise navigation.
   - Improve dashboard metrics and empty states.
3. Real ingestion infrastructure.
   - Add PostgreSQL workflow, object storage or local file storage, real OCR/AI schemas, text-removed images, and audio alignment.

## Verification Snapshot

Latest full verification recorded in the handoff:

```text
npm run test: 9 files, 35 tests passed
npm run typecheck: passed
npm run lint: passed
npm run test:e2e: 10 passed
```

Restart `npm run dev` after any `next.config.ts` changes, especially changes to Server Action body size limits.

## Known Caveats

- In-memory repositories lose data on dev server restart.
- Real uploaded images are stored as data URLs in process memory.
- The `25mb` upload limit is a prototype workaround, not production storage.
- Practice generation and grading are deterministic prototypes.
- Browser extensions can cause unrelated Next hydration warnings.

## One-Line Handoff

Take over `/Users/darren/code/build_ai/english_tutor_app` on branch `mvp-foundation`. The prototype has completed MVP Foundation, Book Ingestion, Practice And Mastery, expanded deterministic exercises, and 25 MB upload support. Start by choosing the next plan: Prisma/Postgres persistence, Parent/Child UX Polish, or real ingestion infrastructure.
