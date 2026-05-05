import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <p style={{ color: "#64748b", marginBottom: 8 }}>Private English Tutor</p>
      <h1 style={{ fontSize: 36, lineHeight: 1.15, margin: "0 0 16px" }}>
        家庭自用英语绘本学习原型
      </h1>
      <p style={{ color: "#475569", maxWidth: 680 }}>
        第一阶段提供家长端和孩子端入口，后续计划会加入绘本上传、校对、练习生成和掌握度追踪。
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <Link href="/parent/dashboard" style={linkStyle}>
          家长端
        </Link>
        <Link href="/child/today" style={secondaryLinkStyle}>
          孩子端
        </Link>
      </div>
    </main>
  );
}

const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  minHeight: 44,
  alignItems: "center",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  padding: "0 16px",
  fontWeight: 700,
};

const secondaryLinkStyle: React.CSSProperties = {
  ...linkStyle,
  background: "white",
  color: "#172033",
  border: "1px solid #dbe3ef",
};
