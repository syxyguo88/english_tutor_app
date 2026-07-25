# Spec: Monorepo layout（frontend / backend）

仓库布局与工程契约；不描述绘本/练习等业务功能。详细场景说明见变更 `plan.md`。

## 新增需求

### 需求: Monorepo 目录布局

系统**必须**采用 `frontend/` + `backend/` + 仓库根 workspace 编排的目录结构；**禁止**在迁移完成后仍以根目录 `src/app` 作为唯一应用入口。

#### 场景: 目标目录存在且职责清晰

- **当** 本变更已合并
- **那么** 必须存在 `frontend/src/app/`（或等价 Next 入口）、`backend/prisma/schema.prisma`，且仓库根保留 `package.json`、`docker-compose.yml`、`.github/workflows/`

#### 场景: 根目录不再承载 Next 应用树

- **当** 迁移验收完成
- **那么** 根目录**不得**仍存在作为唯一真相的 `src/app/` 树

#### 场景: 项目结构文档一致

- **当** 查看 `spec/structure.md`
- **那么** 其描述的顶层目录树与实际仓库**必须**一致（含 e2e 位于根 `tests/e2e` 的约定）

### 需求: npm workspaces 与单一 Prisma schema

系统**必须**使用 npm workspaces；Prisma schema **必须**仅存在于 `backend/`；`frontend/` **禁止**维护独立 `prisma/schema.prisma`。

#### 场景: workspaces 可安装解析

- **当** 在仓库根执行 `npm ci`
- **那么** 安装成功，且 `@english-tutor/frontend` 与 `@english-tutor/backend` workspace 包可解析

#### 场景: 单一 schema 来源

- **当** 在仓库内搜索 `schema.prisma`（排除 `node_modules` 与归档目录）
- **那么** **仅** `backend/prisma/schema.prisma` 一处

### 需求: 根脚本与本地开发契约

根 `package.json` **必须**提供与迁移前等价的开发/构建/数据库/测试脚本入口。

#### 场景: README 可复制从零到跑

- **当** 新环境按 `README.md` 执行安装、`.env`、数据库、migrate、seed、`npm run dev`
- **那么** 必须能打开家长/孩子关键路由且与迁移前行为一致

#### 场景: 根脚本能力等价

- **当** 在仓库根执行 `npm run dev`、`npm run build`、`npm run prisma:generate`、`npm run db:seed`
- **那么** 各命令**必须**成功（通过 workspace 委托子包）

#### 场景: e2e 冷启动 Prisma client 有效

- **当** 按 CI 或 Playwright `webServer` 顺序执行（含 `prisma:generate` 后 `build`/`start`）
- **那么** **不得**因过时 `@prisma/client` 导致 `/child/today` 等路由运行时失败

### 需求: CI 与测试资产

CI **必须**在 monorepo 布局下保持 unit + Chromium e2e 绿；Vitest **必须**继续覆盖 `frontend/src` 下单元测试。

#### 场景: CI 流水线通过

- **当** GitHub Actions 在约定分支上运行
- **那么** `npm ci`、Prisma migrate/generate、typecheck、lint、unit test、Chromium e2e **必须**通过

#### 场景: Vitest 收集范围正确

- **当** 执行 `npm run test`
- **那么** 领域与仓储等既有单元测试**必须**被执行（无大规模误跳过）

#### 场景: Playwright 使用 workspace 服务

- **当** 在仓库根执行 `npm run test:e2e`
- **那么** 根 `playwright.config.ts` 的 `webServer` **必须**委托 monorepo 下的 build/start；`tests/e2e` **必须**可发现并跑通 Chromium 项目

#### 场景: 可选集成测试路径

- **当** 设置 `RUN_INTEGRATION=1` 并执行文档中的 test 命令
- **那么** Prisma 集成测试路径**必须**正确（不因目录搬迁静默跳过）

### 需求: 文档与业务回归

`CLAUDE.md` **必须**与 `spec/structure.md` 一致；迁移**禁止**改变已有业务路由行为。

#### 场景: CLAUDE 路径不误导

- **当** 阅读 `CLAUDE.md` 中源码/Prisma 路径描述
- **那么** 必须与 `spec/structure.md` 一致或显式引用其为权威

#### 场景: 关键路由无行为回归

- **当** 访问 `/parent/books`、`/child/today`、`/child/book-review`
- **那么** 页面级行为**必须**与迁移前一致（路径修复除外）

#### 场景: 环境与 compose 仍兼容

- **当** 使用 `.env.example` 与 `docker-compose.yml`
- **那么** `DATABASE_URL` 约定**必须**仍有效
