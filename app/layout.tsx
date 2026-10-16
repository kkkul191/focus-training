import type { Metadata } from "next";
import "./globals.css";
import "./fixes.css";

export const metadata: Metadata = {
  title: "Focus Training — 个人专注力训练",
  description: "本地优先、低刺激、数据可解释的个人专注力训练工具。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
