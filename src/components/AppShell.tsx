"use client";

import { Activity, BarChart3, Brain, Grid3X3, LayoutDashboard, Moon, Settings, Sun, TimerReset } from "lucide-react";
import type { ReactNode } from "react";

export type PageKey = "dashboard" | "focus" | "schulte" | "cognitive" | "meditation" | "analytics" | "settings";

const navItems: Array<{ key: PageKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "总览", icon: LayoutDashboard },
  { key: "focus", label: "专注训练", icon: TimerReset },
  { key: "schulte", label: "舒尔特方格", icon: Grid3X3 },
  { key: "cognitive", label: "认知控制", icon: Activity },
  { key: "meditation", label: "注意训练", icon: Brain },
  { key: "analytics", label: "数据分析", icon: BarChart3 },
  { key: "settings", label: "设置", icon: Settings },
];

export function AppShell({
  page,
  onNavigate,
  theme,
  onThemeToggle,
  children,
}: {
  page: PageKey;
  onNavigate: (page: PageKey) => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => onNavigate("dashboard")} aria-label="返回总览">
          <span className="brand-mark">F</span>
          <span><strong>Focus</strong><small>TRAINING</small></span>
        </button>
        <nav aria-label="主要导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} aria-label={item.label} className={page === item.key ? "nav-item active" : "nav-item"} onClick={() => onNavigate(item.key)}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={onThemeToggle} aria-label="切换明暗主题">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === "dark" ? "浅色模式" : "深色模式"}</span>
          </button>
          <p>数据仅保存在此浏览器</p>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

