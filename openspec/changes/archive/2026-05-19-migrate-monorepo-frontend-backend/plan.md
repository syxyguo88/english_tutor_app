# migrate-monorepo-frontend-backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use **superpowers:subagent-driven-development** (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **位置铁律：** 本文件位于 `openspec/changes/migrate-monorepo-frontend-backend/plan.md`，与同变更的 proposal / design / specs / tasks 放在一起。**不要**存到仓库根或 `docs/superpowers/plans/`。

**Goal:** 将根目录 Next.js + Prisma 单体重组为 **npm workspaces monorepo**（`frontend/` + `backend/`），保持业务行为不变，且 **typecheck / lint / test / test:e2e** 与迁移前等价全绿。

**Architecture:** 方案 A（见 `design.md`）—— **backend** 唯一托管 Prisma schema 与 `prisma generate`；**frontend** 整棵 Next 应用 + 领域/仓储代码；根目录保留 workspace 编排、CI、compose、Playwright（配置留根、`webServer` 委托 frontend dev）。

**Tech Stack:** npm workspaces · Node 22 · Next.js 15 · Prisma 6.x · Vitest · Playwright · GitHub Actions

**测试策略：** 本变更为**结构性迁移**，采用**回归测试 + 分步验证**（既有 Vitest / Playwright / typecheck / CI），**不**按 feature-level **TDD**（先写失败测试再实现）推进；新业务能力在后续 openspec 变更中再对具体行为使用 TDD。

**锁定包名（收口 Open Questions）：**

| 包 | `package.json` `name` | 目录 |
|----|------------------------|------|
| 根 | `english-tutor-app` | `.` |
| 后端 | `@english-tutor/backend` | `backend/` |
| 前端 | `@english-tutor/frontend` | `frontend/` |

---

## 规格覆盖自检（plan ↔ spec）

| Spec 场景 | 计划阶段 |
|-----------|----------|
| A1–A3 布局 | S1–S3、S8 |
| B1–B2 workspace / 单 schema | S1–S2 |
| C1–C3 本地脚本与 generate 顺序 | S4–S5、S7 |
| D1–D3 CI / 集成测试 | S6 |
| E1–E2 Vitest / Playwright | S5、S6 |
| F1–F2 文档 | S7 |
| G1–G2 回归 | S8 |

---

## 迁移后文件职责（先读此表再动手）

| 路径 | 职责 |
|------|------|
| `package.json`（根） | `workspaces`、对外脚本委托、**唯一** `package-lock.json` |
| `backend/package.json` | `prisma` CLI、`@prisma/client`、`prisma generate` |
| `backend/prisma/schema.prisma` | **唯一** schema |
| `backend/prisma/migrations/` | 迁移历史（`git mv` 自 `prisma/migrations/`） |
| `backend/prisma/seed.ts` | seed（`git mv` 自 `prisma/seed.ts`） |
| `backend/src/db.ts` | `PrismaClient` 单例（自 `src/lib/db.ts` 迁入） |
| `backend/src/index.ts` | `export { prisma } from "./db"` |
| `frontend/package.json` | Next / React / Vitest 相关依赖 |
| `frontend/src/**` | 原 `src/**`（含 `app`、`domain`、`lib`） |
| `frontend/next.config.ts` | `transpilePackages: ["@english-tutor/backend"]` |
| `playwright.config.ts`（根） | `webServer` 先 `prisma:generate` 再 `dev` |
| `vitest.config.ts`（根） | `include` 指向 `frontend/src/**/*.test.*` |
| `tests/e2e/**`（根） | 不变 |
| `docker-compose.yml`、`.env.example`（根） | 不变 |
| `.github/workflows/ci.yml` | Prisma 步骤加 `-w @english-tutor/backend`（或根脚本） |

**删除（迁移完成后）：** 根目录 `src/`、`prisma/`、根级 `next.config.ts`、`next-env.d.ts`、`postcss.config.mjs`、`tailwind.config.ts`、根级仅用于 Next 的 `tsconfig.json`（避免与 frontend 重复）。

