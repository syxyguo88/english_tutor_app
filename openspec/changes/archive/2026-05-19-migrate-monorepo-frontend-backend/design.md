# Design: migrate-monorepo-frontend-backend

## 1. 架构概览（迁移后）

```text
                    ┌─────────────────────────────────────┐
                    │  repo root (workspace root)         │
                    │  package.json · CI · compose · env  │
                    └──────────────┬──────────────────────┘
           workspaces              │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
           ┌─────────────────┐           ┌─────────────────┐
           │   frontend/     │           │   backend/      │
           │   Next.js 15    │           │   Prisma        │
           │   App Router    │  import   │   (future API)  │
           │   Server Actions├──────────►│   DB access     │
           └────────┬────────┘  types    └────────┬────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                          PostgreSQL (compose / CI)
```

**边界原则**：`frontend` **不复制**一份 Prisma schema；`backend` 为 **Prisma 与数据库迁移的唯一宿主**。`frontend` 通过 workspace 依赖引用 `backend` 暴露的 **Db 模块**（命名以实现为准：`@english-tutor/db` / `backend` 包名在实现时锁定）。

## 2. 方案对比与推荐

### 方案 A — npm workspaces + `backend` 导出 Prisma Client（推荐）

| 优点 | 缺点 |
|------|------|
| 与当前 `package-lock.json` / Node 22 CI 一致 | 需仔细处理 TS path / `exports` 字段 |
| Prisma generate 只在 backend 发生一次 | 首次配置 `package.json` `exports` 易踩坑 |
| Next 仍可 Server Actions 直连 DB（原型阶段） | 未来拆 HTTP 时再抽一层 |

**推荐**：方案 A —— **最小心智负担**，且满足「Prisma 归 backend」的目录与所有权。

### 方案 B — 独立 `packages/db` + `frontend` + `backend/api`

| 优点 | 缺点 |
|------|------|
| DB 客户端与「未来 API」解耦更清晰 | 三 workspace，本变更范围膨胀 |
| 长期最干净 | 对当前「仅搬家」过度设计 |

**结论**：不作为本变更默认；若实施中发现 `backend` 同时承担 API 与 Prisma 过重，再在后续变更拆 `packages/db`。

### 方案 C — 保留根 `src/`，仅虚拟目录别名

| 优点 | 缺点 |
|------|------|
| 改动量极小 | **不满足**项目级需求 R-2026-05-15-gd-16 |

**排除**。

## 3. 关键决策（锁定）

### 3.1 包管理器

- **选择**：**npm workspaces**（延续现有 `package-lock.json`）。
- **不选**：pnpm / yarn（除非团队后续统一迁移，**不在本变更**）。

### 3.2 Prisma 生成物与消费者

- **选择**：`prisma generate` 在 **`backend`** 包生命周期内执行（`postinstall` 或根脚本 `npm run prisma:generate -w backend`）；`frontend` **依赖** workspace 包 `backend`（或最终包名），通过 **稳定相对路径或 package exports** 引用 `PrismaClient` / 单例 `db`。
- **约束**：禁止在 `frontend` 再维护第二份 `schema.prisma`。

### 3.3 领域与业务代码位置

- **当前事实**：领域与仓储在 `src/domain`、`src/lib`（与 Next 共用）。
- **本变更默认**：上述代码随 Next **迁入 `frontend/src`**（保持相对 import 改动可控）。若个别纯逻辑文件零 Next 依赖，**可选**后续再抽到 `packages/shared` —— **不纳入本变更必达项**。

### 3.4 E2E 与 Playwright 配置位置

| 选项 | 说明 |
|------|------|
| **A（默认）** | `playwright.config.ts` 留在**仓库根**，`webServer` 调用 workspace 的 `frontend` dev；`testDir` 仍指向根 `tests/e2e` |
| **B** | 配置迁入 `frontend/`；CI `working-directory: frontend` |

**推荐**：**选项 A**，减少 CI 与文档里「从哪执行 playwright」的分叉；若根目录过于拥挤，可在后续变更再迁配置。

### 3.5 环境变量与 `DATABASE_URL`

- **选择**：继续由**仓库根** `.env` / `.env.example` 提供 `DATABASE_URL`（与 `docker-compose.yml` 对齐）；`backend` Prisma CLI 从进程 cwd 或 `env` 读取。
- **说明**：若工具要求 `schema` 在子目录，使用 `prisma` 的 `--schema` 或在 `backend/package.json` 配置 `prisma.schema` 路径。

### 3.6 `docker-compose.yml`

- **选择**：保留在**仓库根**（与 `spec/structure.md` 一致）；不强制迁入 `backend/`。

## 4. CI 调整要点（实现清单）

- `actions/setup-node` 的 **`cache-dependency-path`**：指向根 `package-lock.json`（若锁文件仅根一份）；若子包各自锁文件（**不推荐双锁**），需同步文档。
- **Install**：根目录 `npm ci`（workspaces 一次安装）。
- **Prisma**：`migrate deploy` / `generate` / `seed` 的 cwd 或 `-w backend`。
- **Next build / e2e**：确保 `NODE_ENV`、端口 `E2E_PORT`、Postgres service 与迁移前一致。
- **集成测试**：`RUN_INTEGRATION=1` 的路径与 `vitest.config` 的 `root` / `include` 更新。

## 5. 风险与缓解

| 风险 | 缓解 |
|------|------|
| Prisma Client 双生成或版本漂移 | 仅 backend 声明 `@prisma/client`；根脚本统一 generate |
| Next 解析 workspace TS 包失败 | `next.config.ts` `transpilePackages: ['backend']`（包名以实装为准） |
| Server Actions 与 monorepo 边界 | 保持单进程 dev；避免循环依赖（db 不 import React） |
| CI 缓存命中下降 | 单锁文件 + 明确 cache path；必要时分 job 缓存 |
| 文档遗漏导致新贡献者卡死 | README「一键复制」块与 `spec/structure.md` 同步验收 |

## 6. 非目标

见 `proposal.md` **不包含**。

## 7. Open Questions（实现 / plan 阶段收口）

- `backend` **npm 包最终名称**（`@english-tutor/backend` vs `english-tutor-backend`）。
- `tsconfig` **project references** 是否启用（影响 IDE 与增量编译；可选）。
- Vitest **projects** 是否拆分 `frontend` / `backend` 测试配置（本变更可先保持单配置能跑全量）。
