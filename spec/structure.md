# Project Structure

> **维护规则**：在**添加或删除顶层目录**时更新本文件。Monorepo（`frontend` / `backend` workspace）已落地；下列为**当前**布局。

---

## 当前布局

```text
<project-root>/
├── backend/                 # Prisma 宿主 + DB 脚本（workspace `@english-tutor/backend`）
│   ├── prisma/              # schema.prisma、migrations、seed
│   └── src/                 # DB 导出等（含 `@english-tutor/backend/db`）
├── frontend/                # Next.js 应用（workspace `@english-tutor/frontend`）
│   ├── src/app/             # App Router 页面与路由
│   ├── public/
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── tests/                   # 根级验收：`tests/e2e/`（Playwright，配置在仓库根 `playwright.config.ts`）
├── prototype/               # 原型设计稿 / 静态实验
├── spec/                    # 项目级 spec
│   ├── requirements.md
│   ├── design.md
│   ├── tasks.md
│   ├── devlog.md
│   └── structure.md         # 本文件
├── openspec/                # 需求级变更（OpenSpec）
│   ├── config.yaml
│   ├── changes/
│   │   └── archive/
│   └── specs/               # 长期提炼规格（如有）
├── docs/                    # 说明资源、Superpowers 计划与规格等
│   └── superpowers/
├── .github/workflows/       # CI
├── docker-compose.yml       # 本地 Postgres（根级）
├── playwright.config.ts     # E2E（根目录，指向 frontend baseURL）
├── vitest.config.ts         # 单元 / 集成测试（根目录）
├── package.json             # npm workspaces 根编排
├── CLAUDE.md
├── LICENSE
└── README.md
```

---

## 修订历史

| 日期 | 说明 |
|------|------|
| 2026-05-15 | 由 **gd** kickoff：补充「目标布局」与「迁移前快照」，与 `spec/requirements.md` R-2026-05-15-gd-16 对齐 |
| 2026-05-18 | Monorepo 迁移落地：改为「当前布局」；移除迁移前快照；标明根级 `tests/e2e`、`playwright.config.ts`、`vitest.config.ts` |
