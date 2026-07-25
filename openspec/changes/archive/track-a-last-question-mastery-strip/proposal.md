# Proposal: track-a-last-question-mastery-strip

## 变更内容

修复孩子端 `/child/today` 在**当日队列最后一题**（及手动切题）时，`getTodayPractice` 返回数据与 **步进器当前题**、**本题掌握 strip**、**作答反馈区** 不一致的问题：

1. **队列稳定性**：孩子当日已作答的题目在 `router.refresh()` 后仍保留在 `exercises` 列表中（不因答对后 `nextReviewAt` 进入未来而被踢出），避免最后一题提交后列表缩短、索引错位、strip 显示其它题的 0 分。
2. **反馈对齐**：`latestAttempt` 的展示与步进器**当前 `exerciseId`** 绑定——仅当全局最近作答属于当前题时才显示 `AttemptFeedback`。
3. **数据一致**：当前题的 `exercises[i].mastery` 与（若展示）`latestAttempt` 的掌握分/复习日来自同一次提交后的持久化状态。

与 `spec/tasks.md` 任务 **track-a-last-question-mastery-strip**、路线图 **A2** 对齐。

## 为什么

- 步进器会话流（2026-05-09）已支持答对后推进，但 **刷新后 `getTodayPractice` 会过滤掉已答且未到复习日的题**，最后一题答对/答错后列表变化，导致「第 5 / 5 题」与掌握 strip 偶发仍为 0 或指向错误题目。
- 页面级 `AttemptFeedback` 使用**全局** `latestAttempt`，与手动「上一题/下一题」浏览组合时不反映当前题。
- 路线图 A2 与 [child-practice-stepper plan](../../../docs/superpowers/plans/2026-05-10-child-practice-stepper-session-flow.md) 明确本项为 Track A 数据/UX 修复，验收用 `npm run verify`。

## 范围

### 包含

- `getTodayPractice` 选题/过滤规则（`repository.ts` + `prisma-practice-repository.ts`）
- `/child/today`：`PracticeStepper` + 作答反馈展示逻辑
- Vitest：`repository.test.ts`（及按需 prisma integration）
- OpenSpec `plan.md` 执行与 `npm run verify`

### 不包含

- 修改每日 5 题的复习排序算法本身
- 新增 Playwright e2e（留给 `e2e-expand-practice-flows`）
- 看图裂图（A1）

## 成功标准

- [ ] 最后一题提交后 `router.refresh()`，`exercises` 仍包含该题且 `mastery` 反映最新作答
- [ ] 步进器当前题的 strip 与（若显示）反馈区 `latestAttempt` 属于同一 `exerciseId`，掌握分一致
- [ ] `npm run verify` exit 0

## 相关文档

- 路线图 A2：`docs/superpowers/plans/2026-05-12-long-term-roadmap.zh.md`
- 步进器背景：`docs/superpowers/plans/2026-05-10-child-practice-stepper-session-flow.md`
- 父分支：`mvp-foundation`
