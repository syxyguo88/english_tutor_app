# Spec: Monorepo layout（frontend / backend）

**规格风格**：场景式（Scenario-based）——每条可独立验收；本文件描述**仓库布局与工程契约**，不描述业务功能（绘本、练习等）。

---

## A. 仓库布局（Layout）

### 场景 A1：目标目录存在且职责清晰

- **前置**：本变更已合并到目标分支。
- **验收**：
  - 存在目录 `frontend/`，且包含 Next App Router 入口（例如 `frontend/src/app/layout.tsx` 或项目选用的等价路径）。
  - 存在目录 `backend/`，且包含 **唯一** Prisma schema 路径（例如 `backend/prisma/schema.prisma`）。
  - 仓库根保留 `package.json`（workspace 根）、`docker-compose.yml`（若项目使用）、`.github/workflows/`。

### 场景 A2：不再以根目录 `src/app` 为唯一应用入口

- **前置**：迁移完成。
- **验收**：根目录不存在「仍承载全部 Next 页面」的 **`src/app`** 树作为唯一真相（允许短暂 shim **仅当** openspec 明确记录删除计划，**默认不允许**）。

### 场景 A3：`spec/structure.md` 与仓库一致

- **前置**：合并前或合并提交中更新项目级结构文档。
- **验收**：`spec/structure.md` 描述的顶层树与实际目录**无矛盾**（含 `tests/` 或 `frontend/tests/` 等 e2e 位置的最终选择）。

---

## B. Workspace 与依赖（Workspaces）

### 场景 B1：npm workspaces 可解析

- **前置**：干净工作区，仅根 `package-lock.json`（推荐）。
- **验收**：在仓库根执行 `npm ci` 成功；`node_modules` 中可解析 `frontend`、`backend` workspace 包（`npm ls -w frontend` / `npm ls -w backend` 或等价命令成功）。

### 场景 B2：单一 Prisma schema 来源

- **验收**：
  - 全仓库 `find` / ripgrep 仅 **一处** `schema.prisma`（排除 `node_modules`、归档目录）。
  - `frontend` **不**包含独立 `prisma/schema.prisma`。

---

## C. 脚本与本地开发（Local dev）

### 场景 C1：README 可复制「从零到跑」

- **前置**：新机器仅有 Node、Docker（或自备 Postgres）、git。
- **验收**：严格按 `README.md` 步骤可完成：依赖安装 → 环境文件 → 数据库启动 → migrate → seed → 启动 dev → 浏览器可打开家长/孩子关键路由（与迁移前一致）。

### 场景 C2：根脚本对外契约稳定

- **验收**（名称可微调，但能力须等价）：
  - `npm run dev` 启动 Next 开发服务器（通过 workspace 委托）。
  - `npm run build` 产出生产构建成功。
  - `npm run prisma:generate` / `db:migrate` / `db:seed`（或文档所写等价命令）在**文档声明的 cwd** 下成功。

### 场景 C3：Prisma 与 Next 的生成顺序

- **前置**：冷启动 e2e 或 CI job。
- **验收**：在**无**手工预跑的情况下，按文档或 CI 顺序执行不会出现过时 `@prisma/client` 导致运行时错误（与迁移前 `playwright.config.ts` 中「先 generate 再 dev」意图一致）。

---

## D. 持续集成（CI）

### 场景 D1：CI 使用 workspace 安装与检查

- **验收**：`.github/workflows` 中 `npm ci`、缓存路径、Prisma、lint、typecheck、unit test 全部在迁移后仍绿。

### 场景 D2：E2E job 等价

- **验收**：E2e job 内 **Chromium** 套件通过；Postgres service、`DATABASE_URL`、`migrate deploy`、`seed` 与迁移前行为一致。

### 场景 D3：可选集成测试门闸

- **前置**：仓库保留 `RUN_INTEGRATION=1` 约定。
- **验收**：README 仍说明如何开启；开启后命令路径正确（不因目录搬迁而静默跳过）。

---

## E. 测试资产（Tests）

### 场景 E1：Vitest 收集范围正确

- **验收**：`npm run test` 执行时，**单元测试**仍覆盖原有关键模块（领域、仓储等），无大规模「误跳过」或路径空跑。

### 场景 E2：Playwright 基址与 webServer

- **验收**：`playwright.config.ts`（根或 `frontend/`，以设计锁定为准）中 `baseURL`、`webServer.command` 指向 **workspace 下** 的 dev 命令；`tests/e2e` 内 specs 可发现且通过（Chromium）。

---

## F. 文档与协作（Docs）

### 场景 F1：`CLAUDE.md` 不误导路径

- **验收**：`CLAUDE.md` 中涉及源码树、Prisma 位置的描述与 `spec/structure.md` **一致**或显式引用该文件为权威。

### 场景 F2：OpenSpec 元数据

- **验收**：本变更目录 `openspec/changes/migrate-monorepo-frontend-backend/` 含 `proposal.md`、`design.md`、`specs/**/spec.md`；后续实现阶段补 `plan.md`、`tasks.md`（本场景可在 `plan.md` 落地后勾验）。

---

## G. 回归与安全网（Regression）

### 场景 G1：无业务行为回归

- **验收**：对 `/parent/books`、`/child/today`、`/child/book-review` 等现有路由的手动或 e2e 抽样，页面级行为与迁移前一致（除路径修复带来的等价改动）。

### 场景 G2：已知原型约束仍成立

- **验收**：`.env.example` 仍含 `DATABASE_URL`；`docker-compose.yml`（如存在）仍与示例连接串兼容。