---

## 阶段总览

| 阶段 | 目标 | 估时 |
|------|------|------|
| **S1** | 建立 `backend` workspace + 迁入 Prisma | 0.5d |
| **S2** | 建立 `frontend` workspace + 迁入 Next 源码 | 0.5d |
| **S3** | frontend ↔ backend 依赖与 `db` 引用 | 0.25d |
| **S4** | 根 `package.json` workspaces 与脚本 | 0.25d |
| **S5** | Vitest / Playwright / ESLint 路径 | 0.25d |
| **S6** | CI 更新 | 0.25d |
| **S7** | README、`spec/structure.md`、`CLAUDE.md` | 0.25d |
| **S8** | 全量验证 + 清理残留 | 0.25d |

**合计约 2.5 人日**（含 review；不含 Prisma 7 升级）。

---

## S1. Backend workspace + Prisma

### Task S1.1: 创建 `backend/package.json`

**Files:**
- Create: `backend/package.json`
- Delete: `backend/.gitkeep`（若存在）

- [ ] **Step 1:** 写入 `backend/package.json`：

```json
{
  "name": "@english-tutor/backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./db": "./src/db.ts"
  },
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:validate": "prisma validate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed"
  },
  "dependencies": {
    "@prisma/client": "^6.8.2"
  },
  "devDependencies": {
    "prisma": "^6.8.2",
    "tsx": "^4.19.4",
    "typescript": "^5.8.3"
  },
  "prisma": {
    "schema": "prisma/schema.prisma",
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 2:** 创建 `backend/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts", "prisma/seed.ts"]
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/tsconfig.json
git commit -m "chore(monorepo): scaffold backend workspace package"
```

### Task S1.2: 迁入 Prisma 目录

**Files:**
- Move: `prisma/` → `backend/prisma/`（`git mv`）

- [ ] **Step 1:** 在仓库根执行：

```bash
git mv prisma backend/prisma
```

- [ ] **Step 2:** 确认 `backend/prisma/schema.prisma` 存在；根目录 **无** `prisma/`。

- [ ] **Step 3:** 在根目录（需已配置 `DATABASE_URL` 或仅 validate）：

```bash
cd backend && npx prisma validate
```

Expected: `The schema at prisma/schema.prisma is valid`

- [ ] **Step 4: Commit**

```bash
git add -A backend/prisma
git commit -m "chore(monorepo): move Prisma schema and migrations to backend/"
```

### Task S1.3: 迁入 `db` 模块并导出

**Files:**
- Create: `backend/src/db.ts`（自 `src/lib/db.ts`）
- Create: `backend/src/index.ts`
- Create: `backend/src/placeholder-api.ts`（未来 HTTP API 占位，可选）

- [ ] **Step 1:** 将 `src/lib/db.ts` **复制**为 `backend/src/db.ts`（内容相同，仍 `import { PrismaClient } from "@prisma/client"`）。

- [ ] **Step 2:** 创建 `backend/src/index.ts`：

```typescript
export { prisma } from "./db";
```

- [ ] **Step 3:** 创建 `backend/src/placeholder-api.ts`（仅占位，满足「未来 API」目录约定）：

```typescript
/** Reserved for future standalone HTTP API. Not used in this change. */
export const BACKEND_API_PLACEHOLDER = true;
```

- [ ] **Step 4:** 在 `backend/` 下生成 client：

```bash
cd backend && npx prisma generate
```

Expected: `Generated Prisma Client` 无报错。

- [ ] **Step 5: Commit**

```bash
git add backend/src
git commit -m "chore(monorepo): add backend db module and Prisma client export"
```

---

## S2. Frontend workspace + Next 源码

### Task S2.1: 创建 `frontend/package.json` 与工具链配置

**Files:**
- Create: `frontend/package.json`
- Move: `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `eslint.config.mjs`, `tsconfig.json` → `frontend/`

