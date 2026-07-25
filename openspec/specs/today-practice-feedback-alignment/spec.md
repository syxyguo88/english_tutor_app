# Spec: Today practice feedback alignment (A2)

孩子端当日练习队列、掌握 strip 与作答反馈的数据与 UI 一致性。

## 新增需求

### 需求: 当日已作答题保留在 getTodayPractice

`getTodayPractice` **必须**在孩子于**同一本地日历日**已作答某题后，仍将该题包含在返回的 `exercises` 中（即使 `nextReviewAt` 晚于 `now`），直到次日或复习日到达。

#### 场景: 最后一题答对后刷新

- **当** 孩子对当日队列最后一题（`limit` 内）提交**正确**答案并触发页面刷新
- **那么** 刷新后 `exercises` **仍包含**该 `exerciseId`，且其 `mastery.masteryScore` **大于** 答对前的分数（或符合评分规则的非零正确分）

#### 场景: 最后一题答错后刷新

- **当** 孩子对最后一题提交**错误**答案并刷新
- **那么** `exercises` **仍包含**该题，且 `mastery` 反映错误后的统计（如 `errors` 增加、`masteryScore` 降低）

#### 场景: 跨日不再保留

- **当** `lastAttemptedAt` 的本地日早于 `input.now` 的本地日，且 `nextReviewAt > now`
- **那么** 该题**可以**从当日队列中排除（复习策略不变）

### 需求: 反馈区与步进器当前题一致

UI **必须**仅在孩子**当前正在做的题目**与 `latestAttempt.exerciseId` 一致时展示作答反馈（掌握分、复习日、对错文案）。

#### 场景: 浏览非最近作答的题

- **当** 孩子用「上一题/下一题」切到题目 A，但全局 `latestAttempt` 属于题目 B
- **那么** **不显示**作答反馈区（或等价于无反馈），strip **仅**显示题目 A 的 `mastery`

#### 场景: 当前题刚提交

- **当** 孩子在题目 A 提交后刷新，且 `latestAttempt.exerciseId === A`
- **那么** 显示反馈区，且反馈区掌握分与题目 A 的 strip 掌握分**一致**

### 需求: latestAttempt 与 mastery 同源更新

提交作答后，`getTodayPractice` 返回的 `latestAttempt` 与对应 `exercises[].mastery` **必须**反映同一次 `submitAttempt` 的持久化结果。

#### 场景: 仓库单测

- **当** in-memory（或 integration）仓库对队列末题 `submitAttempt` 后立即 `getTodayPractice`
- **那么** `latestAttempt.exerciseId` 等于该题 id，且 `latestAttempt.masteryScore ===` 该题在 `exercises` 中的 `mastery.masteryScore`

## 修改需求

无（新增行为；不改变 `getRecentAttempts` 排序契约）。
