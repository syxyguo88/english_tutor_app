# Track A2 — Last question mastery strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 最后一题提交后 refresh 不丢题；步进器 strip 与 `latestAttempt` 反馈仅对当前题展示且掌握分一致。

**Architecture:** 仓库层 `getTodayPractice` 增加「同日已作答仍 eligible」；UI 将 `AttemptFeedback` 并入 `PracticeStepper` 并按 `exerciseId` 过滤。In-memory 与 Prisma 双实现 + Vitest。

**Tech Stack:** Next.js App Router、Prisma、`localDateKey`、Vitest。

---

## File map

| Path | 变更 |
|------|------|
| `frontend/src/lib/practice/practice-calendar.ts` | 已存在 `localDateKey` — 复用 |
| `frontend/src/lib/practice/repository.ts` | eligibility + import `localDateKey` |
| `frontend/src/lib/practice/prisma-practice-repository.ts` | 同上 |
| `frontend/src/lib/practice/repository.test.ts` | 新增末题/同日保留/一致性用例 |
| `frontend/src/app/child/today/page.tsx` | 传 `latestAttempt` 给 stepper，移除独立反馈 |
| `frontend/src/app/child/today/practice-stepper.tsx` | 条件渲染 `AttemptFeedback` |

---

### Task 1: 同日保留 — in-memory 仓库 + 失败测试

**Files:** `repository.ts`, `repository.test.ts`

- [ ] **Step 1:** 写失败测试：`limit: 2` 两题，对**第二题**（列表末位）答对后 `getTodayPractice` 仍返回 2 题且末题 `masteryScore` 为答对后分值（如 8）。
- [ ] **Step 2:** 在 `getTodayPractice` filter 中加入 `lastAttemptedAt` 同日保留（`localDateKey`）。
- [ ] **Step 3:** `npm run test --workspace=@english-tutor/frontend -- repository.test` 通过。

---

### Task 2: 同日保留 — Prisma 仓库

**Files:** `prisma-practice-repository.ts`

- [ ] **Step 1:** 镜像 Task 1 的 eligibility 逻辑（`mastery.lastAttemptedAt` + `localDateKey(input.now)`）。
- [ ] **Step 2:** 若存在 `prisma.integration.test.ts` 中 `getTodayPractice` 相关用例，补一条或确认无需改；`npm run test` 全绿。

---

### Task 3: latestAttempt 与当前题 mastery 一致 — 仓库测试

**Files:** `repository.test.ts`

- [ ] **Step 1:** 测试：末题 `submitAttempt` 后 `getTodayPractice` 的 `latestAttempt.masteryScore === exercises.find(id).mastery.masteryScore`。
- [ ] **Step 2:** 跑 frontend unit tests。

---

### Task 4: UI — 反馈区绑定当前题

**Files:** `page.tsx`, `practice-stepper.tsx`

- [ ] **Step 1:** `PracticeStepper` 增加 prop `latestAttempt`（可序列化：日期字段已是 summary 中的 Date，注意 RSC→client 边界；若需序列化则传 ISO string 或仅在匹配时用 masteryScore/flags）。
- [ ] **Step 2:** 从 `page.tsx` 传入 `practice.latestAttempt`；删除页面级 `<AttemptFeedback>`。
- [ ] **Step 3:** 在 stepper 内：仅 `latestAttempt?.exerciseId === current.id` 时渲染反馈（可抽取小组件，样式与现 `AttemptFeedback` 一致）。
- [ ] **Step 4:** `npm run typecheck`、`npm run lint`。

---

### Task 5: 全量验证

- [ ] **Step 1:** 仓库根执行 `npm run verify`，exit 0。
- [ ] **Step 2:** 在 `openspec/changes/track-a-last-question-mastery-strip/tasks.md` 勾选任务（协调者）。

---

## Verification

```bash
npm run verify
```

手动（可选）：`/child/today` 做到第 5 题，错答/对答后 strip 与反馈不错位；对答最后一题进入完成态且反馈掌握分非 0。
