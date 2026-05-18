import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Private English Tutor",
  description: "A family English tutor prototype for picture book learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