- [ ] **Step 1:** 自根 `package.json` **拆分**依赖到 `frontend/package.json`（Next/React/测试/样式相关留在 frontend；`@prisma/client`/`prisma` **仅**在 backend）：

```json
{
  "name": "@english-tutor/frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@english-tutor/backend": "*",
    "clsx": "^2.1.1",
    "lucide-react": "^0.511.0",
    "next": "^15.3.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zod": "^3.24.4"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.15.17",
    "@types/react": "^19.1.3",
    "@types/react-dom": "^19.1.3",
    "@vitejs/plugin-react": "^4.4.1",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.26.0",
    "eslint-config-next": "^15.3.2",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3"
  }
}
```

- [ ] **Step 2:** `git mv` 配置文件：

```bash
git mv next.config.ts next-env.d.ts postcss.config.mjs tailwind.config.ts eslint.config.mjs tsconfig.json frontend/
```

- [ ] **Step 3:** 更新 `frontend/next.config.ts`，在现有配置对象上增加：

```typescript
  transpilePackages: ["@english-tutor/backend"],
```

- [ ] **Step 4:** 更新 `frontend/eslint.config.mjs` 的 `ignores`，增加 `frontend/.next/**` 若 baseDirectory 已为 `frontend` 则保持 `.next/**` 即可。

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/*.ts frontend/*.mjs frontend/tsconfig.json
git commit -m "chore(monorepo): scaffold frontend workspace and move Next config"
```

### Task S2.2: 迁入 `src/`

**Files:**
- Move: `src/` → `frontend/src/`

- [ ] **Step 1:**

```bash
git mv src frontend/src
```

- [ ] **Step 2:** 确认 `frontend/src/app/layout.tsx` 存在；根目录 **无** `src/`。

- [ ] **Step 3: Commit**

```bash
git add -A frontend/src
git commit -m "chore(monorepo): move application source to frontend/src"
```

---

## S3. Frontend ↔ Backend 连线

### Task S3.1: 用 workspace 依赖替换 `@prisma/client` 直连

**Files:**
- Modify: `frontend/src/lib/db.ts`
- Modify: 所有 `from "@prisma/client"` 的 frontend 文件（见下方 grep 清单）
- Modify: `frontend/package.json`（`"@english-tutor/backend": "*"` 在 S2 已加）

**当前需改 import 的文件（迁移后路径）：**

- `frontend/src/lib/db.ts` — 改为 re-export
- `frontend/src/lib/practice/prisma-practice-repository.ts`
- `frontend/src/lib/book-ingestion/prisma-book-repository.ts`
- `frontend/src/lib/practice/prisma.integration.test.ts`

- [ ] **Step 1:** 将 `frontend/src/lib/db.ts` **整文件替换**为：

```typescript
export { prisma } from "@english-tutor/backend";
```

- [ ] **Step 2:** 在 `prisma-*-repository.ts` 与 `prisma.integration.test.ts` 中，将类型 import 改为：

```typescript
import type { PrismaClient } from "@english-tutor/backend";
// 若需枚举/模型类型，使用：
// import type { ... } from "@prisma/client";
// 或从 backend 再 export 类型（若 TS 报错，在 backend/src/index.ts 增加 type re-export）
```

**若 `import type { X } from "@prisma/client"` 在 frontend 仍需要：** 在 `backend/src/index.ts` 增加：

```typescript
export type { PrismaClient } from "@prisma/client";
export { PrismaClient } from "@prisma/client";
```

并在 repository 文件中对 **值** 使用 `PrismaClient` 构造时从 `@english-tutor/backend` 引入。

- [ ] **Step 3:** 根目录执行（workspaces 安装后）：

```bash
npm install
npm run prisma:generate -w @english-tutor/backend
cd frontend && npm run typecheck
```

Expected: `typecheck` exit 0。

- [ ] **Step 4: Commit**

```bash
git add frontend/src backend/src
git commit -m "chore(monorepo): wire frontend to backend Prisma client"
```

---

## S4. 根 workspace 与脚本

### Task S4.1: 根 `package.json` 改为 workspace 根

**Files:**
- Modify: `package.json`（根）

- [ ] **Step 1:** 根 `package.json` **替换**为编排版（依赖下沉到子包；Playwright 可留根 devDependencies）：

```json
{
  "name": "english-tutor-app",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "npm run dev -w @english-tutor/frontend",
    "build": "npm run build -w @english-tutor/frontend",
    "start": "npm run start -w @english-tutor/frontend",
    "lint": "npm run lint -w @english-tutor/frontend",
    "typecheck": "npm run typecheck -w @english-tutor/frontend",
    "test": "vitest run",
    "test:watch": "vitest",
    "playwright:install": "playwright install",
    "test:e2e": "playwright test --project=chromium",
    "test:e2e:all": "playwright test",
    "db:up": "docker compose up -d",
    "db:migrate": "npm run db:migrate -w @english-tutor/backend",
    "db:seed": "npm run db:seed -w @english-tutor/backend",
    "prisma:validate": "npm run prisma:validate -w @english-tutor/backend",
    "prisma:generate": "npm run prisma:generate -w @english-tutor/backend"
  },
  "devDependencies": {
    "@playwright/test": "^1.52.0",
    "@vitejs/plugin-react": "^4.4.1",
    "vitest": "^3.1.3"
  }
}
```

- [ ] **Step 2:** 删除根 `package.json` 中已迁移的 `dependencies` / `prisma` 块；**不要**保留根级 `@prisma/client`。

- [ ] **Step 3:** 重装锁文件：

```bash
rm -rf node_modules frontend/node_modules backend/node_modules
npm install
```

Expected: 无 peer 冲突；`npm ls @english-tutor/backend -w @english-tutor/frontend` 可解析。

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(monorepo): convert root package.json to npm workspaces"
```

---

## S5. 测试与 lint 配置

### Task S5.1: Vitest（根配置，指向前端源码）

**Files:**
- Modify: `vitest.config.ts`
- Modify: `vitest.setup.ts`（若含 `./src` 路径则改）

- [ ] **Step 1:** 更新 `vitest.config.ts`：

```typescript
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const frontendRoot = fileURLToPath(new URL("./frontend", import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: frontendRoot,
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [fileURLToPath(new URL("./vitest.setup.ts", import.meta.url))],
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/**/*.integration.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./frontend/src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 2:** 运行：

