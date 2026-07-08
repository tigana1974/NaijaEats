import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { X, Sparkles, ArrowRight, Check } from "lucide-react";
import {
  PiTruckDuotone,
  PiPercentDuotone,
  PiGiftDuotone,
  PiCrownDuotone,
  PiConfettiDuotone,
} from "react-icons/pi";
import {
  loadCustomerPlan,
  isUpsellDismissed,
  dismissUpsell,
  bumpUpsellSeen,
  PLAN_EVENT,
} from "@/lib/premium";

/**
 * Auto-appearing premium upsell modal for customers on the Basic plan.
 * Waits ~4 seconds after the page loads so it never blocks the initial
 * interaction, and stays dismissed for 7 days after "Not now". Also
 * suppressed on subscription-related routes so it doesn't nag users
 * who are already in the flow.
 */
export function PremiumUpsellDialog() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Never fire on the subscription page or wallet flows.
    if (
      path.startsWith("/subscription") ||
      path.startsWith("/wallet/top-up") ||
      path.startsWith("/wallet/send") ||
      path.startsWith("/wallet/request") ||
      path.startsWith("/auth")
    ) {
      return;
    }
    if (loadCustomerPlan() !== "basic") return;
    if (isUpsellDismissed()) return;
    // Show after a short delay so it feels considered, not pushy.
    const t = window.setTimeout(() => {
      bumpUpsellSeen();
      setOpen(true);
    }, 4000);
    return () => window.clearTimeout(t);
  }, [path]);

  useEffect(() => {
    const refresh = () => {
      if (loadCustomerPlan() !== "basic") setOpen(false);
    };
    window.addEventListener(PLAN_EVENT, refresh);
    return () => window.removeEventListener(PLAN_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissUpsell();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted || !open) return null;

  const close = () => {
    dismissUpsell();
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upsell-title"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={close}
      />

      <div className="relative w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-2 fade-in duration-300 bg-white">
        {/* Hero */}
        <div className="relative overflow-hidden p-6 sm:p-7 text-white bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.55),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_55%),linear-gradient(150deg,#1a0e0a,#3a1a14_55%,#7c2d12)]">
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[var(--brand-gold)]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[var(--brand-clay)]/40 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

          <button
            onClick={close}
            aria-label="Close"
            className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur transition"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-[var(--brand-gold)]" /> Members-only offer
            </div>
            <h2 id="upsell-title" className="font-display text-3xl sm:text-[34px] font-bold tracking-tight mt-3 leading-[1.05]">
              Try Naija Eats Plus<br />free for 7 days
            </h2>
            <p className="text-white/80 text-sm mt-2 max-w-xs">
              Free delivery, 5% cashback, and members-only chef drops. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7">
          <div className="space-y-3">
            <Perk
              Icon={PiTruckDuotone}
              tone="bg-emerald-100 text-emerald-700"
              title="Free delivery"
              body="On every eligible order over ₦5,000 / £15"
            />
            <Perk
              Icon={PiPercentDuotone}
              tone="bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]"
              title="5% cashback"
              body="Automatically credited to your wallet"
            />
            <Perk
              Icon={PiGiftDuotone}
              tone="bg-amber-100 text-amber-700"
              title="Weekly chef drops"
              body="Members-only menus & birthday meal"
            />
          </div>

          {/* Price teaser */}
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">After trial</div>
              <div className="text-xs text-muted-foreground mt-0.5">from</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold tabular-nums leading-none">
                ₦1,500
                <span className="text-sm font-semibold text-muted-foreground ml-1">/ mo</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">or £4.99 in the UK</div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Link
              to="/subscription"
              onClick={() => setOpen(false)}
              className="w-full h-13 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--brand-clay)] to-orange-500 text-white font-bold shadow-lg shadow-[var(--brand-clay)]/30 hover:shadow-xl active:scale-[0.99] transition-all py-3.5"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={close}
              className="w-full h-12 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Not now
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <PiConfettiDuotone className="h-3.5 w-3.5 text-[var(--brand-clay)]" />
            Trusted by <span className="font-bold text-foreground">12,400+</span> members
          </div>
        </div>
      </div>
    </div>
  );
}

function Perk({
  Icon,
  tone,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  tone: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-bold flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3.5} />
          {title}
        </div>
        <div className="text-xs text-muted-foreground truncate">{body}</div>
      </div>
    </div>
  );
}

/**
 * A compact "Go Premium" call-to-action strip used on the account page.
 * Shows different content based on the current plan.
 */
export function PremiumAccountBanner() {
  const [plan, setPlan] = useState(loadCustomerPlan());
  useEffect(() => {
    const refresh = () => setPlan(loadCustomerPlan());
    window.addEventListener(PLAN_EVENT, refresh);
    return () => window.removeEventListener(PLAN_EVENT, refresh);
  }, []);

  if (plan === "elite") {
    return (
      <Link
        to="/subscription"
        className="relative block overflow-hidden rounded-[2rem] p-5 text-white bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 shadow-[0_20px_50px_-20px_rgba(147,51,234,0.45)]"
      >
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <PiCrownDuotone className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest font-bold text-white/80">Elite member</div>
            <div className="font-display text-lg font-bold">VIP status active</div>
            <div className="text-xs text-white/80">Unlimited free delivery + 10% cashback</div>
          </div>
          <ArrowRight className="h-4 w-4 opacity-70" />
        </div>
      </Link>
    );
  }

  if (plan === "plus") {
    return (
      <Link
        to="/subscription"
        className="relative block overflow-hidden rounded-[2rem] p-5 text-white bg-gradient-to-br from-[var(--brand-clay)] to-orange-500 shadow-[0_20px_50px_-20px_rgba(217,75,58,0.45)]"
      >
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Sparkles className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest font-bold text-white/80">Plus member</div>
            <div className="font-display text-lg font-bold">You're on Plus 🎉</div>
            <div className="text-xs text-white/80">Upgrade to Elite for unlimited free delivery</div>
          </div>
          <ArrowRight className="h-4 w-4 opacity-70" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/subscription"
      className="group relative block overflow-hidden rounded-[2rem] p-5 text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] bg-[radial-gradient(110%_110%_at_0%_0%,oklch(0.85_0.17_90/0.55),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_55%),linear-gradient(150deg,#1a0e0a,#3a1a14_55%,#7c2d12)]"
    >
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[var(--brand-gold)]/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
          <Sparkles className="h-3.5 w-3.5 text-[var(--brand-gold)]" /> Go Premium
        </div>
        <h3 className="font-display text-xl font-bold mt-2 leading-tight">
          Free delivery + 5% cashback
        </h3>
        <p className="text-xs text-white/75 mt-1 max-w-xs">
          Try Naija Eats Plus free for 7 days. Cancel anytime.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white text-[#3a1a14] px-4 py-2 text-xs font-bold group-hover:scale-105 transition-transform">
          Start free trial <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
