# Design: track-a-last-question-mastery-strip

## 根因

| 现象 | 机制 |
|------|------|
| 最后一题答对后 strip/题号错乱 | `getTodayPractice` 在 `attempted && nextReviewAt > now` 时**排除**该题；`router.refresh()` 后 `exercises.length` 减少，`useEffect` 钳制 `index` |
| 掌握分偶发仍为 0 | strip 读 `exercises[index].mastery`，index 在 refresh 后指向**另一题**（未作答，默认 0） |
| 反馈区与当前题不符 | `page.tsx` 用全局 `latestAttempt`（`findFirst` / 最近列表 [0]），与步进器 `index` 无关 |

## 方案

### 1. 当日会话内保留已选题（仓库层）

在 `getTodayPractice` 的 eligibility 判断中，对已 attempted 的题目增加 **同日保留** 条件：

```text
eligible =
  !attempted
  || !nextReviewAt
  || nextReviewAt <= now
  || lastAttemptedAt 的本地日历日 === input.now 的本地日历日
```

- 复用已有 `localDateKey`（`practice-calendar.ts`），与 `getChildPracticeOverview` 一致。
- **不改变**未尝试题目的挑选顺序与 `limit` 语义：仍先按 `createdOrder` 扫描，凑满 `limit` 后停止；已尝试且仅因复习日未来的题，若在同日已作答则仍可被选中入队（与扫描顺序一致）。

In-memory 与 Prisma 实现**必须**同步修改。

### 2. 反馈区与当前题对齐（UI）

- 将 `AttemptFeedback` 移入 `PracticeStepper`（或等价客户端子组件），接收 `latestAttempt: PracticeAttemptSummary | null`。
- 仅当 `latestAttempt?.exerciseId === current.id` 时渲染反馈；否则不显示（避免全局最近作答干扰浏览其它题）。
- `page.tsx` 删除独立 `AttemptFeedback` 块，向 `PracticeStepper` 传入 `latestAttempt`。

### 3. 掌握分一致性

- strip 继续用 `current.mastery`（来自 `getTodayPractice` 的 `masteryStat`）。
- 反馈区用 `latestAttempt.masteryScore` / `nextReviewAt`（attempt 快照）。
- 测试断言：提交后 `getTodayPractice` 中该题的 `mastery.masteryScore` 与 `latestAttempt.masteryScore` 一致（同一 child、同一 exercise）。

## 风险

- **同日保留**会使当日列表在多次 refresh 后仍含已答对题，可能超过「纯未答」意义上的 5 题 — 接受，因产品约定为固定会话队列，且 `limit` 仍限制扫描入选数量。
- 跨日访问：次日 `lastAttemptedAt` 非当日，已答且未到复习日的题正常退出队列 — 符合复习策略。

## 不在本轮

- 服务端 session 存储固定 exerciseIds
- 按 exercise 批量查询 `latestAttempt`（当前用全局 + UI 过滤即可）