```bash
npm run prisma:generate
npm run test
```

Expected: 与迁移前相同数量级通过（约 63 passed；integration 默认 skip）。

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts vitest.setup.ts
git commit -m "chore(monorepo): point Vitest at frontend workspace"
```

### Task S5.2: Playwright `webServer`

**Files:**
- Modify: `playwright.config.ts`

- [ ] **Step 1:** 将 `webServer.command` 改为：

```typescript
command: `npm run prisma:generate && PORT=${e2ePort} npm run dev`,
```

（根脚本已委托 frontend；**保持**在仓库根执行 `npm run test:e2e`。）

- [ ] **Step 2:** 本地（Postgres + seed 已就绪）：

```bash
npm run test:e2e
```

Expected: Chromium 项目全绿。

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "chore(monorepo): keep Playwright at repo root with workspace dev server"
```

---

## S6. CI

### Task S6.1: 更新 `.github/workflows/ci.yml`

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1:** 所有 Prisma 步骤在 `npm ci` 之后使用根脚本（推荐，与本地一致）：

```yaml
      - name: Apply database migrations
        run: npx prisma migrate deploy --schema backend/prisma/schema.prisma

      - name: Generate Prisma client
        run: npm run prisma:generate

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test
```

E2E job 中 `Seed database` 使用 `npm run db:seed`；`Install dependencies` 仍为根 `npm ci`；`cache-dependency-path: package-lock.json` **不变**。

- [ ] **Step 2:** 若 `npm run build` 在 CI 中缺失但本地需要，可在 unit job 末尾加一步 `npm run build`（可选，与迁移前对齐即可）。

