# Prisma Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace in-memory prototype repositories with PostgreSQL-backed persistence using the existing `prisma/schema.prisma`, including migrations, seed data aligned with `ensurePrototypeSession`, and phased adoption of Prisma in book ingestion and practice flows.

**Architecture:** Phase A establishes a reproducible local Postgres and baseline migration. Phase B persists book ingestion (Books → Pages → Sentences → Knowledge links). Phase C persists generated exercises, attempts, mastery stats, and review queue keyed by `ChildProfile` and `User` (child). Adapters implement the same repository interfaces the app already uses, so routes change minimally. Use explicit `id` values where the prototype already relies on stable string ids (`prototype-family`, `prototype-parent`, `prototype-child`).

**Tech Stack:** Next.js 15, Prisma 6, PostgreSQL 16, TypeScript, Vitest.

**Reference schema:** `prisma/schema.prisma` (models `Family`, `User`, `ChildProfile`, `Book`, `BookPage`, `Sentence`, `KnowledgeItem`, `KnowledgeVariant`, `SentenceKnowledgeLink`, `Exercise`, `Attempt`, `MasteryStat`, `ReviewQueueItem`).

---

## File map (expected)

| Area | Files |
|------|--------|
| Local DB | `docker-compose.yml` (new), `.env.example` (already has `DATABASE_URL`) |
| Migrations | `prisma/migrations/*` |
| Seed | `prisma/seed.ts` |
| Book ingestion | `src/lib/book-ingestion/repository.ts` → Prisma implementation or `repository.prisma.ts` + factory |
| Practice | `src/lib/practice/repository.ts` → same pattern |
| Session | `src/lib/prototype-session.ts` (align with DB seed) |
| Tests | Extend `*.test.ts` with Prisma test DB or keep unit tests on pure mappers + integration opt-in |

---

## Phase A — Database foundation

### Task A1: Docker Postgres + initial migration + seed

**Files:** `docker-compose.yml`, `prisma/migrations/`, `prisma/seed.ts`, `package.json` (prisma seed + scripts), optional `tsx` devDependency.

- [ ] Add `docker-compose.yml` for PostgreSQL 16, credentials and database name matching `.env.example`.
- [ ] Add `prisma/seed.ts` to upsert `Family` (`prototype-family`), `User` (parent + child), `ChildProfile` for the child (set `grade` to a non-empty string, e.g. `G1`), using explicit ids consistent with `ensurePrototypeSession` when possible.
- [ ] Wire `prisma.seed` in `package.json` (e.g. `tsx prisma/seed.ts`); add dev script helpers (`db:up`, `db:migrate`, `db:seed` as needed).
- [ ] Create **initial** migration: `prisma migrate dev --name init` with DB running; commit generated `prisma/migrations` SQL.
- [ ] Verify: `npx prisma migrate deploy` (or `migrate dev` in dev), `npx prisma db seed`, `npm run prisma:generate`, `npm run typecheck`.

### Task A2: Document one-command local workflow

**Files:** Short section in this plan or `README.md` (minimal) — how to `docker compose up -d`, copy `.env.example` → `.env`, migrate, seed.

---

## Phase B — Book ingestion persistence

### Task B1: Map domain IDs and Prisma writes

- [ ] Decide ID strategy: explicit string ids on create for prototype-shaped ids (`book_*`) vs pure cuids; document choice.
- [ ] Implement Prisma-backed `createBookDraft`, `getBookForReview`, `confirmPage`, `getConfirmedPracticeContent`, `getParentDashboardMetrics` against `Book`, `BookPage`, `Sentence`, `KnowledgeItem` / `KnowledgeVariant`, `SentenceKnowledgeLink`.
- [ ] Map mock OCR JSON ↔ Prisma `ocrDraft` / `confirmedAt` fields.
- [ ] Tests: repository integration tests with test database or mocked Prisma client (project preference).

---

## Phase C — Practice + mastery persistence

### Task C1: Exercise + attempt persistence

- [ ] Persist `Exercise` rows when generating from confirmed content; dedupe by stable natural key or schema unique constraints.
- [ ] Map `submitAttempt` → `Attempt`; map grading outputs to `score` / `errorTags`.

### Task C2: Mastery + review queue

- [ ] Resolve `ChildProfile` id from `childUserId` (`prototype-child`).
- [ ] Upsert `MasteryStat` rows per `(childProfileId, knowledgeItemId, knowledgeVariantId, exerciseType)`.
- [ ] Insert `ReviewQueueItem` rows analogous to current in-memory queue.

### Task C3: Read paths + buffers

- [ ] Implement `getTodayPractice`, `getRecentAttempts`, `countLowMasteryKnowledge` from Prisma with equivalent semantics to in-memory ordering/filter rules.

---

## Phase D — Cutover and cleanup

### Task D1: Feature flag or single implementation

- [ ] Remove or gate in-memory singletons; ensure `PRACTICE_REPOSITORY_VERSION`-style resets are obsolete or replaced by migrations.
- [ ] Full `npm run test`, `npm run typecheck`, `npm run lint`, `npm run test:e2e` (may require DB in CI).

---

## Verification (each phase)

```bash
DATABASE_URL="postgresql://english_tutor:english_tutor@localhost:5432/english_tutor_app?schema=public" npm run prisma:validate
npm run prisma:generate
npm run typecheck
npm run lint
npm run test
```

After persistence wiring: `npm run test:e2e` with Postgres available.
