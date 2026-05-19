# Proposal: migrate-monorepo-frontend-backend

## 变更内容

将当前**仓库根目录单体**布局（Next.js + Prisma 同根）重组为 **npm workspaces monorepo**：

- **`frontend/`**：整棵 **Next.js 15** 应用（`src/app`、`public`、前端工具链与测试配置中与 Next 绑定的部分）。
- **`backend/`**：**Prisma**（`schema.prisma`、`migrations/`、`seed` 脚本）以及为**未来独立 HTTP API** 预留的 `backend/src`（本变更**可不实现** HTTP 服务，仅目录与包边界到位）。
- **仓库根**：`package.json` 作为 **workspace 根**，统一脚本入口（dev / build / test / e2e / prisma）；**CI**、**docker-compose**、**`.env.example`** 等与路径相关的引用全部更新。

与项目级需求对齐：`spec/requirements.md` **R-2026-05-15-gd-16**、**R-2026-05-15-gd-17**、**R-2026-05-15-gd-18**；结构真相图：`spec/structure.md`。

## 为什么

- **对齐模板与长期架构**：`spec/design.md` 决策 3 —— 分离 Web 壳与持久化边界，便于后续对象存储、真 OCR、独立 BFF。
- **降低后续功能变更的耦合**：新功能继续走 `openspec/changes/<name>/`，物理目录与包名先稳定，减少「根目录全堆」带来的 import 与 CI 隐性依赖。
- **可验证**：迁移本身应以「同一套验证命令仍绿」为验收，避免纯搬家不跑通。

## 范围（Scope）

### 包含

- 建立 **npm workspaces**（`"workspaces": ["frontend", "backend"]` 或等价字段名以最终实现为准）。
- **搬迁**：根目录 Next 相关源码与配置 → `frontend/`；`prisma/` → `backend/prisma/`（或本变更 `design.md` 锁定的等价路径）。
- **依赖与生成物**：`@prisma/client` 的生成与对 Next Server Actions / `src/lib/db` 的引用路径调整；确保 **单一** Prisma schema 来源（避免双 schema）。
- **脚本**：根 `package.json` 脚本对子包的委托（如 `npm run dev -w frontend`）；`README.md` 中 clone → install → DB → migrate → seed → test → e2e 路径更新。
- **CI**（`.github/workflows/ci.yml`）：`working-directory`、`cache-dependency-path`、锁文件位置；`npm ci` / `prisma migrate deploy` / `db:seed` / e2e **与迁移前等价绿**。
- **Playwright / Vitest**：`testDir`、`webServer.command`、任何硬编码 `cwd` 或相对路径修复。
- **`spec/structure.md`**：若与实现有差异，在**本变更合并时**按维护规则更新为与仓库一致。
- **`CLAUDE.md`**：若仍写死根目录 `src/`，改为指向 `frontend/` 或表述「以 `spec/structure.md` 为准」。

### 不包含（明确排除）

- **实现**新的 REST/GraphQL HTTP API（仅预留 `backend/` 包与入口占位即可）。
- **业务功能**变更（路由、领域规则、UI 行为不变，除非因路径错误被迫等价修复）。
- **Prisma 大版本升级**（如 Prisma 7）—— 独立变更（见 `spec/tasks.md` **backend-prisma7-config**）。
- **生产部署拓扑**的最终选定（可在 `design.md` 记 Open Question，本变更不实施）。

## 成功标准

- [ ] 在干净 clone 下，按 **更新后 README** 可完成：安装依赖 → Postgres → `.env` → migrate → seed → `typecheck` / `lint` / `test` / **`test:e2e`（Chromium）** 全绿（与迁移前能力等价）。
- [ ] `frontend` 可独立 `next dev` / `next build`（由根脚本或 workspace 脚本触发均可）。
- [ ] `backend` 可独立执行 Prisma CLI（`migrate`、`generate`、`db seed`），且 **仅一处** schema 为权威来源。
- [ ] GitHub Actions 在 **`main` / `mvp-foundation` / 本 feature 分支策略所覆盖的分支**上与迁移前同等级检查通过（具体分支列表以 workflow 文件为准，若需增加 feature 分支可列入本变更或后续小变更）。
- [ ] 无残留「根目录 `src/app` 仍为唯一真相」的文档或 CI 假设（除非刻意保留 shim，**不推荐**）。

## 相关文档

- 本变更：`proposal.md`、`design.md`、`specs/monorepo-layout/spec.md`
- 后续：`writing-plans` → `plan.md`、`tasks.md`（尚未创建）