- [ ] **Step 3:** 推送后在 GitHub Actions 确认 **Unit** + **E2E** 绿（或本地 `act` 近似验证）。

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run Prisma and checks against monorepo layout"
```

---

## S7. 文档

### Task S7.1: README 本地开发路径

**Files:**
- Modify: `README.md`（项目中与 English Tutor 相关的 **Local database** / 验证章节；若 README 仍为模板，在仓库内搜索 `prisma migrate`、`npm run dev` 并更新）

- [ ] **Step 1:** 将涉及路径的说明改为：

```text
# 仓库根
cp .env.example .env
npm ci
npm run db:up
npm run prisma:generate
npx prisma migrate deploy --schema backend/prisma/schema.prisma
npm run db:seed
npm run dev          # → frontend Next
npm run test
npm run test:e2e
RUN_INTEGRATION=1 npm run test
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update local dev commands for monorepo layout"
```

### Task S7.2: `spec/structure.md` 与 `CLAUDE.md`

**Files:**
- Modify: `spec/structure.md` — 删除「迁移前快照」或改为「已完成」
- Modify: `CLAUDE.md` — `backend/`、`frontend/` 描述与 `spec/structure.md` 一致

- [ ] **Step 1:** 更新 `spec/structure.md` 仅保留 **目标布局** 一节，并注明 `tests/e2e` 在根。

- [ ] **Step 2:** 在 `CLAUDE.md` 项目概览中，将「根目录 src」改为「见 `spec/structure.md`」。

- [ ] **Step 3: Commit**

```bash
git add spec/structure.md CLAUDE.md
git commit -m "docs: align project structure docs with monorepo layout"
```

---

## S8. 最终验证与清理

### Task S8.1: 全量验证（证据先于「完成」）

**Required SUB-SKILL:** **verification-before-completion**

在仓库根依次执行并记录输出：

```bash
npm ci
npm run prisma:generate
npx prisma migrate deploy --schema backend/prisma/schema.prisma
npm run db:seed
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

可选：

```bash
RUN_INTEGRATION=1 npm run test
```

- [ ] 全部 exit 0（integration 若环境无 DB 可文档说明跳过条件）。

### Task S8.2: 残留扫描

- [ ] **Step 1:** 确认无第二份 schema：

```bash
find . -path ./node_modules -prune -o -name schema.prisma -print
```

Expected: 仅 `./backend/prisma/schema.prisma`。

- [ ] **Step 2:** 确认根无 `src/app`：

```bash
test ! -d src/app && echo OK
```

- [ ] **Step 3:** 手工或 e2e 抽样：`/parent/books`、`/child/today`、`/child/book-review`（场景 G1）。

### Task S8.3: 更新 OpenSpec `tasks.md`（可选 checklist）

**Files:**
- Create: `openspec/changes/migrate-monorepo-frontend-backend/tasks.md`

- [ ] 将本 plan 各 Task 的 checkbox 同步到 `tasks.md`，便于 `/opsx:archive` 前勾选。

---

## 风险回滚

若迁移中途卡住：

1. `git stash` 或 `git reset --hard` 到 feature 分支上次绿提交（**勿**对已推送共享分支 force push，除非人工要求）。
2. 优先恢复 **单一** `prisma generate` 与 **单一** schema 路径，再跑 `npm run test`。

---

## 执行方式（完成后由协调员询问）

**Plan 已保存至：** `openspec/changes/migrate-monorepo-frontend-backend/plan.md`

1. **Subagent-Driven（推荐）** — 按 Task S1.1 → … → S8 派发 subagent；每任务 **spec 合规 review → code quality review**（见 `.cursor/rules/default-subagent-driven-development.mdc`）。
2. **Inline Execution** — 本会话用 **executing-plans**，按阶段 checkpoint 推进。

**下一技能：** `superpowers:executing-plans`（或 SDD 派发）；**不要**跳过 plan 直接改目录。
