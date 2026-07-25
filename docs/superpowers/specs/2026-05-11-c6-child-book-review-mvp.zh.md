# C6 — 孩子端「绘本复习」MVP 技术规格

日期：2026-05-11  
关联计划：`docs/superpowers/plans/2026-05-11-phase-priorities-parent-child.md`  
设计总览：`docs/superpowers/specs/2026-05-04-private-english-tutor-app-design.zh.md`

---

## 1. 目标

为孩子提供**独立于「今日练习」**的 **绘本复习**入口，以 **读句 / 句卡（A 方案）** 为主：在已确认内容范围内，按绘本浏览句子，支持日常翻看与跟读前的语言输入，**不要求**系统 TTS、录音、判分或新题库。

**成功标准（约一月 MVP）：** 使用原型家庭账号，在家长已确认至少一本绘本后，孩子从导航进入复习页 → 选书 → 按页序浏览句子列表（或等价卡片流），文案清晰、手机宽度可用、无登录改造。

---

## 2. 产品范围

### 2.1 必做（MVP）

| ID | 能力 | 说明 |
|----|------|------|
| R1 | **独立路由** | 新增孩子端路由（建议 **`/child/book-review`**，命名可实施时微调），与 **`/child/today`** 分离。 |
| R2 | **导航** | `AppShell` 中「绘本复习」链到该路由（替换当前指向 `/child/today` 的占位）。「今天」仍指向 `/child/today`。 |
| R3 | **书单** | 展示**当前家庭**下、**至少含一条可复习句子**的绘本列表（书名、状态或页数等轻量信息）。无数据时友好空状态 + 引导（如「请家长上传并确认绘本」）。 |
| R4 | **句子列表 / 句卡** | 进入单书后，展示该书下**可复习句子**，顺序：**`pageOrder` 升序**，同页内句子顺序稳定（建议按 `sentenceId` 或创建顺序）。 |
| R5 | **句子展示** | 每条以**句子英文文本**为主视觉；可选展示**页码**或「第 N 页」辅助定位。 |
| R6 | **可选缩略图** | 若存在 `pageImageUrl` 且客户端能加载，可展示**小图**（非全屏）；加载失败时**隐藏图或占位图标**，不阻塞阅读、不把裂图当 P0 修（与阶段优先级文档一致）。 |
| R7 | **会话与权限** | 与 **`/child/today`** 一致：使用现有 **`ensurePrototypeSession()`**，仅访问**本会话 `familyId`** 下的书与句子；不得跨家庭读取。 |

### 2.2 不做（本 MVP 明确非目标）

- 浏览器 / 系统 **TTS 朗读**、跟读打分、录音上传。  
- 在复习页内 **提交练习答案**、写入 `Attempt` / 更新 `MasteryStat`（复习与答题解耦）。  
- **真实 OCR**、对象存储迁移、离线包。  
- **「我的星星」** 激励体系（另开规格）。  
- 全局修复 **看图练习 `Exercise.prompt` 裂图**（本阶段不纳入 C6 必交付；复习页缩略图允许降级）。

---

## 3. 内容与数据规则

### 3.1 「可复习句子」定义

与练习管线对齐，句子须满足 **`canUseSentenceForPractice`**（`src/domain/content-rules.ts`）：

- `sentence.confirmedAt` 为**有效** `Date`（非 `null`、非 Invalid Date）。

同时，句子所属 **书页**须为家长已确认流程下的可用状态（与现有 `getConfirmedPracticeContent` 语义一致或**更严**）：

- `BookPage.status === Confirmed`（与 Prisma / 域枚举一致）。

**说明：** 若当前 `getConfirmedPracticeContent` 的 Prisma `where` **未**包含 `Sentence.confirmedAt` 条件，C6 实现应在**查询层或映射层**显式过滤，避免未确认句子进入复习列表；并在实现计划中注明是否顺带收紧练习同步数据源（可选，避免范围膨胀可仅在新 API 中过滤）。

### 3.2 书单来源

- 从 **`Book`** 中选取：`familyId === session.familyId`，且存在**至少一条**满足 §3.1 的句子。  
- 排序建议：与 **`listBooksForFamily`** 一致（如 `updatedAt` 降序），或按「最近有确认内容」排序（可选优化，非 MVP 阻塞）。

### 3.3 单书句子数据

每条记录至少包含：

| 字段 | 用途 |
|------|------|
| `sentenceId` | 稳定 key、列表项 `key` |
| `sentenceText` | 主文案 |
| `pageOrder` | 排序与「第几页」展示 |
| `pageId` | 可选，调试或未来扩展 |
| `pageImageUrl` | 可选缩略图；允许空或无效 URL |

不要求在 MVP 中返回知识链接全文；若 UI 需要「轻量标签」可后续加。

---

## 4. 界面与交互（线框级）

### 4.1 页面结构

