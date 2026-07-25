# verification-hardening 规范

## 目的

定义 monorepo 迁移后的**工程验证契约**：根级 `npm run verify` 流水线、Vitest 集成测试环境、文档/CI 与本地命令对齐。不含业务功能或扩展 e2e 场景。
## 需求
### 需求: 根级验证入口

仓库**必须**提供从根目录一键运行的验证脚本；**禁止**要求贡献者记忆多条无序命令才能确认「迁移后仍健康」。

#### 场景: 默认验证通过

- **当** 在仓库根已配置 `.env`、`npm ci`、Postgres 已 migrate 且 seed（e2e 除外）
- **那么** 执行 `npm run verify` **必须** exit 0，且**依次**覆盖：`prisma:generate`、`typecheck`、`lint`、`test`、`build`

#### 场景: 验证失败可诊断

- **当** 上述任一步骤失败
- **那么** 脚本**必须**输出失败步骤名称与非零 exit code，且整体 exit 1

#### 场景: 可选 e2e 验证

- **当** 执行文档中的 `npm run verify:e2e`（或 `verify --e2e`）
- **那么** **必须**委托现有 `scripts/run-e2e.mjs` + Playwright Chromium 项目，且先决条件在 README 中写明

### 需求: 集成测试环境（Vitest + Postgres）

在 monorepo 布局下，opt-in Prisma 集成测试**必须**能在「仅配置根 `.env`」时运行，无需额外 `export` 手册步骤。

#### 场景: RUN_INTEGRATION 本地可运行

- **当** 根目录存在含 `DATABASE_URL` 的 `.env`，且数据库已 migrate/seed
- **那么** `RUN_INTEGRATION=1 npm run test`（或 `npm run verify:integration`）**必须**执行 `frontend/src/lib/practice/prisma.integration.test.ts` 中的用例且通过（非整文件 skip）

#### 场景: 无 DATABASE_URL 时明确失败

- **当** `RUN_INTEGRATION=1` 且未设置 `DATABASE_URL` / `INTEGRATION_DATABASE_URL`
- **那么** 集成测试**必须**失败并给出可读错误信息（**禁止**静默 skip 为通过）

### 需求: 文档与状态快照

README 与 Superpowers 当前状态**必须**反映 monorepo 验证命令，且与脚本一致。

#### 场景: README 验证清单完整

- **当** 阅读 README「English Tutor 本地开发」验证小节
- **那么** **必须**列出 `verify`、常规 `test`/`test:e2e`、`RUN_INTEGRATION` 的用途区别及先决条件

#### 场景: current-status 快照更新

- **当** 本变更合并
- **那么** `docs/superpowers/current-status.md` **必须**包含更新后的 Verification snapshot（命令列表与 monorepo 路径说明）

### 需求: CI 与本地验证对齐

CI **必须**在 monorepo 布局下捕获「仅 typecheck/lint/test 无法发现」的构建失败；集成测试在 CI 中的策略**必须**在 design/plan 中明确且可执行。

#### 场景: CI unit job 包含生产构建

- **当** GitHub Actions `unit` job 运行
- **那么** **必须**包含 `npm run build` 步骤且失败时 job 失败

#### 场景: CI 集成测试（若启用）

- **当** workflow 启用 `RUN_INTEGRATION=1` 步骤
- **那么** 在 Postgres service 与 migrate/seed 之后运行，且与本地 `RUN_INTEGRATION=1 npm run test` 行为一致

