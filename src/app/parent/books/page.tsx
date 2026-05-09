import Link from "next/link";
import { AppShell, type AppShellNavItem } from "@/components/app-shell";
import { BookStatus } from "@/domain/enums";
import { getBookIngestionRepository } from "@/lib/book-ingestion/repository";
import { ensurePrototypeSession } from "@/lib/prototype-session";

const parentNav = [
  { id: "overview", href: "/parent/dashboard", label: "总览" },
  { id: "books", href: "/parent/books", label: "绘本" },
  { id: "review", href: "/parent/dashboard", label: "待校对" },
  { id: "knowledge", href: "/parent/dashboard", label: "知识画像" },
] satisfies ReadonlyArray<AppShellNavItem>;

function statusLabel(status: BookStatus): string {
  switch (status) {
    case BookStatus.Draft:
      return "草稿";
    case BookStatus.Processing:
      return "处理中";
    case BookStatus.ReadyForReview:
      return "待校对";
    case BookStatus.Confirmed:
      return "已确认";
  }
}

function formatUpdatedAt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function ParentBooksPage() {
  const session = await ensurePrototypeSession();
  const books = await getBookIngestionRepository().listBooksForFamily(session.familyId);

  return (
    <AppShell title="我的绘本" subtitle="My picture books" navItems={parentNav}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
            查看已上传的绘本并继续校对。
          </p>
        </div>
        <Link
          href="/parent/books/new"
          style={{
            border: 0,
            borderRadius: 8,
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontWeight: 700,
            minHeight: 42,
            padding: "10px 16px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          上传新绘本
        </Link>
      </div>

      {books.length === 0 ? (
        <aside
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            background: "#f8fafc",
            padding: "14px 16px",
            color: "#475569",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 600, color: "#334155" }}>暂无绘本 · No books yet</span>
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
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {books.map((book) => (
            <article
              key={book.id}
              style={{
                border: "1px solid #dbe3ef",
                borderRadius: 8,
                background: "white",
                padding: "16px 18px",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 8px", fontSize: 18, color: "#172033" }}>{book.title}</h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
                  状态：{statusLabel(book.status)} · 页数：{book.pageCount} · 更新：{formatUpdatedAt(book.updatedAt)}
                </p>
              </div>
              <Link
                href={`/parent/books/${book.id}/review`}
                style={{
                  fontWeight: 700,
                  color: "#2563eb",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                去校对 →
              </Link>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
