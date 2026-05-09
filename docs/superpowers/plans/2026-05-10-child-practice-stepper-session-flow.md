# Child practice stepper — session flow & UI sync

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 每次提交后刷新本题统计；**仅当本题判定为答对时**才进入下一题或本轮完成态；避免出现永远停在「第 1 / 5 题」、索引从不前进、且无结束态的问题。

**Architecture:** 根因仍是 **客户端 `index` 从未随提交更新** + **刷新不及时**。实现上需要：(1) **`submitPracticeAttemptAction` 返回 `{ isCorrect: boolean }`**（或等价结构），供客户端判断是否推进索引；(2) **客户端包装提交**（`startTransition` + `router.refresh()`），答错时只刷新 strip / 反馈、**不** `setIndex`；答对时再 `index + 1` 或标记完成。必要时用 `key` 对齐 RSC。

**Tech Stack:** Next.js 15 App Router、React 19、`next/navigation`、现有 `submitPracticeAttemptAction`、`PracticeStepper` / `ExerciseCard`。

---

## 背景与根因（代码证据）

| 现象 | 原因 |
|------|------|
| 一直「第 1 / 5 题」 | `practice-stepper.tsx` 中 `index` 初始为 `0`，**提交后没有任何逻辑 `setIndex`**；只有「上一题 / 下一题」会改索引。 |
| 「最近作答」有多条、但进度不动 | 多次提交命中 **同一 `exerciseId`（当前索引对应的那一题）**，历史列表来自 DB，与本地 `index` 无关。 |
| 连对 / 掌握分始终 0 |  strip 显示的是 **`exercises[index].mastery`**；卡在 index 0 时只看第一题的统计；若 RSC 刷新未及时传到客户端，也可能短期显示旧 props（需用 `refresh` 验证）。 |
| 做完 5 道也不「结束」 | 无「本轮会话完成」状态机；用户从未通过提交走到 index 4 之后的完成 UI。 |

相关文件：

- `src/app/child/today/practice-stepper.tsx` — 题号、`current.mastery`、表单。
- `src/app/child/today/actions.ts` — `submitPracticeAttemptAction`，`revalidatePath("/child/today")`。
- `src/app/child/today/page.tsx` — 传入 `practice.exercises.map(toClientExercise)`。

---

## 产品行为（本次修复约定）— **答对后才下一题**

1. **提交后留在本题**：若判定为 **答错**，不推进题号；用户可修改答案再次提交（仍针对同一 `exerciseId`）。`router.refresh()` 后本题 **掌握分 / 连对 / 反馈区** 应反映最新一次作答。
2. **答对后进入下一题**：若判定为 **答对** 且当前 `index < total - 1`，执行 `setIndex(index + 1)`。
3. **最后一题答对**：若 **答对** 且 `index === total - 1`，进入 **本轮完成** 状态（完成文案 + 可选「再练一次」重置本地索引为 0）。
4. **本题 strip**：始终展示 **当前索引题目** 的掌握分与连对；每次提交（无论对错）后均应刷新 props。
5. **手动上一题 / 下一题**：保留，用于预习其它题；**不以手动浏览改变「是否已完成本题」的服务器事实**——索引推进仍以「本题答对」为准（避免只做浏览就跳过未完成题目，除非产品后续改为自由顺序）。

**依赖：** 客户端必须知道本次提交是否答对 → **`submitPracticeAttemptAction` 必须返回 **`isCorrect`**（由 `submitAttempt` / 评分结果透出，与 `AttemptFeedback` 逻辑一致）。

---

## 文件结构（计划内将修改/新增）

| 路径 | 职责 |
|------|------|
| `src/app/child/today/practice-stepper.tsx` | 客户端提交包装、`refresh`、**仅答对时**索引推进、完成态 UI。 |
| `src/app/child/today/actions.ts` | **必须**：`submitPracticeAttemptAction` 返回 `{ isCorrect: boolean }`（及按需扩展字段）；内部沿用 `submitAttempt` 的判定结果。 |
| `src/app/child/today/page.tsx` | 可选：`PracticeStepper` 的 `key` — **仅在实测仍陈旧时加**。 |
| `e2e/` | 可选：Playwright — 错答仍「第 1 题」、对答后「第 2 题」或最后一题完成态。 |

---

### Task 1: 复现与基线

**Files:**

- Read-only: `practice-stepper.tsx`, `actions.ts`

- [ ] **Step 1:** 本地登录孩子路径，`/child/today` 连续提交同一题 2 次，确认题号仍为 1、网络面板中 Server Action 成功。
- [ ] **Step 2:** 在 `PracticeStepper` 临时 `console.log` props 中第一题 `mastery.masteryScore` 提交前后（或用 React DevTools），确认是否为 **props 陈旧** 还是 **纯索引未前进**。

