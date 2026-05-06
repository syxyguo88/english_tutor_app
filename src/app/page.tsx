import { RoleCard } from "@/components/role-card";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <p style={{ color: "#64748b", marginBottom: 8 }}>Private English Tutor</p>
      <h1 style={{ fontSize: 36, lineHeight: 1.15, margin: "0 0 16px" }}>
        家庭自用英语绘本学习原型
      </h1>
      <p style={{ color: "#475569", maxWidth: 680 }}>
        第一阶段提供家长端和孩子端入口。后续计划会加入绘本上传、校对、练习生成和掌握度追踪。
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <RoleCard
          href="/parent/dashboard"
          title="家长端"
          description="上传绘本、校对内容、查看孩子的学习画像。"
          action="进入家长端"
        />
        <RoleCard
          href="/child/today"
          title="孩子端"
          description="完成今日练习、复习绘本句子、用键盘或语音作答。"
          action="进入孩子端"
        />
      </div>
    </main>
  );
}
