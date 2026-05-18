import type { CSSProperties } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BookStatus } from "@/domain/enums";
import { getBookIngestionRepository } from "@/lib/book-ingestion/repository";
import { ensurePrototypeSession } from "@/lib/prototype-session";
import { childNav } from "../child-nav";

export const dynamic = "force-dynamic";

const cardStyle: CSSProperties = {
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  background: "white",
  padding: 20,
};

const linkStyle: CSSProperties = {
  color: "#2563eb",
  fontWeight: 600,
  textDecoration: "underline",
};

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

export default async function ChildBookReviewListPage() {
  const session = await ensurePrototypeSession();
  const books = await getBookIngestionRepository().listBooksWithReviewSentencesForFamily(session.familyId);

  return (
    <AppShell title="绘本复习" subtitle="Book review" navItems={childNav}>
      <div style={{ display: "grid", gap: 16, maxWidth: 760 }}>
        {books.length === 0 ? (
          <section style={cardStyle}>
            <h2 style={{ margin: "0 0 10px", fontSize: 22 }}>还没有可复习的句子</h2>
            <p style={{ margin: "0 0 8px", color: "#475569", lineHeight: 1.5 }}>
              请家长在家长端上传绘本，并在校对页确认页面与句子后，这里会列出可以翻看的书。
            </p>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
              Ask a parent to upload a book and confirm pages and sentences in the parent review UI; books with
              review-ready sentences will show up here.
            </p>
            <p style={{ margin: 0, color: "#475569" }}>
              家长入口：<Link href="/parent/books/new" style={linkStyle}>
                上传绘本 · Upload a book
              </Link>
            </p>
          </section>
        ) : (
          <ul
            aria-label="可复习绘本列表 · Books with sentences to review"
            style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}
          >
            {books.map((book) => (
              <li key={book.id}>
                <Link
                  href={`/child/book-review/${book.id}`}
                  style={{
                    display: "block",
                    ...cardStyle,
                    textDecoration: "none",
                    color: "#172033",
                    transition: "box-shadow 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <span style={{ fontSize: 20, fontWeight: 700 }}>{book.title}</span>
                    <span style={{ fontSize: 13, color: "#64748b", flexShrink: 0 }}>进入 →</span>
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: 14, color: "#64748b" }}>
                    {book.pageCount} 页 · {statusLabel(book.status)}
                    {book.readingDate ? ` · 阅读日 ${book.readingDate}` : ""}
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>Open · 打开复习</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
