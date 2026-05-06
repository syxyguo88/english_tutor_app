import { AppShell } from "@/components/app-shell";

const parentNav = [
  { id: "overview", href: "/parent/dashboard", label: "总览" },
  { id: "books", href: "/parent/dashboard", label: "绘本" },
  { id: "review", href: "/parent/dashboard", label: "待校对" },
  { id: "knowledge", href: "/parent/dashboard", label: "知识画像" },
];

export default function ParentDashboardPage() {
  return (
    <AppShell title="家长端" subtitle="上传、校对和查看学习进展" navItems={parentNav}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard label="待校对绘本" value="0" />
        <MetricCard label="待复核 AI 判断" value="0" />
        <MetricCard label="今日复习项" value="0" />
        <MetricCard label="低掌握度知识点" value="0" />
      </div>
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
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
      <strong style={{ fontSize: 32 }}>{value}</strong>
    </section>
  );
}
