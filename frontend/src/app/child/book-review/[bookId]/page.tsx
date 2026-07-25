import type { CSSProperties } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getBookIngestionRepository } from "@/lib/book-ingestion/repository";
import { ensurePrototypeSession } from "@/lib/prototype-session";
import { childNav } from "../../child-nav";
import { SentenceThumbnail } from "../sentence-row-with-thumb";

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

type BookReviewDetailProps = {
  params: Promise<{ bookId: string }>;
};

export default async function ChildBookReviewDetailPage({ params }: BookReviewDetailProps) {
  const { bookId } = await params;
  const session = await ensurePrototypeSession();
  const data = await getBookIngestionRepository().getBookSentenceReviewList({
    familyId: session.familyId,
    bookId,
  });

  if (!data) {
    return (
      <AppShell title="未找到绘本" subtitle="Book review" navItems={childNav}>
        <section style={{ ...cardStyle, maxWidth: 760 }}>
          <p style={{ margin: "0 0 12px", color: "#475569", lineHeight: 1.5 }}>
            这本书不存在，或还不属于当前家庭可复习的内容。
          </p>
          <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
            This book is unavailable for review, or does not belong to your family session.
          </p>
          <Link href="/child/book-review" style={linkStyle}>
            返回绘本复习 · Back to book list
          </Link>
        </section>
      </AppShell>
    );
  }

  const listAriaLabel = `《${data.bookTitle}》句子列表 · Sentences for this book`;

  return (
    <AppShell title={data.bookTitle} subtitle="Book review" navItems={childNav}>
      <div style={{ display: "grid", gap: 16, maxWidth: 760 }}>
        <p style={{ margin: 0 }}>
          <Link href="/child/book-review" style={linkStyle}>
            ← 返回书单 · Back to list
          </Link>
        </p>

        {data.sentences.length === 0 ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
              这本书暂时没有可复习的句子（可能数据正在更新）。请返回书单或稍后再试。
            </p>
            <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
              No review-ready sentences for this book right now. Try the list again later.
            </p>
          </section>
        ) : (
          <ul
            aria-label={listAriaLabel}
            style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 14 }}
          >
            {data.sentences.map((row) => (
              <li key={row.sentenceId} style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <p
                      lang="en"
                      style={{
                        margin: "0 0 8px",
                        fontSize: 22,
                        lineHeight: 1.45,
                        fontWeight: 600,
                        color: "#0f172a",
                        wordBreak: "break-word",
                      }}
                    >
                      {row.sentenceText}
                    </p>
                    <p style={{ margin: 0, fontSize: 15, color: "#64748b" }}>
                      第 {row.pageOrder} 页 · Page {row.pageOrder}
                    </p>
                  </div>
                  <SentenceThumbnail src={row.pageImageUrl} pageOrder={row.pageOrder} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
