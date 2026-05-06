import Link from "next/link";
import type { Route } from "next";

type RoleCardProps = {
  href: Route;
  title: string;
  description: string;
  action: string;
};

export function RoleCard({ href, title, description, action }: RoleCardProps) {
  return (
    <article
      style={{
        border: "1px solid #dbe3ef",
        borderRadius: 8,
        background: "white",
        padding: 18,
      }}
    >
      <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>{title}</h2>
      <p style={{ margin: "0 0 16px", color: "#475569" }}>{description}</p>
      <Link
        href={href}
        style={{
          display: "inline-flex",
          minHeight: 40,
          alignItems: "center",
          borderRadius: 8,
          background: "#2563eb",
          color: "white",
          padding: "0 14px",
          fontWeight: 700,
        }}
      >
        {action}
      </Link>
    </article>
  );
}
