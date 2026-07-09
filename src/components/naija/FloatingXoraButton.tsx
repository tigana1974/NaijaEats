import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

/**
 * Small round FAB parked in the bottom-right of the viewport. Opens the Xora
 * (Naija Eats AI) chat page. Auto-hides on Xora's own page and on cart /
 * checkout flows where a floating chip would visually clash with the sticky
 * bottom bar.
 */
export function FloatingXoraButton() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  const hidden =
    path === "/xora" ||
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
      to="/xora"
      aria-label="Ask Xora — the Naija Eats AI"
      className="group fixed z-30 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] right-4 sm:bottom-6 sm:right-6"
    >
      {/* Gentle animated ring so it draws the eye without being obnoxious */}
      <span className="absolute inset-0 rounded-full bg-[var(--brand-clay)]/40 blur-md opacity-70 animate-pulse pointer-events-none" />

      <span className="relative flex items-center gap-2 rounded-full h-14 pl-1.5 pr-4 bg-gradient-to-br from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white shadow-[0_12px_30px_-8px_rgba(255,77,77,0.55)] ring-2 ring-white/30 hover:scale-105 active:scale-95 transition-transform duration-200">
        {/* Xora portrait inside a white circle */}
        <span className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden bg-white shadow-inner">
          <img
            src="/xora.jpg"
            alt=""
            className="h-full w-full object-cover object-top scale-[1.15]"
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const fb = e.currentTarget.parentElement?.querySelector(".xora-fab-fallback") as HTMLElement | null;
              if (fb) fb.style.display = "grid";
            }}
          />
          <span className="xora-fab-fallback hidden absolute inset-0 place-items-center font-display font-extrabold text-[var(--brand-clay)] text-lg">
            X
          </span>
        </span>
        <span className="flex flex-col leading-tight pr-1">
          <span className="text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1 text-[var(--brand-gold)]">
            <Sparkles className="h-2.5 w-2.5" /> AI
          </span>
          <span className="text-sm font-extrabold">Ask Xora</span>
        </span>
      </span>
    </Link>
  );
}
