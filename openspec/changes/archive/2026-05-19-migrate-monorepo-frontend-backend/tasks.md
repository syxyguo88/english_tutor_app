# Tasks: migrate-monorepo-frontend-backend

> 与 [`plan.md`](./plan.md) 同步；实现时按顺序勾选。归档前应全部 ✅。

## S1 — Backend workspace + Prisma

- [x] S1.1 创建 `backend/package.json` 与 `backend/tsconfig.json`
- [x] S1.2 `git mv prisma` → `backend/prisma`
- [x] S1.3 迁入 `backend/src/db.ts`、`index.ts`、API 占位；`prisma generate` 通过

## S2 — Frontend workspace + Next

- [x] S2.1 创建 `frontend/package.json`；迁入 Next/ESLint/TS/Tailwind 配置
- [x] S2.2 `git mv src` → `frontend/src`

## S3 — 依赖连线

- [x] S3.1 `frontend` 通过 `@english-tutor/backend` 使用 Prisma；`typecheck` 通过

## S4 — 根 workspace

- [x] S4.1 根 `package.json` workspaces + 脚本委托；`npm install` 成功

## S5 — 测试配置

- [x] S5.1 Vitest 指向 `frontend/src`
- [x] S5.2 Playwright `webServer` 使用根脚本

## S6 — CI

- [x] S6.1 `.github/workflows/ci.yml` 使用 `backend/prisma` 路径

## S7 — 文档

- [x] S7.1 README 本地命令更新
- [x] S7.2 `spec/structure.md`、`CLAUDE.md` 更新

## S8 — 验证

- [x] S8.1 全量命令绿（typecheck / lint / test / build / e2e）
- [x] S8.2 无重复 schema、无根 `src/app`
- [x] S8.3 业务路由抽样 / e2e 通过
