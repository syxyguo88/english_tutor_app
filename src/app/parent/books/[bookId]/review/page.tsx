/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { AppShell, type AppShellNavItem } from "@/components/app-shell";
import { KnowledgeItemType } from "@/domain/enums";
import { getBookIngestionRepository, type BookReviewPage } from "@/lib/book-ingestion/repository";
import { confirmBookPageAction } from "./actions";

const parentNav = [
  { id: "overview", href: "/parent/dashboard", label: "总览" },
  { id: "new-book", href: "/parent/books/new", label: "上传绘本" },
] satisfies ReadonlyArray<AppShellNavItem>;

type ReviewPageProps = {
  params: Promise<{ bookId: string }>;
};

export default async function BookReviewPageRoute({ params }: ReviewPageProps) {
  const { bookId } = await params;
  const book = await getBookIngestionRepository().getBookForReview(bookId);

  if (!book) {
    return (
      <AppShell title="未找到绘本" subtitle="Book Review" navItems={parentNav}>
        <p style={{ color: "#475569" }}>这个绘本草稿不存在或开发服务器已重启。</p>
        <Link href="/parent/books/new" style={linkStyle}>
          重新上传绘本
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title={`校对：${book.title}`} subtitle="Book Review" navItems={parentNav}>
      <section
        style={{
          border: "1px solid #dbe3ef",
          borderRadius: 8,
          background: "white",
          padding: 18,
          marginBottom: 18,
        }}
      >
        <p style={{ margin: 0, color: "#475569" }}>
          状态：<strong>{book.status === "confirmed" ? "已确认" : "草稿待确认"}</strong>
        </p>
        <p style={{ margin: "8px 0 0", color: "#64748b" }}>
          未确认 OCR 草稿不会进入正式练习、掌握度统计或复习队列。
        </p>
      </section>

      <div style={{ display: "grid", gap: 18 }}>
        {book.pages.map((page) => (
          <PageReviewCard key={page.id} bookId={book.id} page={page} />
        ))}
      </div>
    </AppShell>
  );
}

function PageReviewCard({ bookId, page }: { bookId: string; page: BookReviewPage }) {
  const isConfirmed = page.status === "confirmed";

  return (
    <article
      style={{
        border: "1px solid #dbe3ef",
        borderRadius: 8,
        background: "white",
        padding: 18,
      }}
    >
      <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>第 {page.pageOrder} 页</h2>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 280px) 1fr", gap: 18 }}>
        <img
          alt={`第 ${page.pageOrder} 页原图`}
          src={page.originalImageUrl}
          style={{ width: "100%", borderRadius: 8, border: "1px solid #dbe3ef" }}
        />
        {isConfirmed ? (
          <ConfirmedPageContent page={page} />
        ) : (
          <form action={confirmBookPageAction} style={{ display: "grid", gap: 14 }}>
            <input type="hidden" name="bookId" value={bookId} />
            <input type="hidden" name="pageId" value={page.id} />

            <section>
              <h3 style={sectionHeadingStyle}>句子草稿</h3>
              {page.ocrDraft.sentences.map((sentence, index) => (
                <textarea
                  key={`${page.id}-sentence-${index}`}
                  name="sentences"
                  defaultValue={sentence.text}
                  aria-label={`第 ${page.pageOrder} 页句子 ${index + 1}`}
                  style={textareaStyle}
                />
              ))}
            </section>

            <section>
              <h3 style={sectionHeadingStyle}>候选单词和短语</h3>
              {page.ocrDraft.knowledgeCandidates.map((candidate, index) => (
                <div
                  key={`${page.id}-knowledge-${index}`}
                  style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px", gap: 8 }}
                >
                  <select name="knowledgeType" defaultValue={candidate.type} style={inputStyle}>
                    <option value={KnowledgeItemType.Word}>单词</option>
                    <option value={KnowledgeItemType.Phrase}>短语</option>
                  </select>
                  <input
                    name="knowledgeSurfaceForm"
                    defaultValue={candidate.surfaceForm}
                    aria-label={`第 ${page.pageOrder} 页知识项 ${index + 1}`}
                    style={inputStyle}
                  />
                  <input
                    name="knowledgeVariantKind"
                    defaultValue={candidate.variantKind ?? "base"}
                    aria-label={`第 ${page.pageOrder} 页形态 ${index + 1}`}
                    style={inputStyle}
                  />
                </div>
              ))}
            </section>

            <button type="submit" style={buttonStyle}>
              确认这一页
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

function ConfirmedPageContent({ page }: { page: BookReviewPage }) {
  return (
    <section>
      <h3 style={sectionHeadingStyle}>已确认内容</h3>
      {page.sentences.map((sentence) => (
        <div key={sentence.id} style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700 }}>{sentence.text}</p>
          <p style={{ margin: 0, color: "#64748b" }}>
            知识项：
            {sentence.knowledgeLinks.map((link) => link.surfaceForm).join("、") || "无"}
          </p>
        </div>
      ))}
    </section>
  );
}

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 16,
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  minHeight: 38,
  padding: "6px 8px",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  display: "block",
  width: "100%",
  minHeight: 72,
  marginBottom: 8,
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  minHeight: 42,
  padding: "0 14px",
};

const linkStyle: React.CSSProperties = {
  ...buttonStyle,
  display: "inline-flex",
  alignItems: "center",
  marginTop: 16,
  textDecoration: "none",
};
