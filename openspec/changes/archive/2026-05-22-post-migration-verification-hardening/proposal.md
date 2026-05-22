# Proposal: post-migration-verification-hardening

## 变更内容

在 **monorepo 迁移已合并**（`migrate-monorepo-frontend-backend`）之后，把「能跑通」固化为「**可重复、可文档化、可对齐 CI**」的验证体系：

- 提供**单一入口**（如根脚本 `npm run verify` / `npm run verify:full`）串联：`prisma:generate` → `typecheck` → `lint` → `test` → `build`；可选 `test:e2e`、可选 `RUN_INTEGRATION=1`。
- 修复/补齐 monorepo 后**测试与环境的路径回归**（Vitest 读根 `.env`、集成测试 `DATABASE_URL`、Playwright `webServer` 与文档一致）。
- 更新 **README** 与 **`docs/superpowers/current-status.md`** 的验证快照，使新贡献者按文档即可复现。
- **可选**：在 CI `unit` job 增加 `npm run build`；增加 **opt-in** 集成测试步骤（`RUN_INTEGRATION=1`，需 Postgres service）。

与 `spec/tasks.md` 任务 **post-migration-verification-hardening** 对齐；依赖 `openspec/specs/monorepo-layout/` 已落地的目录契约。

## 为什么

- 迁移变更的 S8 在 feature 分支上已跑通，但**缺少**仓库级「一键验收」与集成测试在 Vitest 下的 **`.env` 加载**约定，新人易在 `RUN_INTEGRATION=1` 或 e2e 顺序上踩坑。
- 项目级需求 **R-2026-05-15-gd-18** 要求本地命令可复制；本变更把验证清单**显式化**，降低后续 feature 开发前的回归成本。
- **不**在本变更扩展业务 e2e 场景（留给 `e2e-expand-practice-flows`）或修产品 bug（留给 `track-a-*` 等）。

## 范围（Scope）

### 包含

- 根目录 **`scripts/verify.mjs`**（或等价）+ `package.json` 脚本：`verify`、`verify:integration`、`verify:e2e`（命名以实现为准）。
- **`vitest.setup.ts` 或 `vitest.config.ts`**：在仓库根加载 `.env`（与 `backend/prisma/seed.ts`、`frontend/next.config.ts` 路径一致），使 `RUN_INTEGRATION=1` 无需手工 `export DATABASE_URL`。
- **README**「English Tutor 本地开发」：完整验证矩阵、先决条件、与 CI 对齐说明。
- **`docs/superpowers/current-status.md`**：Verification snapshot 更新（日期 + 命令列表）。
- **CI**（小步）：`unit` job 增加 `npm run build`；可选 `RUN_INTEGRATION=1 npm run test` 步骤（失败即红，不 silent skip 除非无 DB）。

### 不包含

- 新增/修改业务功能或 UI 行为。
- 扩展 Playwright 用例覆盖（`e2e-expand-practice-flows`）。
- Prisma 7 升级（`backend-prisma7-config`）。
- 修改 `openspec/specs/monorepo-layout/` 的目录契约（仅消费它）。

## 成功标准

- [ ] 在干净 clone（`.env` + migrate + seed）下，`npm run verify` **exit 0**。
- [ ] `RUN_INTEGRATION=1 npm run verify:integration`（或文档等价命令）在 Postgres 可用时 **exit 0**，且**至少 1** 条集成测试执行（非全 skip）。
- [ ] README 中的命令与脚本实际行为一致；`current-status.md` 快照已更新。
- [ ] CI `unit`（及若增加的 integration 步骤）在 PR 上绿。

## 相关文档

- 前置归档：`openspec/changes/archive/2026-05-19-migrate-monorepo-frontend-backend/`
- 长期布局：`openspec/specs/monorepo-layout/spec.md`
- 本变更：`proposal.md`、`design.md`、`specs/verification-hardening/spec.md` → 后续 `plan.md`
