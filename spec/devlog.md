# Development Log

> **维护规则**：每次 PR 合并后，由 AI 自动追加一条记录。
>
> 每条记录应包含：日期、变更名、摘要、关键决策/坑点。

---

## Entry Template

```markdown
### YYYY-MM-DD · <change-name>

**摘要**：一句话说清楚这次变更做了什么。

**关键决策**：
- 决策点 1 — 选了什么、放弃了什么、为什么
- 决策点 2 — ...

**踩坑 / 经验**：
- 坑点描述 + 如何解决（可选）

**相关产出**：
- 归档位置：`openspec/changes/archive/<change-name>/`
- PR：#xxx（如适用）
```

---

## Log Entries

<!-- 最新条目在最上面 -->

### 2026-05-15 · spec-baseline-kickoff-2026-05-15

**摘要**：在分支 `mvp-foundation`（无 `version/v*`）以日期标签完成首版项目级 spec kickoff：从 `docs/superpowers/` 升格 `requirements.md`、`design.md`、`tasks.md`、`structure.md`，并约定 **OpenSpec 单变更** 负责 `frontend/` + `backend/` monorepo 迁移。

**关键决策**：
- 需求 ID 采用 `R-2026-05-15-gd-*`；发起人缩写 **gd**
- 新功能一律 `openspec/changes/<name>/`；目录迁移任务 **`migrate-monorepo-frontend-backend`**
- `backend/` 容纳 Prisma 与未来 HTTP API；`frontend/` 容纳整棵 Next 应用

**相关产出**：
- 项目级：`spec/requirements.md`、`spec/design.md`、`spec/tasks.md`、`spec/structure.md`
- Superpowers 参考仍保留于 `docs/superpowers/`（北星与路线图）

### 2026-04-16 · bootstrap-speccoding-template

**摘要**：从 SpecCoding Template 初始化项目骨架。

**关键决策**：
- 采用「两级 Spec 体系」：`spec/` 管全局、`openspec/` 管单次变更
- 开发工作流固化为七阶段：git branch → scaffold → brainstorm → plan → execute → archive → merge

**相关产出**：
- 项目级 spec 文档骨架（requirements / design / tasks / devlog / structure）
- OpenSpec 配置 + 示例归档变更 `example-add-user-auth`
