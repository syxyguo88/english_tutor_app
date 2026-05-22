# post-migration-verification-hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use **superpowers:subagent-driven-development** (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **位置铁律：** 本文件位于 `openspec/changes/post-migration-verification-hardening/plan.md`，与同变更的 proposal / design / specs / tasks 放在一起。**不要**存到仓库根或 `docs/superpowers/plans/`。

**Goal:** 在 monorepo 迁移后提供可重复的 **`npm run verify`** 体系、修复 Vitest 集成测试的 `.env` 加载，并使 README / CI / `current-status.md` 与本地验证一致。

**Architecture:** 根目录 `scripts/verify.mjs` 顺序调用现有 npm 脚本；`vitest.setup.ts` 用 `dotenv` 加载仓库根 `.env`；CI `unit` job 增加 `db:seed`、`build`、`RUN_INTEGRATION=1` 测试；e2e 仍走 `scripts/run-e2e.mjs`。

**Tech Stack:** Node 22 · npm workspaces · Vitest 3 · Playwright · GitHub Actions · dotenv

**测试策略：** **回归 / 验证加固**，非 feature-level TDD。以「跑通既有套件 + 脚本行为」为验收，不为业务域新增测试。

**Open Questions（本 plan 收口）：**

| 问题 | 决定 |
|------|------|
| `verify` 是否含 `prisma:validate`？ | **是**，放在 `prisma:generate` 之后（轻量、早失败） |
| CI integration 放哪？ | **`unit` job**，在 migrate 后增加 **`db:seed`**，再 `RUN_INTEGRATION=1 npm run test` |

---

## 规格覆盖自检

| Spec 需求 | 任务 |
|-----------|------|
| 根级验证入口 | T1、T5 |
| 集成测试环境 | T2 |
| 文档与快照 | T4 |
| CI 对齐 | T3 |

---

## 阶段总览

| 阶段 | 目标 | 估时 |
|------|------|------|
| **T1** | `scripts/verify.mjs` + 根 `package.json` 脚本 | 0.25d |
| **T2** | Vitest 加载根 `.env` | 0.15d |
| **T3** | CI `unit` job：seed + build + integration | 0.15d |
| **T4** | README + `current-status.md` | 0.15d |
| **T5** | 全量验证 + 勾选 openspec `tasks.md` | 0.15d |

**合计约 0.85 人日**

---

## T1. 根级 `verify` 脚本

### Task T1.1: 创建 `scripts/verify.mjs`

**Files:**
- Create: `scripts/verify.mjs`

- [ ] **Step 1:** 实现与 `scripts/run-e2e.mjs` 同风格的 `spawn` 包装（`stdio: "inherit"`，`shell: false`），仓库根为 `join(dirname(fileURLToPath(import.meta.url)), "..")`。

- [ ] **Step 2:** 默认步骤顺序（每步失败即 `process.exit(1)` 并打印 `verify: failed at <name> (exit <code>)`）：

```javascript
const defaultSteps = [
  ["prisma:generate", ["npm", "run", "prisma:generate"]],
  ["prisma:validate", ["npm", "run", "prisma:validate"]],
  ["typecheck", ["npm", "run", "typecheck"]],
  ["lint", ["npm", "run", "lint"]],
  ["test", ["npm", "run", "test"]],
  ["build", ["npm", "run", "build"]],
];
```

- [ ] **Step 3:** 解析 CLI 参数（`process.argv.slice(2)`）：
  - `--integration`：`test` 步骤使用 `env: { ...process.env, RUN_INTEGRATION: "1" }`
  - `--e2e`：在默认步骤**之后**追加 `["e2e", ["npm", "run", "test:e2e"]]`
  - 允许 `--integration --e2e` 组合

- [ ] **Step 4:** 启动时打印一行：`verify: running <step1> → … → <stepN>`

- [ ] **Step 5: Commit**

```bash
git add scripts/verify.mjs
git commit -m "chore(verify): add root verification orchestration script"
```

### Task T1.2: 注册 `package.json` 脚本

**Files:**
- Modify: `package.json`（根）

- [ ] **Step 1:** 在 `"scripts"` 增加：

```json
"verify": "node scripts/verify.mjs",
"verify:integration": "node scripts/verify.mjs --integration",
"verify:e2e": "node scripts/verify.mjs --e2e",
"verify:all": "node scripts/verify.mjs --integration --e2e"
```

- [ ] **Step 2:** 本地冒烟（需 `.env` + DB + 已 migrate/seed；e2e 可单独测）：

```bash
npm run verify
```

