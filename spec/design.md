# Design

> **维护规则**：本文件是**项目整体设计与架构决策**，仅在**人工明确要求**时修改。AI 不得擅自更新。

---

## 1. 技术栈

| 层 | 选型 | 理由 |
|----|------|------|
| 前端 | **Next.js 15**、**React 19**、**TypeScript**、**Tailwind CSS** | 全栈原型迭代快；App Router + Server Actions 与当前实现一致 |
| 后端（当前） | **Next.js Server Actions / Route Handlers** + 领域模块（`src/domain`） | 家庭原型阶段减少部署面；逻辑与 UI 同仓 |
| 后端（目标） | **`backend/`**：**Prisma** + **未来独立 HTTP API**（框架待定：Node 生态优先） | 分离持久化与 API 边界，便于后续 BFF/移动客户端与独立扩缩 |
| 数据库 | **PostgreSQL 16** | 与 Prisma、CI service 镜像一致 |
| ORM | **Prisma 6.x** | 已用于 schema、migrations、仓库实现 |
| 测试 | **Vitest**（单元/集成）、**Playwright**（e2e Chromium） | 与 CI 一致 |
| 部署（原型） | 单机 Docker Compose（开发库）+ 待定托管 | 生产拓扑未锁定 |

---

## 2. 系统架构

### 2.1 逻辑架构（北星）

```
[ 浏览器：家长端 / 孩子端 ]
        │
        ▼
[ Web 应用：Next.js（目标路径 frontend/）]
        │  Server Actions / 未来可改为调用 HTTP
        ▼
[ 应用服务层：领域规则 + 仓储接口 ]
        │
        ├──► [ Prisma ── PostgreSQL ]   （目标：schema/migrations 在 backend/）
        └──► [ 未来：对象存储 / OCR / LLM 工作者 ]（E 轨，未实现）
```

**核心边界**：AI/OCR 输出仅为草稿；**家长确认**后的内容才进入练习与掌握度；重要判题可预留家长复核队列（B3）。

### 2.2 目标物理仓库布局

见 `spec/structure.md`（**已实现**：`frontend/` + `backend/` monorepo；Prisma 在 `backend/prisma/`）。

---

## 3. 模块划分

| 模块 | 职责 |
|------|------|
| **book-ingestion** | 绘本上传、页面与句子草稿、家长校对、确认状态机、与练习内容闸门 |
| **practice** | 今日练习生成、作答提交、掌握分与复习字段更新 |
| **mastery / scheduling** | 掌握度键、下次复习时间、与领域公式（见 `src/domain/mastery.ts`） |
| **child UX** | `/child/today` 步进器、`/child/book-review` 复习体验、共享导航 |
| **parent UX** | 仪表盘、绘本列表与上传、逐书 review |
| **auth（原型）** | 当前为原型会话/角色切换；**非生产认证** |
| **persistence** | Prisma schema、migrations、seed；仓库模式隔离 in-memory vs Postgres |

---

## 4. 数据模型（核心实体）

与 `prisma/schema.prisma` 及 `docs/superpowers/specs/2026-05-04-private-english-tutor-app-design.zh.md` 对齐，核心包括：

- **Family / User / ChildProfile** — 家庭边界与用户角色  
- **Book / BookPage / BookAudio / Sentence / SentenceAudioSegment** — 绘本与多媒体  
- **KnowledgeItem / KnowledgeVariant / SentenceKnowledgeLink** — 知识点与表层形式  
- **Exercise / Attempt / MasteryStat / ReviewQueueItem** — 练习、作答、掌握度、复习队列  
- **InterestTag** — 家长维护兴趣标签  

字段级真相来源：**迁移后**以 `backend/prisma/schema.prisma` 为准（迁移前为根目录 `prisma/schema.prisma`）。

---

## 5. 关键接口约定

| 主题 | 约定 |
|------|------|
| **对内 API** | 当前以 **TypeScript 函数 + Server Actions** 为主；迁出 `backend/` 后，前端通过 **HTTP/JSON** 或保留短路径 BFF 由 openspec 决策 |
| **鉴权** | 原型会话；生产 JWT/Session/OAuth **待定**（需求 R-2026-05-15-gd-25） |
| **错误处理** | Server Action 返回可序列化结果；用户可见文案中文（家长）/ 中英（孩子） |
| **上传体积** | 单页上限与 Next `serverActions.bodySizeLimit` 协调（见 `next.config.ts` / `upload-limits.ts`） |

---

## 6. 关键决策与权衡

### 决策 1：家庭原型优先于完整中台

- **选择**：单库单家庭数据、确定性 mock OCR、图片以 data URL 或字符串形式存库（短期）。  
- **放弃**：一上来就上对象存储、异步 worker 集群、真多租户。  
- **理由**：验证学习闭环与 UX；与 `docs/superpowers/plans/2026-05-11-phase-priorities-parent-child.md` 锁定节奏一致。

### 决策 2：确认门在领域层显式表达

- **选择**：`canUseSentenceForPractice` 等对 `confirmedAt`、枚举状态的硬规则。  
- **放弃**：仅靠 UI 隐藏未确认内容。  
- **理由**：防止练习/统计绕过；C6(孩子端「绘本复习」) 与练习共用同一真相。

### 决策 3：Monorepo 分 `frontend/` 与 `backend/`

- **选择**：Next 整树进 `frontend/`；Prisma + 未来 HTTP 服务进 `backend/`；根保留 workspace 与 CI。  
- **放弃**：继续将全栈无边界堆在根 `src/`。  
- **理由**：对齐模板与长期 E 轨基础设施演进；**实现必须通过单独 OpenSpec 变更**降低一次性风险。

### 决策 4：CI 使用真实 Postgres + migrate + seed

- **选择**：GitHub Actions `services: postgres:16-alpine`，跑 migrate + e2e。  
- **放弃**：纯内存 mock 数据库跑 e2e。  
- **理由**：持久化路径已在主开发分支验证。

---

## 7. 数据库与部署（摘要）

- **本地**：`docker compose up -d` 或自备 Postgres；`.env` 自 `.env.example` 复制。  
- **迁移**：`npx prisma migrate deploy`（npm 脚本别名以迁移后 `package.json` 为准）。  
- **种子**：`prototype-family` / `prototype-parent` / `prototype-child` + **ChildProfile**（`submitAttempt` 等路径依赖）。  
- **生产**：待选托管（Vercel / Render / 自建 K8s 等）与密钥管理策略——**不在本 kickoff 锁定**。

---

## 8. 待定项（Open Questions）

- **backend HTTP** 框架与端口、是否与 Next 同源反代。  
- **共享代码**（纯领域类型）放在 `packages/domain` 还是暂时由 frontend 引用 backend 的生成类型——需在本次 OpenSpec 迁移中决策。  
- **生产对象存储** 提供商与 URL 签名策略。  
- **真实认证** 与多家庭租户模型。

---

## 9. 修订历史

| 日期 | 说明 |
|------|------|
| 2026-05-15 | 由 **gd** kickoff：从 Superpowers 文档收敛技术栈、模块、数据与 CI/DB 约定；写入 monorepo 目标架构。 |
