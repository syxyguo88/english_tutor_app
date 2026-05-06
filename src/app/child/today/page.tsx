import { AppShell } from "@/components/app-shell";

const childNav = [
  { id: "today", href: "/child/today", label: "今天" },
  { id: "book-review", href: "/child/today", label: "绘本复习" },
  { id: "stars", href: "/child/today", label: "我的星星" },
];

export default function ChildTodayPage() {
  return (
    <AppShell title="今日练习" subtitle="Today" navItems={childNav}>
      <section
        style={{
          border: "1px solid #dbe3ef",
          borderRadius: 8,
          background: "white",
          padding: 20,
          maxWidth: 720,
        }}
      >
        <p style={{ margin: "0 0 8px", color: "#64748b" }}>Ready?</p>
        <h2 style={{ margin: "0 0 12px", fontSize: 26 }}>今天先从 5 道题开始</h2>
        <p style={{ margin: 0, color: "#475569" }}>
          后续计划会在这里显示填空、看图说句子、找错和造句练习。
        </p>
      </section>
    </AppShell>
  );
}
