import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Theme controller.
 *
 * - `mode` is what the user picked: "light" | "dark" | "system".
 * - `resolved` is what actually gets applied to <html>: "light" | "dark".
 *
 * The theme preference is stored globally in the browser so that it
 * remains consistent across logged-out pages (landing, auth) and logged-in pages.
 */

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_KEY = "naijaeats.theme.v1";
const TRANSITION_CLASS = "theme-transition";

type ThemeCtx = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

function readStoredMode(): ThemeMode {
  // Default is Light. Users opt into Dark or System explicitly from Settings.
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(THEME_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "light";
}

function systemPref(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(resolved: ResolvedTheme, animate: boolean) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  // Only animate deliberate switches, not the very first paint — a global
  // transition on cold start would make every element fade in from grey.
  if (animate) {
    el.classList.add(TRANSITION_CLASS);
    window.setTimeout(() => el.classList.remove(TRANSITION_CLASS), 320);
  }
  el.classList.toggle("dark", resolved === "dark");
  el.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());
  const [systemResolved, setSystemResolved] = useState<ResolvedTheme>(() => systemPref());
  const firstRun = useState({ v: true })[0];

  // Track OS-level dark mode changes so `mode: "system"` responds live
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemResolved(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved: ResolvedTheme = mode === "system" ? systemResolved : mode;

  useEffect(() => {
    apply(resolved, !firstRun.v);
    firstRun.v = false;
  }, [resolved, firstRun]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, m);
  };

  const value = useMemo<ThemeCtx>(
    () => ({ mode, resolved, setMode, isDark: resolved === "dark" }),
    [mode, resolved], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback so components outside the provider don't crash — they just
    // reflect the current DOM state.
    const resolved: ResolvedTheme =
      typeof document !== "undefined" && document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
    return {
      mode: "system",
      resolved,
      setMode: () => undefined,
      isDark: resolved === "dark",
    };
  }
  return ctx;
}
