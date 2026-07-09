import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Theme controller.
 *
 * - `mode` is what the user picked: "light" | "dark" | "system".
 * - `resolved` is what actually gets applied to <html>: "light" | "dark".
 *
 * The choice is scoped to the current Supabase auth uid so switching
 * accounts on the same browser never leaks one user's theme into another.
 * When no user is signed in yet, we fall back to the system preference so
 * the marketing pages still respect a visitor's OS-level dark mode.
 */

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const KEY_PREFIX = "naijaeats.theme.v1::";
const ANON_KEY = "naijaeats.theme.v1::anon";
const TRANSITION_CLASS = "theme-transition";

type ThemeCtx = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

function keyFor(uid: string | null | undefined): string {
  return uid ? KEY_PREFIX + uid : ANON_KEY;
}

function readStoredMode(uid: string | null | undefined): ThemeMode {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(keyFor(uid));
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
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

export function ThemeProvider({ uid, children }: { uid?: string | null; children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode(uid));
  const [systemResolved, setSystemResolved] = useState<ResolvedTheme>(() => systemPref());
  const firstRun = useState({ v: true })[0];

  // Re-read stored mode when the auth uid changes (login / logout / account switch)
  useEffect(() => {
    setModeState(readStoredMode(uid));
  }, [uid]);

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
    if (typeof window !== "undefined") localStorage.setItem(keyFor(uid), m);
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
