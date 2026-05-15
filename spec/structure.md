# Project Structure

> **维护规则**：在**添加或删除顶层目录**或**完成 monorepo 迁移验收**时更新本文件。

---

## 目标布局（`migrate-monorepo-frontend-backend` 完成后）

```text
<project-root>/
├── backend/                 # Prisma + DB 脚本 + 未来独立 HTTP API
│   ├── prisma/              # schema.prisma、migrations、seed
│   └── src/                 # （可选）API 服务入口 — 迁移时由 openspec 具体化
├── frontend/                # Next.js 应用（整树迁入）
│   ├── src/app/             # App Router 页面与路由
│   ├── public/
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
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
├── tests/                   # 若保留根级 e2e：与 CI 约定一致（或迁入 frontend/ — 由迁移变更决定）
├── .github/workflows/       # CI
├── docker-compose.yml       # 本地 Postgres（可保留根级）
├── package.json             # workspace 根编排（npm/pnpm/yarn workspaces）
├── CLAUDE.md
├── LICENSE
└── README.md
```

---

## 迁移前（当前仓库快照 · kickoff 时）

在 **`migrate-monorepo-frontend-backend`** 完成之前，主要应用代码仍位于**仓库根目录**：

- Next.js：`src/app/`、`next.config.ts` 等  
- Prisma：根目录 `prisma/`  
- 共享领域：`src/domain/`、`src/lib/`  

`frontend/` 与 `backend/` 目录已预置占位（`.gitkeep`），**不代表**已完成代码搬迁。

---

## 修订历史

| 日期 | 说明 |
|------|------|
| 2026-05-15 | 由 **gd** kickoff：补充「目标布局」与「迁移前快照」，与 `spec/requirements.md` R-2026-05-15-gd-16 对齐 |
