"use client";

import { useSyncExternalStore } from "react";
import { Moon, MonitorSmartphone, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

const NEXT_THEME: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const THEME_ICON: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: MonitorSmartphone,
};

const THEME_LABEL: Record<Theme, string> = {
  light: "ライトモード",
  dark: "ダークモード",
  system: "システム設定に合わせる",
};

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
}

function getServerSnapshot(): Theme {
  return "system";
}

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  listeners.forEach((listener) => listener());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const Icon = THEME_ICON[theme];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(NEXT_THEME[theme])}
      aria-label={`テーマ: ${THEME_LABEL[theme]}（クリックで切替）`}
    >
      <Icon className="size-5" />
    </Button>
  );
}
