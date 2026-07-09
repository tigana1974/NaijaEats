import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/naija/Logo";

/**
 * Small round FAB parked in the bottom-right of the viewport. Opens the Ada
 * (Naija Eats AI) chat page. Auto-hides on Ada's own page and on cart /
 * checkout flows where a floating chip would visually clash with the sticky
 * bottom bar.
 */
export function FloatingAdaButton() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  const hidden =
    path === "/ada" ||
    path.startsWith("/cart") ||
    path.startsWith("/wallet/top-up") ||
    path.startsWith("/wallet/send") ||
    path.startsWith("/wallet/request") ||
    path.startsWith("/auth") ||
    path.startsWith("/vendor/") || // vendor-facing routes
    path.startsWith("/rider/") ||
    path.startsWith("/admin/") ||
    path.startsWith("/chats/") ||
    path.startsWith("/orders/");

  if (hidden) return null;

  return (
    <Link
      to="/ada"
      aria-label="Ask Ada — the Naija Eats AI"
      className="group fixed z-30 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] right-4 sm:bottom-6 sm:right-6"
    >
      {/* Gentle animated ring so it draws the eye without being obnoxious */}
      <span className="absolute inset-0 rounded-full bg-[var(--brand-clay)]/40 blur-md opacity-70 animate-pulse pointer-events-none" />

      <span className="relative flex items-center gap-2 rounded-full h-14 pl-1.5 pr-4 bg-gradient-to-br from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white shadow-[0_12px_30px_-8px_rgba(255,77,77,0.55)] ring-2 ring-white/30 hover:scale-105 active:scale-95 transition-transform duration-200">
        {/* Logo mark inside a white circle */}
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[var(--brand-clay)] shadow-inner">
          <Logo className="h-7 w-7" />
        </span>
        <span className="flex flex-col leading-tight pr-1">
          <span className="text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1 text-[var(--brand-gold)]">
            <Sparkles className="h-2.5 w-2.5" /> AI
          </span>
          <span className="text-sm font-extrabold">Ask Ada</span>
        </span>
      </span>
    </Link>
  );
}
