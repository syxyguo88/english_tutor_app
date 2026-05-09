import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell, type AppShellNavItem } from "@/components/app-shell";
import { getBookIngestionRepository } from "@/lib/book-ingestion/repository";
import { getPracticeRepository } from "@/lib/practice/repository";
import { ensurePrototypeSession } from "@/lib/prototype-session";

const parentNav = [
  { id: "overview", href: "/parent/dashboard", label: "总览" },
  { id: "books", href: "/parent/books/new", label: "绘本" },
  { id: "review", href: "/parent/dashboard", label: "待校对" },
  { id: "knowledge", href: "/parent/dashboard", label: "知识画像" },
] satisfies ReadonlyArray<AppShellNavItem>;

export default async function ParentDashboardPage() {
  const session = await ensurePrototypeSession();
  const metrics = await getBookIngestionRepository().getParentDashboardMetrics();
  const lowMasteryKnowledgeCount = await getPracticeRepository().countLowMasteryKnowledge({
    childId: session.childUserId,
  });

  const showUploadHint =
    metrics.draftBooks === 0 && metrics.pagesAwaitingReview === 0;

  return (
    <AppShell title="家长端" subtitle="上传、校对和查看学习进展" navItems={parentNav}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard label="待校对绘本" value={String(metrics.draftBooks)} />
        <MetricCard
          label="待复核 AI 判断"
          value="—"
          footnote={
            <>
              AI 复核队列尚未接入（原型）
              <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                详见 backlog：docs/superpowers/plans/2026-05-10-next-development.md
              </span>
            </>
          }
        />
        <MetricCard label="待校对页面" value={String(metrics.pagesAwaitingReview)} />
        <MetricCard label="低掌握度知识点" value={String(lowMasteryKnowledgeCount)} />
      </div>
      {showUploadHint ? (
        <aside
          style={{
            marginTop: 18,
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            background: "#f8fafc",
            padding: "14px 16px",
            color: "#475569",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 600, color: "#334155" }}>暂无待校对内容 · Nothing queued yet</span>
          <p style={{ margin: "8px 0 0" }}>
            上传一本绘本即可开始校对流程。
            <span style={{ color: "#64748b" }}> Upload a book to start review.</span>
          </p>
          <Link
            href="/parent/books/new"
            style={{
              display: "inline-block",
              marginTop: 10,
              fontWeight: 600,
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            去上传绘本 →
          </Link>
        </aside>
      ) : null}
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  footnote,
}: {
  label: string;
  value: string;
  footnote?: ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid #dbe3ef",
        borderRadius: 8,
        background: "white",
        padding: 18,
      }}
    >
      <p style={{ margin: "0 0 8px", color: "#64748b" }}>{label}</p>
      <strong style={{ fontSize: 32, display: "block", lineHeight: 1.2 }}>{value}</strong>
      {footnote ? (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.45 }}>
          {footnote}
        </p>
      ) : null}
    </section>
  );
}
