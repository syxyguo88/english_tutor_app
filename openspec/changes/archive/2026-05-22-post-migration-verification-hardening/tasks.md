# Tasks: post-migration-verification-hardening

> 与 [`plan.md`](./plan.md) 同步；实现时按顺序勾选。归档前应全部 ✅。

## T1 — 根级 verify 脚本

- [x] T1.1 创建 `scripts/verify.mjs`（步骤、--integration、--e2e、失败诊断）
- [x] T1.2 根 `package.json` 注册 `verify` / `verify:integration` / `verify:e2e` / `verify:all`

## T2 — Vitest 与 .env

- [x] T2.1 根 `dotenv` + `vitest.setup.ts` 加载仓库根 `.env`；`RUN_INTEGRATION=1` 集成测试通过

## T3 — CI

- [x] T3.1 `unit` job：`db:seed`、`npm run build`、`RUN_INTEGRATION=1 npm run test`

## T4 — 文档

- [x] T4.1 README「验证（推荐）」小节
- [x] T4.2 `docs/superpowers/current-status.md` Verification snapshot

## T5 — 最终验证

- [x] T5.1 `npm run verify` / `verify:integration`（可选 `verify:e2e`）本地绿