**Expected:** 至少确认索引未前进为确定性 bug；掌握分若 refresh 后仍不对再查仓库层。

---

### Task 2: Server Action 返回 `isCorrect` + 客户端提交与 `router.refresh()`

**Files:**

- Modify: `src/app/child/today/actions.ts`
- Modify: `src/app/child/today/practice-stepper.tsx`

- [ ] **Step 1 (`actions.ts`):** 将 `submitPracticeAttemptAction` 改为返回 **`Promise<{ isCorrect: boolean }>`**。在调用 `getPracticeRepository().submitAttempt(...)` 后，用返回值里的 grading / attempt（与仓库 API 一致）设置 `isCorrect`（与同路径写入 DB 的判定一致）。
- [ ] **Step 2 (`practice-stepper.tsx`):** 将裸 `<form action={...}>` 改为客户端可调用的异步流程：`const result = await submitPracticeAttemptAction(formData)`，然后 **`await router.refresh()`**。
- [ ] **Step 3:** `useTransition` + 提交中禁用按钮，避免重复 POST。
- [ ] **Step 4:** 保留 `revalidatePath`；与 `refresh()` 双重刷新可接受（以实测为准）。

**Verification:** 故意错答一次 → 返回 `isCorrect: false`；改正后 → `true`（可用临时日志或单测 mock）。

---

### Task 3: 仅答对时推进索引与完成态

**Files:**

- Modify: `src/app/child/today/practice-stepper.tsx`

- [ ] **Step 1:** 在 **`refresh()` 完成后**，读取本次提交的 **`result.isCorrect`**：
  - **`false`**：`setIndex` 不变；输入框可保留非受控（用户改字再交）或后续再加受控清空。
  - **`true`** 且 `index < total - 1`：`setIndex((i) => i + 1)`。
  - **`true`** 且 `index === total - 1`：`setSessionComplete(true)`。
- [ ] **Step 2:** `sessionComplete === true` 时渲染完成文案；可选「再练一次」：`setSessionComplete(false)` + `setIndex(0)`。
- [ ] **Step 3:** 完成态隐藏作答表单，避免继续 POST。

**Edge cases:**

- `total === 0`：保持现有 `null` 渲染。
- 提交 **throw**：不推进、不标记完成；`try/catch` 提示错误。
- **连续错答同一题**：题号不变，「最近作答」可增加多条记录 — 符合预期。

---

### Task 4: 错误处理与类型 / Lint / 测试

**Files:**

- Modify: `practice-stepper.tsx`
- Optional: `src/app/child/today/practice-stepper.test.tsx`（若项目已有 Client 组件测试范式）

- [ ] **Step 1:** `npm run typecheck`、`npm run lint`、`npm run test`。
- [ ] **Step 2:** 若有 Vitest + RTL：**mock** 返回 `{ isCorrect: false }` 与 `{ isCorrect: true }`，断言是否调用索引递增（可选）。
- [ ] **Step 3:** 可选 Playwright：错答 → 仍为「第 1」；对答 → 「第 2」或完成态。

---

### Task 5: 文档与交接

**Files:**

- Modify: `docs/superpowers/current-status.md` 或本计划顶部 **P3 progress** — 一句话说明「孩子端步进器会话流已修复」（若团队只在计划追踪，可仅更新本文件 **Done** 段）。

- [ ] **Step 1:** 在本文件末尾追加 **Implementation record**（日期、commit、已知限制）。
- [ ] **Step 2:** 若 README 有「孩子端练习」说明，补一句「**答对后**进入下一题」。

---

## 验证命令（合并）

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e   # 若加了 e2e
```

手动：**错答 → 题号不变、可再答；对答 → 题号递增；最后一题对答 → 完成态；refresh 后掌握分 / 连对合理**。

---

## 风险与不在本轮的范围

- **队列算法**：`getTodayPractice` 返回的 5 道题顺序与复习策略不变；本轮只修 **UI 会话状态机**。
- **同一题多次复习**：若日后允许同一天同一题出现多次，完成态定义可能要改成「完成当日队列」而非固定 5 格——当前仍按固定 `limit: 5` 列表处理。

---

## References

- `src/app/child/today/practice-stepper.tsx`
- `src/app/child/today/actions.ts`
- `docs/superpowers/specs/2026-05-04-private-english-tutor-app-design.zh.md`（练习闭环，如需对齐文案）

---

## Implementation record

- **2026-05-09:** Shipped — `submitPracticeAttemptAction` returns `{ isCorrect }` from `submitAttempt`; `PracticeStepper` uses client `onSubmit` + `router.refresh()`, advances index **only when correct**, last correct sets session complete + 「再练一次」resets local state; README + `current-status` + plan-aligned copy on `/child/today` intro.
- **Known limits:** Playwright e2e for wrong/correct flows not added (optional Task 4); manual prev/next still allows browsing without server-side “unlock”.
