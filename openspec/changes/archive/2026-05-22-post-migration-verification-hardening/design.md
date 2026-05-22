# Design: post-migration-verification-hardening

## 1. 背景

Monorepo 迁移后，验证命令分散在 README 多段、CI 两个 job、以及 agent 记忆中的「上次绿了的组合」。本变更**不移动目录**，只加固**如何证明仓库健康**。

## 2. 目标架构（验证流）

```text
开发者 / CI
    │
    ▼
npm run verify ──► scripts/verify.mjs
    │                    │
    │                    ├─► prisma:generate (-w backend)
    │                    ├─► typecheck / lint (-w frontend)
    │                    ├─► vitest run (root config → frontend/src)
    │                    └─► build (-w frontend)
    │
    ├─► verify:integration ──► 同上 + RUN_INTEGRATION=1 test
    └─► verify:e2e ──► 假定 DB 已 migrate/seed；run-e2e.mjs → Playwright
```

**原则**：脚本在**仓库根**执行；子命令通过现有 workspace 委托，不重复实现 Prisma/Next CLI 逻辑。

## 3. 方案对比

### 方案 A — 根 `verify.mjs` + Vitest 加载 `.env`（推荐）

| 优点 | 缺点 |
|------|------|
| 本地与文档一处真相 | 需维护脚本参数（--skip-e2e 等） |
| 集成测试不再依赖 shell `export` | 脚本失败时要清晰打印步骤名 |

### 方案 B — 仅文档，无脚本

| 优点 | 缺点 |
|------|------|
| 零代码 | 无法防止「漏跑 build / generate」 |
| | 不符合「hardening」目标 |

### 方案 C — 全量进 CI（含 e2e + integration 每 push）

| 优点 | 缺点 |
|------|------|
| 最强门禁 | e2e 已单独 job；integration 增加 CI 时间 |
| | 与「opt-in integration」历史约定需权衡 |

**推荐**：**A + C 的轻量子集** —— `verify` 脚本本地必用；CI `unit` 加 `build` + 可选 `RUN_INTEGRATION=1`（Postgres service 已存在）；e2e **仍**独立 job，由 `verify:e2e` 本地/发布前手动或沿用现有 workflow。

## 4. 关键决策

### 4.1 测试策略

- **回归 / 验证加固**，非 feature-level TDD。
- 若新增脚本逻辑，可用**少量**针对 `verify.mjs` 的单元测试（可选）；**不**为业务域加新测试。

### 4.2 Vitest 与 `.env`

- 在 **`vitest.setup.ts`**（根）用 `dotenv` 加载 **`${repoRoot}/.env`**（与 `backend/prisma/seed.ts` 的 `../../.env` 一致）。
- `frontend/src/lib/practice/prisma.integration.test.ts` 保持 `@vitest-environment node`；依赖 `DATABASE_URL` 或 `INTEGRATION_DATABASE_URL`。

### 4.3 Playwright / e2e

- **不**改 e2e 用例；仅保证 `npm run verify:e2e` 文档化先决条件：`db:up`、migrate、seed、Chromium 已安装。
- 继续委托 `scripts/run-e2e.mjs`（端口、NO_PROXY 逻辑已存在）。
- `playwright.config.ts` 的 `rm -rf frontend/.next` **保留**（迁移 devlog 已记录）。

### 4.4 CI 增量

| Job | 新增步骤 |
|-----|----------|
| `unit` | `npm run build`（在 test 之后或之前，以 catch Next 构建失败为准） |
| `unit` | 可选：`RUN_INTEGRATION=1 npm run test`（Postgres 已起；须确保 Vitest 加载 `.env` 或 job `env` 含 `DATABASE_URL`） |
| `e2e` | 不变（仍 `npm run test:e2e`） |

### 4.5 文档

- **README**：增加「验证（推荐）」小节，列出 `verify` / `verify:integration` / `verify:e2e` 及耗时提示。
- **current-status.md**：替换 Verification snapshot 为 monorepo 命令 + 最近本地/CI 日期占位（由执行者填写实际日期）。

## 5. `verify.mjs` 行为草案

```javascript
// 伪代码 — 实现时写入 scripts/verify.mjs
const steps = [
  ["prisma:generate", () => run("npm", ["run", "prisma:generate"])],
  ["typecheck", () => run("npm", ["run", "typecheck"])],
  ["lint", () => run("npm", ["run", "lint"])],
  ["test", () => run("npm", ["run", "test"])],
  ["build", () => run("npm", ["run", "build"])],
];
// flags: --integration → RUN_INTEGRATION=1 覆盖 test 步骤
// flags: --e2e → 末尾 run test:e2e
```

失败时：**打印步骤名 + exit code**，整体 exit 1。

## 6. 风险与缓解

| 风险 | 缓解 |
|------|------|
| CI integration 在无 seed 时失败 | e2e job 已 seed；unit job 加 migrate + seed 或仅 migrate（集成测试读 prototype-family） |
| `.env` 未提交导致 CI 仅靠 `env.DATABASE_URL` | CI workflow 已设 `DATABASE_URL`；Vitest setup 不覆盖已有 env |
| verify 过慢 | 默认 `verify` 不含 e2e；e2e 单独 `verify:e2e` |

## 7. 非目标

见 `proposal.md`。

## 8. Open Questions（plan 阶段收口）

- `verify` 是否默认包含 `prisma:validate`。
- CI 是否在 `unit` job 跑 integration，或单独 `integration` job（推荐先并入 `unit` 以复用 Postgres service）。
