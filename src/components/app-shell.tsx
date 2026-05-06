import Link from "next/link";
import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  subtitle: string;
  navItems: Array<{ id: string; href: string; label: string }>;
  children: ReactNode;
};

export function AppShell({ title, subtitle, navItems, children }: AppShellProps) {
  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header
        style={{
          borderBottom: "1px solid #dbe3ef",
          background: "white",
          padding: "16px 20px",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: 14 }}>{subtitle}</p>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2 }}>{title}</h1>
          <nav style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                style={{
                  border: "1px solid #dbe3ef",
                  borderRadius: 8,
                  background: "#ffffff",
                  color: "#172033",
                  padding: "8px 12px",
                  fontWeight: 700,
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: 20 }}>{children}</section>
    </main>
  );
}
