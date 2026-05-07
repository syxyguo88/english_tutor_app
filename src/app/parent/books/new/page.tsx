import { AppShell, type AppShellNavItem } from "@/components/app-shell";
import { BookDraftForm } from "./book-draft-form";

const parentNav = [
  { id: "overview", href: "/parent/dashboard", label: "总览" },
  { id: "new-book", href: "/parent/books/new", label: "上传绘本" },
] satisfies ReadonlyArray<AppShellNavItem>;

export default function NewBookPage() {
  return (
    <AppShell title="上传绘本" subtitle="Book Ingestion" navItems={parentNav}>
      <section
        style={{
          border: "1px solid #dbe3ef",
          borderRadius: 8,
          background: "white",
          padding: 20,
        }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: 24 }}>创建绘本草稿</h2>
        <p style={{ margin: "0 0 18px", color: "#475569" }}>
          这个原型会使用本地 mock OCR/AI 生成可编辑草稿。未确认内容不会进入正式练习。
        </p>
        <BookDraftForm />
      </section>
    </AppShell>
  );
}