Expected: 各步顺序执行且 exit 0。

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(verify): add npm run verify scripts"
```

---

## T2. Vitest 加载根 `.env`

### Task T2.1: 根 `devDependencies` + `vitest.setup.ts`

**Files:**
- Modify: `package.json`（根）— 增加 `dotenv`
- Modify: `vitest.setup.ts`

- [ ] **Step 1:** 根 `package.json` 的 `devDependencies` 增加 `"dotenv": "^16.5.0"`（与 frontend/backend 同主版本），然后 `npm install`。

- [ ] **Step 2:** 在 **`vitest.setup.ts` 顶部**（在 `import "@testing-library/jest-dom/vitest"` **之前**）增加：

```typescript
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
config({ path: resolve(repoRoot, ".env") });
```

- [ ] **Step 3:** 验证集成测试（Postgres + seed 已就绪）：

```bash
RUN_INTEGRATION=1 npm run test -- frontend/src/lib/practice/prisma.integration.test.ts
```

Expected: **1 passed**（非 skip）。

- [ ] **Step 4:** 验证无 URL 时失败（临时重命名 `.env` 或 `DATABASE_URL=` 空跑）：

```bash
env -u DATABASE_URL -u INTEGRATION_DATABASE_URL RUN_INTEGRATION=1 npm run test -- frontend/src/lib/practice/prisma.integration.test.ts
```

Expected: 失败并出现 `Integration tests require INTEGRATION_DATABASE_URL or DATABASE_URL`（或 beforeAll throw）。

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.setup.ts
git commit -m "fix(test): load repo root .env in Vitest for integration tests"
```

---

## T3. CI 与本地对齐

### Task T3.1: 更新 `.github/workflows/ci.yml`（unit job）

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1:** 在 `unit` job 的 `Apply database migrations` 之后、`Generate Prisma client` 之前或之后（保持 generate 在 test 前）增加：

```yaml
      - name: Seed database
        run: npm run db:seed
```

（若 seed 必须在 generate 之后，则放在 `Generate Prisma client` 之后、Typecheck 之前。）

- [ ] **Step 2:** 在 `Unit tests` 之后增加：

```yaml
      - name: Production build
        run: npm run build

      - name: Integration tests (Prisma)
        run: RUN_INTEGRATION=1 npm run test
        env:
          DATABASE_URL: postgresql://english_tutor:english_tutor@localhost:5432/english_tutor_app?schema=public
```

- [ ] **Step 3:** 确认 `e2e` job **不变**（已有 migrate + seed + test:e2e）。

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: seed, build, and RUN_INTEGRATION tests in unit job"
```

---

## T4. 文档

### Task T4.1: README 验证小节

**Files:**
- Modify: `README.md`（`## English Tutor 本地开发（monorepo）` 段落下）

- [ ] **Step 1:** 在现有「测试与 E2E」代码块**之前**插入 **「验证（推荐）」** 小节，内容包含：

```markdown
### 验证（推荐）

迁移后可用一条命令跑完常规检查（不含 e2e）：

\`\`\`bash
npm run verify          # generate + validate + typecheck + lint + test + build
npm run verify:integration   # 同上，且 RUN_INTEGRATION=1 跑 Prisma 集成测试
npm run verify:e2e      # verify + Chromium e2e（需 DB 已 up / migrate / seed）
\`\`\`

先决条件：仓库根 \`.env\`（\`cp .env.example .env\`）、\`npm ci\`、Postgres 已 \`db:up\` + migrate + seed。
```

- [ ] **Step 2:** 保留原有 `npm run test` / `test:e2e` / `RUN_INTEGRATION=1` 说明，加一句「等价于 verify 子集，见上」。

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): document npm run verify for monorepo"
```

### Task T4.2: `current-status.md` 快照

**Files:**
- Modify: `docs/superpowers/current-status.md` — `## Verification Snapshot` 段

- [ ] **Step 1:** 替换为 monorepo 命令块（示例，执行时填入**实际日期**）：

```markdown
## Verification Snapshot (last recorded locally)

\`\`\`bash
npm run verify
npm run verify:integration   # needs Postgres + seed
npm run test:e2e             # or npm run verify:e2e
\`\`\`

Recorded: YYYY-MM-DD on \`feature/post-migration-verification-hardening\` (monorepo root scripts).
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/current-status.md
git commit -m "docs: update verification snapshot for verify scripts"
```

---

## T5. 最终验证

**Required SUB-SKILL:** **verification-before-completion**

### Task T5.1: 本地全量

- [ ] **Step 1:** 在仓库根（`.env` + `npm ci` + `db:up` + migrate + seed）：

```bash
npm run verify
RUN_INTEGRATION=1 npm run test -- frontend/src/lib/practice/prisma.integration.test.ts
npm run verify:integration
```

Expected: 全部 exit 0。

- [ ] **Step 2（可选，耗时）:**

```bash
npm run verify:e2e
```

Expected: Chromium 绿。

- [ ] **Step 3:** 更新 `openspec/changes/post-migration-verification-hardening/tasks.md` 全部勾选。

- [ ] **Step 4: Commit**（若有未提交的 T1–T4）

```bash
git status
# 若有变更：
git add -A && git commit -m "chore: complete post-migration verification hardening"
```

---

## 执行方式（完成后由协调员询问）

**Plan 已保存至：** `openspec/changes/post-migration-verification-hardening/plan.md`

1. **Subagent-Driven（推荐）** — T1 → T5 每任务派发 subagent + spec/code review。
2. **Inline Execution** — 本会话 **`/superpowers:executing-plans`**，按 checkpoint 推进。

**下一技能：** `executing-plans` 或 SDD；归档前需 `openspec-cn validate` 与 `/opsx:archive`。
