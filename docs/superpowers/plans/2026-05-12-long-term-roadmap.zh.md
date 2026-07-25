# 长期路线图（A–E）— English Tutor App

> **维护约定：** 合并功能或变更范围时，请同步更新本表「状态」列与 **§当前迭代聚焦**；并在 **`docs/superpowers/current-status.md`** 中保持 **「当前开发聚焦」** 与本节一致。

**最后更新：** 2026-05-12

---

## 状态图例

| 标记 | 含义 |
|------|------|
| ✅ | **已开发**：主路径已在 `mvp-foundation` 落地，可按链接验收 |
| 🔄 | **部分**：已有一部分实现，仍缺规格内剩余能力 |
| 🔲 | **待开发**：尚未开始或未达 MVP |
| ⏸️ | **暂缓**：刻意推迟（如非 P0 的裂图根治） |

---

## 文档索引（handoff / plans / specs）

### Handoffs

| 文档 | 用途 |
|------|------|
| [2026-05-06-project-handoff.md](../handoffs/2026-05-06-project-handoff.md) | 会话交接、Latest Handoff、历史叙事 |

### Plans

| 文档 | 用途 |
|------|------|
| [2026-05-11-phase-priorities-parent-child.md](./2026-05-11-phase-priorities-parent-child.md) | Stakeholder 优先级、Track A/C6 决策 |
| [2026-05-10-next-development.md](./2026-05-10-next-development.md) | P0–P3、CI、验证命令 |
| [2026-05-10-child-practice-stepper-session-flow.md](./2026-05-10-child-practice-stepper-session-flow.md) | 孩子端练习步进器（答对后下一题） |
| [2026-05-08-prisma-persistence.md](./2026-05-08-prisma-persistence.md) | Prisma 持久化 Phase A–D |
| [2026-05-05-mvp-foundation.md](./2026-05-05-mvp-foundation.md) | MVP 地基任务与范围 |

### Specs

| 文档 | 用途 |
|------|------|
| [2026-05-04-private-english-tutor-app-design.zh.md](../specs/2026-05-04-private-english-tutor-app-design.zh.md) | 产品总设计、长期愿景 |
| [2026-05-09-p2.3-practice-overview-streak.zh.md](../specs/2026-05-09-p2.3-practice-overview-streak.zh.md) | P2.3 练习总览 / 打卡 |
| [2026-05-11-c6-child-book-review-mvp.zh.md](../specs/2026-05-11-c6-child-book-review-mvp.zh.md) | C6 绘本复习 MVP |

---

## 当前迭代聚焦（开干时请改这一行）

**默认下一棒：** **Track A — 可靠性与数据**（与 [phase-priorities](./2026-05-11-phase-priorities-parent-child.md) 一致；无单独 issue 时仍视为「组织上的当前优先域」）。

若已锁定具体任务（例如「只做 B1」），将上一句替换为：`Track B1 — 待校对入口` 等。

---

## A — 可靠性与数据（孩子每天用）

| ID | 任务 | 状态 | 说明 / 链接 |
|----|------|------|-------------|
| A1 | **看图练习图片来源**：渲染时按 `pageId` 读 `BookPage.originalImageUrl`（或 CDN），减少对 `Exercise.prompt` 大 blob 快照依赖；或「重建练习」管理动作 | ⏸️ | 当前阶段**非 P0**（见 phase-priorities）；技术债见 [next-development P3.1](./2026-05-10-next-development.md) |
| A2 | **`getTodayPractice` 最后一题**：`latestAttempt` / strip 与「当前题索引」展示一致；偶现仍为 0 时专项复现修复 | 🔲 | 与 [child-practice-stepper plan](./2026-05-10-child-practice-stepper-session-flow.md)、`/child/today` 实现联动 |
| A3 | **`getRecentAttempts`**：减少 exercise 大 JSON 负载 | ✅ | [next-development P3.2](./2026-05-10-next-development.md) 已做 `select type` |
| A4 | **确认句数据源收紧**：`getConfirmedPracticeContent` + C6 列表对 `Sentence.confirmedAt` 与域规则一致 | ✅ | C6 / `getBookSentenceReviewList`；见 [C6 spec](../specs/2026-05-11-c6-child-book-review-mvp.zh.md) |
| A5 | **`getBookIngestionRepository` 全局单例**：HMR 后缺新方法时重建 | ✅ | 避免 `listBooksWithReviewSentencesForFamily is not a function`；见 [handoff](../handoffs/2026-05-06-project-handoff.md) |

