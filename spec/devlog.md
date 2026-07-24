# Development Log

> **维护规则**：每次 PR 合并后，由 AI 自动追加一条记录。
>
> 每条记录应包含：日期、变更名、摘要、关键决策/坑点。

---

## Entry Template

```markdown
### YYYY-MM-DD · <change-name>

**摘要**：一句话说清楚这次变更做了什么。

**关键决策**：
- 决策点 1 — 选了什么、放弃了什么、为什么
- 决策点 2 — ...

**踩坑 / 经验**：
- 坑点描述 + 如何解决（可选）

**相关产出**：
- 归档位置：`openspec/changes/archive/<change-name>/`
- PR：#xxx（如适用）
```

---

## Log Entries

<!-- 最新条目在最上面 -->

### 2026-07-24 · track-a-last-question-mastery-strip

**摘要**：修复孩子端 `/child/today` 最后一题提交后，今日练习队列、掌握 strip 与作答反馈可能错位的问题。已从 `feature/track-a-last-question-mastery-strip` **合并回父分支 `mvp-foundation`**。

**关键决策**：
- 仓库层复用 `localDateKey`，让同一本地日历日内已作答题继续保留在 `getTodayPractice` 返回队列中；跨日仍按 `nextReviewAt` 复习策略过滤
- UI 将作答反馈绑定到步进器当前题，仅当 `latestAttempt.exerciseId === current.id` 时展示，避免浏览其它题时显示全局最近作答

**踩坑 / 经验**：
- 当前环境没有可用的 `openspec-cn` CLI，且 `npx @openspec-cn/cli` 返回 404；本次按 `/opsx:archive` 约定手动归档并同步长期 spec

**相关产出**：
- 归档：`openspec/changes/archive/track-a-last-question-mastery-strip/`
- 长期规格：`openspec/specs/today-practice-feedback-alignment/spec.md`
- 验证：`npm run verify`

### 2026-05-22 · post-migration-verification-hardening

**摘要**：在 monorepo 落地后加固工程验证：`npm run verify` 串联 generate/validate/typecheck/lint/test/build；Vitest 与 `verify.mjs` 自动加载仓库根 `.env`；CI `unit` job 增加 seed、build、`RUN_INTEGRATION=1` 测试。已从 `feature/post-migration-verification-hardening` **合并回父分支 `mvp-foundation`**。

**关键决策**：
- 根脚本 `scripts/verify.mjs` + `verify:integration` / `verify:e2e`；**回归验证**为主，非 feature-level TDD
- CI 在既有 Postgres service 的 `unit` job 内跑集成测试（非单独 job）
- 长期规格：`openspec/specs/verification-hardening/`

**踩坑 / 经验**：
- `npm run verify` 最初未加载 `.env`，`prisma:validate` 在无 `DATABASE_URL` 时失败；已在 `verify.mjs` 用 `dotenv` 修复
- `openspec-cn archive` 若长期 spec 已存在同名需求，需 `--skip-specs` 或先合并增量

**相关产出**：
- 归档：`openspec/changes/archive/2026-05-22-post-migration-verification-hardening/`
- 长期规格：`openspec/specs/verification-hardening/spec.md`
- 项目级：`spec/tasks.md`（`post-migration-verification-hardening` ✅）

### 2026-05-19 · migrate-monorepo-frontend-backend

**摘要**：将根目录 Next.js + Prisma 单体重组为 **npm workspaces monorepo**（`frontend/`、`backend/`），根目录保留编排、CI、compose 与 e2e；业务行为不变，验证命令（typecheck / lint / test / build / e2e）保持可用。已从 `feature/migrate-monorepo-frontend-backend` **合并回父分支 `mvp-foundation`**。

**关键决策**：
- **方案 A**：`@english-tutor/backend` 唯一托管 Prisma（`backend/prisma/`）；`@english-tutor/frontend` 整棵 Next + 领域/仓储；根 `package.json` 脚本委托 workspace
- Playwright / Vitest 配置留在**仓库根**（`tests/e2e`、`playwright.config.ts`、`vitest.config.ts`）；e2e 用 **prod `build` + `start`**，启动前清 `frontend/.next` 避免 dev 残留
- 本变更采用**回归测试 + 分步验证**，非 feature-level TDD；长期规格写入 `openspec/specs/monorepo-layout/`

**踩坑 / 经验**：
- `openspec-cn archive` 要求变更 spec 含 `## 新增需求` 与 `#### 场景:` 增量格式，否则归档中止
- 本地 e2e：陈旧 `frontend/.next` 可导致 Server Actions / Prisma client 与生产构建不一致；`scripts/run-e2e.mjs` 可自动选空闲端口并绕过 loopback 代理

**相关产出**：
- 归档：`openspec/changes/archive/2026-05-19-migrate-monorepo-frontend-backend/`
- 长期规格：`openspec/specs/monorepo-layout/spec.md`
- 项目级：`spec/structure.md`、`spec/design.md`（§2.2 标为已实现）、`spec/tasks.md`（`migrate-monorepo-frontend-backend` ✅）

### 2026-05-15 · spec-baseline-kickoff-2026-05-15

**摘要**：在分支 `mvp-foundation`（无 `version/v*`）以日期标签完成首版项目级 spec kickoff：从 `docs/superpowers/` 升格 `requirements.md`、`design.md`、`tasks.md`、`structure.md`，并约定 **OpenSpec 单变更** 负责 `frontend/` + `backend/` monorepo 迁移。

**关键决策**：
- 需求 ID 采用 `R-2026-05-15-gd-*`；发起人缩写 **gd**
- 新功能一律 `openspec/changes/<name>/`；目录迁移任务 **`migrate-monorepo-frontend-backend`**
- `backend/` 容纳 Prisma 与未来 HTTP API；`frontend/` 容纳整棵 Next 应用

**相关产出**：
- 项目级：`spec/requirements.md`、`spec/design.md`、`spec/tasks.md`、`spec/structure.md`
- Superpowers 参考仍保留于 `docs/superpowers/`（北星与路线图）

### 2026-04-16 · bootstrap-speccoding-template

**摘要**：从 SpecCoding Template 初始化项目骨架。

**关键决策**：
- 采用「两级 Spec 体系」：`spec/` 管全局、`openspec/` 管单次变更
- 开发工作流固化为七阶段：git branch → scaffold → brainstorm → plan → execute → archive → merge

**相关产出**：
- 项目级 spec 文档骨架（requirements / design / tasks / devlog / structure）
- OpenSpec 配置 + 示例归档变更 `example-add-user-auth`
