import type { AppShellNavItem } from "@/components/app-shell";

export const childNav = [
  { id: "today", href: "/child/today", label: "今天" },
  { id: "book-review", href: "/child/book-review", label: "绘本复习" },
  { id: "stars", href: "/child/today", label: "我的星星" },
] satisfies ReadonlyArray<AppShellNavItem>;
