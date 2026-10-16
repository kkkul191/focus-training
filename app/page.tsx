"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AppShell, type PageKey } from "@/src/components/AppShell";
import { AnalyticsPage } from "@/src/features/analytics/AnalyticsPage";
import { Dashboard } from "@/src/features/dashboard/Dashboard";
import { CognitivePage } from "@/src/features/cognitive/CognitivePage";
import { FocusPage } from "@/src/features/focus/FocusPage";
import { MeditationPage } from "@/src/features/meditation/MeditationPage";
import { SchultePage } from "@/src/features/schulte/SchultePage";
import { SettingsPage } from "@/src/features/settings/SettingsPage";
import { storageService } from "@/src/services/storage";

const pages: PageKey[] = ["dashboard", "focus", "schulte", "cognitive", "meditation", "analytics", "settings"];

function readPage(): PageKey {
  if (typeof window === "undefined") return "dashboard";
  const value = window.location.hash.replace("#", "") as PageKey;
  return pages.includes(value) ? value : "dashboard";
}

function readTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return storageService.getTheme() ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

const themeSubscribers = new Set<() => void>();

function subscribeToPage(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function subscribeToTheme(callback: () => void) {
  themeSubscribers.add(callback);
  return () => themeSubscribers.delete(callback);
}

export default function Home() {
  const page = useSyncExternalStore(subscribeToPage, readPage, (): PageKey => "dashboard");
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, (): "light" | "dark" => "light");
  const [, setRevision] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const navigate = useCallback((next: PageKey) => {
    window.location.hash = next;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const saved = useCallback(() => { refresh(); navigate("dashboard"); }, [navigate, refresh]);
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    storageService.setTheme(next);
    themeSubscribers.forEach((notify) => notify());
  };

  return <AppShell page={page} onNavigate={navigate} theme={theme} onThemeToggle={toggleTheme}>
    {page === "dashboard" ? <Dashboard onNavigate={navigate}/> : null}
    {page === "focus" ? <FocusPage onSaved={saved}/> : null}
    {page === "schulte" ? <SchultePage/> : null}
    {page === "cognitive" ? <CognitivePage/> : null}
    {page === "meditation" ? <MeditationPage onSaved={refresh}/> : null}
    {page === "analytics" ? <AnalyticsPage/> : null}
    {page === "settings" ? <SettingsPage onDataChanged={refresh}/> : null}
  </AppShell>;
}

