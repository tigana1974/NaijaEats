import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { ComingSoonBanner } from "@/components/naija/ComingSoonBanner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Send,
  Gift,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  Wifi,
  Receipt,
  Repeat,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet")({
  component: WalletPage,
});

const txns: any[] = [];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

function WalletPage() {
  const [hidden, setHidden] = useState(false);
  const balance = 0;

  return (
    <RoleShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
        <ComingSoonBanner feature="Wallet" />
        {/* Heading */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold">Wallet</div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Your balance</h1>
          </div>
          <button className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground">
            <ShieldCheck className="h-4 w-4 text-[var(--brand-forest)]" /> Secured
          </button>
        </div>

        {/* Card */}
        <div className="mt-5 relative">
          <div className="absolute -inset-x-2 -bottom-2 h-24 rounded-3xl bg-[var(--brand-gold)]/30 blur-2xl -z-10" />
          <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-8 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.6),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_50%),linear-gradient(140deg,#1d1d1b,#3a1a14_60%,#7c2d12)]">
            {/* shine */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.08)_50%,transparent_60%)]" />

            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Available balance</div>
                <div className="mt-2 flex items-end gap-3">
                  <div className="font-display text-4xl sm:text-5xl font-semibold tabular-nums">
                    {hidden ? "•••••••" : fmt(balance)}
                  </div>
                  <button
                    onClick={() => setHidden((v) => !v)}
                    className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-white/15 hover:bg-white/25 transition"
                    aria-label="Toggle balance"
                  >
                    {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/80">
                  <TrendingUp className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                  Your digital wallet is active
                </div>
              </div>
              <Wifi className="h-6 w-6 rotate-90 text-white/70" />
            </div>

            <div className="mt-8 flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">Naija Eats · Wallet</div>
                <div className="mt-1 font-mono text-sm tracking-[0.25em] text-white/90">
                  {hidden ? "•••• •••• •••• ••••" : "---- ---- ---- ----"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">Tier</div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--brand-gold)] text-foreground px-2.5 py-1 text-xs font-semibold">
                  <Sparkles className="h-3 w-3" /> Gold
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Top up", Icon: Plus, to: "/wallet/top-up" as const },
            { label: "Send", Icon: Send, to: "/wallet/send" as const },
            { label: "Request", Icon: ArrowDownLeft, to: "/wallet/request" as const },
            { label: "Rewards", Icon: Gift, to: "/referrals" as const },
          ].map(({ label, Icon, to }) => (
            <Link
              key={label}
              to={to}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-card border border-border py-4 hover:border-foreground/40 hover:shadow-sm transition"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-foreground text-background group-hover:bg-[var(--brand-clay)] transition">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Spent this month" value={fmt(0)} hint="Across 0 orders" tone="clay" />
          <StatCard label="Saved with rewards" value={fmt(0)} hint="No rewards yet" tone="gold" />
          <StatCard label="Pending refunds" value={fmt(0)} hint="No pending refunds" tone="forest" />
        </div>

        {/* Transactions */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight">Recent activity</h2>
          <button className="text-sm font-medium text-foreground/70 hover:text-foreground inline-flex items-center gap-1">
            All <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-3xl border border-border bg-card overflow-hidden">
          {txns.length > 0 ? (
            <ul className="divide-y divide-border">
              {txns.map((t) => {
                const out = t.kind === "out";
                return (
                  <li key={t.id} className="flex items-center gap-3 px-4 sm:px-5 py-4 hover:bg-muted/40 transition">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${out ? "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]" : "bg-[var(--brand-forest)]/15 text-[var(--brand-forest)]"}`}>
                      {out ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <t.Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="font-medium text-sm truncate">{t.title}</div>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{t.sub} · {t.when}</div>
                    </div>
                    <div className={`shrink-0 text-right font-semibold tabular-nums text-sm ${out ? "text-foreground" : "text-[var(--brand-forest)]"}`}>
                      {out ? "−" : "+"}{fmt(Math.abs(t.amount))}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No transactions yet. Add money to get started!
            </div>
          )}
        </div>

        {/* Promo */}
        <div className="mt-8 relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-[linear-gradient(135deg,oklch(0.85_0.17_90/0.35),oklch(0.66_0.245_25/0.18))] border border-border">
          <div className="absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-[var(--brand-clay)]/20 blur-3xl" />
          <div className="relative grid sm:grid-cols-[1fr_auto] items-center gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold">Gold tier perks</div>
              <h3 className="font-display text-xl sm:text-2xl font-semibold mt-1">Top up ₦20k, get ₦2k free.</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">Boost your wallet this week and unlock chef booking discounts up to 15%.</p>
            </div>
            <Button asChild className="h-11 rounded-2xl bg-foreground text-background hover:bg-foreground/90">
              <Link to="/wallet/top-up">Top up now <Plus className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </RoleShell>
  );
}

function StatCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: "clay" | "gold" | "forest" }) {
  const dot =
    tone === "clay" ? "bg-[var(--brand-clay)]" : tone === "gold" ? "bg-[var(--brand-gold)]" : "bg-[var(--brand-forest)]";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      </div>
      <div className="font-display text-xl sm:text-2xl font-semibold mt-2 tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}