1. **`/child/book-review`（书单）**  
   - 标题：如「绘本复习」  
   - 列表：每行 / 卡片 → 书名 + 进入  
   - 空状态：无书或无满足 §3.1 的句子时的说明 + 家长端引导文案  

2. **`/child/book-review/[bookId]`（单书复习）**  
   - 顶栏：返回书单、书名  
   - 主体：**垂直列表**或**大卡分页**（二选一，实现组定案；推荐先 **垂直列表** 降低复杂度）  
   - 每条：大号句子文本 + 次要信息（页码）；图可选右侧或下方  

### 4.2 无障碍与国际化

- 列表区使用合理 **`aria-label`**（如「某书句子列表」）。  
- 文案：**中文说明 + 英文句子**；错误 / 空状态中英可读（与现有孩子页风格一致即可）。

---

## 5. 技术实现要点

### 5.1 分层建议

| 层 | 建议 |
|----|------|
| **数据** | 在 **`BookIngestionRepository`** 增加只读方法（示例命名）：`listBooksWithReviewSentencesForFamily(familyId)`、`listReviewSentencesForBook({ familyId, bookId })`，内部 Prisma 查询 + §3.1 过滤；**或**在页面层基于 `getConfirmedPracticeContent()` 分组过滤（仅原型可接受，数据量大时优先专用查询）。 |
| **RSC** | 书单页、单书页均为 **Server Component** 拉数；无需 `"use client"` 除非做客户端-only 动效。 |
| **布局** | 复用 **`AppShell`** + 与 `child/today` 一致的 `childNav` 配置（更新 href）。 |

### 5.2 性能

- 单书句子数在单家庭原型内预期有限；仍建议 **单查询** 或 **书 + 句子一次 join**，避免 N+1。  
- **不在此页**调用 `syncConfirmedPracticeExercises`（避免与 `/child/today` 重复重活）；复习为只读展示即可。

### 5.3 安全

- 所有查询带 **`familyId`**（来自 session），`bookId` 必须属于该 family，否则 **404** 或统一「未找到」页，不泄露其他家庭是否存在该书。

---

## 6. 验收标准（测试与手工）

| # | 验收项 |
|---|--------|
| AC1 | 导航「绘本复习」进入新路由，「今天」仍进 `/child/today`。 |
| AC2 | 无确认句子时，复习书单为空或提示正确，不报错。 |
| AC3 | 家长确认一页含句后，该书出现在书单；进入后句子顺序符合 §3.1 / §2.1 R4。 |
| AC4 | `sentenceText` 与家长在校对页确认的内容一致（抽样对照 DB 或校对 UI）。 |
| AC5 | 非本会话 `bookId` URL 无法看到他人数据。 |
| AC6 | `npm run typecheck`、`npm run lint`、`npm run test` 通过；如有针对新 repository 方法的单元测试，覆盖过滤逻辑（`confirmedAt`）。 |
| AC7 | （可选）Playwright：登录孩子 → 打开复习 → 断言书单或空状态文案。 |

---

## 7. 依赖与风险

| 风险 | 缓解 |
|------|------|
| `getConfirmedPracticeContent` 与域规则不一致 | C6 新 API **显式** `Sentence.confirmedAt` 过滤；记录在 PR / 计划中。 |
| `pageImageUrl` 为巨大 data URL | 列表页可不配图；单书页缩略图限制 `max-width` / `loading="lazy"`，失败 `onError` 隐藏。 |
| Seed 无句子 | 文档说明依赖 `db:seed` + 家长上传确认流程做手工验收。 |

---

## 8. 实施计划引用

实现时使用 **`superpowers:subagent-driven-development`**，按任务拆分，例如：

1. Repository API + 单元测试（过滤规则）。  
2. `/child/book-review` 书单页 + `AppShell` 导航。  
3. `/child/book-review/[bookId]` 单书页。  
4. 可选 e2e、README 一句说明。

---

## 9. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-05-11 | 初版：MVP = 读句/句卡；路由、数据规则、验收、非目标。 |
| 2026-05-11 | **已实现：** `listBooksWithReviewSentencesForFamily` / `getBookSentenceReviewList`（TDD + `canUseSentenceForPractice` / 页 Confirmed）；`/child/book-review`、`/child/book-review/[bookId]`；共享 `src/app/child/child-nav.ts`；`SentenceThumbnail` 懒加载 + `onError` 隐藏；`getConfirmedPracticeContent` Prisma 增加 `Sentence.confirmedAt` 过滤。未加 Playwright（AC7 可选）。 |

---

## 10. Implementation record（仓库状态）

- **Routes:** `/child/book-review`，`/child/book-review/[bookId]`。  
- **Nav:** `childNav` — 绘本复习 → `/child/book-review`；今天 → `/child/today`。  
- **Tests:** `repository.test.ts` 中 `describe("C6 book sentence review")` 等；全量 `npm run test` 通过（集成测试仍 opt-in）。
