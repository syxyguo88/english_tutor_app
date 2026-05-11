# Phase priorities — parent / child (decision 2026-05-11)

> **Source:** Product direction from stakeholder. Use with `superpowers:subagent-driven-development` when implementing multi-file work.

---

## Locked decisions

| # | Decision |
|---|----------|
| 1 | **Implementation order:** prioritize **Track A** (below, minus看图裂图) **+ Track C6** before other backlog items. |
| 2 | **看图练习裂图:** **not P0** — may defer; no mandatory fix in this phase. |
| 3 | **Time horizon:** aim for a **child-playable MVP within ~one month** — primary deliverable is **C6 绘本复习** slice that a first-grader can actually use weekly. |

---

## Track A — Reliability / data (excluding deferred 看图裂图)

**In scope for this phase**

- Small **data correctness / UX** issues that block daily practice *other than* broken PictureSentence images (e.g. if reproduced: last-question mastery strip vs `latestAttempt`, or other clear bugs tied to `getTodayPractice` / child today).
- **Performance / payload** items already in `2026-05-10-next-development.md` P3 can be pulled in **only if** they block the C6 MVP or child `/child/today` stability.

**Explicitly out of scope (this phase)**

- **看图裂图** root-cause fix (e.g. resolve image from `BookPage` vs snapshot in `Exercise.prompt`, bulk DB repair). May reopen as P0 later.

---

## Track C6 — 绘本复习 MVP（孩子下个月能玩到）

**Goal (MVP):** Child has a **dedicated “绘本复习” experience** (own route or clear tab), not only the placeholder nav that points at `/child/today`. Content should be **parent-confirmed** material (sentences / pages already in the pipeline), **read-only / light interaction** acceptable for v1 (e.g. browse + listen to self-recorded TTS later — **not** required for first MVP if scope risks the month).

**MVP interaction choice (locked):** **A — 读句 / 句卡为主**（像随身卡片：进书 → 句子列表，以阅读浏览为核心）。**不**把「跟读 / 系统 TTS 播放」作为 C6 MVP 必做项（可后续再加）。

**Thin slice (implementation target)**

1. **Route:** e.g. `/child/book-review` or `/child/review` (update `AppShell` nav — replace placeholder links that all pointed at `/child/today`).
2. **Data:** Confirmed sentences only (same gates as practice — `confirmedAt`, etc.); **list by book** (book picker or recent books → sentence list / card stack UI).
3. **UI:** Sentence text prominent; optional small page thumbnail when URL valid — **degraded / omit image if broken** (acceptable; 看图裂图 not in-scope to fix globally).
4. **Quality bar:** Works with seed + one real book after parent confirm; readable on phone width; prototype session only.

**Non-goals for C6 MVP**

- Browser TTS / recording / pronunciation scoring as required features.
- Real OCR, object storage migration, full spaced-repetition engine.

---

## Suggested order of execution

1. **C6 scaffold** — route + nav + empty/loading states + data query (confirmed content only).  
2. **C6 core UI** — list/detail enough for “play” (read-along or simple flip is enough for MVP definition workshop).  
3. **Track A** — pick 1–2 concrete bugs from production use (excluding 看图裂图) as they appear; otherwise keep A as buffer after C6 vertical slice lands.

---

## Implementation status (C6)

**Shipped in repo:** `/child/book-review`, `/child/book-review/[bookId]`, `BookIngestionRepository` review APIs + TDD tests, shared `child-nav`, README note. Spec §9–10 updated in `2026-05-11-c6-child-book-review-mvp.zh.md`.

---

## References

- **C6 技术规格（实现依据）：** `docs/superpowers/specs/2026-05-11-c6-child-book-review-mvp.zh.md`
- Child today / stepper: `src/app/child/today/`, plan `2026-05-10-child-practice-stepper-session-flow.md`
- Next development backlog: `docs/superpowers/plans/2026-05-10-next-development.md`
- Design north star: `docs/superpowers/specs/2026-05-04-private-english-tutor-app-design.zh.md`
