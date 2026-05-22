# Tasks

> **维护规则**：
> - **任务内容**由人工维护，仅在人工明确要求时修改
> - **任务完成状态**由 AI 在对应 openspec 变更归档后自动勾选
>
> 每个任务对应 `openspec/changes/<task-name>/` 下的一个变更提案。

---

## 命名约定

- 任务名使用 **kebab-case**：`migrate-monorepo-frontend-backend`
- 粒度：**一个提案能做完的事情**（通常 1~3 天工作量）
- 尽量独立：减少任务间依赖，便于并行推进

---

## 版本基线 2026-05-15（分支 `mvp-foundation` · 无 semver 版本分支）

> 本块对应本次 kickoff 写入的项目级范围；执行时每个 ✅ 任务走完整 OpenSpec 七阶段（`openspec-cn new change` → … → archive → merge）。

- [x] **migrate-monorepo-frontend-backend** — 将现有根目录 Next 应用迁入 `frontend/`（含 `src/app`、`public`、前端工具链配置）；将 **Prisma**（`schema.prisma`、`migrations/`、`seed.ts`）及**未来独立 HTTP API** 骨架迁入 `backend/`；根目录 **npm/pnpm workspaces**（或等效 monorepo 编排）与 **CI 工作流路径**、**README 本地命令**一并更新；验收后 `spec/structure.md` 与真实目录一致  
- [x] **post-migration-verification-hardening** — 迁移完成后全量验证：`typecheck`、`lint`、`test`、`test:e2e`、可选 `RUN_INTEGRATION=1`；修复路径相关的 Playwright / Vitest 配置回归  
- [ ] **track-a-last-question-mastery-strip** — 路线图 **A2**：`getTodayPractice` 最后一题与 `latestAttempt` / 步进器展示一致性（独立 openspec，待执行时拆 proposal）  
- [ ] **parent-b1-pending-review-entry** — 路线图 **B1**：家长端「待校对」一键入口或列表过滤  
- [ ] **child-c2-stars-gamification** — 路线图 **C2**：「我的星星」导航与最小可用实现（需先补游戏化 spec 或并入 openspec）  
- [ ] **e2e-expand-practice-flows** — 路线图 **D2**：扩展 Playwright 覆盖错→留题、对→下一题及上传→校对→孩子见题等主路径  
- [ ] **backend-prisma7-config** — 路线图 **D1**：Prisma 7 与 `prisma.config.ts` 升级路径（独立变更，避免与迁移混写）  
- [ ] **security-img-src-allowlist** — 路线图 **D5**：复习缩略图等 `img` 白名单 / XSS 加固  

---

## 进度概览

- 总任务数：8（本基线块）
- 已完成：2
- 进行中：0

（每完成一个任务并归档 openspec 后更新数字）

---

## 修订历史

| 日期 | 说明 |
|------|------|
| 2026-05-15 | 由 **gd** kickoff：以日期版本块取代模板 M1–M4 占位；任务与 `docs/superpowers/plans/2026-05-12-long-term-roadmap.zh.md` A–D 轨对齐 |