---

## B — 家长端产品壳

| ID | 任务 | 状态 | 说明 / 链接 |
|----|------|------|-------------|
| B1 | **待校对入口**：总览一键跳到「有待校页面的书」或过滤列表 | 🔲 | 今日导航「待校对」仍回 [dashboard](../../src/app/parent/dashboard/page.tsx)；需新路由或 query |
| B2 | **知识画像**：低掌握度列表 / drill-down（只读 DB + 链到书页） | 🔲 | 今日「知识画像」占位；数据已有 `countLowMasteryKnowledge` 等 |
| B3 | **「待复核 AI 判断」**：长期接队列；短期占位 + **链到本路线图 / backlog** | 🔄 | 已有占位与 [next-development](./2026-05-10-next-development.md) 脚注；可加强外链 |

---

## C — 孩子端扩展

| ID | 任务 | 状态 | 说明 / 链接 |
|----|------|------|-------------|
| C1 | **绘本复习**：独立路由，已确认句子轻量复习（无真 OCR） | ✅ | [C6 spec](../specs/2026-05-11-c6-child-book-review-mvp.zh.md)；`/child/book-review` |
| C2 | **「我的星星」**：积分 / 徽章（可先纯前端，表后置） | 🔲 | 导航仍指向 `/child/today`；依赖游戏化 spec（待写） |
| C3 | **绘本复习 E2E**（错链、空态、进书） | 🔲 | [C6 spec](../specs/2026-05-11-c6-child-book-review-mvp.zh.md) AC7 可选 |

---

## D — 工程与计划内项

| ID | 任务 | 状态 | 说明 / 链接 |
|----|------|------|-------------|
| D1 | **P3.4 Prisma 7** + `prisma.config.ts` | 🔲 | [next-development P3.4](./2026-05-10-next-development.md) |
| D2 | **E2E**：孩子「错→留题、对→下一题」；家长上传→校对→孩子见题 | 🔲 | 扩展 [CI / Playwright](../../.github/workflows/ci.yml)；见 [next-development](./2026-05-10-next-development.md) P1.2 |
| D3 | **P1.3** `RUN_INTEGRATION=1` Prisma 集成测试骨架 | ✅ | README + `*.integration.test.ts` |
| D4 | **CI**：unit + Chromium e2e + Postgres | ✅ | [next-development P1](./2026-05-10-next-development.md) |
| D5 | **img `src` 白名单 / XSS 防护**（复习缩略图等） | 🔲 | 代码审查建议；可与 A1 协同 |

---

## E — 长期产品 / 基础设施（与「家庭原型」边界分开）

| ID | 任务 | 状态 | 说明 / 链接 |
|----|------|------|-------------|
| E1 | **真 OCR**、版式理解 | 🔲 | [设计总 spec](../specs/2026-05-04-private-english-tutor-app-design.zh.md) |
| E2 | **对象存储** + CDN URL，替代 DB 内大 data URL | 🔲 | 同上；[next-development P3.1](./2026-05-10-next-development.md) |
| E3 | **生产级登录**、多家庭租户 | 🔲 | 设计 spec；当前 [prototype-session](../../src/lib/prototype-session.ts) |
| E4 | **语音**（输入 / TTS / 发音评分） | 🔲 | 设计 spec 非 v1 范围 |
| E5 | **真实 AI 判分与家长复核队列** | 🔲 | 与 B3、设计 spec 对齐 |

---

## 修订记录

| 日期 | 变更 |
|------|------|
| 2026-05-12 | 初版：A–E 与 handoff/plan/spec 链接、状态列、当前迭代聚焦占位 |
