import { useEffect, useState } from "react";
import { Logo } from "@/components/naija/Logo";

/**
 * Branded Naija Eats splash screen. Shows on first mount, then fades out.
 * Persists a "seen" flag in sessionStorage so it doesn't re-appear between
 * client-side navigations within the same session, but re-appears on a
 * fresh tab / hard refresh.
 *
 * Renders nothing on the server — the fade animation would otherwise flash
 * during SSR hydration.
 */
export function SplashScreen({ minDurationMs = 1400 }: { minDurationMs?: number }) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"enter" | "exit" | "gone">("enter");

  useEffect(() => {
    setMounted(true);
    // If already shown this session, skip immediately
    if (typeof window !== "undefined" && sessionStorage.getItem("naijaeats.splash.shown") === "1") {
      setPhase("gone");
      return;
    }
    const exit = window.setTimeout(() => setPhase("exit"), minDurationMs);
    const gone = window.setTimeout(() => {
      setPhase("gone");
      if (typeof window !== "undefined") sessionStorage.setItem("naijaeats.splash.shown", "1");
    }, minDurationMs + 550);
    return () => {
      window.clearTimeout(exit);
      window.clearTimeout(gone);
    };
  }, [minDurationMs]);

  if (!mounted || phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        phase === "exit" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(120% 120% at 0% 0%, oklch(0.85 0.17 90 / 0.55), transparent 55%), radial-gradient(120% 120% at 100% 100%, oklch(0.55 0.22 25 / 0.95), transparent 55%), linear-gradient(150deg, #1a0e0a, #3a1a14 55%, #7c2d12)",
      }}
      aria-hidden="true"
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[var(--brand-gold)]/25 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[var(--brand-clay)]/40 blur-3xl animate-pulse" style={{ animationDelay: "0.4s" }} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.05)_50%,transparent_60%)]" />

      {/* Speckle texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 25% 30%, white, transparent 50%), radial-gradient(1.5px 1.5px at 75% 65%, white, transparent 50%), radial-gradient(1.5px 1.5px at 45% 85%, white, transparent 50%), radial-gradient(1.5px 1.5px at 90% 15%, white, transparent 50%), radial-gradient(1.5px 1.5px at 10% 55%, white, transparent 50%)",
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center px-6 text-center">
        {/* Logo halo */}
        <div className="relative">
          <div className="absolute inset-0 -m-4 rounded-full bg-white/12 blur-2xl animate-splash-pulse" />
          <div className="absolute inset-0 -m-2 rounded-full bg-[var(--brand-gold)]/20 blur-xl animate-splash-pulse" style={{ animationDelay: "0.15s" }} />
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-[2rem] bg-white/95 backdrop-blur shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/30 grid place-items-center animate-splash-in">
            <Logo className="h-20 w-20 sm:h-24 sm:w-24" />
          </div>
        </div>

        {/* Wordmark */}
        <div className="mt-7 animate-splash-word">
          <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white leading-none">
            Naija<span className="text-[var(--brand-gold)]">Eats</span>
          </div>
          <div className="mt-2.5 text-[11px] uppercase tracking-[0.36em] font-bold text-white/70">
            Cooked with culture
          </div>
        </div>

        {/* Loader */}
        <div className="mt-10 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white/90 animate-splash-dot" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-white/90 animate-splash-dot" style={{ animationDelay: "160ms" }} />
          <span className="h-2 w-2 rounded-full bg-white/90 animate-splash-dot" style={{ animationDelay: "320ms" }} />
        </div>
      </div>

      {/* Bottom credit */}
      <div className="absolute bottom-6 inset-x-0 text-center animate-splash-word" style={{ animationDelay: "0.4s" }}>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-white/80 border border-white/15">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-gold)]" />
          Serving Nigeria & UK
        </div>
      </div>

      {/* Inline keyframes so this is self-contained */}
      <style>{`
        @keyframes splash-in {
          0% { transform: scale(0.85) translateY(6px); opacity: 0; }
          60% { transform: scale(1.04) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes splash-word {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes splash-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes splash-pulse {
          0%, 100% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .animate-splash-in { animation: splash-in 700ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-splash-word { animation: splash-word 700ms cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.15s; }
        .animate-splash-dot { animation: splash-dot 1.2s ease-in-out infinite; }
        .animate-splash-pulse { animation: splash-pulse 1.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
